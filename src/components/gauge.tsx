import { cn } from "@/lib/utils";
import type { VerdictStatus } from "@/lib/verdict";
import { withSign } from "@/lib/calc";

interface GaugeProps {
  /** Measured value (same unit as the band). Undefined => empty gauge. */
  value?: number;
  /** Tolerance band. */
  min?: number;
  max?: number;
  status?: VerdictStatus;
  /** Labels for the two ends of the scale, e.g. "toe-out" / "toe-in". */
  leftLabel?: string;
  rightLabel?: string;
  className?: string;
  decimals?: number;
}

const STATUS_COLOR: Record<VerdictStatus, string> = {
  pass: "var(--pass)",
  fail: "var(--fail)",
  unknown: "var(--muted-foreground)",
};

/**
 * A horizontal measuring scale centred on 0 — the app's signature motif, taken
 * straight from the JOSAM frame-gauge ruler. The tolerance band is shaded, the
 * measured value sits on the scale as a needle, tinted by its verdict.
 */
export function Gauge({
  value,
  min,
  max,
  status = "unknown",
  leftLabel,
  rightLabel,
  className,
  decimals = 1,
}: GaugeProps) {
  const W = 300;
  const H = 56;
  const midY = 30;
  const padX = 10;

  // Symmetric domain around zero, comfortably containing band + value.
  const candidates = [Math.abs(min ?? 0), Math.abs(max ?? 0), Math.abs(value ?? 0), 2];
  const domain = Math.max(...candidates) * 1.35;
  const toX = (v: number) => {
    const clamped = Math.max(-domain, Math.min(domain, v));
    return padX + ((clamped + domain) / (2 * domain)) * (W - 2 * padX);
  };

  const color = STATUS_COLOR[status];
  const hasBand = min !== undefined && max !== undefined;
  const hasValue = value !== undefined && !Number.isNaN(value);

  // Ruler ticks across the width.
  const ticks = [];
  const tickCount = 20;
  for (let i = 0; i <= tickCount; i++) {
    const x = padX + (i / tickCount) * (W - 2 * padX);
    const major = i % 5 === 0;
    ticks.push(
      <line
        key={i}
        x1={x}
        x2={x}
        y1={midY}
        y2={midY + (major ? 8 : 5)}
        stroke="currentColor"
        strokeWidth={1}
        className="text-border"
      />,
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={
          hasValue ? `${withSign(value!, decimals)} on a scale from -${domain.toFixed(0)} to +${domain.toFixed(0)}` : "no value"
        }
      >
        {/* tolerance band */}
        {hasBand && (
          <rect
            x={toX(min!)}
            y={midY - 12}
            width={Math.max(2, toX(max!) - toX(min!))}
            height={24}
            rx={3}
            fill="var(--pass)"
            opacity={0.16}
          />
        )}
        {/* baseline */}
        <line x1={padX} x2={W - padX} y1={midY} y2={midY} stroke="currentColor" strokeWidth={1.5} className="text-border" />
        {ticks}
        {/* zero line */}
        <line x1={toX(0)} x2={toX(0)} y1={midY - 16} y2={midY + 12} stroke="currentColor" strokeWidth={1.5} className="text-muted-foreground" />
        <text x={toX(0)} y={midY - 20} textAnchor="middle" className="fill-muted-foreground" fontSize={9}>
          0
        </text>
        {/* value needle */}
        {hasValue && (
          <g>
            <line x1={toX(value!)} x2={toX(value!)} y1={midY - 18} y2={midY + 12} stroke={color} strokeWidth={2.5} />
            <circle cx={toX(value!)} cy={midY - 18} r={4.5} fill={color} />
          </g>
        )}
      </svg>
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between px-1 -mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}
