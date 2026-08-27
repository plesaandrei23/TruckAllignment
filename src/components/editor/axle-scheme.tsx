"use client";

import type { ReactNode } from "react";

/**
 * Top-down view of one axle, drawn between its two input columns so the
 * technician fills in each scale reading next to the wheel it belongs to —
 * the same left/centre/right arrangement as the printed AM39 sheet.
 *
 * Each wheel is tilted by its own rolling direction, so toe-in and toe-out are
 * visible at a glance while the mechanic works the track rod. The tilt is
 * exaggerated (a real 3 mm/m is ~0.17°, invisible at this size) and clamped, so
 * it reads as a direction, never as a measurement.
 */

const TILT_PER_MM_M = 2.2;
const MAX_TILT = 14;

function tilt(c: number | undefined): number {
  if (c === undefined || Number.isNaN(c)) return 0;
  return Math.max(-MAX_TILT, Math.min(MAX_TILT, c * TILT_PER_MM_M));
}

export function AxleScheme({
  cLeft,
  cRight,
  dual,
  frontLabel,
}: {
  cLeft?: number;
  cRight?: number;
  /** Twin wheels, as on a drive axle. */
  dual?: boolean;
  frontLabel: string;
}) {
  const w = 92;
  const h = 196;
  const axleY = 108;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" role="presentation">
      {/* direction of travel */}
      <g className="fill-muted-foreground/70">
        <path d={`M${w / 2} 6 l5 9 h-10 z`} />
        <text x={w / 2} y={29} fontSize={9} textAnchor="middle" className="fill-muted-foreground">
          {frontLabel}
        </text>
      </g>

      {/* centreline of the vehicle */}
      <line
        x1={w / 2}
        y1={34}
        x2={w / 2}
        y2={h - 6}
        strokeDasharray="3 4"
        className="stroke-border"
        strokeWidth={1}
      />

      {/* axle beam */}
      <line x1={18} y1={axleY} x2={w - 18} y2={axleY} className="stroke-muted-foreground/60" strokeWidth={2.5} />

      <WheelGroup x={18} y={axleY} deg={tilt(cLeft)} dual={dual} />
      <WheelGroup x={w - 18} y={axleY} deg={-tilt(cRight)} dual={dual} />
    </svg>
  );
}

/**
 * One wheel (or twin pair) seen from above, rotated about its own centre.
 * The sign is mirrored for the right-hand side so that a positive rolling
 * direction leans both wheels the same way the vehicle would steer.
 */
function WheelGroup({ x, y, deg, dual }: { x: number; y: number; deg: number; dual?: boolean }): ReactNode {
  const tyreW = dual ? 11 : 15;
  const tyreH = 56;
  const gap = 3;
  const rects = dual
    ? [-(tyreW + gap) / 2, (tyreW + gap) / 2]
    : [0];

  return (
    <g transform={`translate(${x} ${y}) rotate(${deg})`}>
      {rects.map((dx) => (
        <rect
          key={dx}
          x={dx - tyreW / 2}
          y={-tyreH / 2}
          width={tyreW}
          height={tyreH}
          rx={4}
          className="fill-muted stroke-foreground/70"
          strokeWidth={1.2}
        />
      ))}
      {/* rolling direction, drawn through the wheel like the printed sheet */}
      <line x1={0} y1={-tyreH / 2 - 14} x2={0} y2={tyreH / 2 + 14} className="stroke-primary" strokeWidth={1.6} />
    </g>
  );
}
