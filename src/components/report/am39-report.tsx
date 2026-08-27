import type { ReactNode } from "react";
import type { Job, VehicleType } from "@/lib/types";
import { wheelNumbers } from "@/lib/types";
import type { AxleComputed, JobComputed, WheelComputed, SteeringComputed } from "@/lib/compute";
import type { VerdictStatus } from "@/lib/verdict";
import { fmtAngle, fmtDate } from "@/lib/format";
import { withSign, round } from "@/lib/calc";

/**
 * The JOSAM AM39-1 test report sheet, redrawn to match the printed forms
 * `truckModel.jpeg` and `trailerModel.jpeg` box for box, then filled with the
 * job's data.
 *
 * The sheet is a FIXED template, exactly like the paper: a truck always prints
 * the turn diagram, one pair of scales and three axle rows; a trailer always
 * prints four axle rows across two pairs of scales. Rows with no measurements
 * stay blank, as they would on paper.
 *
 * The form's own labels are multilingual (Swedish / German / English / French)
 * and are reproduced verbatim; the sheet is always issued in English regardless
 * of the app's language. Measured values are tinted green or red against the
 * chosen tolerance profile — the only ink that is not on the blank form.
 */

export const SHEET_W = 794; // A4 portrait @96dpi
export const SHEET_H = 1123;

/** Axle rows the printed template always shows, per vehicle type. */
const TEMPLATE_SLOTS: Record<VehicleType, number> = { truck: 3, trailer: 4 };

const M = 22; // outer margin
const INK = "#111111";
const HAIR = 0.7; // thin rule
const LINE = 1; // normal rule

/** The form's own dotted write-on lines. */
const DOTS = "1.5 2";

function vfill(status: VerdictStatus): { fill: string; text: string } {
  switch (status) {
    case "pass":
      return { fill: "#e8f7ec", text: "#15803d" };
    case "fail":
      return { fill: "#fdeaea", text: "#b91c1c" };
    default:
      return { fill: "#ffffff", text: INK };
  }
}

const UNKNOWN = { status: "unknown" as const };

function emptyWheel(): WheelComputed {
  return {
    rolling: undefined,
    camberDeg: undefined,
    camberVerdict: UNKNOWN,
    casterDeg: undefined,
    casterVerdict: UNKNOWN,
    kpiDeg: undefined,
    kpiVerdict: UNKNOWN,
  };
}

function emptySteering(): SteeringComputed {
  return {
    tootVerdict: UNKNOWN,
    steeringBoxVerdict: UNKNOWN,
    tapeVerdict: UNKNOWN,
    maxTurnLeftVerdict: UNKNOWN,
    maxTurnRightVerdict: UNKNOWN,
  };
}

/** A blank template row (no data yet), keeping the printed design. */
function blankAxle(index: number, isSteering: boolean): AxleComputed {
  return {
    id: `blank-${index}`,
    index,
    isSteering,
    wheelNo: wheelNumbers(index),
    cLeft: undefined,
    cRight: undefined,
    toe: undefined,
    toeKind: "unknown",
    toeVerdict: UNKNOWN,
    oos: undefined,
    oosSide: "unknown",
    oosVerdict: UNKNOWN,
    left: emptyWheel(),
    right: emptyWheel(),
    steering: isSteering ? emptySteering() : undefined,
    status: "unknown",
  };
}

const EMPTY_RAW: Job["axles"][number] = { id: "", isSteering: false, left: {}, right: {} };

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Value text or nothing at all — a blank form line stays blank. */
function num(v: number | undefined, decimals = 1): string {
  return v === undefined || Number.isNaN(v) ? "" : String(round(v, decimals));
}

