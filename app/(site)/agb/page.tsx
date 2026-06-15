import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGB",
  description: "Allgemeine Geschäftsbedingungen von immoampel.",
  alternates: { canonical: "/agb" },
};

export default function AgbPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
      <h1 className="text-4xl sm:text-5xl">Allgemeine Geschäftsbedingungen</h1>

      <div className="mt-6 rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm">
        <strong>Hinweis:</strong> Dieser AGB-Entwurf ist ein Platzhalter und
        muss vor dem öffentlichen Launch durch eine Rechtsanwältin / einen
        Rechtsanwalt geprüft und finalisiert werden.
      </div>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-serif text-2xl text-foreground">1. Geltungsbereich</h2>
          <p className="mt-2">
            Diese AGB gelten für die Nutzung der Website immoampel.at und der
            dort angebotenen kostenlosen Leistbarkeits-Berechnung sowie der
            Vermittlung von Kontakten zu Finanzierungs- und Immobilienpartnern.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-foreground">2. Leistungsbeschreibung</h2>
          <p className="mt-2">
            immoampel erbringt keine Bank-, Kreditvermittlungs- oder
            Maklerleistungen. Berechnungsergebnisse sind unverbindliche
            Orientierungswerte und ersetzen keine Finanz-, Rechts- oder
            Steuerberatung. Die Vermittlung von Beratungsterminen erfolgt
            ausschließlich auf aktive Anfrage der Nutzerin / des Nutzers.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-foreground">3. Haftung</h2>
          <p className="mt-2">
            Für die Richtigkeit, Vollständigkeit und Aktualität der
            bereitgestellten Informationen und Berechnungen wird keine Gewähr
            übernommen. Verbindliche Finanzierungszusagen können ausschließlich
            Kreditinstitute nach eigener Prüfung erteilen.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-foreground">4. Vergütung</h2>
          <p className="mt-2">
            Die Nutzung ist für Verbraucher:innen kostenlos. immoampel kann von
            Partnern erfolgsabhängige Vermittlungsprovisionen erhalten; dadurch
            entstehen Nutzer:innen keine Mehrkosten.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-foreground">5. Schlussbestimmungen</h2>
          <p className="mt-2">
            Es gilt österreichisches Recht. Gerichtsstand ist — soweit
            gesetzlich zulässig — der Sitz des Betreibers. Sollten einzelne
            Bestimmungen unwirksam sein, bleibt die Gültigkeit der übrigen
            unberührt.
          </p>
        </section>
      </div>
    </main>
  );
}
