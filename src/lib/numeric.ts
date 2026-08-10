/**
 * Text -> number parsing for the measurement inputs.
 *
 * We deliberately do NOT use `<input type="number">`: while you type "6." the
 * browser reports an empty value, so a decimal could never be entered, and a
 * Romanian keyboard's decimal comma was rejected outright. Instead the fields
 * keep the raw text and parse it here, accepting "," as a decimal separator and
 * the typographic minus "−".
 */

export type Parsed =
  /** Usable number (or `undefined` for a cleared field). */
  | { kind: "ok"; value?: number }
  /** Mid-typing, e.g. "-" or "." — keep the text, emit nothing, say nothing. */
  | { kind: "partial" }
  /** Not a number at all — keep the text and tell the user. */
  | { kind: "invalid" };

export function parseNumeric(raw: string): Parsed {
  const cleaned = raw.trim().replace(/−/g, "-").replace(",", ".");
  if (cleaned === "") return { kind: "ok", value: undefined };
  if (/^-?\.?$/.test(cleaned)) return { kind: "partial" };
  if (!/^-?(\d+(\.\d*)?|\.\d+)$/.test(cleaned)) return { kind: "invalid" };
  const n = Number(cleaned);
  return Number.isFinite(n) ? { kind: "ok", value: n } : { kind: "invalid" };
}

/** Show the raw text while the user is editing it, otherwise the stored value. */
export function displayValue(raw: string | null, value?: number): string {
  if (raw !== null) {
    const parsed = parseNumeric(raw);
    // Only fall back to the stored value once an external change disagrees.
    if (parsed.kind !== "ok" || parsed.value === value) return raw;
  }
  return value === undefined || Number.isNaN(value) ? "" : String(value);
}
