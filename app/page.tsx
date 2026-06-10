import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

const TRUST = [
  { Icon: ShieldCheck, label: "KIM-V-konform berechnet" },
  { Icon: UserRound, label: "Keine Registrierung" },
  { Icon: Lock, label: "Daten verschlüsselt übertragen" },
];

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="relative flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-accent via-background to-background">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-5 pb-12 pt-10 text-center sm:px-8 sm:pt-16 lg:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Leistbarkeit prüfen
          </span>

          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Welche Immobilie kann ich mir leisten?
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            In 2 Minuten Klarheit. Kostenlos. Ohne Registrierung.
          </p>

          <Button
            asChild
            size="xl"
            className="mt-8 h-14 w-full max-w-sm px-8 text-base font-semibold shadow-lg shadow-primary/15 sm:w-auto"
          >
            <Link href="/check" aria-label="Leistbarkeits-Check starten">
              Jetzt prüfen
              <ArrowRight className="ml-1" aria-hidden />
            </Link>
          </Button>

          <p className="mt-3 text-xs text-muted-foreground">
            Dauer: ca. 2 Minuten · 3 kurze Schritte
          </p>

          <ul className="mt-10 grid w-full gap-3 text-left sm:mt-14 sm:grid-cols-3 sm:gap-4">
            {TRUST.map(({ Icon, label }) => (
              <li
                key={label}
                className="flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-medium leading-snug">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
