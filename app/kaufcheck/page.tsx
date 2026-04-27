import Link from "next/link";
import { ArrowRight, ShieldCheck, UserRound, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

const trustItems = [
  {
    icon: ShieldCheck,
    text: "Basiert auf österreichischen KIM-V-Richtlinien",
  },
  {
    icon: UserRound,
    text: "Keine Registrierung notwendig",
  },
  {
    icon: Lock,
    text: "Ihre Daten werden nicht gespeichert",
  },
];

export default function KaufcheckLandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="relative flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-accent via-background to-background">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-5 pb-12 pt-10 text-center sm:px-8 sm:pt-16 lg:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Kaufcheck
          </span>

          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-dark sm:text-5xl lg:text-6xl">
            Welche Immobilie kann ich mir leisten?
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            In 3 Minuten Klarheit über Ihr Budget – kostenlos und unverbindlich.
          </p>

          <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button
              asChild
              size="xl"
              className="h-14 w-full px-8 text-base font-semibold shadow-lg shadow-primary/20 sm:w-auto"
            >
              <Link href="/kaufcheck/wizard" aria-label="Jetzt Kaufcheck starten">
                Jetzt prüfen
                <ArrowRight className="ml-1" aria-hidden />
              </Link>
            </Button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Dauer: ca. 3 Minuten · 4 kurze Schritte
          </p>

          <ul className="mt-10 grid w-full gap-3 text-left sm:mt-14 sm:grid-cols-3 sm:gap-4">
            {trustItems.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-medium leading-snug text-foreground">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 px-5 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} ImmoScout Kaufcheck</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link
              href="/kaufcheck/datenschutz"
              prefetch={false}
              className="font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              Datenschutz
            </Link>
            <span className="opacity-60">·</span>
            <span>
              Orientierungswert – keine verbindliche Kreditzusage.
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
