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
