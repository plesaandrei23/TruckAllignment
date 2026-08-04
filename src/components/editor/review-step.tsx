import Link from "next/link";
import { FileText } from "lucide-react";
import type { Job, SpecProfile } from "@/lib/types";
import type { JobComputed } from "@/lib/compute";
import { VerdictBadge, VerdictDot } from "@/components/verdict";
import { Button } from "@/components/ui/button";
import { fmtMmM, fmtSigned, fmtDeg, toeLabel, sideLabel } from "@/lib/format";
import { verdictClasses } from "@/lib/verdict";
import { cn } from "@/lib/utils";

export function ReviewStep({
  job,
  computed,
  spec,
}: {
  job: Job;
  computed: JobComputed;
  spec?: SpecProfile;
}) {
  const c = verdictClasses[computed.status];
  return (
    <div className="space-y-5">
      {/* overall banner */}
      <div className={cn("flex items-center gap-3 rounded-lg border p-4", c.bg, c.border)}>
        <VerdictDot status={computed.status} className="size-4" />
        <div className="flex-1">
          <p className={cn("font-semibold", c.text)}>
            {computed.status === "pass"
              ? "Within tolerance"
              : computed.status === "fail"
                ? "Out of tolerance"
                : "Not enough data yet"}
          </p>
          <p className="text-xs text-muted-foreground">
            {spec ? `Checked against “${spec.name}”` : "No tolerance profile selected"}
          </p>
        </div>
      </div>

      {computed.axles.map((axle) => (
        <div key={axle.id} className="space-y-2 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              Axle {axle.index + 1}
              <span className="ml-1 font-mono text-xs text-muted-foreground">
                C{axle.wheelNo.left}/C{axle.wheelNo.right}
              </span>
              {axle.isSteering && <span className="ml-2 text-xs font-normal text-primary">steering</span>}
            </h3>
            <VerdictBadge status={axle.status} />
          </div>

          <Row
            label="Toe"
            value={`${fmtMmM(axle.toe)}${axle.toe !== undefined ? ` · ${toeLabel(axle.toeKind)}` : ""}`}
            status={axle.toeVerdict.status}
          />
          <Row
            label="Out of square"
            value={`${fmtSigned(axle.oos)} mm/m${axle.oos !== undefined ? ` · ${sideLabel(axle.oosSide)}` : ""}`}
            status={axle.oosVerdict.status}
          />
          <Row label="Camber L" value={fmtDeg(axle.left.camberDeg)} status={axle.left.camberVerdict.status} />
          <Row label="Camber R" value={fmtDeg(axle.right.camberDeg)} status={axle.right.camberVerdict.status} />

          {axle.isSteering && axle.steering && (
            <>
              <Row label="Caster L" value={fmtDeg(axle.left.casterDeg)} status={axle.left.casterVerdict.status} />
              <Row label="Caster R" value={fmtDeg(axle.right.casterDeg)} status={axle.right.casterVerdict.status} />
              <Row label="KPI L" value={fmtDeg(axle.left.kpiDeg)} status={axle.left.kpiVerdict.status} />
              <Row label="KPI R" value={fmtDeg(axle.right.kpiDeg)} status={axle.right.kpiVerdict.status} />
              <Row
                label="Toe-out on turn Δ"
                value={axle.steering.tootDiff !== undefined ? `${axle.steering.tootDiff.toFixed(2)}°` : "—"}
                status={axle.steering.tootVerdict.status}
              />
              <Row
                label="Steering box"
                value={fmtMmM(axle.steering.steeringBoxDev)}
                status={axle.steering.steeringBoxVerdict.status}
              />
              <Row
                label="Tape out of square"
                value={axle.steering.tapeDiff !== undefined ? `${axle.steering.tapeDiff} mm` : "—"}
                status={axle.steering.tapeVerdict.status}
              />
            </>
          )}
        </div>
      ))}

      {computed.parallelism.length > 0 && (
        <div className="space-y-2 rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold">Axle parallelism</h3>
          <p className="text-xs text-muted-foreground">Each axle compared with axle 1 (0 = parallel).</p>
          {computed.parallelism.map((p) => (
            <Row
              key={p.to}
              label={`Axle 1 ↔ Axle ${p.to + 1}`}
              value={p.value !== undefined ? `${fmtSigned(p.value)} mm/m` : "—"}
              status={p.verdict.status}
            />
          ))}
        </div>
      )}

      <Button size="lg" className="h-12 w-full text-base" render={<Link href={`/job/${job.id}/report`} />}>
        <FileText className="size-5" /> Open AM39 report
      </Button>
    </div>
  );
}

function Row({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: import("@/lib/verdict").VerdictStatus;
}) {
  return (
    <div className="flex items-center justify-between border-t py-1.5 text-sm first:border-t-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        <VerdictDot status={status} />
        {label}
      </span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}
