"use client";

import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { helpFor, type HelpKey } from "@/lib/help";
import { useI18n } from "@/lib/i18n";

/** A tap-friendly "?" that explains a field, using text from the JOSAM manual. */
export function FieldHelp({ topic }: { topic: HelpKey }) {
  const { lang } = useI18n();
  const help = helpFor(lang, topic);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`Help: ${help.title}`}
            className="grid size-5 place-items-center rounded-full text-muted-foreground/70 hover:bg-muted hover:text-foreground"
          />
        }
      >
        <HelpCircle className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 text-sm">
        <p className="font-semibold">{help.title}</p>
        <p className="mt-1 text-muted-foreground">{help.body}</p>
        {help.ref && <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground/70">{help.ref}</p>}
      </PopoverContent>
    </Popover>
  );
}
