"use client";

import type { WritableDraft } from "immer";
import { Plus, Trash2 } from "lucide-react";
import { SteeringWheel } from "@/components/icons";
import type { Job, SpecProfile } from "@/lib/types";
import { wheelNumbers } from "@/lib/types";
import { MAX_AXLES, newAxle } from "@/lib/defaults";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface SetupStepProps {
  job: Job;
  specs: SpecProfile[];
  update: (recipe: (draft: WritableDraft<Job>) => void) => void;
}

/**
 * What has to be decided before the laser goes on: which vehicle, which
 * tolerances, and which axles are being aligned. Everything else — the scale
 * distance, and the rest of the sheet's header — is asked for later, at the
 * point in the job where it is actually known.
 */
export function SetupStep({ job, specs, update }: SetupStepProps) {
  const { t } = useI18n();
  const usableSpecs = specs.filter((s) => s.vehicleType === job.vehicleType);
  const max = MAX_AXLES[job.vehicleType];
  const isTruck = job.vehicleType === "truck";

  const setSteering = (i: number, on: boolean) =>
    update((d) => {
      const ax = d.axles[i];
      ax.isSteering = on;
      if (on && !ax.steering) ax.steering = {};
      if (!on) ax.steering = undefined;
    });

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">{t("Vehicle")}</h3>
        <div className="space-y-1.5">
          <Label className="text-sm">{t("Reg. no")}</Label>
          <Input
            value={job.header.regNo ?? ""}
            onChange={(e) => update((d) => void (d.header.regNo = e.target.value.toUpperCase()))}
            placeholder="B 123 ABC"
            className="h-12 text-center font-mono text-lg tracking-widest"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">{t("Profile")}</Label>
          <Select
            value={job.specProfileId ?? ""}
            onValueChange={(v) => update((d) => void (d.specProfileId = (v as string) || undefined))}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder={t("Choose a spec profile")}>
                {(value: string) => {
                  const found = usableSpecs.find((s) => s.id === value);
                  return found ? t(found.name) : t("Choose a spec profile");
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {usableSpecs.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {t(s.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("Decides which readings pass or fail.")}</p>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("Axles")}</h3>
          <span className="text-xs text-muted-foreground">
            {job.axles.length} / {max}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{t("Only the axles you are aligning. The rest stay blank on the report.")}</p>
        <ul className="space-y-2">
          {job.axles.map((axle, i) => {
            const { left, right } = wheelNumbers(i);
            return (
              <li key={axle.id} className="flex items-center gap-3 rounded-md border bg-background px-3 py-2">
                <span className="grid size-8 place-items-center rounded bg-muted font-mono text-xs">{i + 1}</span>
                <span className="flex-1 text-sm">
                  {t("Axle")} {i + 1}
                  <span className="ml-1 font-mono text-xs text-muted-foreground">
                    C{left}/C{right}
                  </span>
                </span>
                {isTruck && (
                  <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
                    <SteeringWheel className={cn("size-4", axle.isSteering && "text-primary")} />
                    <span className="hidden sm:inline">{t("Steering")}</span>
                    <Switch checked={axle.isSteering} onCheckedChange={(v) => setSteering(i, v)} />
                  </label>
                )}
                {job.axles.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    aria-label={`${t("Remove axle")} ${i + 1}`}
                    onClick={() => update((d) => void d.axles.splice(i, 1))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {job.axles.length < max && (
          <Button variant="outline" className="w-full" onClick={() => update((d) => void d.axles.push(newAxle(false)))}>
            <Plus className="size-4" /> {t("Add axle")}
          </Button>
        )}
      </section>
    </div>
  );
}
