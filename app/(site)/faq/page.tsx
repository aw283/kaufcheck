import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ – Häufige Fragen",
  description:
    "Antworten auf die häufigsten Fragen zu Leistbarkeits-Check, Berechnung, Datenschutz und Partner-Vermittlung.",
  alternates: { canonical: "/faq" },
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "Was kostet der immoampel-Check?",
    a: "Nichts — weder jetzt noch später. Keine Registrierung, kein Abo, keine versteckten Kosten. Wir finanzieren uns über Vermittlungsprovisionen unserer Partner, die nur anfallen, wenn Sie aktiv eine Beratung anfragen und es zu einem Abschluss kommt.",
  },
  {
    q: "Wie genau ist die Berechnung?",
    a: "Wir verwenden dieselben Leitplanken wie österreichische Banken: maximal 40 % Schuldendienstquote für die Rate, realistische Eigenkapital-Anrechnung, marktübliche Laufzeiten (bis 35 Jahre) und rund 11 % Kaufnebenkosten. Seit dem Auslaufen der KIM-V (Mitte 2025) finanzieren Banken wieder flexibler — auch schon ab rund 15 % Eigenkapital. Das Ergebnis ist ein belastbarer Orientierungswert — die verbindliche Zusage kann nur eine Bank nach Bonitätsprüfung geben.",
  },
  {
    q: "Welche Vermögenswerte zählen als Eigenkapital?",
    a: "Mehr als Sie denken: Sparguthaben und Bausparer voll, Wertpapiere und Gold mit ca. 70 %, der Rückkaufswert von Lebensversicherungen, schriftlich zugesagte Schenkungen — und bestehende Immobilien mit ca. 70 % des Verkehrswerts abzüglich Restschuld.",
  },
  {
    q: "Was passiert mit meinen Daten?",
    a: "Ihre Check-Eingaben bleiben in Ihrem Browser. Erst wenn Sie aktiv eine Anfrage absenden, übermitteln Sie Kontaktdaten — und stimmen dabei explizit der Weitergabe an genau eine Partner-Kategorie zu. Kein Tracking, kein Datenverkauf. Details im Datenschutzhinweis.",
  },
  {
    q: "Ich bin im gelben Bereich — was jetzt?",
    a: "Gelb heißt: mit Anpassungen erreichbar. Die häufigsten Hebel sind ein zweiter Kreditnehmer, zusätzliches Eigenkapital (auch über Schenkung oder Bestandsimmobilie), längere Laufzeit oder Wohnbauförderung. Das Ergebnis zeigt Ihnen, welcher Hebel bei Ihnen am meisten bringt.",
  },
  {
    q: "Vermittelt immoampel selbst Kredite?",
    a: "Nein. Wir sind weder Bank noch Kreditvermittler noch Makler. Wir berechnen Leistbarkeit und stellen auf Ihre Anfrage den Kontakt zu konzessionierten Partnern her, die die eigentliche Beratung und Vermittlung übernehmen.",
  },
  {
    q: "Gilt die Berechnung auch für eine zweite Immobilie?",
    a: "Ja — gerade dafür ist der Check stark: Tragen Sie Ihre bestehende Immobilie mit Verkehrswert und Restschuld ein, und der Check rechnet den beleihbaren Anteil als Eigenkapital für das neue Objekt an.",
  },
  {
    q: "Warum sehe ich keine tagesaktuellen Zinssätze?",
    a: "Weil statische Zinsangaben im Netz fast immer veraltet sind. Wir rechnen mit einem konservativen Kalkulationszins und erklären auf der Zinsen-Seite, wovon Ihre persönliche Kondition tatsächlich abhängt.",
  },
];

export default function FaqPage() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <h1 className="text-4xl sm:text-5xl">Häufige Fragen</h1>

      <div className="mt-8 space-y-3">
        {FAQS.map((f) => (
          <details key={f.q} className="rounded-xl border bg-surface p-5">
            <summary className="cursor-pointer list-none font-medium">
              {f.q}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {f.a}
            </p>
          </details>
        ))}
      </div>

      <div className="mt-10 rounded-xl border bg-accent/50 p-6 text-center">
        <p className="font-serif text-2xl">Frage nicht dabei?</p>
        <Link
          href="/kontakt"
          className="mt-3 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Schreiben Sie uns
        </Link>
      </div>
    </main>
  );
}
