import { describe, it, expect } from "vitest";
import { parseNumeric, displayValue } from "./numeric";

describe("parseNumeric", () => {
  it("reads plain and decimal numbers", () => {
    expect(parseNumeric("6")).toEqual({ kind: "ok", value: 6 });
    expect(parseNumeric("6.5")).toEqual({ kind: "ok", value: 6.5 });
    expect(parseNumeric(" 110 ")).toEqual({ kind: "ok", value: 110 });
    expect(parseNumeric(".5")).toEqual({ kind: "ok", value: 0.5 });
  });

  it("accepts the Romanian decimal comma", () => {
    expect(parseNumeric("6,5")).toEqual({ kind: "ok", value: 6.5 });
  });

  it("accepts negative readings, including a typographic minus", () => {
    expect(parseNumeric("-2.5")).toEqual({ kind: "ok", value: -2.5 });
    expect(parseNumeric("−2,5")).toEqual({ kind: "ok", value: -2.5 });
  });

  it("keeps a half-typed decimal usable — this is the bug type=number caused", () => {
    expect(parseNumeric("6.")).toEqual({ kind: "ok", value: 6 });
    expect(parseNumeric("6,")).toEqual({ kind: "ok", value: 6 });
  });

  it("treats a lone sign or dot as still-typing, not an error", () => {
    expect(parseNumeric("-")).toEqual({ kind: "partial" });
    expect(parseNumeric(".")).toEqual({ kind: "partial" });
  });

  it("clears the value on an empty field", () => {
    expect(parseNumeric("")).toEqual({ kind: "ok", value: undefined });
  });

  it("flags text that is not a number", () => {
    expect(parseNumeric("abc").kind).toBe("invalid");
    expect(parseNumeric("6.5.1").kind).toBe("invalid");
    expect(parseNumeric("1e5").kind).toBe("invalid");
  });
});

describe("displayValue", () => {
  it("shows the stored value when the field is not being edited", () => {
    expect(displayValue(null, 6.5)).toBe("6.5");
    expect(displayValue(null, undefined)).toBe("");
    expect(displayValue(null, Number.NaN)).toBe("");
  });

  it("keeps what the user typed while it still means the stored value", () => {
    expect(displayValue("6.", 6)).toBe("6.");
    expect(displayValue("6,5", 6.5)).toBe("6,5");
    expect(displayValue("-", undefined)).toBe("-");
    expect(displayValue("abc", 6)).toBe("abc");
  });

  it("yields to an external change", () => {
    expect(displayValue("6.5", 7)).toBe("7");
  });
});
