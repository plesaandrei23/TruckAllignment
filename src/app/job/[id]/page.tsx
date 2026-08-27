"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { useJobEditor } from "@/lib/use-job";
import { computeJob } from "@/lib/compute";
import { defaultSpecId } from "@/lib/defaults";
import { AppHeader } from "@/components/app-header";
import { SetupStep } from "@/components/editor/setup-step";
import { RunoutStep, MeasureStep, AnglesStep, SteeringStep } from "@/components/editor/axle-step";
import { LogStep } from "@/components/editor/log-step";
import { DetailsStep } from "@/components/editor/details-step";
import { ReviewStep } from "@/components/editor/review-step";
import { VerdictDot } from "@/components/verdict";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

/**
 * Every screen in the job, as its own page. An axle contributes several — the
 * work is done in stages and nothing should have to be scrolled past while a
 * wheel is on the gauge.
 */
type StepKind =
  | { kind: "setup" }
  | { kind: "runout"; index: number }
  | { kind: "measure"; index: number }
  | { kind: "angles"; index: number }
  | { kind: "steering"; index: number }
  | { kind: "log" }
  | { kind: "finish" };

/** Which chip in the top strip a step belongs to. */
function groupOf(s: StepKind): string {
  switch (s.kind) {
    case "setup":
    case "log":
    case "finish":
      return s.kind;
    default:
      return `axle-${s.index}`;
  }
}

export default function JobEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useI18n();
  const { job, loading, update } = useJobEditor(id);
  const specs = useLiveQuery(() => db.specs.toArray(), []) ?? [];
  const [step, setStep] = useState(0);

  // Default a tolerance profile if none chosen yet.
  useEffect(() => {
    if (job && !job.specProfileId) {
      update((d) => void (d.specProfileId = defaultSpecId(d.vehicleType)));
    }
  }, [job, update]);

  const spec = specs.find((s) => s.id === job?.specProfileId);
  const computed = useMemo(() => (job ? computeJob(job, spec) : null), [job, spec]);

  const steps: StepKind[] = useMemo(() => {
    if (!job) return [];
    const perAxle = job.axles.flatMap((axle, i) => {
      const pages: StepKind[] = [
        { kind: "runout", index: i },
        { kind: "measure", index: i },
        { kind: "angles", index: i },
      ];
      if (axle.isSteering) pages.push({ kind: "steering", index: i });
      return pages;
    });
    return [{ kind: "setup" }, ...perAxle, { kind: "log" }, { kind: "finish" }];
  }, [job]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-md flex-1">
        <AppHeader title={t("Loading…")} back="/" />
        <div className="space-y-3 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (!job || !computed) {
    return (
      <div className="mx-auto w-full max-w-md flex-1">
        <AppHeader title={t("Not found")} back="/" />
        <div className="p-8 text-center">
          <p className="font-medium">{t("This measurement no longer exists.")}</p>
          <Button variant="outline" className="mt-4" render={<Link href="/" />}>
            {t("Back to measurements")}
          </Button>
        </div>
      </div>
    );
  }

  const clamped = Math.min(step, steps.length - 1);
  const current = steps[clamped];
  const isFirst = clamped === 0;
  const isLast = clamped === steps.length - 1;

  const subLabel = (s: StepKind) =>
    s.kind === "runout"
      ? t("Run-out")
      : s.kind === "measure"
        ? t("Measure")
        : s.kind === "angles"
          ? t("Angles")
          : t("Steering");

  const stepLabel =
    current.kind === "setup"
      ? t("Setup")
      : current.kind === "log"
        ? t("Readings")
        : current.kind === "finish"
          ? t("Finish")
          : `${t("Axle")} ${current.index + 1} · ${subLabel(current)}`;

  // The sub-steps of the axle currently being worked on, for the second row.
  const currentGroup = groupOf(current);
  const subSteps = steps
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => groupOf(s) === currentGroup && "index" in s);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-24">
      <AppHeader
        title={job.header.regNo || job.header.type || t("New measurement")}
        subtitle={stepLabel}
        back="/"
        right={
          <Link
            href={`/job/${job.id}/report`}
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("Report")}
          >
            <FileText className="size-5" />
          </Link>
        }
      />

      <StepDots steps={steps} current={clamped} computed={computed} onSelect={setStep} />

      {subSteps.length > 1 && (
        <div className="flex items-center gap-1 border-b bg-background px-4 py-2">
          {subSteps.map(({ s, i }, n) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                i === clamped ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              <span className="mr-1 text-[10px] opacity-60">{n + 1}</span>
              {subLabel(s)}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 px-4 py-4">
        {current.kind === "setup" && <SetupStep job={job} specs={specs} update={update} />}
        {current.kind === "runout" && <RunoutStep job={job} index={current.index} update={update} />}
        {current.kind === "measure" && (
          <MeasureStep
            job={job}
            index={current.index}
            computed={computed.axles[current.index]}
            spec={spec}
            update={update}
          />
        )}
        {current.kind === "angles" && <AnglesStep job={job} index={current.index} update={update} />}
        {current.kind === "steering" && (
          <SteeringStep
            job={job}
            index={current.index}
            computed={computed.axles[current.index]}
            update={update}
          />
        )}
        {current.kind === "log" && <LogStep job={job} update={update} />}
        {current.kind === "finish" && (
          <div className="space-y-5">
            <DetailsStep job={job} update={update} />
            <ReviewStep job={job} computed={computed} spec={spec} />
          </div>
        )}
      </div>

      {/* sticky bottom navigation */}
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur">
        <div
          className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <Button
            variant="outline"
            className="flex-1"
            disabled={isFirst}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft className="size-4" /> {t("Back")}
          </Button>
          {isLast ? (
            <Button className="flex-1" render={<Link href={`/job/${job.id}/report`} />}>
              <FileText className="size-4" /> {t("Report")}
            </Button>
          ) : (
            <Button className="flex-1" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
              {t("Next")} <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDots({
  steps,
  current,
  computed,
  onSelect,
}: {
  steps: StepKind[];
  current: number;
  computed: import("@/lib/compute").JobComputed;
  onSelect: (i: number) => void;
}) {
  const { t } = useI18n();
  const activeGroup = groupOf(steps[current]);

  // One chip per axle, however many pages that axle has.
  const groups: { key: string; label: string; first: number; status?: import("@/lib/verdict").VerdictStatus }[] = [];
  steps.forEach((s, i) => {
    const key = groupOf(s);
    if (groups.some((g) => g.key === key)) return;
    groups.push({
      key,
      label:
        s.kind === "setup"
          ? t("Setup")
          : s.kind === "log"
            ? t("Readings")
            : s.kind === "finish"
              ? t("Finish")
              : `A${s.index + 1}`,
      first: i,
      status: "index" in s ? computed.axles[s.index]?.status : undefined,
    });
  });

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b bg-card px-4 py-2">
      {groups.map((g) => {
        const active = g.key === activeGroup;
        return (
          <button
            key={g.key}
            onClick={() => onSelect(g.first)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {g.status && !active && <VerdictDot status={g.status} />}
            {g.label}
          </button>
        );
      })}
    </div>
  );
}