export function Am39Report({ job, computed }: { job: Job; computed: JobComputed }) {
  const isTruck = job.vehicleType === "truck";

  // Fixed template slots: fill with real axles, pad the rest with blanks.
  const slotCount = Math.max(TEMPLATE_SLOTS[job.vehicleType], computed.axles.length);
  const slots: AxleComputed[] = [];
  for (let i = 0; i < slotCount; i++) {
    const real = computed.axles[i];
    slots.push(real ?? blankAxle(i, isTruck && i === 0));
  }

  const blocks: AxleComputed[][] = isTruck ? [slots] : chunk(slots, 2);
  const steeringAxle = slots.find((a) => a.isSteering);

  // ---- vertical layout ----
  // Heights are chosen so the blocks fill the A4 page the way the printed
  // sheet does, rather than bunching up at the top.
  const headerY = M;
  // A trailer has no turn block, so its first pair of scales needs its own gap
  // under the header.
  let y = headerY + (isTruck ? 78 : 96);

  let turnY = 0;
  if (isTruck) {
    turnY = y;
    y += 196;
  }
  const rowH = isTruck ? { steering: 196, plain: 176 } : { steering: 158, plain: 158 };

  const blockLayouts: {
    axles: { axle: AxleComputed; y: number; h: number }[];
    rulerTopY: number;
    rulerBotY: number;
    scaleNo: number;
  }[] = [];

  for (let bi = 0; bi < blocks.length; bi++) {
    const rulerTopY = y;
    y += 14;
    const axleLayouts: { axle: AxleComputed; y: number; h: number }[] = [];
    for (const axle of blocks[bi]) {
      const h = axle.isSteering ? rowH.steering : rowH.plain;
      axleLayouts.push({ axle, y, h });
      y += h;
    }
    const rulerBotY = y + 4;
    y = rulerBotY + 62;
    blockLayouts.push({ axles: axleLayouts, rulerTopY, rulerBotY, scaleNo: bi * 2 + 1 });
  }

  const oosY = y;

  return (
    <svg
      viewBox={`0 0 ${SHEET_W} ${SHEET_H}`}
      width={SHEET_W}
      height={SHEET_H}
      style={{
        background: "#fff",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        fontFamily: "Helvetica, Arial, sans-serif",
      }}
    >
      <Header job={job} y={headerY} />
      {isTruck && <TurnDiagram axle={steeringAxle} job={job} y={turnY} />}

      {blockLayouts.map((block, bi) => (
        <g key={bi}>
          <Ruler y={block.rulerTopY} leftTag="A" rightTag="A" no={block.scaleNo} marker />
          {block.axles.map(({ axle, y: ay, h }) => (
            <AxleRow key={axle.id} axle={axle} job={job} y={ay} h={h} scaleNo={block.scaleNo} />
          ))}
          <Ruler y={block.rulerBotY} leftTag="B" rightTag="B" no={block.scaleNo} marker />
          <DBox x={SHEET_W - M - 104} y={block.rulerBotY + 20} d={job.D} no={block.scaleNo} />
        </g>
      ))}

      <OutOfSquare computed={computed} slots={slots} isTruck={isTruck} y={oosY} />

      {/* form footers, as printed */}
      <text x={M} y={SHEET_H - 22} fontSize={16} fontWeight={800} fill={INK}>
        AM39-1
      </text>
      <text x={SHEET_W - M} y={SHEET_H - 22} fontSize={7} fill={INK} textAnchor="end">
        T 27 1-2-3-4 1204
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

/** The form's dotted write-on line. */
function DotLine({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return <line x1={x1} y1={y} x2={x2} y2={y} stroke={INK} strokeWidth={HAIR} strokeDasharray={DOTS} />;
}

/** Stacked "+" over "−", as printed next to every signed value. */
function PlusMinus({ x, y, size = 7 }: { x: number; y: number; size?: number }) {
  return (
    <g fill={INK} fontSize={size} fontWeight={700} textAnchor="middle">
      <text x={x} y={y}>
        +
      </text>
      <text x={x} y={y + size + 1}>
        −
      </text>
    </g>
  );
}

/** Mono value text, drawn only when there is something to print. */
function Val({
  x,
  y,
  value,
  size = 9,
  anchor = "end",
  fill = INK,
}: {
  x: number;
  y: number;
  value: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  fill?: string;
}) {
  if (!value) return null;
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={700}
      fill={fill}
      textAnchor={anchor}
      style={{ fontFamily: "'Courier New', monospace" }}
    >
      {value}
    </text>
  );
}

/**
 * An A/B scale box: a bold tag cell and a dotted write-on line, mirrored for the
 * right-hand panel so the tag always sits on the outside edge, as on the sheet.
 */
function ScaleBox({
  x,
  y,
  w,
  h = 20,
  tag,
  sub,
  value,
  mirror,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  tag: string;
  sub: string;
  value: string;
  mirror?: boolean;
}) {
  const tagW = 30;
  const tagX = mirror ? x + w - tagW : x;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={LINE} />
      <line x1={mirror ? tagX : x + tagW} y1={y} x2={mirror ? tagX : x + tagW} y2={y + h} stroke={INK} strokeWidth={LINE} />
      <text x={tagX + tagW / 2} y={y + h / 2 + 4.5} fontSize={13} fontWeight={800} fill={INK} textAnchor="middle">
        {tag}
        <tspan fontSize={8} dy={2}>
          {sub}
        </tspan>
      </text>
      <DotLine x1={mirror ? x + 6 : x + tagW + 6} x2={mirror ? tagX - 6 : x + w - 6} y={y + h - 5} />
      <Val
        x={mirror ? x + 10 : x + w - 8}
        y={y + h - 7}
        value={value}
        anchor={mirror ? "start" : "end"}
        size={10}
      />
    </g>
  );
}

/** JOSAM measuring scale: 0 100 200 300 … gap … 300 200 100 0. */
function Ruler({
  y,
  leftTag,
  rightTag,
  no,
  marker,
}: {
  y: number;
  leftTag: string;
  rightTag: string;
  no: number;
  marker?: boolean;
}) {
  const x0 = M + 26;
  const x1 = SHEET_W - M - 26;
  const barW = 118; // printed portion carrying the numbers
  const h = 13;
  const cx = (x0 + x1) / 2;

  const scaleBar = (bx: number, flip: boolean) => {
    const ticks: ReactNode[] = [];
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const tx = bx + (i / n) * barW;
      const major = i % 6 === 0;
      ticks.push(
        <line
          key={i}
          x1={tx}
          y1={y + h}
          x2={tx}
          y2={y + h - (major ? 6 : 3)}
          stroke={INK}
          strokeWidth={major ? 0.8 : 0.5}
        />,
      );
    }
    const labels = ["0", "100", "200", "300"];
    return (
      <g>
        <rect x={bx} y={y} width={barW} height={h} fill="none" stroke={INK} strokeWidth={LINE} />
        {ticks}
        {(flip ? labels.slice().reverse() : labels).map((l, i) => (
          <text
            key={l}
            x={bx + 10 + i * ((barW - 20) / 3)}
            y={y + 7}
            fontSize={6}
            fontWeight={600}
            fill={INK}
            textAnchor="middle"
          >
            {l}
          </text>
        ))}
      </g>
    );
  };

  return (
    <g>
      <text x={x0 - 4} y={y + h} fontSize={14} fontWeight={800} fill={INK} textAnchor="end">
        {leftTag}
        <tspan fontSize={8} dy={2}>
          {no}
        </tspan>
      </text>
      {scaleBar(x0, false)}
      <line x1={x0} y1={y + h} x2={x1} y2={y + h} stroke={INK} strokeWidth={LINE} />
      {scaleBar(x1 - barW, true)}
      <text x={x1 + 4} y={y + h} fontSize={14} fontWeight={800} fill={INK}>
        {rightTag}
        <tspan fontSize={8} dy={2}>
          {no + 1}
        </tspan>
      </text>
      {marker && <path d={`M ${cx - 5} ${y + h - 12} L ${cx + 5} ${y + h - 12} L ${cx} ${y + h} Z`} fill={INK} />}
    </g>
  );
}

