"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Plus,
  Search,
  Truck,
  Container,
  SlidersHorizontal,
  MoreVertical,
  Trash2,
  FileText,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { db, ensureBuiltInSpecs, deleteJob, saveJob } from "@/lib/db";
import { newJob, newTruck8x4 } from "@/lib/defaults";
import { makeDemoJob } from "@/lib/demo";
import type { Job, VehicleType } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/lang-toggle";

export default function HomePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const jobs = useLiveQuery(() => db.jobs.orderBy("updatedAt").reverse().toArray(), []);

  useEffect(() => {
    void ensureBuiltInSpecs();
  }, []);

  const filtered = useMemo(() => {
    if (!jobs) return undefined;
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) =>
      [j.header.regNo, j.header.owner, j.header.type, j.header.orderNo]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [jobs, query]);

  async function create(kind: VehicleType | "truck8x4", regNo: string) {
    const job = kind === "truck8x4" ? newTruck8x4() : newJob(kind);
    job.header.regNo = regNo.trim();
    await saveJob(job);
    router.push(`/job/${job.id}`);
  }

  async function loadDemo() {
    const job = makeDemoJob();
    await saveJob(job);
    toast.success(t("Demo measurement created"));
    router.push(`/job/${job.id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <AppHeader
        title="TruckAlign"
        subtitle={t("JOSAM AM39 alignment")}
        right={
          <div className="flex items-center gap-2">
            <LangToggle />
            <Link
              href="/specs"
              className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t("Spec profiles")}
            >
              <SlidersHorizontal className="size-5" />
            </Link>
          </div>
        }
      />

      <div className="space-y-4 px-4 py-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search reg no, owner, type…")}
            className="h-11 pl-9"
          />
        </div>

        <NewJobDialog onPick={create} />

        <div className="space-y-2">
          {filtered === undefined ? (
            <ListSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState hasJobs={(jobs?.length ?? 0) > 0} onDemo={loadDemo} />
          ) : (
            filtered.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                onDelete={async () => {
                  await deleteJob(job.id);
                  toast.success("Measurement deleted");
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function NewJobDialog({ onPick }: { onPick: (t: VehicleType | "truck8x4", regNo: string) => Promise<void> }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<VehicleType | "truck8x4" | null>(null);
  const [regNo, setRegNo] = useState("");

  // Only the plate is asked for up front — it is what you can read off the
  // vehicle. The rest of the sheet's header is collected after measuring.
  function reset(next: boolean) {
    setOpen(next);
    if (!next) {
      setKind(null);
      setRegNo("");
    }
  }

  // Navigate first, then close: tearing the dialog down mid-push swallowed it.
  async function start() {
    if (!kind) return;
    await onPick(kind, regNo);
    reset(false);
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger render={<Button size="lg" className="h-12 w-full text-base" />}>
        <Plus className="size-5" /> {t("New measurement")}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        {kind === null ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("What are you measuring?")}</DialogTitle>
              <DialogDescription>{t("Pick the vehicle so the right report is used.")}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <TypeCard
                icon={<Truck className="size-7" />}
                label={t("Truck")}
                hint={t("Steering axle — add more later")}
                onClick={() => setKind("truck")}
              />
              <TypeCard
                icon={<Truck className="size-7" />}
                label={t("Truck 8×4")}
                hint={t("2 steering axles")}
                onClick={() => setKind("truck8x4")}
              />
              <TypeCard
                icon={<Container className="size-7" />}
                label={t("Trailer")}
                hint={t("Up to 4 axles")}
                onClick={() => setKind("trailer")}
                className="col-span-2"
              />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("Licence plate")}</DialogTitle>
              <DialogDescription>{t("The rest of the details are filled in after measuring.")}</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-3 pt-1"
              onSubmit={(e) => {
                e.preventDefault();
                void start();
              }}
            >
              <Input
                autoFocus
                value={regNo}
                onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                placeholder="B 123 ABC"
                className="h-12 text-center font-mono text-lg tracking-widest"
                aria-label={t("Licence plate")}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setKind(null)}>
                  <ChevronLeft className="size-4" /> {t("Back")}
                </Button>
                <Button type="submit" className="flex-1">
                  {t("Start measuring")}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TypeCard({
  icon,
  label,
  hint,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center transition-colors hover:border-primary hover:bg-primary/5",
        className,
      )}
    >
      <span className="text-primary">{icon}</span>
      <span className="font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </button>
  );
}

function JobRow({ job, onDelete }: { job: Job; onDelete: () => void }) {
  const { t } = useI18n();
  const Icon = job.vehicleType === "truck" ? Truck : Container;
  const title = job.header.regNo || job.header.type || t("Untitled vehicle");
  return (
    <div className="group flex items-center gap-3 rounded-lg border bg-card p-3">
      <Link href={`/job/${job.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{title}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {job.axles.length} {t("axles")} · {fmtDate(job.header.date || job.updatedAt)}
            {job.header.owner ? ` · ${job.header.owner}` : ""}
          </span>
        </span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={t("Actions")} />}
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/job/${job.id}/report`} />}>
            <FileText className="size-4" /> {t("Open report")}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="size-4" /> {t("Delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg border bg-card" />
      ))}
    </div>
  );
}

function EmptyState({ hasJobs, onDemo }: { hasJobs: boolean; onDemo: () => void }) {
  const { t } = useI18n();
  return (
    <div className={cn("rounded-lg border border-dashed bg-card/50 p-8 text-center")}>
      <p className="font-medium">{hasJobs ? t("No matches") : t("No measurements yet")}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasJobs
          ? t("Try a different search.")
          : t(
              "Start a new measurement to record axle readings and build a report — or load a demo to see how it works.",
            )}
      </p>
      {!hasJobs && (
        <Button variant="outline" className="mt-4" onClick={onDemo}>
          <Sparkles className="size-4" /> {t("Load demo measurement")}
        </Button>
      )}
    </div>
  );
}
