import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /** href for a back chevron; omit for the root. */
  back?: string;
  right?: ReactNode;
  className?: string;
}

/**
 * Sticky top bar. The hairline "measuring scale" strip under the bar is the
 * app's recurring signature — a nod to the JOSAM frame-gauge ruler.
 */
export function AppHeader({ title, subtitle, back, right, className }: AppHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-30 bg-background/85 backdrop-blur", className)}>
      <div className="flex items-center gap-2 px-4 h-14">
        {back && (
          <Link
            href={back}
            className="-ml-2 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Back"
          >
            <ChevronLeft className="size-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
      <ScaleStrip />
    </header>
  );
}

/** A thin ruler with tick marks — the signature element, reused as a divider. */
export function ScaleStrip({ className }: { className?: string }) {
  return (
    <div className={cn("h-2 w-full border-b bg-card", className)} aria-hidden>
      <svg viewBox="0 0 400 8" preserveAspectRatio="none" className="h-2 w-full text-border">
        {Array.from({ length: 81 }).map((_, i) => {
          const x = (i / 80) * 400;
          const major = i % 10 === 0;
          return (
            <line
              key={i}
              x1={x}
              x2={x}
              y1={8}
              y2={major ? 1 : 4}
              stroke="currentColor"
              strokeWidth={i % 10 === 0 ? 1.2 : 0.75}
            />
          );
        })}
      </svg>
    </div>
  );
}
