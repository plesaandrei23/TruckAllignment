"use client";

import { useI18n, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Compact EN / RO language switch for the app header. */
export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={cn("inline-flex overflow-hidden rounded-md border text-xs font-semibold", className)}>
      {(["en", "ro"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "px-2.5 py-1 uppercase transition-colors",
            lang === l ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
