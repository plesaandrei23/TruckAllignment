import type { AxleComputed } from "@/lib/compute";
import type { SpecProfile } from "@/lib/types";
import { Gauge } from "@/components/gauge";
import { VerdictBadge } from "@/components/verdict";
import { fmtMmM, fmtSigned, toeLabel, sideLabel } from "@/lib/format";
import { round } from "@/lib/calc";
import { useI18n } from "@/lib/i18n";

/** Live toe & out-of-square readout for one axle, with the scale gauges. */
export function LiveReadout({ axle, spec, d }: { axle: AxleComputed; spec?: SpecProfile; d: number }) {
  const { t } = useI18n();
  // The per-wheel C/Dm values are already shown beside each input column, so
  // this block only carries the arithmetic and the two verdicts.
  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      {/*
        The arithmetic spelled out, because it is what the technician would do
        on paper: add the two sides' A−B, divide by D, and the SIGN of the
        result is what separates toe-in from toe-out.
      */}
      <div className="space-y-1 rounded-md border bg-background px-3 py-2">
        <Line label={`${t("Left")} (A − B)`} value={`${fmtSigned(axle.left.diff, 1)} mm`} />
        <Line label={`${t("Right")} (A − B)`} value={`${fmtSigned(axle.right.diff, 1)} mm`} />
        <Line label={t("Sum")} value={`${fmtSigned(axle.sideSum, 1)} mm`} strong />
        <Line label={`÷ D = ${d > 0 ? `${round(d, 2)} m` : "—"}`} value={fmtMmM(axle.toe, 2)} strong />
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
        {spec && (
          <p className="text-[11px] text-muted-foreground">
            {t("Allowed")} {round(spec.toe.min, 2)} … {round(spec.toe.max, 2)} mm/m
            {spec.toe.min < 0 && <> · {t("this profile permits some toe-out")}</>}
          </p>
        )}
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

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between text-xs ${strong ? "border-t pt-1 font-medium" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

function verdictLabel(t: (s: string) => string, status: "pass" | "fail" | "unknown") {
  return status === "pass" ? t("OK") : status === "fail" ? t("Out") : "—";
}

