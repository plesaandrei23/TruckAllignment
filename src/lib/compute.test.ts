import { describe, it, expect } from "vitest";
import { computeJob } from "./compute";
import { DEFAULT_SPECS } from "./defaults";
import type { Job } from "./types";

/** Build a minimal trailer job with two axles carrying the manual's C3..C6 numbers. */
function manualTrailer(): Job {
  const now = 0;
  return {
    id: "test",
    createdAt: now,
    updatedAt: now,
    vehicleType: "trailer",
    header: {},
    D: 6,
    axles: [
      {
        id: "a1",
        isSteering: false,
        // C3 = (89-113)/6 = -4 ; C4 = (108-96)/6 = +2
        left: { A: 89, B: 113 },
        right: { A: 108, B: 96 },
      },
      {
        id: "a2",
        isSteering: false,
        // C5 = (110-92)/6 = +3 ; C6 = (96-108)/6 = -2
        left: { A: 110, B: 92 },
        right: { A: 96, B: 108 },
      },
    ],
  };
}

describe("computeJob (integration with the manual's C3..C6 example)", () => {
  const spec = DEFAULT_SPECS.find((s) => s.vehicleType === "trailer");
  const result = computeJob(manualTrailer(), spec);

  it("axle 1 (C3/C4): toe -2 toe-out, oos +3 left", () => {
    const a = result.axles[0];
    expect(a.cLeft).toBe(-4);
    expect(a.cRight).toBe(2);
    expect(a.toe).toBe(-2);
    expect(a.toeKind).toBe("toe-out");
    expect(a.oos).toBe(3);
    expect(a.oosSide).toBe("left");
  });

  it("axle 2 (C5/C6): toe +1 toe-in, oos -2.5 right", () => {
    const a = result.axles[1];
    expect(a.cLeft).toBe(3);
    expect(a.cRight).toBe(-2);
    expect(a.toe).toBe(1);
    expect(a.toeKind).toBe("toe-in");
    expect(a.oos).toBe(-2.5);
    expect(a.oosSide).toBe("right");
  });

  it("axles not parallel: oos +3 (left) vs -2.5 (right) => 5.5 mm/m", () => {
    expect(result.parallelism).toHaveLength(1);
    expect(result.parallelism[0].value).toBe(5.5);
  });

  it("wheel numbers map axle index to JOSAM C-numbers", () => {
    // These readings sit at axle indices 0 and 1, so they map to C1/C2, C3/C4.
    expect(result.axles[0].wheelNo).toEqual({ left: 1, right: 2 });
    expect(result.axles[1].wheelNo).toEqual({ left: 3, right: 4 });
  });
});

describe("computeJob with an unusable D", () => {
  // A half-filled form must never throw: D is 0 until the technician types it,
  // and while typing "6." the field is momentarily empty.
  it.each([0, Number.NaN, -1])("returns unknown results instead of throwing (D = %s)", (d) => {
    const job = { ...manualTrailer(), D: d };
    const result = computeJob(job, DEFAULT_SPECS[0]);
    expect(result.axles[0].cLeft).toBeUndefined();
    expect(result.axles[0].toe).toBeUndefined();
    expect(result.axles[0].toeKind).toBe("unknown");
    expect(result.parallelism[0].value).toBeUndefined();
    expect(result.status).toBe("unknown");
  });

  it("computes again once a decimal D is entered", () => {
    const result = computeJob({ ...manualTrailer(), D: 6.5 }, DEFAULT_SPECS[0]);
    expect(result.axles[0].cLeft).toBeCloseTo((89 - 113) / 6.5, 10);
  });
});

describe("raw scale differences", () => {
  const result = computeJob(manualTrailer(), DEFAULT_SPECS[0]);

  it("shows A − B per wheel, in mm", () => {
    // Axle 1: left 89-113 = -24, right 108-96 = +12.
    expect(result.axles[0].left.diff).toBe(-24);
    expect(result.axles[0].right.diff).toBe(12);
    // Axle 2: left 110-92 = +18, right 96-108 = -12.
    expect(result.axles[1].left.diff).toBe(18);
    expect(result.axles[1].right.diff).toBe(-12);
  });

  it("shows the left-vs-right difference of those, in mm", () => {
    expect(result.axles[0].sideDiff).toBe(-36); // -24 - (+12)
    expect(result.axles[1].sideDiff).toBe(30); //  +18 - (-12)
  });

  it("needs no D — A − B is plain plaque arithmetic", () => {
    const noD = computeJob({ ...manualTrailer(), D: 0 }, DEFAULT_SPECS[0]);
    expect(noD.axles[0].left.diff).toBe(-24);
    expect(noD.axles[0].sideDiff).toBe(-36);
    expect(noD.axles[0].cLeft).toBeUndefined();
  });

  it("stays undefined until both scales are keyed in", () => {
    const half = manualTrailer();
    half.axles[0].right = { A: 108 };
    const result = computeJob(half, DEFAULT_SPECS[0]);
    expect(result.axles[0].right.diff).toBeUndefined();
    expect(result.axles[0].sideDiff).toBeUndefined();
  });
});

describe("the toe numerator", () => {
  const result = computeJob(manualTrailer(), DEFAULT_SPECS[0]);

  it("sums the two sides' A − B", () => {
    // Axle 1: left -24, right +12.
    expect(result.axles[0].sideSum).toBe(-12);
    // Axle 2: left +18, right -12.
    expect(result.axles[1].sideSum).toBe(6);
  });

  it("divided by D it equals the toe, whichever way you get there", () => {
    for (const axle of result.axles) {
      expect(axle.sideSum! / 6).toBeCloseTo(axle.toe!, 10);
    }
  });

  it("keeps the sign that separates toe-in from toe-out", () => {
    // A big magnitude with a negative sign is still toe-out, never 'in range'.
    expect(result.axles[0].sideSum).toBeLessThan(0);
    expect(result.axles[0].toeKind).toBe("toe-out");
    expect(result.axles[1].sideSum).toBeGreaterThan(0);
    expect(result.axles[1].toeKind).toBe("toe-in");
  });
});
