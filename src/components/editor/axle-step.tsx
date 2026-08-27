"use client";

import { useState, type ReactNode } from "react";
import type { WritableDraft } from "immer";
import { Gauge, Crosshair, Check, Plus } from "lucide-react";
import type { Job, SpecProfile } from "@/lib/types";
import { scaleNumbers } from "@/lib/types";
import type { AxleComputed } from "@/lib/compute";
import { newAxleReading } from "@/lib/defaults";
import { runoutTarget, runoutSpread, round } from "@/lib/calc";
import { NumberField, AngleField } from "@/components/fields";
import { AxleScheme } from "./axle-scheme";
import { LiveReadout } from "./live-readout";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SteeringWheel } from "@/components/icons";
import { fmtSigned, fmtMmM } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

interface AxleStepProps {
  job: Job;
  index: number;
  computed: AxleComputed;
  spec?: SpecProfile;
  update: (recipe: (draft: WritableDraft<Job>) => void) => void;
}

/**
 * One axle, laid out in the order the job is actually done on the floor:
 * compensate the adapters for run-out, measure while the mechanic adjusts the
 * track rod, save a reading each time, then centre the steering.
 */
export function AxleStep({ job, index, computed, spec, update }: AxleStepProps) {
  const axle = job.axles[index];

  return (
    <div className="space-y-4">
      <RunoutSection job={job} index={index} update={update} />
      <MeasureCard job={job} index={index} computed={computed} spec={spec} update={update} />
      {axle.isSteering && <SteeringCentringCard job={job} index={index} computed={computed} update={update} />}
      <CamberSection job={job} index={index} update={update} />
      {axle.isSteering && <SteeringAdvanced job={job} index={index} update={update} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — run-out compensation
// ---------------------------------------------------------------------------

/**
 * Manual p.13: aim the laser at the scale, read it, spin the wheel half a turn
 * and read it again, then trim the adapter until the dot sits midway between
 * the two. Purely a setup aid — none of it reaches the report.
 */
function RunoutSection({ job, index, update }: { job: Job; index: number; update: AxleStepProps["update"] }) {
  const { t } = useI18n();
  const axle = job.axles[index];
  const done =
    (axle.left.runoutStart !== undefined && axle.left.runoutHalf !== undefined) ||
    (axle.right.runoutStart !== undefined && axle.right.runoutHalf !== undefined);

  return (
    <ToggleSection
      icon={<Crosshair className="size-4" />}
      title={t("Run-out compensation")}
      subtitle={t("step 1")}
      badge={done ? <StepDone /> : undefined}
      defaultOn={!done}
    >
      <p className="mb-3 text-xs text-muted-foreground">
        {t("Read the scale, spin the wheel half a turn and read again. Trim the adapter until the dot sits on the target.")}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <RunoutWheel job={job} index={index} side="left" label={t("Left")} update={update} />
        <RunoutWheel job={job} index={index} side="right" label={t("Right")} update={update} />
      </div>
    </ToggleSection>
  );
}

function RunoutWheel({
  job,
  index,
  side,
  label,
  update,
}: {
  job: Job;
  index: number;
  side: "left" | "right";
  label: string;
  update: AxleStepProps["update"];
}) {
  const { t } = useI18n();
  const wheel = job.axles[index][side];
  const ready = wheel.runoutStart !== undefined && wheel.runoutHalf !== undefined;
  const target = ready ? runoutTarget(wheel.runoutStart!, wheel.runoutHalf!) : undefined;
  const spread = ready ? runoutSpread(wheel.runoutStart!, wheel.runoutHalf!) : undefined;

  return (
    <div className="space-y-2.5 rounded-md border bg-background p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h4>
      <NumberField
        label={t("Start")}
        unit="mm"
        help="runout"
        value={wheel.runoutStart}
        onChange={(v) => update((d) => void (d.axles[index][side].runoutStart = v))}
      />
      <NumberField
        label={t("Half turn")}
        unit="mm"
        help="runout"
        value={wheel.runoutHalf}
        onChange={(v) => update((d) => void (d.axles[index][side].runoutHalf = v))}
      />
      <div className="rounded-md bg-muted/60 px-2.5 py-2 text-center">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("Adjust to")}</div>
        <div className="font-mono text-lg font-semibold tabular-nums">
          {target === undefined ? "—" : round(target, 1)}
        </div>
        {spread !== undefined && (
          <div className="text-[10px] text-muted-foreground">
            {t("Run-out")} {round(spread, 1)} mm
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — measure while the track rod is adjusted
// ---------------------------------------------------------------------------

function MeasureCard({ job, index, computed, spec, update }: AxleStepProps) {
  const { t } = useI18n();
  const axle = job.axles[index];
  const scales = scaleNumbers(job.vehicleType, index);
  const readings = axle.readings ?? [];
  const complete =
    axle.left.A !== undefined && axle.left.B !== undefined && axle.right.A !== undefined && axle.right.B !== undefined;

  function saveReading() {
    update((d) => {
      const target = d.axles[index];
      const stage = (target.readings?.length ?? 0) === 0 ? "initial" : "adjusted";
      target.readings = [...(target.readings ?? []), newAxleReading(target, d.D, stage)];
    });
    toast.success(t("Reading saved"));
  }

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          {t("Measure")}
          <span className="text-xs font-normal text-muted-foreground">{t("step 2")}</span>
        </h3>
        {readings.length > 0 && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {readings.length} {t("saved")}
          </span>
        )}
      </div>

      {/* D lives here: the manual has you measure the scale spacing at the rig. */}
      <NumberField
        label={t("Distance between scales (D)")}
        unit="m"
        help="D"
        placeholder="6.5"
        value={job.D > 0 ? job.D : undefined}
        onChange={(v) => update((d) => void (d.D = v ?? 0))}
      />
      {!(job.D > 0) && (
        <p className="rounded-md border border-warn/40 bg-warn/10 px-2.5 py-2 text-xs">
          {t("Nothing is computed until D is set. Decimals are fine — 6.5 or 6,5.")}
        </p>
      )}

      {/* Scale readings sit next to the wheel they were taken from. */}
      <div className="grid grid-cols-[1fr_92px_1fr] items-center gap-2">
        <WheelColumn
          job={job}
          index={index}
          side="left"
          scaleNo={scales.left}
          wheelNo={computed.wheelNo.left}
          diff={computed.left.diff}
          rolling={computed.left.rolling}
          update={update}
        />
        <div className="h-[196px] w-full">
          <AxleScheme
            cLeft={computed.cLeft}
            cRight={computed.cRight}
            dual={!axle.isSteering}
            frontLabel={t("FRONT")}
          />
        </div>
        <WheelColumn
          job={job}
          index={index}
          side="right"
          scaleNo={scales.right}
          wheelNo={computed.wheelNo.right}
          diff={computed.right.diff}
          rolling={computed.right.rolling}
          update={update}
        />
      </div>

      <LiveReadout axle={computed} spec={spec} />

      <Button className="h-11 w-full" variant="outline" disabled={!complete} onClick={saveReading}>
        <Plus className="size-4" />
        {readings.length === 0 ? t("Save first reading") : t("Save reading after adjustment")}
      </Button>
      {readings.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {t("The values above are what the report prints.")}
        </p>
      )}
    </section>
  );
}

/** One side's scale readings, labelled exactly as the boxes on the AM39 sheet. */
function WheelColumn({
  job,
  index,
  side,
  scaleNo,
  wheelNo,
  diff,
  rolling,
  update,
}: {
  job: Job;
  index: number;
  side: "left" | "right";
  scaleNo: number;
  wheelNo: number;
  diff?: number;
  rolling?: number;
  update: AxleStepProps["update"];
}) {
  const { t } = useI18n();
  const wheel = job.axles[index][side];
  return (
    <div className="space-y-2">
      <div className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {side === "left" ? t("Left") : t("Right")}
      </div>
      <NumberField
        label={`A${scaleNo}`}
        hint={t("front")}
        unit="mm"
        help="A"
        value={wheel.A}
        onChange={(v) => update((d) => void (d.axles[index][side].A = v))}
      />
      <NumberField
        label={`B${scaleNo}`}
        hint={t("rear")}
        unit="mm"
        help="B"
        value={wheel.B}
        onChange={(v) => update((d) => void (d.axles[index][side].B = v))}
      />
      <div className="rounded-md bg-muted/60 px-2 py-1.5">
        <div className="flex items-baseline justify-between text-[10px] text-muted-foreground">
          <span>A − B</span>
          <span className="font-mono tabular-nums">{fmtSigned(diff, 1)}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-medium text-muted-foreground">C{wheelNo}/Dm</span>
          <span className="font-mono text-sm font-semibold tabular-nums">{fmtSigned(rolling, 1)}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — centre the steering
// ---------------------------------------------------------------------------

/**
 * Manual pp.37-39. With the steering box on its centre mark, the same wheel is
 * read against the front and rear scales; they should agree within 1°/m.
 */
function SteeringCentringCard({
  job,
  index,
  computed,
  update,
}: {
  job: Job;
  index: number;
  computed: AxleComputed;
  update: AxleStepProps["update"];
}) {
  const { t } = useI18n();
  const s = job.axles[index].steering ?? {};
  const dev = computed.steering?.steeringBoxDev;
  const status = computed.steering?.steeringBoxVerdict.status;

  const setSteering = (recipe: (st: NonNullable<Job["axles"][number]["steering"]>) => void) =>
    update((d) => {
      const ax = d.axles[index];
      if (!ax.steering) ax.steering = {};
      recipe(ax.steering);
    });

  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <SteeringWheel className="size-4 text-muted-foreground" />
        {t("Centre the steering")}
        <span className="text-xs font-normal text-muted-foreground">{t("step 3")}</span>
      </h3>
      <p className="text-xs text-muted-foreground">
        {t("With the steering box on its centre mark, read the same wheel on both scales. Max 1°/m (≈ 17.4 mm/m).")}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t("Front scale (A)")}
          unit="mm"
          help="steeringBox"
          value={s.steeringBoxA}
          onChange={(v) => setSteering((st) => void (st.steeringBoxA = v))}
        />
        <NumberField
          label={t("Rear scale (B)")}
          unit="mm"
          help="steeringBox"
          value={s.steeringBoxB}
          onChange={(v) => setSteering((st) => void (st.steeringBoxB = v))}
        />
      </div>
      <div className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2">
        <span className="text-sm font-medium">{t("Deviation")}</span>
        <span className="flex items-center gap-2">
          <span className="font-mono text-sm tabular-nums">{fmtMmM(dev)}</span>
          {status && status !== "unknown" && (
            <span
              className={
                status === "pass"
                  ? "rounded bg-pass/15 px-1.5 py-0.5 text-[10px] font-semibold text-pass"
                  : "rounded bg-fail/15 px-1.5 py-0.5 text-[10px] font-semibold text-fail"
              }
            >
              {status === "pass" ? t("OK") : t("Out")}
            </span>
          )}
        </span>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Optional extras
// ---------------------------------------------------------------------------

function StepDone() {
  return (
    <span className="flex size-4 items-center justify-center rounded-full bg-pass/20 text-pass">
      <Check className="size-3" />
    </span>
  );
}

/**
 * A section that reveals its content with a toggle. Shared design for Camber and
 * Steering geometry so both read the same way.
 */
function ToggleSection({
  icon,
  title,
  subtitle,
  badge,
  defaultOn = false,
  onToggle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  defaultOn?: boolean;
  onToggle?: (on: boolean) => void;
  children: ReactNode;
}) {
  const [on, setOn] = useState(defaultOn);
  const toggle = (v: boolean) => {
    setOn(v);
    onToggle?.(v);
  };
  return (
    <div className="rounded-lg border bg-card">
      <label className="flex cursor-pointer items-center justify-between p-4">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-muted-foreground">{icon}</span>
          {title}
          {subtitle && <span className="text-xs font-normal text-muted-foreground">{subtitle}</span>}
          {badge}
        </span>
        <Switch checked={on} onCheckedChange={toggle} />
      </label>
      {on && <div className="border-t p-4">{children}</div>}
    </div>
  );
}

/** Camber is hidden by default; the toggle reveals the left/right inputs. */
function CamberSection({ job, index, update }: { job: Job; index: number; update: AxleStepProps["update"] }) {
  const { t } = useI18n();
  const axle = job.axles[index];
  const hasData = axle.left.camber !== undefined || axle.right.camber !== undefined;

  return (
    <ToggleSection
      icon={<Gauge className="size-4" />}
      title={t("Camber")}
      defaultOn={hasData}
      onToggle={(on) => {
        if (!on) {
          // Turning off clears any recorded camber so it won't affect the verdict.
          update((d) => {
            d.axles[index].left.camber = undefined;
            d.axles[index].right.camber = undefined;
          });
        }
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <AngleField
          label={t("Left")}
          help="camber"
          value={axle.left.camber}
          onChange={(v) => update((d) => void (d.axles[index].left.camber = v))}
        />
        <AngleField
          label={t("Right")}
          help="camber"
          value={axle.right.camber}
          onChange={(v) => update((d) => void (d.axles[index].right.camber = v))}
        />
      </div>
    </ToggleSection>
  );
}

function hasSteeringData(s: NonNullable<Job["axles"][number]["steering"]>, axle: Job["axles"][number]): boolean {
  return (
    axle.left.caster !== undefined ||
    axle.right.caster !== undefined ||
    axle.left.kpi !== undefined ||
    axle.right.kpi !== undefined ||
    s.turnLeft?.opposite !== undefined ||
    s.turnRight?.opposite !== undefined ||
    s.maxTurnLeft !== undefined ||
    s.maxTurnRight !== undefined ||
    s.tapeLeft !== undefined
  );
}

function SteeringAdvanced({ job, index, update }: { job: Job; index: number; update: AxleStepProps["update"] }) {
  const { t } = useI18n();
  const axle = job.axles[index];
  const s = axle.steering ?? {};

  const setSteering = (recipe: (st: NonNullable<Job["axles"][number]["steering"]>) => void) =>
    update((d) => {
      const ax = d.axles[index];
      if (!ax.steering) ax.steering = {};
      recipe(ax.steering);
    });

  return (
    <ToggleSection
      icon={<SteeringWheel className="size-4" />}
      title={t("Steering geometry")}
      subtitle={t("optional")}
      defaultOn={hasSteeringData(s, axle)}
    >
      <div className="space-y-5">
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Caster")} · {t("KPI")}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <AngleField
              label={`${t("Caster")} · ${t("Left")}`}
              help="caster"
              value={axle.left.caster}
              onChange={(v) => update((d) => void (d.axles[index].left.caster = v))}
            />
            <AngleField
              label={`${t("Caster")} · ${t("Right")}`}
              help="caster"
              value={axle.right.caster}
              onChange={(v) => update((d) => void (d.axles[index].right.caster = v))}
            />
            <AngleField
              label={`${t("KPI")} · ${t("Left")}`}
              help="kpi"
              value={axle.left.kpi}
              onChange={(v) => update((d) => void (d.axles[index].left.kpi = v))}
            />
            <AngleField
              label={`${t("KPI")} · ${t("Right")}`}
              help="kpi"
              value={axle.right.kpi}
              onChange={(v) => update((d) => void (d.axles[index].right.kpi = v))}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Toe-out on turn")}</h4>
          <p className="text-xs text-muted-foreground">
            {t("Turn inner wheel to a reference angle, read the outer wheel. Sides should differ by ≤ 0.5°.")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={t("Left · reference")}
              unit="°"
              help="turnReference"
              value={s.turnLeft?.reference ?? 20}
              onChange={(v) => setSteering((st) => void ((st.turnLeft ??= {}).reference = v))}
            />
            <NumberField
              label={t("Left · outer")}
              unit="°"
              help="turnOuter"
              value={s.turnLeft?.opposite}
              onChange={(v) => setSteering((st) => void ((st.turnLeft ??= {}).opposite = v))}
            />
            <NumberField
              label={t("Right · reference")}
              unit="°"
              help="turnReference"
              value={s.turnRight?.reference ?? 20}
              onChange={(v) => setSteering((st) => void ((st.turnRight ??= {}).reference = v))}
            />
            <NumberField
              label={t("Right · outer")}
              unit="°"
              help="turnOuter"
              value={s.turnRight?.opposite}
              onChange={(v) => setSteering((st) => void ((st.turnRight ??= {}).opposite = v))}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Maximum turn")}</h4>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={t("Left lock")}
              unit="°"
              help="maxTurn"
              value={s.maxTurnLeft}
              onChange={(v) => setSteering((st) => void (st.maxTurnLeft = v))}
            />
            <NumberField
              label={t("Right lock")}
              unit="°"
              help="maxTurn"
              value={s.maxTurnRight}
              onChange={(v) => setSteering((st) => void (st.maxTurnRight = v))}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Out of square (tape)")}</h4>
          <p className="text-xs text-muted-foreground">{t("Left vs right spring-eye distance. Max difference 5 mm.")}</p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={t("Left")}
              unit="mm"
              help="tape"
              value={s.tapeLeft}
              onChange={(v) => setSteering((st) => void (st.tapeLeft = v))}
            />
            <NumberField
              label={t("Right")}
              unit="mm"
              help="tape"
              value={s.tapeRight}
              onChange={(v) => setSteering((st) => void (st.tapeRight = v))}
            />
          </div>
        </section>
      </div>
    </ToggleSection>
  );
}
