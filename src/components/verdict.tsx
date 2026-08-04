import { cn } from "@/lib/utils";
import { verdictClasses, type VerdictStatus } from "@/lib/verdict";
import { Check, X, Minus } from "lucide-react";

const ICON: Record<VerdictStatus, typeof Check> = {
  pass: Check,
  fail: X,
  unknown: Minus,
};

export function VerdictDot({ status, className }: { status: VerdictStatus; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2.5 rounded-full", verdictClasses[status].dot, className)}
      aria-hidden
    />
  );
}

export function VerdictBadge({
  status,
  label,
  className,
}: {
  status: VerdictStatus;
  label?: string;
  className?: string;
}) {
  const c = verdictClasses[status];
  const Icon = ICON[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        c.text,
        c.bg,
        c.border,
        className,
      )}
    >
      <Icon className="size-3" />
      {label ?? c.label}
    </span>
  );
}
