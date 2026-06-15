import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bauzinsen Österreich – Orientierungswerte",
  description:
    "Wo Wohnkredit-Zinsen in Österreich aktuell ungefähr liegen: Richtwerte für variabel und fix, und wovon Ihre persönliche Kondition abhängt.",
  alternates: { canonical: "/zinsen" },
};

const RICHTWERTE = [
  { produkt: "Variabel (3-M-Euribor-gebunden)", spanne: "untere bis mittlere 3-%-Spanne" },
  { produkt: "Fixzins 10 Jahre", spanne: "mittlere 3-%-Spanne" },
  { produkt: "Fixzins 15–20 Jahre", spanne: "obere 3- bis untere 4-%-Spanne" },
  { produkt: "Fixzins 25+ Jahre", spanne: "um die 4-%-Marke" },
];

export default function ZinsenPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
      <h1 className="text-4xl sm:text-5xl">Bauzinsen in Österreich</h1>
      <p className="mt-4 text-muted-foreground">
        Tagesaktuelle Zinssätze veröffentlichen wir bewusst nicht — die ändern
        sich schneller, als jede statische Seite aktualisiert werden kann.
        Stattdessen: ehrliche Orientierungswerte und das, was Ihre persönliche
        Kondition wirklich bestimmt.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Produkt</th>
              <th className="px-4 py-3 text-right">Typische Größenordnung*</th>
            </tr>
          </thead>
          <tbody className="bg-surface">
            {RICHTWERTE.map((r) => (
              <tr key={r.produkt} className="border-t">
                <td className="px-4 py-3">{r.produkt}</td>
                <td className="px-4 py-3 text-right">{r.spanne}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        * Grobe Richtwerte für gute Bonität, Stand Frühjahr 2026. Keine
        Angebote. Tagesaktuelle Konditionen erhalten Sie von Banken und
        Vermittlern.
      </p>

      <section className="mt-10">
        <h2 className="text-3xl">Was Ihre Kondition wirklich bestimmt</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Eigenkapitalquote:</strong>{" "}
            ab ca. 30 % Eigenkapital verbessern sich Konditionen oft spürbar —
            die Bank trägt weniger Risiko.
          </li>
          <li>
            <strong className="text-foreground">Beleihungswert des Objekts:</strong>{" "}
            gut verwertbare Lagen bekommen bessere Sätze als Spezialobjekte.
          </li>
          <li>
            <strong className="text-foreground">Haushaltsrechnung:</strong>{" "}
            je größer der Puffer zwischen Rate und 40-%-Grenze, desto mehr
            Verhandlungsspielraum.
          </li>
          <li>
            <strong className="text-foreground">Verhandeln und vergleichen:</strong>{" "}
            zwischen bestem und schlechtestem Angebot für denselben Haushalt
            liegen oft mehrere Zehntelprozentpunkte — über 30 Jahre ein
            fünfstelliger Betrag.
          </li>
        </ul>
      </section>

      <section className="mt-10 rounded-xl border bg-accent/50 p-6">
        <h2 className="text-2xl">Ihre Monatsrate bei heutigem Zinsniveau</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Der Check rechnet mit einem konservativen Kalkulationszins — so sehen
          Sie, was bei realistischen Konditionen leistbar ist.
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
