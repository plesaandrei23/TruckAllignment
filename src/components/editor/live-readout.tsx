import type { AxleComputed } from "@/lib/compute";
import type { SpecProfile } from "@/lib/types";
import { Gauge } from "@/components/gauge";
import { VerdictBadge } from "@/components/verdict";
import { fmtMmM, fmtSigned, toeLabel, sideLabel } from "@/lib/format";

/** Live toe & out-of-square readout for one axle, with the scale gauges. */
export function LiveReadout({ axle, spec }: { axle: AxleComputed; spec?: SpecProfile }) {
  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="grid grid-cols-2 gap-3 text-center">
        <Metric label="Left C/Dm" value={fmtMmM(axle.cLeft)} />
        <Metric label="Right C/Dm" value={fmtMmM(axle.cRight)} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Toe {axle.toe !== undefined && <span className="text-muted-foreground">· {toeLabel(axle.toeKind)}</span>}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm tabular-nums">{fmtMmM(axle.toe)}</span>
            <VerdictBadge status={axle.toeVerdict.status} />
          </div>
        </div>
        <Gauge
          value={axle.toe}
          min={spec?.toe.min}
          max={spec?.toe.max}
          status={axle.toeVerdict.status}
          leftLabel="toe-out"
          rightLabel="toe-in"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Out of square{" "}
            {axle.oos !== undefined && <span className="text-muted-foreground">· {sideLabel(axle.oosSide)}</span>}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm tabular-nums">{fmtSigned(axle.oos)} mm/m</span>
            <VerdictBadge status={axle.oosVerdict.status} />
          </div>
        </div>
        <Gauge
          value={axle.oos}
          min={spec ? -spec.outOfSquareMax : undefined}
          max={spec ? spec.outOfSquareMax : undefined}
          status={axle.oosVerdict.status}
          leftLabel="right"
          rightLabel="left"
        />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card px-2 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-base tabular-nums">{value}</div>
    </div>
  );
}
