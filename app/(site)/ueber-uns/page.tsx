import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Über uns",
  description:
    "Warum es immoampel gibt: Leistbarkeit verständlich machen, ohne Bank-Geblubber und ohne versteckte Agenda.",
  alternates: { canonical: "/ueber-uns" },
};

export default function UeberUnsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
      <h1 className="text-4xl sm:text-5xl">Über immoampel</h1>

      <div className="mt-8 space-y-6 leading-relaxed text-muted-foreground">
        <p>
          immoampel ist aus einem simplen Ärgernis entstanden: Wer in
          Österreich wissen will, ob eine Immobilie leistbar ist, bekommt
          entweder Marketing-Floskeln (&bdquo;Ihr Traum vom Eigenheim!&ldquo;)
          oder Bank-Geblubber (&bdquo;vorbehaltlich Bonitätsprüfung im Rahmen
          der aufsichtsrechtlichen Vorgaben…&ldquo;). Was fehlt: eine klare
          Ansage.
        </p>
        <p>
          Genau die liefern wir. Unser Check rechnet mit denselben
          KIM-V-Leitplanken, die jede österreichische Bank anwendet — und sagt
          Ihnen das Ergebnis so, wie Sie es einem Freund sagen würden: grün,
          gelb oder rot. Inklusive der konkreten Stellschrauben, wenn es noch
          nicht reicht.
        </p>

        <h2 className="pt-2 font-serif text-3xl text-foreground">
          Wie wir Geld verdienen
        </h2>
        <p>
          Transparenz gehört zur klaren Ansage: Der Check ist und bleibt für
          Sie kostenlos. Wenn Sie nach dem Ergebnis aktiv eine
          Finanzierungsberatung oder Objektvorschläge anfragen, vermitteln wir
          Sie an unabhängige Partner — und erhalten dafür eine
          Vermittlungsprovision. Sie zahlen dadurch keinen Cent mehr; die
          Konditionen verhandeln Sie direkt mit dem Partner.
        </p>
        <p>
          Was wir <strong className="text-foreground">nicht</strong> tun:
          Ihre Daten verkaufen, Sie mit Werbung fluten oder Ergebnisse
          schönrechnen, damit Sie schneller klicken. Ein &bdquo;rot&ldquo;
          bleibt ein rot — mit ehrlichen Hinweisen, was sich ändern müsste.
        </p>

        <h2 className="pt-2 font-serif text-3xl text-foreground">
          Die Berechnung ist offen
        </h2>
        <p>
          Jede Formel, die wir verwenden, ist dokumentiert: Schuldendienstquote,
          Annuitätenrechnung, Beleihungsfaktoren, Nebenkosten. Wer es genau
          wissen will, liest unseren{" "}
          <Link href="/blog/kim-v-regel-erklaert" className="text-primary underline">
            KIM-V-Artikel
          </Link>{" "}
          — dort steht dieselbe Logik, mit der der Check rechnet.
        </p>
      </div>

      <div className="mt-10 rounded-xl border bg-accent/50 p-6">
        <p className="font-serif text-2xl">Fragen, Feedback, Partnerschaft?</p>
        <Link
          href="/kontakt"
          className="mt-3 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Kontakt aufnehmen
        </Link>
      </div>
    </main>
  );
}
