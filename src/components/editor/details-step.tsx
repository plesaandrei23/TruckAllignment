"use client";

import type { WritableDraft } from "immer";
import type { Job } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

/**
 * The rest of the AM39 header, asked for once the measuring is done. Field
 * order follows the printed sheet so it reads the same as the paperwork:
 * Order N°, Reg. N°, Date, Miles/Km on the left, Type, Owner, Sign, Notes
 * on the right.
 */
export function DetailsStep({
  job,
  update,
}: {
  job: Job;
  update: (recipe: (draft: WritableDraft<Job>) => void) => void;
}) {
  const { t } = useI18n();

  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <div>
        <h3 className="text-sm font-semibold">{t("Report details")}</h3>
        <p className="text-xs text-muted-foreground">{t("These fill in the header of the AM39 sheet.")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={t("Order no")}
          value={job.header.orderNo}
          onChange={(v) => update((d) => void (d.header.orderNo = v))}
        />
        <TextField
          label={t("Reg. no")}
          value={job.header.regNo}
          onChange={(v) => update((d) => void (d.header.regNo = v.toUpperCase()))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">{t("Date")}</Label>
          <Input
            type="date"
            value={job.header.date ?? ""}
            onChange={(e) => update((d) => void (d.header.date = e.target.value))}
            className="h-11"
          />
        </div>
        <TextField
          label={t("Miles / km")}
          value={job.header.milesKm}
          onChange={(v) => update((d) => void (d.header.milesKm = v))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={t("Type / model")}
          value={job.header.type}
          onChange={(v) => update((d) => void (d.header.type = v))}
        />
        <TextField
          label={t("Owner")}
          value={job.header.owner}
          onChange={(v) => update((d) => void (d.header.owner = v))}
        />
      </div>

      <TextField
        label={t("Signed by")}
        value={job.header.sign}
        onChange={(v) => update((d) => void (d.header.sign = v))}
      />
      <TextField
        label={t("Notes")}
        value={job.header.notes}
        onChange={(v) => update((d) => void (d.header.notes = v))}
      />
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-11" />
    </div>
  );
}
