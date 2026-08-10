"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

/**
 * Friendly fallback for any unexpected error in the editor/report. The workshop
 * phone should never show a raw stack trace: offer a retry (the measurement is
 * already saved locally) and a way back home.
 */
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-warn/15 text-warn">
        <AlertTriangle className="size-6" />
      </span>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{t("Something went wrong")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("Your measurements are saved on this device. Try again, or go back and reopen it.")}
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>
          <RotateCcw className="size-4" /> {t("Try again")}
        </Button>
        <Button variant="outline" render={<Link href="/" />}>
          <Home className="size-4" /> {t("Back to measurements")}
        </Button>
      </div>
      {error.digest && <p className="font-mono text-[10px] text-muted-foreground">{error.digest}</p>}
    </div>
  );
}