/** The small ruler printed above each wheel, with − and + at its ends. */
function MiniRuler({ x, y, w, flip }: { x: number; y: number; w: number; flip?: boolean }) {
  const ticks: ReactNode[] = [];
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const tx = x + (i / n) * w;
    ticks.push(
      <line key={i} x1={tx} y1={y} x2={tx} y2={y + (i % 3 === 0 ? 6 : 3.5)} stroke={INK} strokeWidth={0.5} />,
    );
  }
  return (
    <g>
      <line x1={x} y1={y} x2={x + w} y2={y} stroke={INK} strokeWidth={0.8} />
      {ticks}
      <text x={x - 6} y={y + 4} fontSize={10} fontWeight={800} fill={INK} textAnchor="middle">
        {flip ? "+" : "−"}
      </text>
      <text x={x + w + 6} y={y + 4} fontSize={10} fontWeight={800} fill={INK} textAnchor="middle">
        {flip ? "−" : "+"}
      </text>
    </g>
  );
}

/** A tyre seen from the front: tall rounded casing with the projector eyes. */
function Tyre({ x, y, h, dual }: { x: number; y: number; h: number; dual?: boolean }) {
  const w = 17;
  const one = (ox: number) => (
    <g key={ox}>
      <rect x={ox} y={y} width={w} height={h} rx={7} fill="none" stroke={INK} strokeWidth={LINE} />
      <rect x={ox + 3} y={y + 6} width={w - 6} height={h - 12} rx={4} fill="none" stroke={INK} strokeWidth={0.4} />
    </g>
  );
  return (
    <g>
      {one(x)}
      {dual && one(x + w + 2)}
      <circle cx={x + (dual ? w + 1 : w / 2)} cy={y - 4} r={3} fill="none" stroke={INK} strokeWidth={0.8} />
      <circle cx={x + (dual ? w + 1 : w / 2)} cy={y + h + 4} r={3} fill="none" stroke={INK} strokeWidth={0.8} />
    </g>
  );
}

/** The TOE-IN / TOE-OUT box with its four tyre glyphs. */
function ToeBox({ x, y, w, h, axle }: { x: number; y: number; w: number; h: number; axle: AxleComputed }) {
  const midY = y + h / 2;
  const c = vfill(axle.toeVerdict.status);
  const inActive = axle.toeKind === "toe-in";
  const outActive = axle.toeKind === "toe-out";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={c.fill} stroke={INK} strokeWidth={LINE} />
      <line x1={x + 6} y1={midY} x2={x + w - 6} y2={midY} stroke={INK} strokeWidth={HAIR} strokeDasharray="3 2" />

      <text x={x + 8} y={y + 13} fontSize={7} fontWeight={800} fill={INK}>
        +
      </text>
      <text x={x + w / 2} y={y + 13} fontSize={7.5} fontWeight={700} fill={INK} textAnchor="middle">
        TOE-IN
      </text>
      <text x={x + w - 10} y={y + 13} fontSize={7} fontWeight={800} fill={INK}>
        +
      </text>
      <ToeTyres cx={x + w / 2} cy={y + 25} kind="in" active={inActive} width={w} />

      <ToeTyres cx={x + w / 2} cy={y + h - 27} kind="out" active={outActive} width={w} />
      <text x={x + 8} y={y + h - 6} fontSize={7} fontWeight={800} fill={INK}>
        −
      </text>
      <text x={x + w / 2} y={y + h - 32} fontSize={7.5} fontWeight={700} fill={INK} textAnchor="middle">
        TOE-OUT
      </text>
      <text x={x + w - 10} y={y + h - 6} fontSize={7} fontWeight={800} fill={INK}>
        −
      </text>

      {/* the value is written between the tyres, on the active half's line */}
      <DotLine x1={x + w / 2 - 26} x2={x + w / 2 + 26} y={inActive ? midY - 4 : y + h - 13} />
      <Val
        x={x + w / 2}
        y={inActive ? midY - 6 : y + h - 15}
        value={axle.toe !== undefined ? withSign(axle.toe, 2) : ""}
        anchor="middle"
        fill={c.text}
        size={9}
      />
    </g>
  );
}

