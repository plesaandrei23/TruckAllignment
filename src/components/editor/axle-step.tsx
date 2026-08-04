"use client";

import { useState } from "react";
import type { WritableDraft } from "immer";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { Job, SpecProfile } from "@/lib/types";
import type { AxleComputed } from "@/lib/compute";
import { NumberField, AngleField } from "@/components/fields";
import { LiveReadout } from "./live-readout";
import { cn } from "@/lib/utils";

interface AxleStepProps {
  job: Job;
  index: number;
  computed: AxleComputed;
  spec?: SpecProfile;
  update: (recipe: (draft: WritableDraft<Job>) => void) => void;
}

export function AxleStep({ job, index, computed, spec, update }: AxleStepProps) {
  const axle = job.axles[index];
  const { left: cL, right: cR } = computed.wheelNo;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <WheelCard
          title="Left wheel"
          code={`C${cL}`}
          job={job}
          index={index}
          side="left"
          isSteering={axle.isSteering}
          update={update}
        />
        <WheelCard
          title="Right wheel"
          code={`C${cR}`}
          job={job}
          index={index}
          side="right"
          isSteering={axle.isSteering}
          update={update}
        />
      </div>

      <LiveReadout axle={computed} spec={spec} />

      {axle.isSteering && <SteeringAdvanced job={job} index={index} update={update} />}
    </div>
  );
}

function WheelCard({
  title,
  code,
  job,
  index,
  side,
  isSteering,
  update,
}: {
  title: string;
  code: string;
  job: Job;
  index: number;
  side: "left" | "right";
  isSteering: boolean;
  update: AxleStepProps["update"];
}) {
  const wheel = job.axles[index][side];
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{code}</span>
      </div>
      <NumberField
        label="Front scale (A)"
        unit="mm"
        value={wheel.A}
        onChange={(v) => update((d) => void (d.axles[index][side].A = v))}
      />
      <NumberField
        label="Rear scale (B)"
        unit="mm"
        value={wheel.B}
        onChange={(v) => update((d) => void (d.axles[index][side].B = v))}
      />
      <AngleField
        label="Camber"
        optional
        value={wheel.camber}
        onChange={(v) => update((d) => void (d.axles[index][side].camber = v))}
      />
      {isSteering && (
        <>
          <AngleField
            label="Caster"
            optional
            value={wheel.caster}
            onChange={(v) => update((d) => void (d.axles[index][side].caster = v))}
          />
          <AngleField
            label="KPI"
            optional
            value={wheel.kpi}
            onChange={(v) => update((d) => void (d.axles[index][side].kpi = v))}
          />
        </>
      )}
    </div>
  );
}

function SteeringAdvanced({
  job,
  index,
  update,
}: {
  job: Job;
  index: number;
  update: AxleStepProps["update"];
}) {
  const [open, setOpen] = useState(false);
  const s = job.axles[index].steering ?? {};

  // Ensure the steering object exists before writing nested fields.
  const setSteering = (recipe: (st: NonNullable<Job["axles"][number]["steering"]>) => void) =>
    update((d) => {
      const ax = d.axles[index];
      if (!ax.steering) ax.steering = {};
      recipe(ax.steering);
    });

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          Steering geometry
          <span className="text-xs font-normal text-muted-foreground">optional</span>
        </span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-5 border-t p-4">
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Toe-out on turn</h4>
            <p className="text-xs text-muted-foreground">
              Turn inner wheel to a reference angle, read the outer wheel. Sides should differ by ≤ 0.5°.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Left · reference"
                unit="°"
                value={s.turnLeft?.reference ?? 20}
                onChange={(v) => setSteering((st) => void ((st.turnLeft ??= {}).reference = v))}
              />
              <NumberField
                label="Left · outer"
                unit="°"
                value={s.turnLeft?.opposite}
                onChange={(v) => setSteering((st) => void ((st.turnLeft ??= {}).opposite = v))}
              />
              <NumberField
                label="Right · reference"
                unit="°"
                value={s.turnRight?.reference ?? 20}
                onChange={(v) => setSteering((st) => void ((st.turnRight ??= {}).reference = v))}
              />
              <NumberField
                label="Right · outer"
                unit="°"
                value={s.turnRight?.opposite}
                onChange={(v) => setSteering((st) => void ((st.turnRight ??= {}).opposite = v))}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maximum turn</h4>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Left lock"
                unit="°"
                value={s.maxTurnLeft}
                onChange={(v) => setSteering((st) => void (st.maxTurnLeft = v))}
              />
              <NumberField
                label="Right lock"
                unit="°"
                value={s.maxTurnRight}
                onChange={(v) => setSteering((st) => void (st.maxTurnRight = v))}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Steering-box centering</h4>
            <p className="text-xs text-muted-foreground">Deviation must be ≤ 1°/m (≈ 17.4 mm/m).</p>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Front scale (A)"
                unit="mm"
                value={s.steeringBoxA}
                onChange={(v) => setSteering((st) => void (st.steeringBoxA = v))}
              />
              <NumberField
                label="Rear scale (B)"
                unit="mm"
                value={s.steeringBoxB}
                onChange={(v) => setSteering((st) => void (st.steeringBoxB = v))}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Out of square (tape)
            </h4>
            <p className="text-xs text-muted-foreground">Left vs right spring-eye distance. Max difference 5 mm.</p>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Left"
                unit="mm"
                value={s.tapeLeft}
                onChange={(v) => setSteering((st) => void (st.tapeLeft = v))}
              />
              <NumberField
                label="Right"
                unit="mm"
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
