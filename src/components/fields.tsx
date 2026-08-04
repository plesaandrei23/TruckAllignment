"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { AngleDM } from "@/lib/calc";

interface NumberFieldProps {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  unit?: string;
  placeholder?: string;
  hint?: string;
  optional?: boolean;
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
  className,
}: NumberFieldProps) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        {optional && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">optional</span>}
      </div>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          type="number"
          step="any"
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? undefined : Number(raw));
          }}
          className={cn("h-12 font-mono text-base tabular-nums", unit && "pr-14")}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface AngleFieldProps {
  label: string;
  value?: AngleDM;
  onChange: (v: AngleDM | undefined) => void;
  hint?: string;
  optional?: boolean;
  className?: string;
}

/** Degrees + minutes + sign, matching the AM301 gauge. Empty clears the value. */
export function AngleField({ label, value, onChange, hint, optional, className }: AngleFieldProps) {
  const sign = value?.sign ?? 1;
  const deg = value?.deg;
  const min = value?.min;

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
      <div className="flex items-baseline justify-between">
        <Label className="text-sm">{label}</Label>
        {optional && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">optional</span>}
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
            type="number"
            min={0}
            placeholder="0"
            value={deg ?? ""}
            onChange={(e) => emit({ deg: e.target.value === "" ? undefined : Math.abs(Number(e.target.value)) })}
            className="h-12 pr-7 font-mono text-base tabular-nums"
            aria-label={`${label} degrees`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-sm text-muted-foreground">°</span>
        </div>
        <div className="relative flex-1">
          <Input
            inputMode="numeric"
            type="number"
            min={0}
            max={59}
            placeholder="00"
            value={min ?? ""}
            onChange={(e) => emit({ min: e.target.value === "" ? undefined : Math.abs(Number(e.target.value)) })}
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
