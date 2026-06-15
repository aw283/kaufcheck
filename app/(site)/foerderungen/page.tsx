import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";

import { FOERDERLAENDER } from "@/lib/foerderungen";

export const metadata: Metadata = {
  title: "Wohnbauförderung in Österreich – alle 9 Bundesländer",
  description:
    "Darlehen, Zuschüsse, Eigenmittelersatz: Wie jedes Bundesland Wohneigentum fördert — und wo Sie verbindliche Beträge finden.",
  alternates: { canonical: "/foerderungen" },
};

export default function FoerderungenPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="text-4xl sm:text-5xl">Wohnbauförderung in Österreich</h1>
        <p className="mt-4 text-muted-foreground">
          Förderung ist Ländersache — neun Bundesländer, neun Systeme. Hier
          finden Sie pro Land die Förderlogik, die Schwerpunkte und den
          direkten Draht zur offiziellen Stelle. Konkrete Beträge nennen wir
          bewusst nicht: Die ändern sich laufend, verbindlich ist nur die
          Landesstelle.
        </p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FOERDERLAENDER.map((land) => (
          <Link
            key={land.slug}
            href={`/foerderungen/${land.slug}`}
            className="group flex flex-col gap-2 rounded-xl border bg-surface p-5 shadow-sm transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                <Landmark className="h-4 w-4" aria-hidden />
              </span>
              <h2 className="font-serif text-2xl">{land.name}</h2>
            </div>
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {land.intro}
            </p>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
              Details ansehen
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-14 rounded-xl border bg-accent/50 p-6 sm:p-8">
        <h2 className="text-2xl">Förderung einplanen — aber richtig herum</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Förderungen optimieren eine Finanzierung, sie ersetzen keine. Prüfen
          Sie zuerst, wo Sie ohne Förderung stehen — dann wissen Sie, welche
          Lücke die Förderung schließen muss.
        </p>
        <Link
          href="/check"
          className="mt-4 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Leistbarkeit prüfen
        </Link>
      </section>
    </main>
  );
}
