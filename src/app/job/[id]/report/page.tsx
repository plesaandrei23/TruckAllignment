"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Printer, ChevronLeft } from "lucide-react";
import type { Job, SpecProfile } from "@/lib/types";
import { getJob, getSpec } from "@/lib/db";
import { computeJob } from "@/lib/compute";
import { Am39Report, SHEET_W, SHEET_H } from "@/components/report/am39-report";
import { ScaledSheet } from "@/components/report/scaled-sheet";
import { ScaleStrip } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/lang-toggle";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const [job, setJob] = useState<Job | null | undefined>(undefined);
  const [spec, setSpec] = useState<SpecProfile | undefined>();

  useEffect(() => {
    let live = true;
    getJob(id).then(async (j) => {
      if (!live) return;
      setJob(j ?? null);
      if (j?.specProfileId) setSpec(await getSpec(j.specProfileId));
    });
    return () => {
      live = false;
    };
  }, [id]);

  const computed = useMemo(() => (job ? computeJob(job, spec) : null), [job, spec]);

  if (job === undefined) {
    return <div className="p-8 text-center text-muted-foreground">{t("Loading…")}</div>;
  }
  if (!job || !computed) {
    return (
      <div className="p-8 text-center">
        <p className="font-medium">{t("Report not found.")}</p>
        <Button variant="outline" className="mt-4" render={<Link href="/" />}>
          {t("Back to measurements")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      {/* toolbar (hidden when printing) */}
      <header className="no-print sticky top-0 z-30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 h-14">
          <Link
            href={`/job/${job.id}`}
            className="-ml-2 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("Back")}
          >
            <ChevronLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold">{t("AM39 report")}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {job.header.regNo || job.header.type || t("Untitled vehicle")} · {t(job.vehicleType === "truck" ? "Truck" : "Trailer")}
            </p>
          </div>
          <LangToggle />
          <Button onClick={() => window.print()}>
            <Printer className="size-4" /> {t("Print / PDF")}
          </Button>
        </div>
        <ScaleStrip />
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 p-3 sm:p-6">
        <ScaledSheet width={SHEET_W} height={SHEET_H}>
          <Am39Report job={job} computed={computed} lang={lang} />
        </ScaledSheet>
        <p className="no-print mt-3 text-center text-xs text-muted-foreground">
          {t(
            "Tip: in the print dialog choose “Save as PDF”. Colours must be enabled to keep the pass/fail shading.",
          )}
        </p>
      </div>
    </div>
  );
}
