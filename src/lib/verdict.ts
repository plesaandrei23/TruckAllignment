/**
 * Pass/fail evaluation of a computed value against a spec.
 *
 * Every measurement is judged one of:
 *   - "pass"    : within the allowed band
 *   - "fail"    : outside the allowed band
 *   - "unknown" : not enough input to compute (a skipped/optional value)
 */

import type { Range } from "./types";
import { round } from "./calc";

export type VerdictStatus = "pass" | "fail" | "unknown";

export interface Verdict {
  status: VerdictStatus;
  /** Signed amount outside the band (0 when passing); undefined when unknown. */
  amountOut?: number;
}

/** Judge a value against an inclusive [min, max] band. */
export function verdictRange(
  value: number | undefined,
  range: Range | undefined,
  epsilon = 1e-9,
): Verdict {
  if (value === undefined || Number.isNaN(value) || !range) {
    return { status: "unknown" };
  }
  if (value < range.min - epsilon) {
    return { status: "fail", amountOut: round(value - range.min, 2) };
  }
  if (value > range.max + epsilon) {
    return { status: "fail", amountOut: round(value - range.max, 2) };
  }
  return { status: "pass", amountOut: 0 };
}

/** Judge an absolute value against a maximum magnitude: |value| <= max. */
export function verdictMax(
  value: number | undefined,
  max: number | undefined,
  epsilon = 1e-9,
): Verdict {
  if (value === undefined || Number.isNaN(value) || max === undefined) {
    return { status: "unknown" };
  }
  const mag = Math.abs(value);
  if (mag > max + epsilon) {
    return { status: "fail", amountOut: round(mag - max, 2) };
  }
  return { status: "pass", amountOut: 0 };
}

/** Combine many verdicts: fail if any fails, else pass if any passes, else unknown. */
export function overallVerdict(verdicts: Verdict[]): VerdictStatus {
  if (verdicts.some((v) => v.status === "fail")) return "fail";
  if (verdicts.some((v) => v.status === "pass")) return "pass";
  return "unknown";
}

/** Tailwind text/border/bg helper classes keyed by verdict status. */
export const verdictClasses: Record<
  VerdictStatus,
  { text: string; bg: string; border: string; dot: string; label: string }
> = {
  pass: {
    text: "text-pass",
    bg: "bg-pass/10",
    border: "border-pass/40",
    dot: "bg-pass",
    label: "OK",
  },
  fail: {
    text: "text-fail",
    bg: "bg-fail/10",
    border: "border-fail/40",
    dot: "bg-fail",
    label: "Out",
  },
  unknown: {
    text: "text-muted-foreground",
    bg: "bg-muted/40",
    border: "border-border",
    dot: "bg-muted-foreground/40",
    label: "—",
  },
};
