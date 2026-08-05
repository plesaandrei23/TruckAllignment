import type { ReactNode } from "react";
import type { Job } from "@/lib/types";
import type { AxleComputed, JobComputed } from "@/lib/compute";
import type { VerdictStatus } from "@/lib/verdict";
import { fmtAngle, fmtDate } from "@/lib/format";
import { withSign } from "@/lib/calc";

/**
 * Faithful recreation of the JOSAM AM39 test report sheet (A4 portrait), matching
 * the paper forms `truckModel.jpeg` (steering axle + turn diagram, one ruler
 * block) and `trailerModel.jpeg` (up to 4 axles across two ruler blocks).
 *
 * Rendered entirely in SVG so it prints crisply at true size. All values come
 * from `computeJob`; pass/fail is shown as a light tint on each value box while
 * keeping the black line-art look of the original form.
 */

export const SHEET_W = 794; // A4 portrait @96dpi
export const SHEET_H = 1123;

const M = 24; // outer margin
const INK = "#111111";
const GREY = "#6b7280";

function vfill(status: VerdictStatus): { fill: string; text: string } {
  switch (status) {
    case "pass":
      return { fill: "#dcfce7", text: "#15803d" };
    case "fail":
      return { fill: "#fee2e2", text: "#b91c1c" };
    default:
      return { fill: "#ffffff", text: INK };
  }
}

export function Am39Report({ job, computed }: { job: Job; computed: JobComputed; spec?: unknown }) {
  const isTruck = job.vehicleType === "truck";

  // Split axles into ruler blocks: truck = one block; trailer = pairs.
  const blocks: AxleComputed[][] = isTruck
    ? [computed.axles]
    : chunk(computed.axles, 2);

  // ---- vertical layout ----
  let y = M;
  const headerH = 66;
  const headerY = y;
  y += headerH + 6;

  let turnY = 0;
  if (isTruck) {
    turnY = y;
    y += 116;
  }

  const blockLayouts: {
    axles: { axle: AxleComputed; y: number; h: number }[];
    rulerTopY: number;
    rulerBotY: number;
    dBoxY: number;
  }[] = [];

  for (let bi = 0; bi < blocks.length; bi++) {
    const rulerTopY = y;
    y += 20;
    const axleLayouts: { axle: AxleComputed; y: number; h: number }[] = [];
    for (const axle of blocks[bi]) {
      const h = axle.isSteering ? 150 : 120;
      axleLayouts.push({ axle, y, h });
      y += h;
    }
    const rulerBotY = y;
    y += 20;
    const dBoxY = rulerBotY;
    blockLayouts.push({ axles: axleLayouts, rulerTopY, rulerBotY, dBoxY });
    y += 6;
  }

  const oosY = y + 4;

  return (
    <svg
      viewBox={`0 0 ${SHEET_W} ${SHEET_H}`}
      width={SHEET_W}
      height={SHEET_H}
      style={{
        background: "#fff",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
      }}
    >
      <Header job={job} status={computed.status} y={headerY} />
      {isTruck && <TurnDiagram axle={computed.axles[0]} job={job} y={turnY} />}

      {blockLayouts.map((block, bi) => (
        <g key={bi}>
          <Ruler
            y={block.rulerTopY + 12}
            leftTag={`A${bi * 2 + 1}`}
            rightTag={`A${bi * 2 + 2}`}
            marker={isTruck}
          />
          {block.axles.map(({ axle, y: ay, h }) => (
            <AxleRow key={axle.id} axle={axle} job={job} y={ay} h={h} />
          ))}
          <Ruler
            y={block.rulerBotY + 12}
            leftTag={`B${bi * 2 + 1}`}
            rightTag={`B${bi * 2 + 2}`}
          />
          <DBox
            x={SHEET_W - M - 96}
            y={block.dBoxY - 2}
            d={job.D}
            top={`A${bi * 2 + 1},${bi * 2 + 2}`}
            bot={`B${bi * 2 + 1},${bi * 2 + 2}`}
          />
        </g>
      ))}

      <OutOfSquare computed={computed} isTruck={isTruck} y={oosY} />

      {/* footer marks */}
      <text x={M} y={SHEET_H - 12} fontSize={13} fontWeight={700} fill={INK}>
        AM39-1
      </text>
      <text x={SHEET_W - M} y={SHEET_H - 12} fontSize={8} fill={GREY} textAnchor="end">
        JOSAM laser AM · T 27
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function Box({
  x,
  y,
  w,
  h,
  status = "unknown",
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  status?: VerdictStatus;
  children?: ReactNode;
}) {
  const c = vfill(status);
  return (
    <>
      <rect x={x} y={y} width={w} height={h} fill={c.fill} stroke={INK} strokeWidth={0.8} />
      {children}
    </>
  );
}

/** A boxed value with a small label tab, e.g. A₁ | 158. */
function LabelValue({
  x,
  y,
  w,
  label,
  value,
  status = "unknown",
  labelW = 26,
  h = 18,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  value: string;
  status?: VerdictStatus;
  labelW?: number;
  h?: number;
}) {
  const c = vfill(status);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={c.fill} stroke={INK} strokeWidth={0.8} />
      <line x1={x + labelW} y1={y} x2={x + labelW} y2={y + h} stroke={INK} strokeWidth={0.8} />
      <text x={x + labelW / 2} y={y + h / 2 + 3.5} fontSize={9} fontWeight={700} fill={INK} textAnchor="middle">
        {label}
      </text>
      <text
        x={x + w - 5}
        y={y + h / 2 + 3.5}
        fontSize={10}
        fontWeight={600}
        fill={c.text}
        textAnchor="end"
        style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
      >
        {value}
      </text>
    </g>
  );
}

/** Trilingual measurement box (Camber / KPI / Caster) with a value. */
function MeasureBox({
  x,
  y,
  w,
  h,
  lines,
  value,
  status = "unknown",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
  value: string;
  status?: VerdictStatus;
}) {
  const c = vfill(status);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={c.fill} stroke={INK} strokeWidth={0.8} />
      {lines.map((ln, i) => (
        <text key={i} x={x + 4} y={y + 9 + i * 7.2} fontSize={5.6} fill={GREY} letterSpacing={0.2}>
          {ln.toUpperCase()}
        </text>
      ))}
      <text
        x={x + w - 5}
        y={y + h - 6}
        fontSize={11}
        fontWeight={700}
        fill={c.text}
        textAnchor="end"
        style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
      >
        {value}
      </text>
    </g>
  );
}

