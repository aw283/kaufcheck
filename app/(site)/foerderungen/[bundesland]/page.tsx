import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft, ExternalLink, Lightbulb } from "lucide-react";

import { FOERDERLAENDER, getFoerderland } from "@/lib/foerderungen";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://immoampel.at";

export function generateStaticParams() {
  return FOERDERLAENDER.map((f) => ({ bundesland: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bundesland: string }>;
}): Promise<Metadata> {
  const { bundesland } = await params;
  const land = getFoerderland(bundesland);
  if (!land) return {};
  return {
    title: `Wohnbauförderung ${land.name}`,
    description: `So fördert ${land.name} Wohneigentum: Förderlogik, Schwerpunkte und der direkte Weg zur offiziellen Stelle.`,
    alternates: { canonical: `/foerderungen/${land.slug}` },
  };
}

export default async function FoerderlandPage({
  params,
}: {
  params: Promise<{ bundesland: string }>;
}) {
  const { bundesland } = await params;
  const land = getFoerderland(bundesland);
  if (!land) notFound();

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Förderungen", item: `${SITE_URL}/foerderungen` },
      { "@type": "ListItem", position: 2, name: land.name, item: `${SITE_URL}/foerderungen/${land.slug}` },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <Link
        href="/foerderungen"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Alle Bundesländer
      </Link>

      <h1 className="mt-4 text-4xl sm:text-5xl">
        Wohnbauförderung {land.name}
      </h1>

      <p className="mt-5 leading-relaxed text-muted-foreground">{land.intro}</p>

      <section className="mt-8">
        <h2 className="text-2xl">Förder-Schwerpunkte</h2>
        <ul className="mt-4 space-y-2.5">
          {land.schwerpunkte.map((s) => (
            <li key={s} className="flex items-start gap-2.5 text-sm">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                aria-hidden
              />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-xl border-2 border-primary/20 bg-accent/50 p-5">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <h2 className="text-xl">Gut zu wissen</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {land.besonderheit}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl">So gehen Sie vor</h2>
        <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm">
          <li>
            <strong>Eigene Leistbarkeit klären</strong> — bevor Sie Objekte
            suchen oder Förderanträge stellen. So wissen Sie, welche Lücke die
            Förderung schließen muss.
          </li>
          <li>
            <strong>Aktuelle Richtlinien bei der Landesstelle prüfen</strong> —
            Förderbeträge und Einkommensgrenzen ändern sich teils jährlich.
            Verbindlich ist nur die offizielle Information.
          </li>
          <li>
            <strong>Vor Kaufvertrag oder Baubeginn ansuchen</strong> — viele
            Förderungen sind nachträglich nicht mehr möglich.
          </li>
          <li>
            <strong>Förderung in die Bankfinanzierung einbauen lassen</strong> —
            ein zinsgünstiges Landesdarlehen oder ein Zuschuss verbessert Ihre
            KIM-V-Kennzahlen und damit Ihre Verhandlungsposition.
          </li>
        </ol>
      </section>

      <section className="mt-8 flex flex-col gap-3 rounded-xl border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Offizielle Förderstelle</p>
          <p className="text-sm text-muted-foreground">
            Aktuelle Richtlinien, Beträge und Anträge
          </p>
        </div>
        <a
          href={land.offiziell.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {land.offiziell.label}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </section>

      <section className="mt-10 rounded-xl bg-primary p-6 text-primary-foreground sm:p-8">
        <h2 className="font-serif text-2xl text-primary-foreground">
          Erst rechnen, dann fördern lassen
        </h2>
        <p className="mt-2 text-sm opacity-90">
          Der immoampel-Check zeigt in zwei Minuten, wo Sie ohne Förderung
          stehen — KIM-V-konform und kostenlos.
        </p>
        <Link
          href="/check"
          className="mt-4 inline-flex rounded-md bg-white px-5 py-2.5 text-sm font-medium text-primary hover:bg-white/90"
        >
          Leistbarkeit prüfen
        </Link>
      </section>
    </main>
  );
}
