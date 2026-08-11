"use client";

import { useState, type ReactNode } from "react";
import type { WritableDraft } from "immer";
import { Gauge } from "lucide-react";
import type { Job, SpecProfile } from "@/lib/types";
import type { AxleComputed } from "@/lib/compute";
import { NumberField, AngleField } from "@/components/fields";
import { LiveReadout } from "./live-readout";
import { Switch } from "@/components/ui/switch";
import { SteeringWheel } from "@/components/icons";
import { fmtSigned } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

interface AxleStepProps {
  job: Job;
  index: number;
  computed: AxleComputed;
  spec?: SpecProfile;
  update: (recipe: (draft: WritableDraft<Job>) => void) => void;
}

export function AxleStep({ job, index, computed, spec, update }: AxleStepProps) {
  const { t } = useI18n();
  const axle = job.axles[index];
  const { left: cL, right: cR } = computed.wheelNo;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <WheelCard
          title={t("Left wheel")}
          code={`C${cL}`}
          job={job}
          index={index}
          side="left"
          diff={computed.left.diff}
          update={update}
        />
        <WheelCard
          title={t("Right wheel")}
          code={`C${cR}`}
          job={job}
          index={index}
          side="right"
          diff={computed.right.diff}
          update={update}
        />
      </div>

      {!(job.D > 0) && (
        <p className="rounded-md border border-warn/40 bg-warn/10 p-3 text-xs">
          {t("Set the distance D on the Setup step to see computed results.")}
        </p>
      )}

      <LiveReadout axle={computed} spec={spec} />

      <CamberSection job={job} index={index} update={update} />

      {axle.isSteering && <SteeringAdvanced job={job} index={index} update={update} />}
    </div>
  );
}

/** Minimal wheel card — the two scale readings the device prints, plus A − B. */
function WheelCard({
  title,
  code,
  job,
  index,
  side,
  diff,
  update,
}: {
  title: string;
  code: string;
  job: Job;
  index: number;
  side: "left" | "right";
  diff?: number;
  update: AxleStepProps["update"];
}) {
  const { t } = useI18n();
  const wheel = job.axles[index][side];
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{code}</span>
      </div>
      <NumberField
        label={t("Front scale (A)")}
        unit="mm"
        help="A"
        value={wheel.A}
        onChange={(v) => update((d) => void (d.axles[index][side].A = v))}
      />
      <NumberField
        label={t("Rear scale (B)")}
        unit="mm"
        help="B"
        value={wheel.B}
        onChange={(v) => update((d) => void (d.axles[index][side].B = v))}
      />
      <div className="flex items-center justify-between border-t pt-2.5">
        <span className="text-xs text-muted-foreground">{t("A − B")}</span>
        <span className="font-mono text-sm tabular-nums">{fmtSigned(diff, 1)} mm</span>
      </div>
    </div>
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
  defaultOn = false,
  onToggle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
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
    s.steeringBoxA !== undefined ||
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
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Steering-box centering")}</h4>
            <p className="text-xs text-muted-foreground">{t("Deviation must be ≤ 1°/m (≈ 17.4 mm/m).")}</p>
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