/** JOSAM measuring scale: 0 100 200 300 ...gap... 300 200 100 0. */
function Ruler({
  y,
  leftTag,
  rightTag,
  marker,
}: {
  y: number;
  leftTag: string;
  rightTag: string;
  marker?: boolean;
}) {
  const x0 = M + 150;
  const x1 = SHEET_W - M - 150;
  const w = x1 - x0;
  const ticks: ReactNode[] = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const x = x0 + (i / n) * w;
    const major = i % 5 === 0;
    ticks.push(
      <line key={i} x1={x} y1={y} x2={x} y2={y + (major ? 7 : 4)} stroke={INK} strokeWidth={major ? 0.9 : 0.5} />,
    );
  }
  const labels = ["0", "100", "200", "300"];
  return (
    <g>
      <text x={x0 - 6} y={y + 6} fontSize={10} fontWeight={700} fill={INK} textAnchor="end">
        {leftTag}
      </text>
      <line x1={x0} y1={y} x2={x1} y2={y} stroke={INK} strokeWidth={0.9} />
      {ticks}
      {labels.map((l, i) => (
        <text key={`l${i}`} x={x0 + 6 + i * (w * 0.11)} y={y - 3} fontSize={6.5} fill={INK} textAnchor="middle">
          {l}
        </text>
      ))}
      {labels
        .slice()
        .reverse()
        .map((l, i) => (
          <text key={`r${i}`} x={x1 - 6 - i * (w * 0.11)} y={y - 3} fontSize={6.5} fill={INK} textAnchor="middle">
            {l}
          </text>
        ))}
      {marker && <path d={`M ${(x0 + x1) / 2 - 5} ${y - 10} L ${(x0 + x1) / 2 + 5} ${y - 10} L ${(x0 + x1) / 2} ${y - 2} Z`} fill={INK} />}
      <text x={x1 + 6} y={y + 6} fontSize={10} fontWeight={700} fill={INK}>
        {rightTag}
      </text>
    </g>
  );
}

