import type { CSSProperties } from "react";
import type { Job, SpecProfile } from "@/lib/types";
import type { AxleComputed, JobComputed } from "@/lib/compute";
import type { VerdictStatus } from "@/lib/verdict";
import { fmtAngle, fmtDate } from "@/lib/format";
import { withSign } from "@/lib/calc";

/** A4 portrait design size in CSS px (~96 dpi). */
export const SHEET_W = 794;
export const SHEET_H = 1123;

/* Print-safe verdict tints (report is always light). */
function tint(status: VerdictStatus): CSSProperties {
  switch (status) {
    case "pass":
      return { background: "#ecfdf3", color: "#15803d", borderColor: "#86efac" };
    case "fail":
      return { background: "#fef2f2", color: "#b91c1c", borderColor: "#fca5a5" };
    default:
      return { background: "#ffffff", color: "#111111", borderColor: "#cbd5e1" };
  }
}

const ink = "#111111";
const hair = "#94a3b8";

export function Am39Report({
  job,
  computed,
}: {
  job: Job;
  computed: JobComputed;
  /** Reserved for future per-spec annotations on the sheet. */
  spec?: SpecProfile;
}) {
  const isTruck = job.vehicleType === "truck";
  return (
    <div
      className="relative flex flex-col font-sans"
      style={{
        width: SHEET_W,
        height: SHEET_H,
        padding: 20,
        color: ink,
        // Force background tints to print.
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <Header job={job} status={computed.status} />
      {isTruck && <TurnBand axle={computed.axles[0]} job={job} />}

      <Ruler leftTag="A₁" rightTag="A₂" caption="Front frame gauge" />

      <div className="flex flex-1 flex-col">
        {computed.axles.map((axle) => (
          <AxleRow key={axle.id} axle={axle} job={job} />
        ))}
      </div>

      <Ruler leftTag="B₁" rightTag="B₂" caption="Rear frame gauge" />

      <Footer job={job} computed={computed} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header({ job, status }: { job: Job; status: VerdictStatus }) {
  const fields: [string, string | undefined][] = [
    ["Reg. no", job.header.regNo],
    ["Type", job.header.type],
    ["Date", fmtDate(job.header.date)],
    ["Owner", job.header.owner],
    ["Miles / km", job.header.milesKm],
    ["Sign", job.header.sign],
  ];
  return (
    <div className="mb-2 flex items-stretch gap-4 border-b-2 pb-2" style={{ borderColor: ink }}>
      <div className="flex flex-col justify-between">
        <div>
          <div className="text-3xl font-black tracking-tight leading-none">JOSAM</div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-500">laser AM · AM39</div>
        </div>
        <div
          className="mt-2 inline-flex w-fit items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold uppercase"
          style={tint(status)}
        >
          {status === "pass" ? "Within tolerance" : status === "fail" ? "Out of tolerance" : "Incomplete"}
        </div>
      </div>
      <div className="grid flex-1 grid-cols-3 gap-x-4 gap-y-1 self-center">
        {fields.map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-1 border-b" style={{ borderColor: hair }}>
            <span className="text-[9px] uppercase tracking-wide text-neutral-500">{label}</span>
            <span className="ml-auto truncate font-mono text-[11px]">{value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Turn band (truck steering axle)                                    */
/* ------------------------------------------------------------------ */

function TurnBand({ axle, job }: { axle: AxleComputed; job: Job }) {
  const s = job.axles[0].steering ?? {};
  const st = axle.steering;
  return (
    <div className="mb-2 grid grid-cols-3 items-center gap-2 rounded border p-2" style={{ borderColor: hair }}>
      <TurnGroup
        title="Left / Vänster / Links"
        reference={s.turnLeft?.reference}
        opposite={s.turnLeft?.opposite}
        diff={st?.turnLeftDiff}
        maxTurn={s.maxTurnLeft}
        status={st?.tootVerdict.status ?? "unknown"}
      />
      <div className="text-center">
        <div className="text-[9px] uppercase tracking-widest text-neutral-500">Toe-out on turn</div>
        <div className="text-[8px] text-neutral-400">Kurvwinkeldifferens · Max. turn</div>
        <div className="mx-auto mt-1 h-8 w-16 rounded-t-full border-2 border-b-0" style={{ borderColor: hair }} />
      </div>
      <TurnGroup
        title="Right / Höger / Rechts"
        reference={s.turnRight?.reference}
        opposite={s.turnRight?.opposite}
        diff={st?.turnRightDiff}
        maxTurn={s.maxTurnRight}
        status={st?.tootVerdict.status ?? "unknown"}
        alignRight
      />
    </div>
  );
}

function TurnGroup({
  title,
  reference,
  opposite,
  diff,
  maxTurn,
  status,
  alignRight,
}: {
  title: string;
  reference?: number;
  opposite?: number;
  diff?: number;
  maxTurn?: number;
  status: VerdictStatus;
  alignRight?: boolean;
}) {
  return (
    <div className={alignRight ? "text-right" : ""}>
      <div className="text-[9px] font-semibold uppercase tracking-wide text-neutral-600">{title}</div>
      <div className={`mt-1 flex gap-1 ${alignRight ? "justify-end" : ""}`}>
        <MiniBox label="Ref°" value={reference !== undefined ? `${reference}°` : "—"} />
        <MiniBox label="Outer°" value={opposite !== undefined ? `${opposite}°` : "—"} />
        <MiniBox label="Diff" value={diff !== undefined ? `${diff}°` : "—"} status={status} />
        <MiniBox label="Max" value={maxTurn !== undefined ? `${maxTurn}°` : "—"} />
      </div>
    </div>
  );
}

function MiniBox({ label, value, status }: { label: string; value: string; status?: VerdictStatus }) {
  return (
    <div className="rounded border px-1.5 py-0.5 text-center" style={status ? tint(status) : { borderColor: hair }}>
      <div className="text-[7px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="font-mono text-[11px] font-semibold leading-tight">{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Axle row                                                           */
/* ------------------------------------------------------------------ */

function AxleRow({ axle, job }: { axle: AxleComputed; job: Job }) {
  const raw = job.axles[axle.index];
  return (
    <div className="grid grid-cols-[1.05fr_1.9fr_1.05fr] gap-2 border-b py-2" style={{ borderColor: hair }}>
      {/* left panel */}
      <SidePanel axle={axle} raw={raw} side="left" />

      {/* centre: wheels + toe */}
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="text-[9px] font-semibold text-neutral-500">
          Axle {axle.index + 1}
          {axle.isSteering ? " · steering" : ""}
        </div>
        <div className="flex w-full items-center justify-center gap-2">
          <WheelWithValue value={axle.cLeft} code={`C${axle.wheelNo.left}`} dual={!axle.isSteering} />
          <ToeBox axle={axle} />
          <WheelWithValue value={axle.cRight} code={`C${axle.wheelNo.right}`} dual={!axle.isSteering} />
        </div>
        <OosStrip axle={axle} />
      </div>

      {/* right panel */}
      <SidePanel axle={axle} raw={raw} side="right" />
    </div>
  );
}

function SidePanel({
  axle,
  raw,
  side,
}: {
  axle: AxleComputed;
  raw: Job["axles"][number];
  side: "left" | "right";
}) {
  const wheel = side === "left" ? axle.left : axle.right;
  const rawWheel = raw[side];
  const cNo = side === "left" ? axle.wheelNo.left : axle.wheelNo.right;
  const cVal = side === "left" ? axle.cLeft : axle.cRight;
  return (
    <div className={`flex flex-col gap-1 ${side === "right" ? "items-end text-right" : ""}`}>
      <div className="flex gap-1">
        <MiniBox label={`A${side === "left" ? "₁" : "₂"}`} value={rawWheel.A !== undefined ? String(rawWheel.A) : "—"} />
        <MiniBox label={`B${side === "left" ? "₁" : "₂"}`} value={rawWheel.B !== undefined ? String(rawWheel.B) : "—"} />
        <MiniBox
          label={`C${cNo}/Dm`}
          value={cVal !== undefined ? `${withSign(cVal)}` : "—"}
        />
      </div>
      <AngleBox title="Camber" sub="Sturz · Carrossage" raw={rawWheel.camber} status={wheel.camberVerdict.status} />
      {axle.isSteering && (
        <>
          <AngleBox title="KPI" sub="Spreizung" raw={rawWheel.kpi} status={wheel.kpiVerdict.status} />
          <AngleBox title="Caster" sub="Nachlauf · Chasse" raw={rawWheel.caster} status={wheel.casterVerdict.status} />
        </>
      )}
    </div>
  );
}

function AngleBox({
  title,
  sub,
  raw,
  status,
}: {
  title: string;
  sub: string;
  raw?: import("@/lib/calc").AngleDM;
  status: VerdictStatus;
}) {
  return (
    <div className="w-full rounded border px-1.5 py-0.5" style={tint(status)}>
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[8px] font-semibold uppercase tracking-wide">{title}</span>
        <span className="font-mono text-[11px] font-semibold">{raw ? fmtAngle(raw) : "—"}</span>
      </div>
      <div className="text-[7px] uppercase tracking-wide opacity-60">{sub}</div>
    </div>
  );
}

function WheelWithValue({
  value,
  code,
  dual,
}: {
  value?: number;
  code: string;
  dual?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-mono text-[11px] font-semibold">{value !== undefined ? withSign(value) : "—"}</span>
      <Wheel dual={dual} />
      <span className="text-[8px] text-neutral-500">{code}</span>
    </div>
  );
}

function Wheel({ dual }: { dual?: boolean }) {
  return (
    <svg width={dual ? 34 : 20} height={44} viewBox={`0 0 ${dual ? 34 : 20} 44`}>
      <rect x={1} y={1} width={18} height={42} rx={5} fill="none" stroke={ink} strokeWidth={1.5} />
      {dual && <rect x={15} y={1} width={18} height={42} rx={5} fill="none" stroke={ink} strokeWidth={1.5} />}
    </svg>
  );
}

function ToeBox({ axle }: { axle: AxleComputed }) {
  const kindIn = axle.toeKind === "toe-in";
  const kindOut = axle.toeKind === "toe-out";
  return (
    <div className="flex flex-col items-center rounded border px-2 py-1 text-center" style={tint(axle.toeVerdict.status)}>
      <span className={`text-[8px] uppercase tracking-wide ${kindIn ? "font-bold" : "opacity-40"}`}>Toe-in ▸◂</span>
      <span className="my-0.5 font-mono text-sm font-bold leading-none">
        {axle.toe !== undefined ? `${withSign(axle.toe)}` : "—"}
        <span className="ml-0.5 text-[8px] font-normal">mm/m</span>
      </span>
      <span className={`text-[8px] uppercase tracking-wide ${kindOut ? "font-bold" : "opacity-40"}`}>Toe-out ◂▸</span>
    </div>
  );
}

function OosStrip({ axle }: { axle: AxleComputed }) {
  const label =
    axle.oosSide === "left" ? "◂ left" : axle.oosSide === "right" ? "right ▸" : "centred";
  return (
    <div className="flex items-center gap-1 text-[8px] text-neutral-500">
      <span className="uppercase tracking-wide">Out of square</span>
      <span
        className="rounded border px-1 font-mono text-[10px] font-semibold"
        style={tint(axle.oosVerdict.status)}
      >
        {axle.oos !== undefined ? withSign(axle.oos) : "—"} · {label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ruler + footer                                                     */
/* ------------------------------------------------------------------ */

function Ruler({ leftTag, rightTag, caption }: { leftTag: string; rightTag: string; caption: string }) {
  return (
    <div className="my-1 flex items-center gap-2">
      <span className="font-mono text-[10px] font-bold">{leftTag}</span>
      <svg viewBox="0 0 600 16" preserveAspectRatio="none" className="h-4 flex-1" style={{ color: ink }}>
        <line x1={0} x2={600} y1={12} y2={12} stroke="currentColor" strokeWidth={1} />
        {Array.from({ length: 61 }).map((_, i) => {
          const x = (i / 60) * 600;
          const major = i % 10 === 0;
          return <line key={i} x1={x} x2={x} y1={major ? 3 : 7} y2={12} stroke="currentColor" strokeWidth={major ? 1 : 0.5} />;
        })}
      </svg>
      <span className="font-mono text-[10px] font-bold">{rightTag}</span>
      <span className="w-24 text-right text-[8px] uppercase tracking-wide text-neutral-400">{caption}</span>
    </div>
  );
}

function Footer({ job, computed }: { job: Job; computed: JobComputed }) {
  return (
    <div className="mt-2 grid grid-cols-[2fr_1fr] gap-3 border-t-2 pt-2" style={{ borderColor: ink }}>
      <div>
        <div className="text-[9px] font-semibold uppercase tracking-wide text-neutral-600">
          Out of square · Parallelism
        </div>
        <div className="text-[8px] text-neutral-400">Snedställning · Angle fausse</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {computed.axles.map((a) => (
            <div key={a.id} className="rounded border px-1.5 py-0.5 text-center" style={tint(a.oosVerdict.status)}>
              <div className="text-[7px] uppercase opacity-70">Axle {a.index + 1}</div>
              <div className="font-mono text-[11px] font-semibold">{a.oos !== undefined ? withSign(a.oos) : "—"}</div>
            </div>
          ))}
          {computed.parallelism.map((p) => (
            <div key={p.to} className="rounded border px-1.5 py-0.5 text-center" style={tint(p.verdict.status)}>
              <div className="text-[7px] uppercase opacity-70">A1↔A{p.to + 1}</div>
              <div className="font-mono text-[11px] font-semibold">{p.value !== undefined ? withSign(p.value) : "—"}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end justify-center">
        <div className="rounded border px-3 py-1 text-center" style={{ borderColor: ink }}>
          <div className="text-[8px] uppercase tracking-wide text-neutral-500">A₁,₂ ↕ B₁,₂ = D</div>
          <div className="font-mono text-base font-bold">{job.D} m</div>
        </div>
      </div>
    </div>
  );
}
