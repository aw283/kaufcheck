import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Anfrage gesendet – Danke",
};

export default function DankePage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 px-5 py-12 text-center sm:px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--success)]/15 text-[color:var(--success)]">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Vielen Dank für Ihre Anfrage
        </h1>
        <p className="text-muted-foreground">
          Ein Partner meldet sich <strong className="text-foreground">binnen 24 Stunden</strong>{" "}
          telefonisch bei Ihnen. Sie bekommen außerdem eine Bestätigung per
          E-Mail.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Zurück zur Startseite</Link>
        </Button>
      </div>
      <SiteFooter />
    </main>
  );
}
