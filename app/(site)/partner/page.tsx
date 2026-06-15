import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Handshake, Landmark, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Partner-Netzwerk",
  description:
    "Banken, Finanzierungsvermittler und regionale Makler: wie das immoampel-Partnernetzwerk funktioniert — und wie Sie Partner werden.",
  alternates: { canonical: "/partner" },
};

const KATEGORIEN = [
  {
    Icon: Landmark,
    title: "Bank-Partner",
    text: "Etablierte österreichische Institute und Direktbanken, an die wir Finanzierungsanfragen vermitteln — z. B. aus dem Umfeld von Erste, Raiffeisen, BAWAG oder ING. Welcher Partner konkret anfragt, hängt von Region und Anfrage-Profil ab.",
  },
  {
    Icon: Handshake,
    title: "Unabhängige Finanzierungsvermittler",
    text: "Konzessionierte Kreditvermittler, die für Sie mehrere Bankangebote einholen und vergleichen. Für Sie kostenlos — Vermittler werden von der finanzierenden Bank vergütet.",
  },
  {
    Icon: Building2,
    title: "Regionale Makler",
    text: "Geprüfte Immobilienmakler je Bundesland, die zu Ihrem Budget passende Objekte vorschlagen — auf Basis Ihres Check-Ergebnisses statt Wunschdenkens.",
  },
];

export default function PartnerPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:py-14">
      <h1 className="text-4xl sm:text-5xl">Unser Partner-Netzwerk</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        immoampel vergibt selbst keine Kredite und verkauft keine Immobilien.
        Wir verbinden Sie — nur auf Ihre ausdrückliche Anfrage — mit geprüften
        Partnern aus drei Kategorien. Das Netzwerk wird laufend erweitert.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {KATEGORIEN.map(({ Icon, title, text }) => (
          <div key={title} className="rounded-xl border bg-surface p-6 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-4 font-serif text-2xl">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>

      <section className="mt-12 rounded-xl border bg-surface p-6 sm:p-8">
        <h2 className="text-2xl">So funktioniert die Vermittlung</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Sie machen den Leistbarkeits-Check — anonym, ohne Datenweitergabe.</li>
          <li>
            Nur wenn Sie aktiv eine Beratung anfragen, geben Sie Kontaktdaten
            an und stimmen der Weitergabe an genau eine Partner-Kategorie zu.
          </li>
          <li>
            Ein passender Partner meldet sich binnen 24 Stunden. Konditionen
            verhandeln Sie direkt mit ihm — wir mischen uns nicht ein.
          </li>
          <li>
            Wir erhalten bei erfolgreicher Vermittlung eine Provision vom
            Partner. Für Sie ändert sich am Preis nichts.
          </li>
        </ol>
      </section>

      <section className="mt-8 flex flex-col gap-3 rounded-xl border-2 border-primary/20 bg-accent/50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-2xl">Partner werden?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sie sind Bank, Vermittler oder Makler und möchten qualifizierte
            Leads mit vollständiger Leistbarkeits-Analyse?
          </p>
        </div>
        <Link
          href="/kontakt?betreff=partnerschaft"
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Mail className="h-4 w-4" aria-hidden />
          Anfrage senden
        </Link>
      </section>
    </main>
  );
}
