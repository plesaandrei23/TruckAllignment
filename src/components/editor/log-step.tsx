"use client";

import type { WritableDraft } from "immer";
import { Trash2, RotateCcw } from "lucide-react";
import type { AxleReading, Job } from "@/lib/types";
import { wheelNumbers } from "@/lib/types";
import { rollingDirection, toe as toeSum, outOfSquare, toeKind } from "@/lib/calc";
import { Button } from "@/components/ui/button";
import { fmtMmM, fmtSigned, toeLabel } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

/**
 * Every reading taken during the job, oldest first — the before/after trail of
 * the adjustment. Kept for the workshop only: the AM39 report prints just the
 * values currently in the fields, never this history.
 */
export function LogStep({
  job,
  update,
}: {
  job: Job;
  update: (recipe: (draft: WritableDraft<Job>) => void) => void;
}) {
  const { t } = useI18n();
  const total = job.axles.reduce((n, a) => n + (a.readings?.length ?? 0), 0);

  if (total === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="font-medium">{t("No readings saved yet")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Save a reading on an axle before and after the mechanic adjusts, and both show up here.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">{t("Workshop record only — none of this is printed on the report.")}</p>

      {job.axles.map((axle, index) => {
        const readings = axle.readings ?? [];
        if (readings.length === 0) return null;
        const wheels = wheelNumbers(index);
        return (
          <section key={axle.id} className="space-y-2 rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold">
              {t("Axle")} {index + 1}
              <span className="ml-1 font-mono text-xs text-muted-foreground">
                C{wheels.left}/C{wheels.right}
              </span>
            </h3>
            <ol className="space-y-2">
              {readings.map((r, i) => (
                <ReadingRow
                  key={r.id}
                  reading={r}
                  n={i + 1}
                  isLast={i === readings.length - 1}
                  onRestore={() => {
                    update((d) => {
                      const ax = d.axles[index];
                      ax.left.A = r.left.A;
                      ax.left.B = r.left.B;
                      ax.right.A = r.right.A;
                      ax.right.B = r.right.B;
                      d.D = r.D;
                    });
                    toast.success(t("Reading restored"));
                  }}
                  onDelete={() => {
                    update((d) => {
                      const ax = d.axles[index];
                      ax.readings = (ax.readings ?? []).filter((x) => x.id !== r.id);
                    });
                  }}
                />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function ReadingRow({
  reading,
  n,
  isLast,
  onRestore,
  onDelete,
}: {
  reading: AxleReading;
  n: number;
  isLast: boolean;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const { left, right, D } = reading;
  const usable = D > 0 && left.A !== undefined && left.B !== undefined && right.A !== undefined && right.B !== undefined;
  const cl = usable ? rollingDirection(left.A!, left.B!, D) : undefined;
  const cr = usable ? rollingDirection(right.A!, right.B!, D) : undefined;
  const toeValue = cl !== undefined && cr !== undefined ? toeSum(cl, cr) : undefined;
  const oos = cl !== undefined && cr !== undefined ? outOfSquare(cl, cr) : undefined;

  return (
    <li className="rounded-md border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          #{n}
          <span className="text-xs font-normal text-muted-foreground">
            {reading.stage === "initial" ? t("Before adjustment") : t("After adjustment")}
          </span>
          {isLast && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {t("On the report")}
            </span>
          )}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(reading.at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs tabular-nums text-muted-foreground">
        <span>
          A {left.A ?? "—"} · B {left.B ?? "—"}
        </span>
        <span className="text-right">
          A {right.A ?? "—"} · B {right.B ?? "—"}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm">
        <span className="text-muted-foreground">
          {t("Toe")} <span className="font-mono tabular-nums text-foreground">{fmtMmM(toeValue, 2)}</span>
          {toeValue !== undefined && <span className="ml-1 text-xs">{t(toeLabel(toeKind(toeValue)))}</span>}
        </span>
        <span className="text-muted-foreground">
          {t("Out of square")}{" "}
          <span className="font-mono tabular-nums text-foreground">{fmtSigned(oos, 2)}</span>
        </span>
      </div>

      {!isLast && (
        <div className="mt-2 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onRestore}>
            <RotateCcw className="size-3.5" /> {t("Restore")}
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onDelete}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
    </li>
  );
}
