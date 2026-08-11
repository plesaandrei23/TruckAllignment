import type { AxleComputed } from "@/lib/compute";
import type { SpecProfile } from "@/lib/types";
import { Gauge } from "@/components/gauge";
import { VerdictBadge } from "@/components/verdict";
import { fmtMmM, fmtSigned, toeLabel, sideLabel } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

/** Live toe & out-of-square readout for one axle, with the scale gauges. */
export function LiveReadout({ axle, spec }: { axle: AxleComputed; spec?: SpecProfile }) {
  const { t } = useI18n();
  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="grid grid-cols-2 gap-3 text-center">
        <Metric label={t("Left C/Dm")} value={fmtMmM(axle.cLeft)} />
        <Metric label={t("Right C/Dm")} value={fmtMmM(axle.cRight)} />
      </div>

      {/* Raw plaque arithmetic, so the technician can sanity-check the maths. */}
      <div className="flex items-center justify-between border-y py-2">
        <span className="text-sm font-medium">
          {t("Left − Right")} <span className="text-xs text-muted-foreground">({t("A − B")})</span>
        </span>
        <span className="font-mono text-sm tabular-nums">{fmtSigned(axle.sideDiff, 1)} mm</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {t("Toe")}{" "}
            {axle.toe !== undefined && <span className="text-muted-foreground">· {t(toeLabel(axle.toeKind))}</span>}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm tabular-nums">{fmtMmM(axle.toe, 2)}</span>
            <VerdictBadge status={axle.toeVerdict.status} label={verdictLabel(t, axle.toeVerdict.status)} />
          </div>
        </div>
        <Gauge
          value={axle.toe}
          min={spec?.toe.min}
          max={spec?.toe.max}
          status={axle.toeVerdict.status}
          leftLabel={t("toe-out")}
          rightLabel={t("toe-in")}
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {t("Out of square")}{" "}
            {axle.oos !== undefined && <span className="text-muted-foreground">· {t(sideLabel(axle.oosSide))}</span>}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm tabular-nums">{fmtSigned(axle.oos, 2)} mm/m</span>
            <VerdictBadge status={axle.oosVerdict.status} label={verdictLabel(t, axle.oosVerdict.status)} />
          </div>
        </div>
        <Gauge
          value={axle.oos}
          min={spec ? -spec.outOfSquareMax : undefined}
          max={spec ? spec.outOfSquareMax : undefined}
          status={axle.oosVerdict.status}
          leftLabel={t("right")}
          rightLabel={t("left")}
        />
      </div>
    </div>
  );
}

function verdictLabel(t: (s: string) => string, status: "pass" | "fail" | "unknown") {
  return status === "pass" ? t("OK") : status === "fail" ? t("Out") : "—";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card px-2 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-base tabular-nums">{value}</div>
    </div>
  );
}
