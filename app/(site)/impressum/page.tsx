import Link from "next/link";
import { ArrowLeft } from "lucide-react";


export const metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          prefetch={false}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Zurück
        </Link>

        <h1 className="text-3xl font-bold tracking-tight">Impressum</h1>

        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm">
          <strong>Hinweis:</strong> Vor Launch durch echtes Impressum
          ersetzen — Pflicht nach § 5 ECG / § 24 MedienG (Österreich).
        </div>

        <section className="rounded-lg border bg-card p-5 text-sm shadow-sm">
          <h2 className="text-base font-semibold">Medieninhaber &amp; Herausgeber</h2>
          <address className="mt-2 not-italic text-muted-foreground">
            <strong className="text-foreground">[Firmenname / Name]</strong>
            <br />
            [Straße + Hausnummer]
            <br />
            [PLZ + Ort], Österreich
            <br />
            <br />
            E-Mail: kontakt@immoampel.at
            <br />
            Telefon: [+43 …]
          </address>
        </section>

        <section className="rounded-lg border bg-card p-5 text-sm shadow-sm">
          <h2 className="text-base font-semibold">Aufsichtsbehörde</h2>
          <p className="mt-2 text-muted-foreground">
            [zuständige Bezirkshauptmannschaft / Magistrat]
          </p>
        </section>

        <section className="rounded-lg border bg-card p-5 text-sm shadow-sm">
          <h2 className="text-base font-semibold">Unternehmensgegenstand</h2>
          <p className="mt-2 text-muted-foreground">
            Vermittlung von Finanzierungs- und Immobilienberatungs-Leistungen
            durch Weiterleitung an unabhängige Partner. immoampel ist
            selbst kein Kreditgeber und kein Makler.
          </p>
        </section>

        <section className="rounded-lg border bg-card p-5 text-sm shadow-sm">
          <h2 className="text-base font-semibold">Haftungsausschluss</h2>
          <p className="mt-2 text-muted-foreground">
            Die berechneten Werte sind Orientierungswerte basierend auf
            KIM-V-Richtlinien. Eine verbindliche Kredit- oder Finanzierungs-
            zusage erfolgt ausschließlich durch die Partner-Banken nach
            Bonitätsprüfung.
          </p>
        </section>
      </div>

    </main>
  );
}