/** A side-view tire (single) or dual pair. */
function Wheel({ x, y, dual }: { x: number; y: number; dual?: boolean }) {
  const th = 74; // tire height
  const tw = 15; // tire width
  const ry = 6;
  return (
    <g>
      <rect x={x} y={y} width={tw} height={th} rx={ry} fill="none" stroke={INK} strokeWidth={1.1} />
      {dual && <rect x={x + tw + 3} y={y} width={tw} height={th} rx={ry} fill="none" stroke={INK} strokeWidth={1.1} />}
    </g>
  );
}

/** TOE-IN / TOE-OUT box with top-view tire pairs; active half tinted. */
function ToeBox({ x, y, axle }: { x: number; y: number; axle: AxleComputed }) {
  const w = 92;
  const h = 60;
  const midY = y + h / 2;
  const inActive = axle.toeKind === "toe-in";
  const outActive = axle.toeKind === "toe-out";
  const c = vfill(axle.toeVerdict.status);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={c.fill} stroke={INK} strokeWidth={0.9} />
      <line x1={x} y1={midY} x2={x + w} y2={midY} stroke={INK} strokeWidth={0.6} strokeDasharray="2 2" />
      {/* toe-in: tops closer */}
      <text x={x + 5} y={y + 11} fontSize={7} fontWeight={inActive ? 700 : 400} fill={inActive ? c.text : GREY}>
        + TOE-IN
      </text>
      <ToeTires cx={x + w / 2} cy={y + 20} kind="in" active={inActive} />
      {/* toe-out: tops apart */}
      <ToeTires cx={x + w / 2} cy={midY + 12} kind="out" active={outActive} />
      <text x={x + 5} y={y + h - 4} fontSize={7} fontWeight={outActive ? 700 : 400} fill={outActive ? c.text : GREY}>
        − TOE-OUT
      </text>
      {/* value */}
      <text
        x={x + w - 5}
        y={midY - 3}
        fontSize={9}
        fontWeight={700}
        fill={c.text}
        textAnchor="end"
        style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
      >
        {axle.toe !== undefined ? `${withSign(axle.toe)}` : "—"}
      </text>
      <text x={x + w - 5} y={midY + 8} fontSize={5} fill={GREY} textAnchor="end">
        mm/m
      </text>
    </g>
  );
}

function ToeTires({ cx, cy, kind, active }: { cx: number; cy: number; kind: "in" | "out"; active: boolean }) {
  // Two small trapezoids angled toward/away from each other.
  const col = active ? INK : "#9ca3af";
  const gap = 12;
  const lean = kind === "in" ? 3 : -3;
  const tire = (mx: number, dir: 1 | -1) => {
    const topX = mx + dir * -lean;
    return (
      <path
        d={`M ${topX - 2} ${cy - 6} L ${topX + 2} ${cy - 6} L ${mx + 2} ${cy + 6} L ${mx - 2} ${cy + 6} Z`}
        fill={col}
      />
    );
  };
  return (
    <g>
      {tire(cx - gap, -1)}
      {tire(cx + gap, 1)}
    </g>
  );
}

