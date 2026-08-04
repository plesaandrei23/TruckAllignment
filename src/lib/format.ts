/**
 * Display formatting for measured & computed values. Keeps units and signs
 * consistent across the editor and the report.
 */

import { round, withSign, decimalToAngle, type AngleDM, type ToeKind } from "./calc";
import type { Side } from "./calc";

/** e.g. 3 -> "+3.0 mm/m". */
export function fmtMmM(value: number | undefined, decimals = 1): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return `${withSign(value, decimals)} mm/m`;
}

/** Bare signed number, no unit. */
export function fmtSigned(value: number | undefined, decimals = 1): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return withSign(value, decimals);
}

/** e.g. {deg:1,min:30,sign:-1} -> "-1°30′". */
export function fmtAngle(a: AngleDM | undefined): string {
  if (!a) return "—";
  const sign = a.sign < 0 ? "-" : "";
  return `${sign}${a.deg}°${String(a.min).padStart(2, "0")}′`;
}

/** Decimal degrees -> "1°30′". */
export function fmtDeg(decimal: number | undefined): string {
  if (decimal === undefined || Number.isNaN(decimal)) return "—";
  return fmtAngle(decimalToAngle(decimal));
}

export function toeLabel(kind: ToeKind | "unknown"): string {
  switch (kind) {
    case "toe-in":
      return "Toe-in";
    case "toe-out":
      return "Toe-out";
    case "neutral":
      return "Neutral";
    default:
      return "—";
  }
}

export function sideLabel(side: Side | "unknown"): string {
  switch (side) {
    case "left":
      return "Left";
    case "right":
      return "Right";
    case "centre":
      return "Centred";
    default:
      return "—";
  }
}

/** Short date like "4 Aug 2026" from an ISO or epoch. */
export function fmtDate(value: string | number | undefined): string {
  if (value === undefined || value === "") return "—";
  const d = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export { round, withSign };
