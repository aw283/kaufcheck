"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface KaufcheckErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function KaufcheckError({ error, reset }: KaufcheckErrorProps) {
  useEffect(() => {
    // Für Sentry/Vercel-Error-Reporting sichtbar machen.
    console.error("[kaufcheck] boundary caught:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-5 px-5 py-12 text-center sm:px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertOctagon className="h-7 w-7" aria-hidden />
      </div>

      <div className="space-y-2">
        <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
          Da ist leider etwas schiefgelaufen.
        </h1>
        <p className="text-sm text-muted-foreground">
          Der Kaufcheck konnte nicht wie gewohnt laden. Ihre Eingaben sind nicht
          gespeichert – ein Neustart reicht meistens.
        </p>
        {error.digest ? (
          <p className="text-xs text-muted-foreground">
            Fehler-ID: <code className="font-mono">{error.digest}</code>
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" size="lg" onClick={() => reset()}>
          <RefreshCcw aria-hidden />
          Erneut versuchen
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/kaufcheck" prefetch={false}>
            Zum Kaufcheck-Start
          </Link>
        </Button>
      </div>
    </main>
  );
}
