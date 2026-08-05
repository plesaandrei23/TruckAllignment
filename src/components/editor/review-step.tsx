"use client";

import type { Job, SpecProfile } from "@/lib/types";
import type { JobComputed } from "@/lib/compute";
import { VerdictBadge, VerdictDot } from "@/components/verdict";
import { fmtMmM, fmtSigned, fmtDeg, toeLabel, sideLabel } from "@/lib/format";
import { verdictClasses } from "@/lib/verdict";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function ReviewStep({
  computed,
  spec,
}: {
  job: Job;
  computed: JobComputed;
  spec?: SpecProfile;
}) {
  const { t } = useI18n();
  const c = verdictClasses[computed.status];
  return (
    <div className="space-y-5">
      {/* overall banner */}
      <div className={cn("flex items-center gap-3 rounded-lg border p-4", c.bg, c.border)}>
        <VerdictDot status={computed.status} className="size-4" />
        <div className="flex-1">
          <p className={cn("font-semibold", c.text)}>
            {computed.status === "pass"
              ? t("Within tolerance")
              : computed.status === "fail"
                ? t("Out of tolerance")
                : t("Not enough data yet")}
          </p>
          <p className="text-xs text-muted-foreground">
            {spec ? `${t("Checked against")} “${spec.name}”` : t("No tolerance profile selected")}
          </p>
        </div>
      </div>

      {computed.axles.map((axle) => (
        <div key={axle.id} className="space-y-2 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t("Axle")} {axle.index + 1}
              <span className="ml-1 font-mono text-xs text-muted-foreground">
                C{axle.wheelNo.left}/C{axle.wheelNo.right}
              </span>
              {axle.isSteering && <span className="ml-2 text-xs font-normal text-primary">{t("steering")}</span>}
            </h3>
            <VerdictBadge status={axle.status} label={vlabel(t, axle.status)} />
          </div>

          <Row
            label={t("Toe")}
            value={`${fmtMmM(axle.toe, 2)}${axle.toe !== undefined ? ` · ${t(toeLabel(axle.toeKind))}` : ""}`}
            status={axle.toeVerdict.status}
          />
          <Row
            label={t("Out of square")}
            value={`${fmtSigned(axle.oos, 2)} mm/m${axle.oos !== undefined ? ` · ${t(sideLabel(axle.oosSide))}` : ""}`}
            status={axle.oosVerdict.status}
          />
          <Row label={t("Camber L")} value={fmtDeg(axle.left.camberDeg)} status={axle.left.camberVerdict.status} />
          <Row label={t("Camber R")} value={fmtDeg(axle.right.camberDeg)} status={axle.right.camberVerdict.status} />

          {axle.isSteering && axle.steering && (
            <>
              <Row label={t("Caster L")} value={fmtDeg(axle.left.casterDeg)} status={axle.left.casterVerdict.status} />
              <Row label={t("Caster R")} value={fmtDeg(axle.right.casterDeg)} status={axle.right.casterVerdict.status} />
              <Row label={t("KPI L")} value={fmtDeg(axle.left.kpiDeg)} status={axle.left.kpiVerdict.status} />
              <Row label={t("KPI R")} value={fmtDeg(axle.right.kpiDeg)} status={axle.right.kpiVerdict.status} />
              <Row
                label={t("Toe-out on turn Δ")}
                value={axle.steering.tootDiff !== undefined ? `${axle.steering.tootDiff.toFixed(2)}°` : "—"}
                status={axle.steering.tootVerdict.status}
              />
              <Row
                label={t("Steering box")}
                value={fmtMmM(axle.steering.steeringBoxDev, 2)}
                status={axle.steering.steeringBoxVerdict.status}
              />
              <Row
                label={t("Tape out of square")}
                value={axle.steering.tapeDiff !== undefined ? `${axle.steering.tapeDiff} mm` : "—"}
                status={axle.steering.tapeVerdict.status}
              />
            </>
          )}
        </div>
      ))}

      {computed.parallelism.length > 0 && (
        <div className="space-y-2 rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold">{t("Axle parallelism")}</h3>
          <p className="text-xs text-muted-foreground">{t("Each axle compared with axle 1 (0 = parallel).")}</p>
          {computed.parallelism.map((p) => (
            <Row
              key={p.to}
              label={`${t("Axle")} 1 ↔ ${t("Axle")} ${p.to + 1}`}
              value={p.value !== undefined ? `${fmtSigned(p.value, 2)} mm/m` : "—"}
              status={p.verdict.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function vlabel(t: (s: string) => string, status: "pass" | "fail" | "unknown") {
  return status === "pass" ? t("OK") : status === "fail" ? t("Out") : "—";
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
