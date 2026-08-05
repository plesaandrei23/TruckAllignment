"use client";

import { useState } from "react";
import type { WritableDraft } from "immer";
import { ChevronDown, Plus, Trash2, Navigation } from "lucide-react";
import type { Job, SpecProfile } from "@/lib/types";
import { wheelNumbers } from "@/lib/types";
import { MAX_AXLES, newAxle } from "@/lib/defaults";
import { NumberField } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SetupStepProps {
  job: Job;
  specs: SpecProfile[];
  update: (recipe: (draft: WritableDraft<Job>) => void) => void;
}

export function SetupStep({ job, specs, update }: SetupStepProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const usableSpecs = specs.filter((s) => s.vehicleType === job.vehicleType);
  const max = MAX_AXLES[job.vehicleType];

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">Vehicle</h3>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Reg. no"
            value={job.header.regNo}
            onChange={(v) => update((d) => void (d.header.regNo = v))}
          />
          <TextField
            label="Type / model"
            value={job.header.type}
            onChange={(v) => update((d) => void (d.header.type = v))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Owner"
            value={job.header.owner}
            onChange={(v) => update((d) => void (d.header.owner = v))}
          />
          <div className="space-y-1.5">
            <Label className="text-sm">Date</Label>
            <Input
              type="date"
              value={job.header.date ?? ""}
              onChange={(e) => update((d) => void (d.header.date = e.target.value))}
              className="h-11"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          More details
          <ChevronDown className={cn("size-3.5 transition-transform", moreOpen && "rotate-180")} />
        </button>
        {moreOpen && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Order no"
                value={job.header.orderNo}
                onChange={(v) => update((d) => void (d.header.orderNo = v))}
              />
              <TextField
                label="Miles / km"
                value={job.header.milesKm}
                onChange={(v) => update((d) => void (d.header.milesKm = v))}
              />
            </div>
            <TextField
              label="Signed by"
              value={job.header.sign}
              onChange={(v) => update((d) => void (d.header.sign = v))}
            />
            <TextField
              label="Notes"
              value={job.header.notes}
              onChange={(v) => update((d) => void (d.header.notes = v))}
            />
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">Measurement setup</h3>
        <NumberField
          label="Distance between scales (D)"
          unit="m"
          help="D"
          hint="Distance between the front and rear frame gauges. Shared by every axle."
          value={job.D}
          onChange={(v) => update((d) => void (d.D = v ?? 0))}
        />
        <div className="space-y-1.5">
          <Label className="text-sm">Tolerance profile</Label>
          <Select
            value={job.specProfileId ?? ""}
            onValueChange={(v) => update((d) => void (d.specProfileId = (v as string) || undefined))}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Choose a spec profile">
                {(value: string) => usableSpecs.find((s) => s.id === value)?.name ?? "Choose a spec profile"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {usableSpecs.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Decides which readings pass or fail.</p>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Axles</h3>
          <span className="text-xs text-muted-foreground">
            {job.axles.length} / {max}
          </span>
        </div>
        <ul className="space-y-2">
          {job.axles.map((axle, i) => {
            const { left, right } = wheelNumbers(i);
            return (
              <li
                key={axle.id}
                className="flex items-center gap-3 rounded-md border bg-background px-3 py-2"
              >
                <span className="grid size-8 place-items-center rounded bg-muted font-mono text-xs">{i + 1}</span>
                <span className="flex-1 text-sm">
                  Axle {i + 1}
                  <span className="ml-1 font-mono text-xs text-muted-foreground">
                    C{left}/C{right}
                  </span>
                  {axle.isSteering && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      <Navigation className="size-3" /> steering
                    </span>
                  )}
                </span>
                {job.axles.length > 1 && !axle.isSteering && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    aria-label={`Remove axle ${i + 1}`}
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
          <Button
            variant="outline"
            className="w-full"
            onClick={() => update((d) => void d.axles.push(newAxle(false)))}
          >
            <Plus className="size-4" /> Add axle
          </Button>
        )}
      </section>
    </div>
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