/** Small rolling-direction indicator: "Cn/Dm" with sign. */
function RollTag({ x, y, label, value }: { x: number; y: number; label: string; value?: number }) {
  const sign = value === undefined ? "" : value > 0 ? "+" : value < 0 ? "−" : "";
  return (
    <g>
      <text x={x} y={y} fontSize={8} fill={INK}>
        <tspan fontWeight={700}>{label}</tspan>
        <tspan>/Dm</tspan>
      </text>
      <text x={x + 44} y={y} fontSize={9} fontWeight={700} fill={INK} style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
        {sign}
        {value !== undefined ? Math.abs(value) : ""}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header({ job, status, y }: { job: Job; status: VerdictStatus; y: number }) {
  const c = vfill(status);
  const col1: [string, string][] = [
    ["Order N°", job.header.orderNo ?? ""],
    ["Reg. N°", job.header.regNo ?? ""],
    ["Date", fmtDate(job.header.date)],
    ["Miles/Km", job.header.milesKm ?? ""],
  ];
  const col2: [string, string][] = [
    ["Type", job.header.type ?? ""],
    ["Owner", job.header.owner ?? ""],
    ["Sign", job.header.sign ?? ""],
    ["Notes", job.header.notes ?? ""],
  ];
  const field = (fx: number, fy: number, fw: number, label: string, value: string) => (
    <g>
      <text x={fx} y={fy} fontSize={8.5} fill={INK}>
        {label}
      </text>
      <line x1={fx + 52} y1={fy + 2} x2={fx + fw} y2={fy + 2} stroke={GREY} strokeWidth={0.5} strokeDasharray="2 2" />
      <text x={fx + 56} y={fy} fontSize={9} fill={INK} style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
        {value}
      </text>
    </g>
  );
  return (
    <g>
      {/* JOSAM mark */}
      <rect x={M} y={y} width={26} height={22} fill="none" stroke={INK} strokeWidth={1.4} />
      <circle cx={M + 8} cy={y + 16} r={2.4} fill={INK} />
      <circle cx={M + 18} cy={y + 16} r={2.4} fill={INK} />
      <rect x={M + 6} y={y + 6} width={14} height={5} fill={INK} transform={`rotate(-12 ${M + 13} ${y + 8})`} />
      <text x={M + 34} y={y + 19} fontSize={22} fontWeight={800} fill={INK} letterSpacing={0.5}>
        JOSAM
      </text>
      <text x={SHEET_W - M} y={y - 2} fontSize={7} fill={GREY} textAnchor="end">
        www.josam.se
      </text>

      {col1.map(([l, v], i) => (
        <g key={`c1${i}`}>{field(M + 150, y + 6 + i * 15, 150, l, v)}</g>
      ))}
      {col2.map(([l, v], i) => (
        <g key={`c2${i}`}>{field(M + 330, y + 6 + i * 15, SHEET_W - M - (M + 330), l, v)}</g>
      ))}

      {/* overall verdict chip */}
      <rect x={M} y={y + 30} width={110} height={16} fill={c.fill} stroke={INK} strokeWidth={0.8} />
      <text x={M + 55} y={y + 41} fontSize={8} fontWeight={700} fill={c.text} textAnchor="middle">
        {status === "pass" ? "WITHIN TOLERANCE" : status === "fail" ? "OUT OF TOLERANCE" : "INCOMPLETE"}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Turn diagram (truck / steering axle)                               */
/* ------------------------------------------------------------------ */

function TurnDiagram({ axle, job, y }: { axle: AxleComputed; job: Job; y: number }) {
  const s = job.axles[0].steering ?? {};
  const st = axle.steering;
  const cx = SHEET_W / 2;
  const arcY = y + 74;
  const r = 62;

  // protractor arc
  const arc = `M ${cx - r} ${arcY} A ${r} ${r} 0 0 1 ${cx + r} ${arcY}`;
  const degTicks: ReactNode[] = [];
  for (let d = 0; d <= 60; d += 10) {
    for (const sgn of [-1, 1] as const) {
      const ang = Math.PI / 2 - (sgn * d * Math.PI) / 180; // measured from vertical
      const x2 = cx + Math.cos(ang) * r;
      const yy2 = arcY - Math.sin(ang) * r;
      const x1 = cx + Math.cos(ang) * (r - 6);
      const yy1 = arcY - Math.sin(ang) * (r - 6);
      degTicks.push(<line key={`${sgn}-${d}`} x1={x1} y1={yy1} x2={x2} y2={yy2} stroke={INK} strokeWidth={0.6} />);
      if (d % 20 === 0 && d !== 0) {
        const lx = cx + Math.cos(ang) * (r + 8);
        const ly = arcY - Math.sin(ang) * (r + 8);
        degTicks.push(
          <text key={`t${sgn}-${d}`} x={lx} y={ly} fontSize={5.5} fill={GREY} textAnchor="middle">
            {d}
          </text>,
        );
      }
    }
  }

  const sideBox = (bx: number, mirror: boolean) => (
    <g>
      {/* big 20° reference */}
      <rect x={bx} y={y + 2} width={44} height={30} fill="none" stroke={INK} strokeWidth={0.9} />
      <text x={bx + 22} y={y + 22} fontSize={16} fontWeight={800} fill={INK} textAnchor="middle">
        20°
      </text>
      <text x={bx + (mirror ? -4 : 48)} y={y + 10} fontSize={5.5} fill={GREY} textAnchor={mirror ? "end" : "start"}>
        {mirror ? "HÖGER" : "VÄNSTER"}
      </text>
      <text x={bx + (mirror ? -4 : 48)} y={y + 17} fontSize={5.5} fill={GREY} textAnchor={mirror ? "end" : "start"}>
        {mirror ? "RIGHT" : "LEFT"}
      </text>
      {/* measured outer value */}
      <LabelValue
        x={bx}
        y={y + 36}
        w={64}
        h={15}
        label="°"
        value={
          mirror
            ? s.turnRight?.opposite !== undefined
              ? `${s.turnRight?.opposite}°`
              : "—"
            : s.turnLeft?.opposite !== undefined
              ? `${s.turnLeft?.opposite}°`
              : "—"
        }
      />
      {/* diff */}
      <LabelValue
        x={bx}
        y={y + 54}
        w={64}
        h={15}
        label="Δ"
        status={st?.tootVerdict.status ?? "unknown"}
        value={
          mirror
            ? st?.turnRightDiff !== undefined
              ? `${st?.turnRightDiff}°`
              : "—"
            : st?.turnLeftDiff !== undefined
              ? `${st?.turnLeftDiff}°`
              : "—"
        }
      />
    </g>
  );

  return (
    <g>
      <text x={M} y={y + 6} fontSize={6} fill={GREY}>
        KURVWINKELDIFFERENS
      </text>
      <text x={M} y={y + 12} fontSize={6} fill={GREY}>
        TOE-OUT ON TURN
      </text>
      {sideBox(M, false)}
      {sideBox(SHEET_W - M - 64, true)}
      {/* centre protractor */}
      <path d={arc} fill="none" stroke={INK} strokeWidth={0.9} />
      {degTicks}
      <line x1={cx} y1={arcY} x2={cx} y2={arcY - r} stroke={INK} strokeWidth={0.6} strokeDasharray="2 2" />
      <text x={cx} y={y + 40} fontSize={6.5} fill={INK} textAnchor="middle">
        MAX TURN
      </text>
      <text x={cx} y={y + 48} fontSize={5.5} fill={GREY} textAnchor="middle">
        MAX SVÄNG · BRAQUAGE MAX
      </text>
      {(s.maxTurnLeft !== undefined || s.maxTurnRight !== undefined) && (
        <text x={cx} y={arcY + 12} fontSize={7} fill={INK} textAnchor="middle" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
          L {s.maxTurnLeft ?? "—"}°   R {s.maxTurnRight ?? "—"}°
        </text>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Axle row                                                           */
/* ------------------------------------------------------------------ */

function AxleRow({ axle, job, y, h }: { axle: AxleComputed; job: Job; y: number; h: number }) {
  const raw = job.axles[axle.index];
  const leftX = M;
  const panelW = 150;
  const rightX = SHEET_W - M - panelW;
  const centreX = leftX + panelW;
  const centreW = rightX - centreX;

  const steering = axle.isSteering;

  return (
    <g>
      {/* separator */}
      <line x1={M} y1={y + h} x2={SHEET_W - M} y2={y + h} stroke="#d1d5db" strokeWidth={0.5} />

      {/* ---- left panel ---- */}
      <SidePanel
        x={leftX}
        y={y + 4}
        w={panelW}
        axle={axle}
        raw={raw}
        side="left"
        steering={steering}
      />

      {/* ---- centre ---- */}
      <g>
        <text x={centreX + centreW / 2} y={y + 12} fontSize={7.5} fontWeight={600} fill={GREY} textAnchor="middle">
          {`Axle ${axle.index + 1}${steering ? " · steering" : ""}`}
        </text>
        {/* rolling tags */}
        <g transform={`translate(${centreX + 8}, ${y + 26})`}>
          <RollTag x={0} y={0} label={`C${axle.wheelNo.left}`} value={axle.cLeft} />
        </g>
        <g transform={`translate(${centreX + 8}, ${y + 38})`}>
          <RollTag x={0} y={0} label={`C${axle.wheelNo.right}`} value={axle.cRight} />
        </g>

        {/* wheels + toe */}
        <Wheel x={centreX + 24} y={y + 44} dual={!steering} />
        <g transform={`translate(0, ${y})`}>
          <ToeBox x={centreX + centreW / 2 - 46} y={44} axle={axle} />
        </g>
        <Wheel x={rightX - (steering ? 39 : 57)} y={y + 44} dual={!steering} />
        <text x={centreX + 24} y={y + h - 4} fontSize={7} fill={GREY}>
          C{axle.wheelNo.left}
        </text>
        <text x={rightX - (steering ? 39 : 57)} y={y + h - 4} fontSize={7} fill={GREY}>
          C{axle.wheelNo.right}
        </text>

        {/* steering linkage hint */}
        {steering && (
          <line
            x1={centreX + 40}
            y1={y + 80}
            x2={rightX - 24}
            y2={y + 80}
            stroke={INK}
            strokeWidth={0.6}
            strokeDasharray="3 2"
          />
        )}

        {/* left/right language tags for non-steering axles */}
        {!steering && (
          <g>
            <text x={rightX - 2} y={y + 40} fontSize={5.4} fill={GREY} textAnchor="end">
              VÄNSTER · LEFT +
            </text>
            <text x={rightX - 2} y={y + h - 16} fontSize={5.4} fill={GREY} textAnchor="end">
              HÖGER · RIGHT −
            </text>
          </g>
        )}
      </g>

      {/* ---- right panel ---- */}
      <SidePanel
        x={rightX}
        y={y + 4}
        w={panelW}
        axle={axle}
        raw={raw}
        side="right"
        steering={steering}
      />
    </g>
  );
}

function SidePanel({
  x,
  y,
  w,
  axle,
  raw,
  side,
  steering,
}: {
  x: number;
  y: number;
  w: number;
  axle: AxleComputed;
  raw: Job["axles"][number];
  side: "left" | "right";
  steering: boolean;
}) {
  const wheel = side === "left" ? axle.left : axle.right;
  const rawWheel = raw[side];
  const cNo = side === "left" ? axle.wheelNo.left : axle.wheelNo.right;
  const cVal = side === "left" ? axle.cLeft : axle.cRight;
  const sub = side === "left" ? "1" : "2";
  const bw = w; // box width

  let cy = y;
  const rows: ReactNode[] = [];

  // A, B, C stacked
  rows.push(
    <LabelValue
      key="A"
      x={x}
      y={cy}
      w={bw}
      label={`A${sub}`}
      value={rawWheel.A !== undefined ? String(rawWheel.A) : "—"}
    />,
  );
  cy += 18;
  rows.push(
    <LabelValue
      key="B"
      x={x}
      y={cy}
      w={bw}
      label={`B${sub}`}
      value={rawWheel.B !== undefined ? String(rawWheel.B) : "—"}
    />,
  );
  cy += 18;
  rows.push(
    <LabelValue
      key="C"
      x={x}
      y={cy}
      w={bw}
      label={`C${cNo}`}
      value={cVal !== undefined ? `${withSign(cVal)} :Dm` : "—"}
    />,
  );
  cy += 22;

  // Camber (+ KPI for steering) side by side
  if (steering) {
    const halfW = (bw - 4) / 2;
    rows.push(
      <MeasureBox
        key="camber"
        x={x}
        y={cy}
        w={halfW}
        h={30}
        lines={["Camber", "Sturz", "Carross."]}
        value={rawWheel.camber ? fmtAngle(rawWheel.camber) : "—"}
        status={wheel.camberVerdict.status}
      />,
    );
    rows.push(
      <MeasureBox
        key="kpi"
        x={x + halfW + 4}
        y={cy}
        w={halfW}
        h={30}
        lines={["KPI", "Spreiz.", "Pivots"]}
        value={rawWheel.kpi ? fmtAngle(rawWheel.kpi) : "—"}
        status={wheel.kpiVerdict.status}
      />,
    );
    cy += 34;
    rows.push(
      <MeasureBox
        key="caster"
        x={x}
        y={cy}
        w={bw}
        h={26}
        lines={["Caster", "Nachlauf", "Chasse"]}
        value={rawWheel.caster ? fmtAngle(rawWheel.caster) : "—"}
        status={wheel.casterVerdict.status}
      />,
    );
  } else {
    rows.push(
      <MeasureBox
        key="camber"
        x={x}
        y={cy}
        w={bw}
        h={30}
        lines={["Camber", "Sturz", "Carrossage"]}
        value={rawWheel.camber ? fmtAngle(rawWheel.camber) : "—"}
        status={wheel.camberVerdict.status}
      />,
    );
  }

  return <g>{rows}</g>;
}

/* ------------------------------------------------------------------ */
/* D box + out-of-square                                              */
/* ------------------------------------------------------------------ */

function DBox({ x, y, d, top, bot }: { x: number; y: number; d: number; top: string; bot: string }) {
  const w = 96;
  const h = 28;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#fff" stroke={INK} strokeWidth={0.8} />
      <text x={x + 4} y={y + 11} fontSize={7} fill={INK}>
        {top}
      </text>
      <text x={x + 4} y={y + 24} fontSize={7} fill={INK}>
        {bot}
      </text>
      <text x={x + w - 6} y={y + 19} fontSize={13} fontWeight={700} fill={INK} textAnchor="end" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
        {d} m
      </text>
      <text x={x + w / 2} y={y + 11} fontSize={8} fill={INK} textAnchor="middle">
        = D
      </text>
    </g>
  );
}

function OutOfSquare({ computed, isTruck, y }: { computed: JobComputed; isTruck: boolean; y: number }) {
  // Steering axle is the reference for a truck; show the non-steering axles as cylinders.
  const shown = isTruck ? computed.axles.filter((a) => !a.isSteering) : computed.axles;
  const x0 = M;
  const cylW = 92;
  const gap = 20;
  return (
    <g>
      <line x1={M} y1={y} x2={SHEET_W - M} y2={y} stroke={INK} strokeWidth={0.9} />
      <text x={M} y={y + 12} fontSize={7} fontWeight={700} fill={INK}>
        SNEDSTÄLLNING · OUT OF SQUARE · ANGLE FAUSSE
      </text>

      {/* cylinders in perspective */}
      {shown.map((a, i) => {
        const cx = x0 + 30 + i * (cylW + gap);
        const cyl = y + 44;
        const offset = a.oos === undefined ? 0 : Math.max(-14, Math.min(14, a.oos * 3));
        return <Cylinder key={a.id} x={cx + offset} y={cyl} w={cylW} label={`C${a.wheelNo.left}`} status={a.oosVerdict.status} value={a.oos} />;
      })}

      {/* parallelism DIFF boxes */}
      {computed.parallelism.map((p, i) => {
        const bx = SHEET_W - M - 120;
        const by = y + 20 + i * 22;
        const c = vfill(p.verdict.status);
        return (
          <g key={p.to}>
            <text x={bx - 6} y={by + 11} fontSize={6.5} fill={INK} textAnchor="end">
              A1↔A{p.to + 1}
            </text>
            <rect x={bx} y={by} width={110} height={16} fill={c.fill} stroke={INK} strokeWidth={0.8} />
            <text x={bx + 4} y={by + 11} fontSize={6.5} fill={GREY}>
              DIFF
            </text>
            <text x={bx + 106} y={by + 11} fontSize={9} fontWeight={700} fill={c.text} textAnchor="end" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
              {p.value !== undefined ? `${withSign(p.value)} mm/m` : "—"}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Cylinder({
  x,
  y,
  w,
  label,
  status,
  value,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  status: VerdictStatus;
  value?: number;
}) {
  const h = 34;
  const ry = h / 2;
  const rx = 8;
  const c = vfill(status);
  return (
    <g>
      {/* body */}
      <rect x={x} y={y - ry} width={w} height={h} fill={c.fill} stroke={INK} strokeWidth={0.9} />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={c.fill} stroke={INK} strokeWidth={0.9} />
      <ellipse cx={x + w} cy={y} rx={rx} ry={ry} fill={c.fill} stroke={INK} strokeWidth={0.9} />
      <text x={x + w / 2} y={y + 3} fontSize={8} fontWeight={700} fill={INK} textAnchor="middle">
        {label}
      </text>
      <text x={x + w / 2} y={y + ry + 12} fontSize={7} fill={c.text} textAnchor="middle" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
        {value !== undefined ? `${withSign(value)} mm/m` : "—"}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
