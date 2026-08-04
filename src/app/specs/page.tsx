"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Truck, Container, ChevronRight, Lock } from "lucide-react";
import { db, ensureBuiltInSpecs, saveSpec } from "@/lib/db";
import { newSpecProfile } from "@/lib/defaults";
import type { SpecProfile, VehicleType } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SpecsPage() {
  const router = useRouter();
  const specs = useLiveQuery(() => db.specs.toArray(), []);

  useEffect(() => {
    void ensureBuiltInSpecs();
  }, []);

  async function create(type: VehicleType) {
    const spec = newSpecProfile(type);
    spec.name = type === "truck" ? "New truck profile" : "New trailer profile";
    await saveSpec(spec);
    router.push(`/specs/${spec.id}`);
  }

  const trucks = specs?.filter((s) => s.vehicleType === "truck") ?? [];
  const trailers = specs?.filter((s) => s.vehicleType === "trailer") ?? [];

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <AppHeader title="Tolerance profiles" subtitle="Decide what passes and fails" back="/" />

      <div className="space-y-6 px-4 py-4">
        <p className="text-sm text-muted-foreground">
          A profile holds the allowed range for each measurement. Duplicate a built-in and enter your
          manufacturer’s figures.
        </p>

        <NewSpecDialog onPick={create} />

        {specs === undefined ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg border bg-card" />
            ))}
          </div>
        ) : (
          <>
            <Group title="Trucks" icon={<Truck className="size-4" />} specs={trucks} />
            <Group title="Trailers" icon={<Container className="size-4" />} specs={trailers} />
          </>
        )}
      </div>
    </div>
  );
}

function Group({ title, icon, specs }: { title: string; icon: React.ReactNode; specs: SpecProfile[] }) {
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </h2>
      {specs.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          No {title.toLowerCase()} profiles yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {specs.map((s) => (
            <li key={s.id}>
              <Link
                href={`/specs/${s.id}`}
                className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:border-primary"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-medium">
                    {s.name || "Untitled profile"}
                    {s.builtIn && (
                      <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        <Lock className="size-3" /> built-in
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Toe {s.toe.min}…{s.toe.max} mm/m · Camber {s.camber.min}…{s.camber.max}°
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NewSpecDialog({ onPick }: { onPick: (t: VehicleType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="h-11 w-full" />}>
        <Plus className="size-4" /> New profile
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New tolerance profile</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => onPick("truck")}
            className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 hover:border-primary hover:bg-primary/5"
          >
            <Truck className="size-7 text-primary" />
            <span className="font-medium">Truck</span>
          </button>
          <button
            onClick={() => onPick("trailer")}
            className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 hover:border-primary hover:bg-primary/5"
          >
            <Container className="size-7 text-primary" />
            <span className="font-medium">Trailer</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
