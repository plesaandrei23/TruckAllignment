/**
 * JOSAM laser AM — alignment calculation engine.
 *
 * Pure, dependency-free functions. Every formula here is verified against the
 * worked examples in the JOSAM manual (see calc.test.ts):
 *   - Rolling direction of a wheel:  C/Dm = (A - B) / D            (mm/m)
 *   - Toe of an axle:                toe  = C_left + C_right        (+ = toe-in)
 *   - Out-of-square of an axle:      oos  = (C_right - C_left) / 2  (+ = left)
 *   - Axle-to-axle parallelism:      diff = oos_x - oos_y
 *   - Angle <-> mm/m:                1° = 17.4 mm/m
 *
 * Sign conventions (from the manual):
 *   Rolling direction: laser dot inside the 0-line = (+), outside = (-).
 *   Toe: (+) greater => toe-IN, (-) greater => toe-OUT.
 *   Out-of-square: axle offset to the LEFT = (+), to the RIGHT = (-).
 */

/** Millimetres-per-metre gained per degree of angle (JOSAM manual, p.21). */
export const MM_PER_DEGREE = 17.4;

/** A signed angle expressed in whole degrees + minutes, as the AM301 gauge reads. */
export interface AngleDM {
  /** Whole degrees, always >= 0. Sign is carried by `sign`. */
  deg: number;
  /** Minutes 0..59, always >= 0. Sign is carried by `sign`. */
  min: number;
  /** +1 or -1. */
  sign: 1 | -1;
}

export type ToeKind = "toe-in" | "toe-out" | "neutral";
export type Side = "left" | "right" | "centre";

/**
 * Rolling direction of a single wheel in mm/m.
 * @param a  Front frame-gauge scale reading (mm).
 * @param b  Rear frame-gauge scale reading (mm).
 * @param d  Distance between the front and rear scales (metres). Must be > 0.
 *
 * Manual example (C5, left): (110 - 92) / 6 = +3 mm/m.
 */
export function rollingDirection(a: number, b: number, d: number): number {
  if (!Number.isFinite(d) || d === 0) {
    throw new Error("Distance D between scales must be a non-zero number.");
  }
  return (a - b) / d;
}

/**
 * Raw scale difference of one wheel in mm: front (A) minus rear (B).
 *
 * This is the numerator of the rolling direction, before dividing by D — the
 * number the technician can check straight off the two plaques.
 */
export function scaleDifference(a: number, b: number): number {
  return a - b;
}

/**
 * Difference between the two sides' raw scale differences (mm).
 * Positive => the left wheel's A−B is the larger of the two.
 */
export function sideDifference(leftDiff: number, rightDiff: number): number {
  return leftDiff - rightDiff;
}

/**
 * Toe of an axle in mm/m. Positive => toe-in, negative => toe-out.
 * @param cLeft   Rolling direction of the left wheel (mm/m).
 * @param cRight  Rolling direction of the right wheel (mm/m).
 *
 * Manual example (C5/C6): +3 + (-2) = +1 => toe-in.
 */
export function toe(cLeft: number, cRight: number): number {
  return cLeft + cRight;
}

/** Classify a toe value into toe-in / toe-out / neutral. */
export function toeKind(toeValue: number, epsilon = 1e-9): ToeKind {
  if (toeValue > epsilon) return "toe-in";
  if (toeValue < -epsilon) return "toe-out";
  return "neutral";
}

/**
 * Out-of-square (axle offset relative to the geometric centreline) in mm/m.
 * Positive => axle offset to the LEFT, negative => to the RIGHT.
 * @param cLeft   Rolling direction of the left wheel (mm/m).
 * @param cRight  Rolling direction of the right wheel (mm/m).
 *
 * Manual example (C3/C4): (2 - (-4)) / 2 = +3 => 3 mm/m to the left.
 * Manual example (C5/C6): (-2 - 3) / 2 = -2.5 => 2.5 mm/m to the right.
 */
