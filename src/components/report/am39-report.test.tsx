import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Am39Report } from "./am39-report";
import { computeJob } from "@/lib/compute";
import { DEFAULT_SPECS } from "@/lib/defaults";
import type { Job } from "@/lib/types";

/** Truck job: steering front axle (with angles) + one drive axle. */
function truckJob(): Job {
  return {
    id: "t",
    createdAt: 0,
    updatedAt: 0,
    vehicleType: "truck",
    header: { regNo: "AB 123 CD", type: "Volvo FH", owner: "Test Haulage" },
    D: 6,
    axles: [
      {
        id: "a1",
        isSteering: true,
        left: { A: 158, B: 151, camber: { deg: 0, min: 20, sign: 1 }, caster: { deg: 2, min: 0, sign: 1 }, kpi: { deg: 6, min: 0, sign: 1 } },
        right: { A: 140, B: 154, camber: { deg: 0, min: 15, sign: 1 } },
        steering: {
          turnLeft: { reference: 20, opposite: 18 },
          turnRight: { reference: 20, opposite: 18 },
          maxTurnLeft: 40,
          maxTurnRight: 40,
          steeringBoxA: 100,
          steeringBoxB: 100,
          tapeLeft: 865,
          tapeRight: 860,
        },
      },
      {
        id: "a2",
        isSteering: false,
        left: { A: 110, B: 92 },
        right: { A: 96, B: 108 },
      },
    ],
  };
}

describe("Am39Report renders to static markup", () => {
  const spec = DEFAULT_SPECS.find((s) => s.vehicleType === "truck");
  const job = truckJob();
  const computed = computeJob(job, spec);
  const html = renderToStaticMarkup(<Am39Report job={job} computed={computed} />);

  it("does not throw and includes the header + JOSAM mark", () => {
    expect(html).toContain("JOSAM");
    expect(html).toContain("www.josam.se");
    expect(html).toContain("AB 123 CD");
    expect(html).toContain("Volvo FH");
  });

  it("carries the form's own four-language labels verbatim", () => {
    for (const label of [
      "KURVVINKELDIFFERENS",
      "SPURDIFFERENSVINKEL",
      "TOE-OUT ON TURNS",
      "MAX. LENKEINSCHLAG",
      "BRAQUAGE MAX.",
      "CARROSSAGE",
      "SPREIZUNG",
      "INCLIN. PIVOTS",
      "NACHLAUF",
      "CHASSE",
      "SNEDSTÄLLNING",
      "SCHRÄGSTÄLLUNG",
      "OUT OF SQUARE",
      "ANGLE FAUSSÉ",
    ]) {
      expect(html).toContain(label);
    }
  });

  it("prints the sheet's identifying marks", () => {
    expect(html).toContain("AM39-1");
    expect(html).toContain("T 27 1-2-3-4 1204");
  });

  it("renders the toe box and the measured values", () => {
    expect(html).toContain("TOE-IN");
    expect(html).toContain("TOE-OUT");
    // Raw scale readings are printed as entered.
    expect(html).toContain(">158<");
    expect(html).toContain(">140<");
    // Steering axle C1/C2 (D=6): (158-151)/6=+1.17, (140-154)/6=-2.33 -> toe -1.17.
    expect(html).toContain(">-1.17<");
    // Drive axle C3/C4: (110-92)/6=+3, (96-108)/6=-2 -> toe +1.
    expect(html).toContain(">+1<");
  });

  it("is issued in English regardless of the app language", () => {
    // The Romanian words the app itself uses must never reach the sheet.
    for (const ro of ["CONVERGENȚĂ", "DIVERGENȚĂ", "Rezultat"]) {
      expect(html).not.toContain(ro);
    }
  });
});

describe("Am39Report trailer variant (two scale pairs, no turn diagram)", () => {
  const spec = DEFAULT_SPECS.find((s) => s.vehicleType === "trailer");
  const job: Job = {
    id: "tr",
    createdAt: 0,
    updatedAt: 0,
    vehicleType: "trailer",
    header: { regNo: "TRL-1" },
    D: 6,
    axles: Array.from({ length: 4 }, (_, i) => ({
      id: `a${i}`,
      isSteering: false,
      left: { A: 100 + i, B: 100 },
      right: { A: 100, B: 100 + i },
    })),
  };
  const computed = computeJob(job, spec);
  const html = renderToStaticMarkup(<Am39Report job={job} computed={computed} />);

  it("numbers both pairs of scales, 1/2 and 3/4", () => {
    // Tags render as a letter plus a subscript tspan.
    for (const n of ["1", "2", "3", "4"]) {
      expect(html).toContain(`<tspan font-size="8" dy="2">${n}</tspan>`);
    }
  });

  it("has no truck-only turn diagram", () => {
    expect(html).not.toContain("TOE-OUT ON TURNS");
    expect(html).not.toContain("MAX. TURN");
  });

  it("still prints all four axle slots", () => {
    for (const c of [1, 2, 3, 4, 5, 6, 7, 8]) {
      expect(html).toContain(`>${c}</tspan>`);
    }
  });
});
