"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { produce, type WritableDraft } from "immer";
import { Copy, Trash2 } from "lucide-react";
import type { SpecProfile } from "@/lib/types";
import { getSpec, saveSpec, deleteSpec } from "@/lib/db";
import { newSpecProfile } from "@/lib/defaults";
import { AppHeader } from "@/components/app-header";
import { NumberField } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export default function SpecEditorPage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [spec, setSpec] = useState<SpecProfile | null | undefined>(undefined);
  const dirty = useRef(false);

  useEffect(() => {
    getSpec(id).then((s) => setSpec(s ?? null));
  }, [id]);

  const update = useCallback((recipe: (d: WritableDraft<SpecProfile>) => void) => {
    dirty.current = true;
    setSpec((prev) => (prev ? produce(prev, recipe) : prev));
  }, []);

  useEffect(() => {
    if (!spec || !dirty.current) return;
    const t = setTimeout(() => void saveSpec(spec), 400);
    return () => clearTimeout(t);
  }, [spec]);

  if (spec === undefined) {
    return (
      <div className="mx-auto w-full max-w-md">
        <AppHeader title={t("Loading…")} back="/specs" />
      </div>
    );
  }
  if (!spec) {
    return (
      <div className="mx-auto w-full max-w-md">
        <AppHeader title={t("Not found")} back="/specs" />
        <div className="p-8 text-center">
          <p className="font-medium">{t("This profile no longer exists.")}</p>
          <Button variant="outline" className="mt-4" render={<Link href="/specs" />}>
            {t("Back to profiles")}
          </Button>
        </div>
      </div>
    );
  }

  const isTruck = spec.vehicleType === "truck";

  async function duplicate() {
    if (!spec) return;
    const copy = newSpecProfile(spec.vehicleType);
    Object.assign(copy, { ...spec, id: copy.id, name: `${spec.name} (copy)`, builtIn: false });
    await saveSpec(copy);
    toast.success(t("Profile duplicated"));
    router.push(`/specs/${copy.id}`);
  }

  async function remove() {
    if (!spec) return;
    await deleteSpec(spec.id);
    toast.success(t("Profile deleted"));
    router.push("/specs");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <AppHeader
        title={spec.name || t("Untitled profile")}
        subtitle={t(isTruck ? "Truck" : "Trailer")}
        back="/specs"
        right={
          <Button variant="ghost" size="icon" className="size-9" aria-label="Duplicate" onClick={duplicate}>
            <Copy className="size-5" />
          </Button>
        }
      />

      <div className="space-y-6 px-4 py-4">
        {spec.builtIn && (
          <p className="rounded-md border border-warn/40 bg-warn/10 p-3 text-xs text-foreground">
            {t(
              "A profile holds the allowed range for each measurement. Duplicate a built-in and enter your manufacturer’s figures.",
            )}
          </p>
        )}

        <div className="space-y-1.5">
          <Label className="text-sm">{t("Profile name")}</Label>
          <Input
            value={spec.name}
            onChange={(e) => update((d) => void (d.name = e.target.value))}
            placeholder="e.g. Volvo FH 6×2"
            className="h-11"
          />
        </div>

        <Section title={t("All axles")}>
          <RangeField
            label={t("Toe")}
            unit="mm/m"
            hint="+ = toe-in, − = toe-out"
            value={spec.toe}
            onChange={(r) => update((d) => void (d.toe = r))}
          />
          <RangeField
            label={t("Camber")}
            unit="°"
            value={spec.camber}
            onChange={(r) => update((d) => void (d.camber = r))}
          />
          <NumberField
            label={`${t("Out of square")} (max)`}
            unit="mm/m"
            value={spec.outOfSquareMax}
            onChange={(v) => update((d) => void (d.outOfSquareMax = v ?? 0))}
          />
          <NumberField
            label={`${t("Axle parallelism")} (max)`}
            unit="mm/m"
            value={spec.parallelismMax}
            onChange={(v) => update((d) => void (d.parallelismMax = v ?? 0))}
          />
        </Section>

        {isTruck && (
          <Section title={t("Steering axle")}>
            <RangeField
              label={t("Caster")}
              unit="°"
              value={spec.caster}
              onChange={(r) => update((d) => void (d.caster = r))}
            />
            <RangeField label={t("KPI")} unit="°" value={spec.kpi} onChange={(r) => update((d) => void (d.kpi = r))} />
            <RangeField
              label={t("Maximum turn")}
              unit="°"
              value={spec.maxTurn}
              onChange={(r) => update((d) => void (d.maxTurn = r))}
            />
            <NumberField
              label={t("Toe-out on turn Δ")}
              unit="°"
              value={spec.tootDiffMax}
              onChange={(v) => update((d) => void (d.tootDiffMax = v ?? 0))}
            />
            <NumberField
              label={`${t("Steering-box centering")} (max)`}
              unit="mm/m"
              hint="1°/m ≈ 17.4 mm/m"
              value={spec.steeringBoxMaxMmPerM}
              onChange={(v) => update((d) => void (d.steeringBoxMaxMmPerM = v ?? 0))}
            />
            <NumberField
              label={`${t("Out of square (tape)")} (max)`}
              unit="mm"
              hint="5 mm"
              value={spec.tapeDiffMax}
              onChange={(v) => update((d) => void (d.tapeDiffMax = v ?? 0))}
            />
          </Section>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t("Changes save automatically.")}</span>
          {!spec.builtIn && (
            <Dialog>
              <DialogTrigger render={<Button variant="destructive" size="sm" />}>
                <Trash2 className="size-4" /> {t("Delete")}
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>{t("Delete this profile?")}</DialogTitle>
                  <DialogDescription>{t("Jobs already using it keep their results. This can’t be undone.")}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>{t("Cancel")}</DialogClose>
                  <Button variant="destructive" onClick={remove}>
                    {t("Delete")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function RangeField({
  label,
  unit,
  hint,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  hint?: string;
  value: { min: number; max: number };
  onChange: (r: { min: number; max: number }) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label className="text-sm">{label}</Label>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Min" unit={unit} value={value.min} onChange={(v) => onChange({ ...value, min: v ?? 0 })} />
        <NumberField label="Max" unit={unit} value={value.max} onChange={(v) => onChange({ ...value, max: v ?? 0 })} />
      </div>
    </div>
  );
}