export function outOfSquare(cLeft: number, cRight: number): number {
  return (cRight - cLeft) / 2;
}

/** Which way an out-of-square value points. */
export function outOfSquareSide(oos: number, epsilon = 1e-9): Side {
  if (oos > epsilon) return "left";
  if (oos < -epsilon) return "right";
  return "centre";
}

/**
 * Difference in out-of-square between two axles (mm/m). The magnitude is how
 * far from parallel the two axles are; 0 => parallel.
 *
 * Because out-of-square is signed (+left / -right), a simple subtraction gives
 * the manual's rule automatically:
 *   - opposite directions add up:  (+3) - (-2.5) = 5.5  (not parallel)
 *   - same direction subtracts:    (-3) - (-2.5) = -0.5 (nearly parallel)
 */
export function parallelismDiff(oosReference: number, oosOther: number): number {
  return oosReference - oosOther;
}

// ---------------------------------------------------------------------------
// Angle <-> mm/m conversions (1° = 17.4 mm/m)
// ---------------------------------------------------------------------------

/** Convert a signed degrees+minutes angle to a decimal degree value. */
export function angleToDecimal(a: AngleDM): number {
  return a.sign * (a.deg + a.min / 60);
}

/** Convert a decimal degree value to a signed degrees+minutes angle. */
export function decimalToAngle(decimalDeg: number): AngleDM {
  const sign: 1 | -1 = decimalDeg < 0 ? -1 : 1;
  const abs = Math.abs(decimalDeg);
  let deg = Math.floor(abs);
  let min = Math.round((abs - deg) * 60);
  if (min === 60) {
    deg += 1;
    min = 0;
  }
  return { deg, min, sign };
}

/** Convert an angle (degrees+minutes) to mm/m. */
export function angleToMmPerM(a: AngleDM): number {
  return angleToDecimal(a) * MM_PER_DEGREE;
}

/** Convert mm/m to a decimal degree value. */
export function mmPerMToDegrees(mmm: number): number {
  return mmm / MM_PER_DEGREE;
}

/** Convert mm/m to a signed degrees+minutes angle. */
export function mmPerMToAngle(mmm: number): AngleDM {
  return decimalToAngle(mmPerMToDegrees(mmm));
}

// ---------------------------------------------------------------------------
// Steering-axle helpers
// ---------------------------------------------------------------------------

/**
 * Toe-out on turn (TOOT): inner wheel is turned to a reference angle (usually
 * 20°); the outer wheel's angle is read. The difference is the toe-out on turn.
 * @param innerAngle  Angle the inner wheel was turned to (°), e.g. 20.
 * @param outerAngle  Angle read on the outer wheel (°), e.g. 18.
 * Manual example: 20 - 18 = 2°.
 */
export function toeOutOnTurn(innerAngle: number, outerAngle: number): number {
  return innerAngle - outerAngle;
}

/**
 * Steering-box centering deviation in mm/m: (A - B) / D. Compare against the
 * fixed manual limit of 1°/m (~17.4 mm/m).
 */
export function steeringBoxDeviation(a: number, b: number, d: number): number {
  return rollingDirection(a, b, d);
}

// ---------------------------------------------------------------------------
// Rounding helpers for display (the device works in whole mm/m)
// ---------------------------------------------------------------------------

/** Round to a given number of decimals (default 1) without -0 artefacts. */
export function round(value: number, decimals = 1): number {
  const f = 10 ** decimals;
  const r = Math.round(value * f) / f;
  return Object.is(r, -0) ? 0 : r;
}

/** Format a signed number with an explicit leading + / - (e.g. "+3", "-2.5"). */
export function withSign(value: number, decimals = 1): string {
  const r = round(value, decimals);
  return `${r > 0 ? "+" : r < 0 ? "-" : ""}${Math.abs(r)}`;
}
