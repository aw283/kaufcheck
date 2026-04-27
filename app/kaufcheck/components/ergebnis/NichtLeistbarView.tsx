"use client";

import Link from "next/link";
import {
  CalendarClock,
  ExternalLink,
  Heart,
  Lightbulb,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { KaufcheckInput, KaufcheckResult } from "@/app/kaufcheck/types";
import {
  BUNDESLAND_LABEL,
  buildMietSearchUrl,
  mietRichtwert,
} from "@/app/kaufcheck/lib/immoscout";
import { analytics } from "@/lib/analytics";

function formatEuro(n: number): string {
  return Math.round(n).toLocaleString("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

interface NichtLeistbarViewProps {
  input: KaufcheckInput;
  result: KaufcheckResult;
}

function erklaerungssatz(input: KaufcheckInput, result: KaufcheckResult) {
  const ek = input.vorstellung.eigenkapital;
  const netto = input.finanzen.nettoEinkommen;
  const altlasten =
    input.finanzen.bestehendeKreditraten + input.finanzen.sonstigeFixkosten;

  if (ek === 0) {
    return "Ohne Eigenkapital lässt sich eine tragfähige Wohnbau­finanzierung derzeit nicht darstellen. Gezieltes Ansparen macht den Unterschied – oft schon innerhalb von 12 bis 24 Monaten.";
  }
  if (result.monatlicheRate < 300) {
    if (altlasten > 0) {
      return `Nach Abzug bestehender Verpflichtungen (${formatEuro(
        altlasten
      )}/Monat) bleibt zu wenig für eine zusätzliche Kreditrate. Werden diese abgelöst, steigt Ihr Rahmen deutlich.`;
    }
    return "Das aktuelle Netto­einkommen reicht nicht, um zusätzlich zu den Lebens­haltungskosten eine tragfähige Kreditrate zu bedienen.";
  }
  if (result.eigenmittelquote < 0.15) {
    return `Ihr Eigen­kapital von ${formatEuro(
      ek
    )} deckt weniger als 15 % des möglichen Gesamt­kaufpreises. Die KIM-V-Richtlinie verlangt mindestens 20 % – das ist die aktuelle Lücke.`;
  }
  return `Der errechnete Rahmen bei einem Einkommen von ${formatEuro(
    netto
  )}/Monat liegt unter einem Niveau, bei dem eine Immobilien­finanzierung sinnvoll trag­fähig wäre.`;
}

export function NichtLeistbarView({ input, result }: NichtLeistbarViewProps) {
  const bundeslandLabel = input.vorstellung.bundesland
    ? BUNDESLAND_LABEL[input.vorstellung.bundesland]
    : "Österreich";

  const maxMiete = mietRichtwert({
    bundesland: input.vorstellung.bundesland,
    nettoEinkommen: input.finanzen.nettoEinkommen,
    hypothetischerKaufpreis: result.maxKaufpreis,
  });
  const mietSuche = buildMietSearchUrl({
    bundesland: input.vorstellung.bundesland,
    immobilienart: input.vorstellung.immobilienart,
    maxMiete,
  });

  const erklaerung = erklaerungssatz(input, result);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-muted/40 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Heart className="h-4 w-4" aria-hidden />
          Ehrliche Einschätzung
        </div>
        <h2 className="mt-1 text-balance text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
          Ein Kauf ist aktuell noch nicht die beste Option
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {erklaerung}
          {" "}Das heißt nicht, dass der Immobilien­wunsch auf Eis liegt – nur
          dass ein anderer Zwischen­schritt gerade sinnvoller ist.
        </p>
      </div>

      <section className="rounded-lg border bg-primary/5 p-4 sm:p-5">
        <h3 className="text-base font-semibold">
          Passende Mietwohnungen in {bundeslandLabel}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Als Orientierung: etwa{" "}
          <strong className="text-foreground">
            {formatEuro(maxMiete)}/Monat
          </strong>{" "}
          – das sind rund 30 % Ihres Netto­einkommens und gilt als gesunde
          Obergrenze.
        </p>
        <Button asChild size="lg" className="mt-4 w-full sm:w-auto">
          <a
            href={mietSuche}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analytics.mietobjekteClicked("nicht_leistbar_primary")}
          >
            <ExternalLink aria-hidden />
            Mietwohnungen in {bundeslandLabel} ansehen
          </a>
        </Button>
      </section>

      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <div className="mb-2 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold">
            Kaufcheck in 12 Monaten neu machen
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Was in den nächsten 12 Monaten einen realen Unterschied macht:
        </p>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <li className="flex items-start gap-2 rounded-md bg-muted/40 p-3">
            <Lightbulb
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden
            />
            <span>
              <strong>10–15 % Eigenkapital aufbauen</strong> – z. B. per
              Bauspar­vertrag oder gezielter Spar­plan.
            </span>
          </li>
          <li className="flex items-start gap-2 rounded-md bg-muted/40 p-3">
            <Lightbulb
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden
            />
            <span>
              <strong>Bestehende Konsum­kredite ablösen</strong> – jeder Euro
              erhöht Ihren späteren Schulden­dienst-Spielraum.
            </span>
          </li>
          <li className="flex items-start gap-2 rounded-md bg-muted/40 p-3">
            <Lightbulb
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden
            />
            <span>
              <strong>Förderungen prüfen</strong> – Wohnbau­förderung,
              Jung­familien-Boni, Sanierungs­förderungen je Bundesland.
            </span>
          </li>
          <li className="flex items-start gap-2 rounded-md bg-muted/40 p-3">
            <Lightbulb
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden
            />
            <span>
              <strong>Einkommens­basis stabilisieren</strong> – unbefristete
              Anstellungen oder Partner-Einkommen verändern die Rechnung
              stark.
            </span>
          </li>
        </ul>
        <Link
          href="/kaufcheck"
          prefetch={false}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          In 12 Monaten erneut prüfen
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">
        Dieses Ergebnis ist ein Orientierungs­wert. Je nach persönlicher
        Situation kann eine individuelle Beratung dennoch sinnvoll sein.
      </p>
    </div>
  );
}
