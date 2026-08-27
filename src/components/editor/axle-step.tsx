"use client";

import { useState } from "react";
import type { WritableDraft } from "immer";
import { Crosshair, Plus, Pencil } from "lucide-react";
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

/**
 * The axle is measured over several short screens, in the order the work is
 * done on the floor: compensate the adapters, measure while the track rod is
 * adjusted, record the angles, then centre the steering. Each is its own page
 * so nothing has to be scrolled past mid-measurement.
 */

interface StepProps {
  job: Job;
  index: number;
  update: (recipe: (draft: WritableDraft<Job>) => void) => void;
}

type SetSteering = (recipe: (st: NonNullable<Job["axles"][number]["steering"]>) => void) => void;

function steeringSetter(index: number, update: StepProps["update"]): SetSteering {
  return (recipe) =>
    update((d) => {
      const ax = d.axles[index];
      if (!ax.steering) ax.steering = {};
      recipe(ax.steering);
    });
}

function Intro({ title, body }: { title: string; body: string }) {
  return (
    <header className="space-y-1">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{body}</p>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Run-out compensation
// ---------------------------------------------------------------------------

/**
 * Manual p.13: aim the laser at the scale, read it, spin the wheel half a turn
 * and read it again, then trim the adapter until the dot sits midway between
 * the two. Purely a setup aid — none of it reaches the report.
 */
export function RunoutStep({ job, index, update }: StepProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <Intro
        title={t("Run-out compensation")}
        body={t("Read the scale, spin the wheel half a turn and read again. Trim the adapter until the dot sits on the target.")}
      />
      <div className="grid grid-cols-2 gap-3">
        <RunoutWheel job={job} index={index} side="left" label={t("Left")} update={update} />
        <RunoutWheel job={job} index={index} side="right" label={t("Right")} update={update} />
      </div>
    </div>
  );
}

function RunoutWheel({
  job,
  index,
  side,
  label,
  update,
}: StepProps & { side: "left" | "right"; label: string }) {
  const { t } = useI18n();
  const wheel = job.axles[index][side];
  const ready = wheel.runoutStart !== undefined && wheel.runoutHalf !== undefined;
  const target = ready ? runoutTarget(wheel.runoutStart!, wheel.runoutHalf!) : undefined;
  const spread = ready ? runoutSpread(wheel.runoutStart!, wheel.runoutHalf!) : undefined;

  return (
    <div className="space-y-2.5 rounded-lg border bg-card p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
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
        <div className="font-mono text-xl font-semibold tabular-nums">
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
// Measure
// ---------------------------------------------------------------------------

export function MeasureStep({
  job,
  index,
  computed,
  spec,
  update,
}: StepProps & { computed: AxleComputed; spec?: SpecProfile }) {
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
    <div className="space-y-4">
      <DistanceRow job={job} update={update} />

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

      <LiveReadout axle={computed} spec={spec} d={job.D} />

      <Button className="h-11 w-full" variant="outline" disabled={!complete} onClick={saveReading}>
        <Plus className="size-4" />
        {readings.length === 0 ? t("Save first reading") : t("Save reading after adjustment")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {readings.length > 0
          ? `${readings.length} ${t("saved")} · ${t("The values above are what the report prints.")}`
          : t("The values above are what the report prints.")}
      </p>
    </div>
  );
}

/** D collapses to a single line once set, to keep the measuring page short. */
function DistanceRow({ job, update }: { job: Job; update: StepProps["update"] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(!(job.D > 0));

  if (!open && job.D > 0) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-sm hover:border-primary"
      >
        <span className="text-muted-foreground">{t("Distance between scales (D)")}</span>
        <span className="flex items-center gap-2 font-mono tabular-nums">
          {round(job.D, 2)} m
          <Pencil className="size-3.5 text-muted-foreground" />
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3">
      <NumberField
        label={t("Distance between scales (D)")}
        unit="m"
        help="D"
        placeholder="6.5"
        value={job.D > 0 ? job.D : undefined}
        onChange={(v) => update((d) => void (d.D = v ?? 0))}
      />
      {job.D > 0 ? (
        <Button variant="ghost" size="sm" className="w-full" onClick={() => setOpen(false)}>
          {t("Done")}
        </Button>
      ) : (
        <p className="rounded-md border border-warn/40 bg-warn/10 px-2.5 py-2 text-xs">
          {t("Nothing is computed until D is set. Decimals are fine — 6.5 or 6,5.")}
        </p>
      )}
    </div>
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
}: StepProps & {
  side: "left" | "right";
  scaleNo: number;
  wheelNo: number;
  diff?: number;
  rolling?: number;
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
// Angles
// ---------------------------------------------------------------------------

/** Camber for every axle; caster and KPI as well on a steered one. */
export function AnglesStep({ job, index, update }: StepProps) {
  const { t } = useI18n();
  const axle = job.axles[index];
  const hasCamber = axle.left.camber !== undefined || axle.right.camber !== undefined;
  const [camberOn, setCamberOn] = useState(hasCamber);

  return (
    <div className="space-y-4">
      <Intro title={t("Angles")} body={t("Optional. Leave a section off and it is left blank on the report.")} />

      <div className="rounded-lg border bg-card">
        <label className="flex cursor-pointer items-center justify-between p-4">
          <span className="text-sm font-semibold">{t("Camber")}</span>
          <Switch
            checked={camberOn}
            onCheckedChange={(v) => {
              setCamberOn(v);
              if (!v) {
                // Turning it off clears the values so they can't affect the verdict.
                update((d) => {
                  d.axles[index].left.camber = undefined;
                  d.axles[index].right.camber = undefined;
                });
              }
            }}
          />
        </label>
        {camberOn && (
          <div className="grid gap-3 border-t p-4">
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
        )}
      </div>

      {axle.isSteering && (
        <section className="space-y-3 rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold">
            {t("Caster")} · {t("KPI")}
          </h3>
          <div className="grid gap-3">
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
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Centre the steering
// ---------------------------------------------------------------------------

/**
 * Manual pp.37-39. With the steering box on its centre mark, the same wheel is
 * read against the front and rear scales; they should agree within 1°/m.
 */
export function SteeringStep({
  job,
  index,
  computed,
  update,
}: StepProps & { computed: AxleComputed }) {
  const { t } = useI18n();
  const s = job.axles[index].steering ?? {};
  const dev = computed.steering?.steeringBoxDev;
  const status = computed.steering?.steeringBoxVerdict.status;
  const setSteering = steeringSetter(index, update);

  return (
    <div className="space-y-4">
      <Intro
        title={t("Centre the steering")}
        body={t("With the steering box on its centre mark, read the same wheel on both scales. Max 1°/m (≈ 17.4 mm/m).")}
      />

      <section className="space-y-3 rounded-lg border bg-card p-4">
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

      <SteeringExtras job={job} index={index} update={update} />
    </div>
  );
}

/** Toe-out on turn, maximum lock and the tape check — all optional. */
function SteeringExtras({ job, index, update }: StepProps) {
  const { t } = useI18n();
  const axle = job.axles[index];
  const s = axle.steering ?? {};
  const setSteering = steeringSetter(index, update);
  const hasData =
    s.turnLeft?.opposite !== undefined ||
    s.turnRight?.opposite !== undefined ||
    s.maxTurnLeft !== undefined ||
    s.maxTurnRight !== undefined ||
    s.tapeLeft !== undefined;
  const [on, setOn] = useState(hasData);

  return (
    <div className="rounded-lg border bg-card">
      <label className="flex cursor-pointer items-center justify-between p-4">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <SteeringWheel className="size-4 text-muted-foreground" />
          {t("Steering geometry")}
          <span className="text-xs font-normal text-muted-foreground">{t("optional")}</span>
        </span>
        <Switch checked={on} onCheckedChange={setOn} />
      </label>
      {on && (
        <div className="space-y-5 border-t p-4">
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
      )}
    </div>
  );
}

export { Crosshair as RunoutIcon };
