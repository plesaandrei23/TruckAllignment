import { describe, it, expect } from "vitest";
import {
  rollingDirection,
  toe,
  toeKind,
  outOfSquare,
  outOfSquareSide,
  parallelismDiff,
  angleToMmPerM,
  mmPerMToAngle,
  angleToDecimal,
  decimalToAngle,
  toeOutOnTurn,
  round,
  withSign,
} from "./calc";

/**
 * All fixtures below are the JOSAM manual's own worked examples. If any of
 * these break, the engine no longer matches the manual.
 */

describe("rolling direction  C/Dm = (A - B) / D", () => {
  it("C5 left (manual p.26): (110 - 92) / 6 = +3", () => {
    expect(rollingDirection(110, 92, 6)).toBe(3);
  });
  it("C6 right (manual p.26): (96 - 108) / 6 = -2", () => {
    expect(rollingDirection(96, 108, 6)).toBe(-2);
  });
  it("C3 left (manual p.32): (89 - 113) / 6 = -4", () => {
    expect(rollingDirection(89, 113, 6)).toBe(-4);
  });
  it("C4 right (manual p.32): (108 - 96) / 6 = +2", () => {
    expect(rollingDirection(108, 96, 6)).toBe(2);
  });
  it("C1 left (manual p.40, D=7): (158 - 151) / 7 = +1", () => {
    expect(rollingDirection(158, 151, 7)).toBe(1);
  });
  it("C2 right (manual p.40, D=7): (140 - 154) / 7 = -2", () => {
    expect(rollingDirection(140, 154, 7)).toBe(-2);
  });
  it("throws when D is zero", () => {
    expect(() => rollingDirection(100, 90, 0)).toThrow();
  });
});

describe("toe  = C_left + C_right", () => {
  it("C5/C6: +3 + (-2) = +1 => toe-in", () => {
    const t = toe(3, -2);
    expect(t).toBe(1);
    expect(toeKind(t)).toBe("toe-in");
  });
  it("C3/C4: -4 + (+2) = -2 => toe-out", () => {
    const t = toe(-4, 2);
    expect(t).toBe(-2);
    expect(toeKind(t)).toBe("toe-out");
  });
  it("C1/C2: +1 + (-2) = -1 => toe-out", () => {
    const t = toe(1, -2);
    expect(t).toBe(-1);
    expect(toeKind(t)).toBe("toe-out");
  });
  it("0 => neutral", () => {
    expect(toeKind(toe(2, -2))).toBe("neutral");
  });
});

describe("out-of-square  = (C_right - C_left) / 2", () => {
  it("C3/C4: (2 - (-4)) / 2 = +3 => left", () => {
    const oos = outOfSquare(-4, 2);
    expect(oos).toBe(3);
    expect(outOfSquareSide(oos)).toBe("left");
  });
  it("C5/C6: (-2 - 3) / 2 = -2.5 => right", () => {
    const oos = outOfSquare(3, -2);
    expect(oos).toBe(-2.5);
    expect(outOfSquareSide(oos)).toBe("right");
  });
});

describe("axle parallelism  = oos_ref - oos_other", () => {
  it("opposite directions add: +3 (left) vs -2.5 (right) => 5.5, not parallel", () => {
    expect(parallelismDiff(3, -2.5)).toBe(5.5);
  });
  it("same direction subtracts: -3 vs -2.5 => -0.5, nearly parallel", () => {
    expect(round(parallelismDiff(-3, -2.5))).toBe(-0.5);
  });
});

describe("angle <-> mm/m  (1° = 17.4 mm/m)", () => {
  it("30' = 0.5° = 8.7 mm/m (manual p.21 table)", () => {
    expect(round(angleToMmPerM({ deg: 0, min: 30, sign: 1 }))).toBe(8.7);
  });
  it("1° = 17.4 mm/m", () => {
    expect(round(angleToMmPerM({ deg: 1, min: 0, sign: 1 }))).toBe(17.4);
  });
  it("negative angle keeps its sign", () => {
    expect(round(angleToMmPerM({ deg: 1, min: 0, sign: -1 }))).toBe(-17.4);
  });
  it("decimal<->angle round-trips", () => {
    expect(angleToDecimal({ deg: 2, min: 30, sign: 1 })).toBe(2.5);
    expect(decimalToAngle(2.5)).toEqual({ deg: 2, min: 30, sign: 1 });
    expect(decimalToAngle(-1.5)).toEqual({ deg: 1, min: 30, sign: -1 });
  });
  it("mm/m -> angle: 8.7 mm/m ~= 30'", () => {
    expect(mmPerMToAngle(8.7)).toEqual({ deg: 0, min: 30, sign: 1 });
  });
});

describe("toe-out on turn (TOOT)", () => {
  it("inner 20°, outer 18° => 2° (manual p.54)", () => {
    expect(toeOutOnTurn(20, 18)).toBe(2);
  });
});

describe("formatting helpers", () => {
  it("withSign renders explicit signs and avoids -0", () => {
    expect(withSign(3)).toBe("+3");
    expect(withSign(-2.5)).toBe("-2.5");
    expect(withSign(0)).toBe("0");
    expect(withSign(-0)).toBe("0");
  });
});