function ToeTyres({
  cx,
  cy,
  kind,
  active,
  width,
}: {
  cx: number;
  cy: number;
  kind: "in" | "out";
  active: boolean;
  width: number;
}) {
  const col = active ? INK : "#8b8b8b";
  const gap = width / 2 - 20;
  const lean = kind === "in" ? 2.6 : -2.6;
  const tyre = (mx: number, mirror: boolean) => {
    const l = mirror ? -lean : lean;
    return (
      <path
        key={mx}
        d={`M ${mx - l - 2.6} ${cy - 8} L ${mx - l + 2.6} ${cy - 8} L ${mx + l + 2.6} ${cy + 8} L ${mx + l - 2.6} ${cy + 8} Z`}
        fill={col}
      />
    );
  };
  return (
    <g>
      {tyre(cx - gap, false)}
      {tyre(cx + gap, true)}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header({ job, y }: { job: Job; y: number }) {
  const col1: [string, string][] = [
    ["Order N°", job.header.orderNo ?? ""],
    ["Reg. N°", job.header.regNo ?? ""],
    ["Date", job.header.date ? fmtDate(job.header.date) : ""],
    ["Miles/Km", job.header.milesKm ?? ""],
  ];
  const col2: [string, string][] = [
    ["Type", job.header.type ?? ""],
    ["Owner", job.header.owner ?? ""],
    ["Sign", job.header.sign ?? ""],
    ["Notes", job.header.notes ?? ""],
  ];
  const field = (fx: number, fy: number, fw: number, label: string, value: string, labelW: number) => (
    <g>
      <text x={fx} y={fy} fontSize={10} fill={INK}>
        {label}
      </text>
      <DotLine x1={fx + labelW} x2={fx + fw} y={fy + 2} />
      <Val x={fx + labelW + 4} y={fy} value={value} anchor="start" size={9.5} />
    </g>
  );

  return (
    <g>
      <JosamMark x={M} y={y} />
      <text x={SHEET_W - M} y={y + 6} fontSize={6.5} fill={INK} textAnchor="end">
        www.josam.se
      </text>

      {col1.map(([l, v], i) => (
        <g key={`c1${i}`}>{field(M + 216, y + 18 + i * 16, 130, l, v, 56)}</g>
      ))}
      {col2.map(([l, v], i) => (
        <g key={`c2${i}`}>{field(M + 386, y + 18 + i * 16, SHEET_W - M - (M + 386), l, v, 46)}</g>
      ))}
    </g>
  );
}

/** The boxed tipper-truck mark and wordmark. */
function JosamMark({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={34} height={34} fill="none" stroke={INK} strokeWidth={2} />
      <g transform={`translate(${x + 5} ${y + 6})`}>
        <path d="M2 16 h20 v-4 h-20 z" fill={INK} />
        <path d="M6 12 L10 3 L20 6 L17 12 Z" fill={INK} />
        <circle cx={7} cy={19} r={3} fill="none" stroke={INK} strokeWidth={1.6} />
        <circle cx={18} cy={19} r={3} fill="none" stroke={INK} strokeWidth={1.6} />
      </g>
      <text x={x + 44} y={y + 28} fontSize={30} fontWeight={800} fill={INK} letterSpacing={-0.5}>
        JOSAM
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Turn diagram (truck / steering axle)                                */
/* ------------------------------------------------------------------ */

function TurnDiagram({ axle, job, y }: { axle?: AxleComputed; job: Job; y: number }) {
  const s = axle ? (job.axles[axle.index]?.steering ?? {}) : {};
  const st = axle?.steering;
  const boxW = 92;
  const leftX = M;
  const rightX = SHEET_W - M - boxW;

  return (
    <g>
      {/* block heading, four languages as printed */}
      {["KURVVINKELDIFFERENS", "SPURDIFFERENSVINKEL", "TOE-OUT ON TURNS", "DIFFERENCE DE COURBE D'ANGLE"].map((l, i) => (
        <text key={l} x={M} y={y + 8 + i * 8} fontSize={6.6} fontWeight={600} fill={INK}>
          {l}
        </text>
      ))}

      <Protractor
        y={y + 40}
        maxLeft={s.maxTurnLeft}
        maxRight={s.maxTurnRight}
        leftVerdict={st?.maxTurnLeftVerdict.status ?? "unknown"}
        rightVerdict={st?.maxTurnRightVerdict.status ?? "unknown"}
      />

      <TurnSide
        x={leftX}
        y={y + 44}
        w={boxW}
        first={["VÄNSTER", "LINKS", "LEFT", "GAUCHE"]}
        second={["HÖGER", "RECHTS", "RIGHT", "DROIT"]}
        reading={s.turnLeft?.opposite}
        diff={st?.turnLeftDiff}
        diffStatus={st?.tootVerdict.status ?? "unknown"}
      />
      <TurnSide
        x={rightX}
        y={y + 44}
        w={boxW}
        mirror
        first={["HÖGER", "RECHTS", "RIGHT", "DROIT"]}
        second={["VÄNSTER", "LINKS", "LEFT", "GAUCHE"]}
        reading={s.turnRight?.opposite}
        diff={st?.turnRightDiff}
        diffStatus={st?.tootVerdict.status ?? "unknown"}
      />
    </g>
  );
}

/** One side of the turn block: the 20° reference, the reading, and DIFF. */
function TurnSide({
  x,
  y,
  w,
  first,
  second,
  reading,
  diff,
  diffStatus,
  mirror,
}: {
  x: number;
  y: number;
  w: number;
  first: string[];
  second: string[];
  reading?: number;
  diff?: number;
  diffStatus: VerdictStatus;
  mirror?: boolean;
}) {
  const boxW = 56;
  const labelX = mirror ? x : x + boxW + 4;
  const boxX = mirror ? x + w - boxW : x;
  const c = vfill(diffStatus);

  const langs = (ly: number, lines: string[]) =>
    lines.map((l, i) => (
      <text key={l} x={labelX} y={ly + i * 7} fontSize={6.2} fontWeight={600} fill={INK}>
        {l}
      </text>
    ));

  return (
    <g>
      {/* reference angle */}
      <rect x={boxX} y={y} width={boxW} height={26} fill="none" stroke={INK} strokeWidth={LINE} />
      <text x={boxX + boxW / 2} y={y + 20} fontSize={19} fontWeight={800} fill={INK} textAnchor="middle">
        20
        <tspan fontSize={9} dy={-7}>
          °
        </tspan>
      </text>
      {langs(y + 6, first)}

      {/* opposite-wheel reading */}
      <rect x={boxX} y={y + 32} width={boxW} height={22} fill="none" stroke={INK} strokeWidth={LINE} />
      <circle cx={boxX + boxW - 7} cy={y + 39} r={2.4} fill="none" stroke={INK} strokeWidth={0.7} />
      <DotLine x1={boxX + 5} x2={boxX + boxW - 5} y={y + 49} />
      <Val x={boxX + boxW - 6} y={y + 47} value={reading !== undefined ? String(reading) : ""} size={9} />
      {langs(y + 38, second)}

      <line x1={boxX} y1={y + 60} x2={boxX + boxW} y2={y + 60} stroke={INK} strokeWidth={1.6} />

      {/* difference between the sides */}
      <rect x={boxX} y={y + 66} width={boxW} height={22} fill={c.fill} stroke={INK} strokeWidth={LINE} />
      <circle cx={boxX + boxW - 7} cy={y + 73} r={2.4} fill="none" stroke={INK} strokeWidth={0.7} />
      <DotLine x1={boxX + 5} x2={boxX + boxW - 5} y={y + 83} />
      <Val x={boxX + boxW - 6} y={y + 81} value={diff !== undefined ? String(round(diff, 1)) : ""} size={9} fill={c.text} />
      <text x={labelX} y={y + 78} fontSize={7} fontWeight={700} fill={INK}>
        DIFF.
      </text>
    </g>
  );
}

/** The pair of turn-angle protractors with the steered wheels between them. */
function Protractor({
  y,
  maxLeft,
  maxRight,
  leftVerdict,
  rightVerdict,
}: {
  y: number;
  maxLeft?: number;
  maxRight?: number;
  leftVerdict: VerdictStatus;
  rightVerdict: VerdictStatus;
}) {
  const r = 62;
  const axisY = y + r;
  const lx = SHEET_W / 2 - 92;
  const rx = SHEET_W / 2 + 92;

  const dial = (cx: number, dir: 1 | -1) => {
    const parts: ReactNode[] = [];
    for (let d = 0; d <= 60; d += 10) {
      const ang = (Math.PI / 2) + (dir * d * Math.PI) / 180;
      const ox = cx + Math.cos(ang) * r;
      const oy = axisY - Math.sin(ang) * r;
      const ix = cx + Math.cos(ang) * (r - 7);
      const iy = axisY - Math.sin(ang) * (r - 7);
      parts.push(<line key={`t${d}`} x1={ix} y1={iy} x2={ox} y2={oy} stroke={INK} strokeWidth={0.7} />);
      const tx = cx + Math.cos(ang) * (r + 9);
      const ty = axisY - Math.sin(ang) * (r + 9);
      parts.push(
        <text
          key={`n${d}`}
          x={tx}
          y={ty + 2}
          fontSize={6}
          fontWeight={600}
          fill={INK}
          textAnchor="middle"
          transform={`rotate(${-dir * d} ${tx} ${ty})`}
        >
          {d}
        </text>,
      );
    }
    // 5° subdivisions
    for (let d = 5; d < 60; d += 10) {
      const ang = Math.PI / 2 + (dir * d * Math.PI) / 180;
      parts.push(
        <line
          key={`s${d}`}
          x1={cx + Math.cos(ang) * (r - 4)}
          y1={axisY - Math.sin(ang) * (r - 4)}
          x2={cx + Math.cos(ang) * r}
          y2={axisY - Math.sin(ang) * r}
          stroke={INK}
          strokeWidth={0.5}
        />,
      );
    }
    const sweepStart = { x: cx, y: axisY - r };
    const end = { x: cx + Math.cos(Math.PI / 2 + (dir * 60 * Math.PI) / 180) * r, y: axisY - Math.sin(Math.PI / 2 + (dir * 60 * Math.PI) / 180) * r };
    return (
      <g>
        <path
          d={`M ${sweepStart.x} ${sweepStart.y} A ${r} ${r} 0 0 ${dir === 1 ? 0 : 1} ${end.x} ${end.y}`}
          fill="none"
          stroke={INK}
          strokeWidth={LINE}
        />
        <line x1={cx} y1={axisY} x2={cx} y2={axisY - r - 4} stroke={INK} strokeWidth={0.8} />
        {parts}
        {/* straight-ahead wheel (dashed) and steered wheel (solid) */}
        <rect
          x={cx - 9}
          y={axisY - 40}
          width={18}
          height={54}
          rx={7}
          fill="none"
          stroke={INK}
          strokeWidth={0.8}
          strokeDasharray="3 2"
        />
        <g transform={`rotate(${-dir * 32} ${cx} ${axisY})`}>
          <rect x={cx - 9} y={axisY - 40} width={18} height={54} rx={7} fill="none" stroke={INK} strokeWidth={LINE} />
        </g>
        <circle cx={cx} cy={axisY} r={3.4} fill="none" stroke={INK} strokeWidth={LINE} />
      </g>
    );
  };

  const maxBox = (bx: number, value: number | undefined, status: VerdictStatus) => {
    const c = vfill(status);
    return (
      <g>
        <rect x={bx} y={y - 6} width={70} height={22} fill={c.fill} stroke={INK} strokeWidth={LINE} />
        <circle cx={bx + 62} cy={y + 1} r={2.4} fill="none" stroke={INK} strokeWidth={0.7} />
        <DotLine x1={bx + 5} x2={bx + 65} y={y + 11} />
        <Val x={bx + 64} y={y + 9} value={value !== undefined ? String(value) : ""} size={9} fill={c.text} />
      </g>
    );
  };

  return (
    <g>
      {dial(lx, 1)}
      {dial(rx, -1)}

      {/* axle centreline and the steering linkage between the pivots */}
      <line x1={lx - r - 6} y1={axisY} x2={rx + r + 6} y2={axisY} stroke={INK} strokeWidth={0.8} />
      <path
        d={`M ${lx} ${axisY} L ${lx + 14} ${axisY + 22} L ${rx - 14} ${axisY + 22} L ${rx} ${axisY}`}
        fill="none"
        stroke={INK}
        strokeWidth={LINE}
      />

      {["MAX. SVÄNG", "MAX. LENKEINSCHLAG", "MAX. TURN", "BRAQUAGE MAX."].map((l, i) => (
        <text key={l} x={SHEET_W / 2} y={axisY - 48 + i * 9.5} fontSize={7.4} fontWeight={600} fill={INK} textAnchor="middle">
          {l}
        </text>
      ))}

      {maxBox(lx - r - 78, maxLeft, leftVerdict)}
      {maxBox(rx + r + 8, maxRight, rightVerdict)}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Axle row                                                            */
/* ------------------------------------------------------------------ */

function AxleRow({
  axle,
  job,
  y,
  h,
  scaleNo,
}: {
  axle: AxleComputed;
  job: Job;
  y: number;
  h: number;
  scaleNo: number;
}) {
  const raw = job.axles[axle.index] ?? EMPTY_RAW;
  const panelW = 162;
  const leftX = M;
  const rightX = SHEET_W - M - panelW;
  const steering = axle.isSteering;
  const cx = SHEET_W / 2;

  const wheelTop = y + 58;
  const wheelH = h - 84;
  const axisY = wheelTop + wheelH / 2;
  const tyreW = steering ? 17 : 36;
  // A non-steered row prints the VÄNSTER/HÖGER sign labels between the wheel
  // and the panel, so it needs a wider gutter on the right.
  const gutter = steering ? 22 : 54;
  const lWheelX = leftX + panelW + 22;
  const rWheelX = rightX - gutter - tyreW;

  return (
    <g>
      <SidePanel x={leftX} y={y + 2} w={panelW} axle={axle} raw={raw} side="left" steering={steering} scaleNo={scaleNo} />
      <SidePanel
        x={rightX}
        y={y + 2}
        w={panelW}
        axle={axle}
        raw={raw}
        side="right"
        steering={steering}
        scaleNo={scaleNo}
        mirror
      />

      {/* the small scale and its sketch box, inboard of each wheel as printed */}
      <MiniRuler x={lWheelX + 14} y={y + 12} w={74} />
      <SketchBox x={lWheelX + 10} y={y + 22} w={82} h={30} />
      <MiniRuler x={rWheelX + tyreW - 88} y={y + 12} w={74} flip />
      <SketchBox x={rWheelX + tyreW - 92} y={y + 22} w={82} h={30} />

      {/* rolling direction of each wheel, written beside the toe box */}
      <RollLine x={cx - 56} y={y + 34} label={axle.wheelNo.left} value={axle.cLeft} />
      <RollLine x={cx - 56} y={y + 52} label={axle.wheelNo.right} value={axle.cRight} />

      {/* wheels, centreline and toe box */}
      <line x1={lWheelX - 16} y1={axisY} x2={rWheelX + tyreW + 16} y2={axisY} stroke={INK} strokeWidth={0.8} />
      <Tyre x={lWheelX} y={wheelTop} h={wheelH} dual={!steering} />
      <Tyre x={rWheelX} y={wheelTop} h={wheelH} dual={!steering} />
      <text x={lWheelX + tyreW / 2} y={axisY - 8} fontSize={12} fontWeight={800} fill={INK} textAnchor="middle">
        C
        <tspan fontSize={7.5} dy={2}>
          {axle.wheelNo.left}
        </tspan>
      </text>
      <text x={rWheelX + tyreW / 2} y={axisY - 8} fontSize={12} fontWeight={800} fill={INK} textAnchor="middle">
        C
        <tspan fontSize={7.5} dy={2}>
          {axle.wheelNo.right}
        </tspan>
      </text>

      <ToeBox x={cx - 56} y={axisY - 38} w={112} h={76} axle={axle} />

      {/* steering linkage on the steered axle, as printed */}
      {steering && (
        <path
          d={`M ${lWheelX + tyreW / 2} ${axisY} L ${lWheelX + tyreW / 2 + 14} ${axisY + 18} L ${rWheelX + tyreW / 2 - 14} ${axisY + 18} L ${rWheelX + tyreW / 2} ${axisY}`}
          fill="none"
          stroke={INK}
          strokeWidth={0.8}
        />
      )}

      {/* which way a non-steered axle is offset */}
      {!steering && (
        <g>
          {["VÄNSTER", "LINKS", "LEFT", "GAUCHE"].map((l, i) => (
            <text key={l} x={rightX - 8} y={y + 34 + i * 7} fontSize={5.6} fontWeight={600} fill={INK} textAnchor="end">
              {i === 0 ? `${l}  +` : l}
            </text>
          ))}
          {["HÖGER", "RECHTS", "RIGHT", "DROIT"].map((l, i) => (
            <text key={l} x={rightX - 8} y={y + h - 36 + i * 7} fontSize={5.6} fontWeight={600} fill={INK} textAnchor="end">
              {i === 0 ? `${l}  −` : l}
            </text>
          ))}
        </g>
      )}
    </g>
  );
}

/** The blank rectangle the sheet leaves for sketching the laser trace. */
function SketchBox({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={LINE} />;
}

/** "C₁/Dm ……… ±" — the wheel's rolling direction, as written on the sheet. */
function RollLine({ x, y, label, value }: { x: number; y: number; label: number; value?: number }) {
  const n = label;
  return (
    <g>
      <text x={x} y={y} fontSize={12} fontWeight={800} fill={INK}>
        C
        <tspan fontSize={8} dy={2}>
          {n}
        </tspan>
        <tspan fontSize={12} dy={-2}>
          /
        </tspan>
        <tspan fontSize={11}>D</tspan>
        <tspan fontSize={7} dy={2}>
          m
        </tspan>
      </text>
      <DotLine x1={x + 56} x2={x + 104} y={y + 1} />
      <Val x={x + 102} y={y - 1} value={value !== undefined ? String(round(Math.abs(value), 1)) : ""} size={9} />
      <PlusMinus x={x + 114} y={y - 3} />
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
  scaleNo,
  mirror,
}: {
  x: number;
  y: number;
  w: number;
  axle: AxleComputed;
  raw: Job["axles"][number];
  side: "left" | "right";
  steering: boolean;
  scaleNo: number;
  mirror?: boolean;
}) {
  const wheel = side === "left" ? axle.left : axle.right;
  const rawWheel = raw[side];
  const cNo = side === "left" ? axle.wheelNo.left : axle.wheelNo.right;
  const cVal = side === "left" ? axle.cLeft : axle.cRight;
  const sub = String(side === "left" ? scaleNo : scaleNo + 1);
  const c = vfill(axle.toeVerdict.status);

  let cy = y;
  const rows: ReactNode[] = [];

  rows.push(
    <ScaleBox key="A" x={x} y={cy} w={w} tag="A" sub={sub} value={num(rawWheel.A, 1)} mirror={mirror} />,
  );
  cy += 20;
  rows.push(
    <ScaleBox key="B" x={x} y={cy} w={w} tag="B" sub={sub} value={num(rawWheel.B, 1)} mirror={mirror} />,
  );
  cy += 20;

  // C row: "C₁ ± ……… : Dm ……… =" (mirrored on the right-hand panel)
  const ch = 24;
  rows.push(
    <g key="C">
      <rect x={x} y={cy} width={w} height={ch} fill={c.fill} stroke={INK} strokeWidth={LINE} />
      {mirror ? (
        <>
          <text x={x + w - 8} y={cy + ch / 2 + 5} fontSize={13} fontWeight={800} fill={INK} textAnchor="end">
            C
            <tspan fontSize={8} dy={2}>
              {cNo}
            </tspan>
          </text>
          <PlusMinus x={x + w - 32} y={cy + 11} />
          <text x={x + w - 48} y={cy + ch / 2 + 4} fontSize={9} fill={INK} textAnchor="end">
            :
          </text>
          <text x={x + 26} y={cy + ch / 2 + 4} fontSize={11} fontWeight={700} fill={INK}>
            = D
            <tspan fontSize={7} dy={2}>
              m
            </tspan>
          </text>
          <DotLine x1={x + 62} x2={x + w - 54} y={cy + ch - 7} />
          <Val x={x + 66} y={cy + ch - 9} value={cVal !== undefined ? String(round(Math.abs(cVal), 1)) : ""} anchor="start" fill={c.text} />
        </>
      ) : (
        <>
          <text x={x + 8} y={cy + ch / 2 + 5} fontSize={13} fontWeight={800} fill={INK}>
            C
            <tspan fontSize={8} dy={2}>
              {cNo}
            </tspan>
          </text>
          <PlusMinus x={x + 32} y={cy + 11} />
          <text x={x + w - 20} y={cy + ch / 2 + 4} fontSize={11} fontWeight={700} fill={INK} textAnchor="end">
            : D
            <tspan fontSize={7} dy={2}>
              m
            </tspan>
          </text>
          <DotLine x1={x + 44} x2={x + w - 58} y={cy + ch - 7} />
          <Val x={x + w - 60} y={cy + ch - 9} value={cVal !== undefined ? String(round(Math.abs(cVal), 1)) : ""} fill={c.text} />
          <rect x={x + w - 12} y={cy + 4} width={5} height={5} fill={INK} />
        </>
      )}
    </g>,
  );
  cy += ch + 3;

  // Camber (+ KPI on a steered axle)
  const halfW = (w - 3) / 2;
  rows.push(
    <SignedBox
      key="camber"
      x={x}
      y={cy}
      w={steering ? halfW : w}
      h={42}
      lines={["CAMBER", "STURZ", "CARROSSAGE"]}
      value={rawWheel.camber ? fmtAngle(rawWheel.camber) : ""}
      status={wheel.camberVerdict.status}
    />,
  );
  if (steering) {
    rows.push(
      <SignedBox
        key="kpi"
        x={x + halfW + 3}
        y={cy}
        w={halfW}
        h={42}
        lines={["KPI", "SPREIZUNG", "INCLIN. PIVOTS"]}
        value={rawWheel.kpi ? fmtAngle(rawWheel.kpi) : ""}
        status={wheel.kpiVerdict.status}
      />,
    );
    cy += 45;
    rows.push(
      <SignedBox
        key="caster"
        x={x}
        y={cy}
        w={w}
        h={26}
        lines={["CASTER", "NACHLAUF", "CHASSE"]}
        value={rawWheel.caster ? fmtAngle(rawWheel.caster) : ""}
        status={wheel.casterVerdict.status}
        inline
        signRight={mirror}
      />,
    );
  }

  return <g>{rows}</g>;
}

/** A measurement box with the form's stacked ± and its dotted write-on lines. */
function SignedBox({
  x,
  y,
  w,
  h,
  lines,
  value,
  status,
  inline,
  signRight,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
  value: string;
  status: VerdictStatus;
  /** Labels beside the sign rather than above it (the CASTER box). */
  inline?: boolean;
  signRight?: boolean;
}) {
  const c = vfill(status);
  const signX = signRight ? x + w - 12 : x + 10;
  const textX = signRight ? x + 6 : x + 22;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={c.fill} stroke={INK} strokeWidth={LINE} />
      {inline ? (
        <>
          {lines.map((l, i) => (
            <text key={l} x={textX} y={y + 9 + i * 6.6} fontSize={5.8} fontWeight={600} fill={INK}>
              {l}
            </text>
          ))}
          <PlusMinus x={signX} y={y + 11} size={8} />
          <DotLine x1={signRight ? x + w - 62 : x + 62} x2={signRight ? x + w - 22 : x + w - 6} y={y + h - 6} />
          <Val x={signRight ? x + w - 24 : x + w - 8} y={y + h - 8} value={value} fill={c.text} size={8.5} />
        </>
      ) : (
        <>
          {lines.map((l, i) => (
            <text key={l} x={x + 4} y={y + 8 + i * 6.6} fontSize={5.8} fontWeight={600} fill={INK}>
              {l}
            </text>
          ))}
          <PlusMinus x={x + 8} y={y + h - 15} size={8} />
          <DotLine x1={x + 18} x2={x + w - 4} y={y + h - 4} />
          <Val x={x + w - 5} y={y + h - 6} value={value} fill={c.text} size={8.5} />
        </>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* D box + out-of-square                                               */
/* ------------------------------------------------------------------ */

function DBox({ x, y, d, no }: { x: number; y: number; d: number; no: number }) {
  const w = 104;
  const h = 44;
  const sub = `${no},${no + 1}`;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#fff" stroke={INK} strokeWidth={1.4} />
      <text x={x + 6} y={y + 17} fontSize={13} fontWeight={800} fill={INK}>
        A
        <tspan fontSize={7} dy={2}>
          {sub}
        </tspan>
      </text>
      <text x={x + 6} y={y + h - 5} fontSize={13} fontWeight={800} fill={INK}>
        B
        <tspan fontSize={7} dy={2}>
          {sub}
        </tspan>
      </text>
      {/* the up/down arrow between the two scale names */}
      <g stroke={INK} strokeWidth={0.9} fill="none">
        <line x1={x + 12} y1={y + 20} x2={x + 12} y2={y + 30} />
        <path d={`M ${x + 9} ${y + 23} L ${x + 12} ${y + 19} L ${x + 15} ${y + 23}`} />
        <path d={`M ${x + 9} ${y + 27} L ${x + 12} ${y + 31} L ${x + 15} ${y + 27}`} />
      </g>
      <text x={x + 40} y={y + 28} fontSize={14} fontWeight={800} fill={INK}>
        =D
      </text>
      <DotLine x1={x + 62} x2={x + w - 16} y={y + 30} />
      <Val x={x + w - 18} y={y + 28} value={d > 0 ? String(d) : ""} size={11} />
      <text x={x + w - 12} y={y + 30} fontSize={8} fill={INK}>
        m
      </text>
    </g>
  );
}

/**
 * The out-of-square block: one drum per axle laid out along the vehicle, with
 * the C-value boxes and the axle-to-axle difference, as printed.
 */
function OutOfSquare({
  computed,
  slots,
  isTruck,
  y,
}: {
  computed: JobComputed;
  slots: AxleComputed[];
  isTruck: boolean;
  y: number;
}) {
  // The sheet draws the driven/trailer axles here — the steered axle is not
  // part of the squareness check.
  const shown = isTruck ? slots.filter((a) => !a.isSteering) : slots;
  const pairs = chunk(shown, 2);

  // Four drums have to step more gently than two to stay on the page.
  const many = shown.length > 2;
  const stepX = many ? 100 : 108;
  const stepY = many ? 15 : 34;
  const drumR = many ? 22 : 28;
  const baseX = M + 170;
  const baseY = y + (many ? 112 : 96);

  return (
    <g>
      {["SNEDSTÄLLNING", "SCHRÄGSTÄLLUNG", "OUT OF SQUARE", "ANGLE FAUSSÉ"].map((l, i) => (
        <text key={l} x={M} y={y + 22 + i * 10} fontSize={8} fontWeight={600} fill={INK}>
          {l}
        </text>
      ))}

      {/* the drums, stepping back and down along the vehicle */}
      {shown.map((a, i) => (
        <Drum
          key={a.id}
          cx={baseX + i * stepX}
          cy={baseY + i * stepY}
          r={drumR}
          label={a.wheelNo.left}
          status={a.oosVerdict.status}
        />
      ))}

      {/* one value box per axle, tied back to its drum */}
      {shown.map((a, i) => {
        const bx = baseX + 22 + i * stepX;
        const by = baseY - 62 + i * stepY;
        return (
          <ValueTab
            key={`v${a.id}`}
            x={bx}
            y={by}
            label={a.wheelNo.right}
            value={a.oos !== undefined ? String(round(Math.abs(a.oos), 2)) : ""}
            status={a.oosVerdict.status}
            drumX={baseX + i * stepX}
            drumY={baseY + i * stepY}
          />
        );
      })}

      {/* the difference between the two axles of each pair */}
      {pairs.map((pair, pi) => {
        if (pair.length < 2) return null;
        const [first, second] = pair;
        const idx = shown.indexOf(first);
        const bx = baseX + 86 + idx * stepX;
        const by = baseY - 88 + idx * stepY;
        const par = computed.parallelism.find((p) => p.to === second.index && p.from === first.index);
        const diff =
          par?.value !== undefined
            ? par.value
            : first.oos !== undefined && second.oos !== undefined
              ? first.oos - second.oos
              : undefined;
        const status = par?.verdict.status ?? "unknown";
        const c = vfill(status);
        return (
          <g key={`d${pi}`}>
            <text x={bx - 5} y={by + 13} fontSize={6} fontWeight={700} fill={INK} textAnchor="end">
              DIFF. C{first.wheelNo.left}/C{first.wheelNo.right}-C{second.wheelNo.left}/C{second.wheelNo.right}
            </text>
            <rect x={bx} y={by} width={112} height={21} fill={c.fill} stroke={INK} strokeWidth={LINE} />
            <text x={bx + 6} y={by + 16} fontSize={12} fontWeight={800} fill={INK}>
              C
              <tspan fontSize={7.5} dy={2}>
                {first.wheelNo.right}
              </tspan>
              <tspan fontSize={12} dy={-2}>
                {" − "}
              </tspan>
              C
              <tspan fontSize={7.5} dy={2}>
                {second.wheelNo.right}
              </tspan>
              <tspan fontSize={12} dy={-2}>
                =
              </tspan>
            </text>
            <DotLine x1={bx + 68} x2={bx + 108} y={by + 17} />
            <Val
              x={bx + 107}
              y={by + 15}
              value={diff !== undefined ? String(round(Math.abs(diff), 2)) : ""}
              fill={c.text}
              size={9}
            />
          </g>
        );
      })}
    </g>
  );
}

/** "C₄ ± ……" tab pinned above its drum. */
function ValueTab({
  x,
  y,
  label,
  value,
  status,
  drumX,
  drumY,
}: {
  x: number;
  y: number;
  label: number;
  value: string;
  status: VerdictStatus;
  drumX: number;
  drumY: number;
}) {
  const w = 68;
  const h = 22;
  const c = vfill(status);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={c.fill} stroke={INK} strokeWidth={LINE} />
      <text x={x + 5} y={y + 16} fontSize={13} fontWeight={800} fill={INK}>
        C
        <tspan fontSize={7.5} dy={2}>
          {label}
        </tspan>
      </text>
      <PlusMinus x={x + 33} y={y + 10} size={7} />
      <DotLine x1={x + 40} x2={x + w - 4} y={y + 17} />
      <Val x={x + w - 5} y={y + 15} value={value} fill={c.text} size={8.5} />
      {/* the leader back to the drum this value belongs to */}
      <line x1={x + 2} y1={y + h} x2={drumX} y2={drumY} stroke={INK} strokeWidth={0.5} />
    </g>
  );
}

/** A wheel drawn as a drum in perspective, the way the sheet shows squareness. */
function Drum({
  cx,
  cy,
  r,
  label,
  status,
}: {
  cx: number;
  cy: number;
  r: number;
  label: number;
  status: VerdictStatus;
}) {
  const off = r * 0.66;
  const c = vfill(status);
  return (
    <g>
      <circle cx={cx + off} cy={cy - off * 0.35} r={r} fill={c.fill} stroke={INK} strokeWidth={0.9} />
      <line x1={cx} y1={cy - r} x2={cx + off} y2={cy - r - off * 0.35} stroke={INK} strokeWidth={0.9} />
      <line x1={cx} y1={cy + r} x2={cx + off} y2={cy + r - off * 0.35} stroke={INK} strokeWidth={0.9} />
      <circle cx={cx} cy={cy} r={r} fill={c.fill} stroke={INK} strokeWidth={LINE} />
      <text x={cx} y={cy + 5} fontSize={r > 24 ? 14 : 12} fontWeight={800} fill={INK} textAnchor="middle">
        C
        <tspan fontSize={8.5} dy={2.5}>
          {label}
        </tspan>
      </text>
    </g>
  );
}
