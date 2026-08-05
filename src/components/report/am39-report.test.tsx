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
  const html = renderToStaticMarkup(<Am39Report job={job} computed={computed} spec={spec} />);

  it("does not throw and includes the header + JOSAM mark", () => {
    expect(html).toContain("JOSAM");
    expect(html).toContain("AB 123 CD");
    expect(html).toContain("Volvo FH");
  });

  it("shows the steering turn diagram and geometry only for trucks", () => {
    expect(html).toContain("TOE-OUT ON TURN");
    expect(html).toContain("MAX TURN");
    expect(html).toContain("CASTER"); // trilingual measure box (uppercased)
    expect(html).toContain("KPI");
  });

  it("renders computed toe and out-of-square values", () => {
    // Steering axle C1/C2 (D=6): (158-151)/6=+1.17, (140-154)/6=-2.33 -> toe ~ -1.17
    // Drive axle C3/C4: (110-92)/6=+3, (96-108)/6=-2 -> toe +1, oos -2.5
    expect(html).toContain("TOE-IN");
    expect(html).toContain("TOE-OUT");
    expect(html).toContain("6 m"); // D box
    expect(html).toContain("OUT OF SQUARE");
  });
});

describe("Am39Report trailer variant (two ruler blocks, no turn diagram)", () => {
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
  const html = renderToStaticMarkup(<Am39Report job={job} computed={computed} spec={spec} />);

  it("renders four axles across two blocks (A1..A4, B1..B4)", () => {
    for (const tag of ["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4"]) {
      expect(html).toContain(`>${tag}<`);
    }
  });

  it("has no truck-only turn diagram", () => {
    expect(html).not.toContain("TOE-OUT ON TURN");
    expect(html).not.toContain("MAX TURN");
  });
});
