"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FieldHelp } from "@/components/field-help";
import type { HelpKey } from "@/lib/help";
import type { AngleDM } from "@/lib/calc";
import { useI18n } from "@/lib/i18n";
import { parseNumeric, displayValue } from "@/lib/numeric";

interface NumberFieldProps {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  unit?: string;
  placeholder?: string;
  hint?: string;
  optional?: boolean;
  help?: HelpKey;
  className?: string;
}

/** Large, touch-friendly numeric input. Empty clears the value (skippable). */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  placeholder = "—",
  hint,
  optional,
  help,
  className,
}: NumberFieldProps) {
  const id = useId();
  const { t } = useI18n();
  const [raw, setRaw] = useState<string | null>(null);
  const shown = displayValue(raw, value);
  const invalid = raw !== null && parseNumeric(raw).kind === "invalid";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Label htmlFor={id} className="text-sm">
            {label}
          </Label>
          {help && <FieldHelp topic={help} />}
        </div>
        {optional && (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("optional")}</span>
        )}
      </div>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          type="text"
          autoComplete="off"
          value={shown}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            const next = e.target.value;
            setRaw(next);
            const parsed = parseNumeric(next);
            if (parsed.kind === "ok") onChange(parsed.value);
          }}
          onBlur={() => setRaw(null)}
          className={cn(
            "h-12 font-mono text-base tabular-nums",
            unit && "pr-14",
            invalid && "border-fail focus-visible:ring-fail/40",
          )}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {invalid ? (
        <p className="text-xs text-fail">{t("Enter a number, e.g. 6.5")}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

interface AngleFieldProps {
  label: string;
  value?: AngleDM;
  onChange: (v: AngleDM | undefined) => void;
  hint?: string;
  optional?: boolean;
  help?: HelpKey;
  className?: string;
}

/** Degrees + minutes + sign, matching the AM301 gauge. Empty clears the value. */
export function AngleField({ label, value, onChange, hint, optional, help, className }: AngleFieldProps) {
  const { t } = useI18n();
  const sign = value?.sign ?? 1;
  const deg = value?.deg;
  const min = value?.min;
  const [rawDeg, setRawDeg] = useState<string | null>(null);
  const [rawMin, setRawMin] = useState<string | null>(null);

  const emit = (next: Partial<{ deg?: number; min?: number; sign: 1 | -1 }>) => {
    const d = next.deg !== undefined ? next.deg : deg;
    const m = next.min !== undefined ? next.min : min;
    const s = next.sign ?? sign;
    if ((d === undefined || Number.isNaN(d)) && (m === undefined || Number.isNaN(m))) {
      onChange(undefined);
      return;
    }
    onChange({ deg: d ?? 0, min: m ?? 0, sign: s });
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Label className="text-sm">{label}</Label>
          {help && <FieldHelp topic={help} />}
        </div>
        {optional && (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("optional")}</span>
        )}
      </div>
      <div className="flex items-stretch gap-2">
        {/* sign toggle */}
        <div className="inline-flex overflow-hidden rounded-md border">
          {([1, -1] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => emit({ sign: s })}
              aria-pressed={sign === s}
              className={cn(
                "w-10 text-base font-mono transition-colors",
                sign === s ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {s === 1 ? "+" : "−"}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Input
            inputMode="numeric"
            type="text"
            autoComplete="off"
            placeholder="0"
            value={displayValue(rawDeg, deg)}
            onChange={(e) => {
              setRawDeg(e.target.value);
              const parsed = parseNumeric(e.target.value);
              // Ignore junk: the sign lives on its own toggle, so keep |value|.
              if (parsed.kind === "ok") emit({ deg: parsed.value === undefined ? undefined : Math.abs(parsed.value) });
            }}
            onBlur={() => setRawDeg(null)}
            className="h-12 pr-7 font-mono text-base tabular-nums"
            aria-label={`${label} degrees`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-sm text-muted-foreground">°</span>
        </div>
        <div className="relative flex-1">
          <Input
            inputMode="numeric"
            type="text"
            autoComplete="off"
            placeholder="00"
            value={displayValue(rawMin, min)}
            onChange={(e) => {
              setRawMin(e.target.value);
              const parsed = parseNumeric(e.target.value);
              // Minutes are 0..59; anything above is clamped rather than rejected.
              if (parsed.kind === "ok")
                emit({ min: parsed.value === undefined ? undefined : Math.min(59, Math.abs(parsed.value)) });
            }}
            onBlur={() => setRawMin(null)}
            className="h-12 pr-7 font-mono text-base tabular-nums"
            aria-label={`${label} minutes`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-sm text-muted-foreground">′</span>
        </div>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
