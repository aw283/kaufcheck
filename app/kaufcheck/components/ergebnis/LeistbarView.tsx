"use client";

import dynamic from "next/dynamic";
import {
  CalendarCheck,
  CheckCircle2,
  Coins,
  ExternalLink,
  HandCoins,
  PiggyBank,
  Receipt,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { KaufcheckInput, KaufcheckResult } from "@/app/kaufcheck/types";
import { buildKaufSearchUrl } from "@/app/kaufcheck/lib/immoscout";
import { analytics } from "@/lib/analytics";

import { KaufpreisRange } from "./KaufpreisRange";
import { KennzahlCard } from "./KennzahlCard";
import { LeadFormDialog } from "./LeadFormDialog";

// Recharts nur laden, wenn die Leistbar-Variante tatsächlich gerendert wird.
const FinanzierungsDonut = dynamic(
  () =>
    import("./FinanzierungsDonut").then((m) => m.FinanzierungsDonut),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[200px] items-center justify-center rounded-md bg-muted/30 text-xs text-muted-foreground"
        aria-busy="true"
      >
        Finanzierungs-Grafik wird geladen …
      </div>
    ),
  }
);

function formatEuro(n: number): string {
  return Math.round(n).toLocaleString("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

interface LeistbarViewProps {
  input: KaufcheckInput;
  result: KaufcheckResult;
}

export function LeistbarView({ input, result }: LeistbarViewProps) {
  const ek = input.vorstellung.eigenkapital;
  const kaufSuche = buildKaufSearchUrl({
    bundesland: input.vorstellung.bundesland,
    immobilienart: input.vorstellung.immobilienart,
    maxPreis: result.maxKaufpreis,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[color:var(--success)]/30 bg-[color:var(--success)]/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--success)]">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Leistbar
        </div>
        <h2 className="mt-1 text-balance text-2xl font-bold leading-tight tracking-tight text-[color:var(--success)] sm:text-3xl lg:text-4xl">
          Ihr Kaufbudget: bis {formatEuro(result.maxKaufpreis)}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Auf Basis Ihrer Eingaben und der österreichischen KIM-V-Richtlinien
          ist eine Finanzierung in diesem Rahmen realistisch.
        </p>

        <div className="mt-5">
          <KaufpreisRange
            maxKaufpreis={result.maxKaufpreis}
            zielAb={result.maxKaufpreis * 0.8}
            zielBis={result.maxKaufpreis}
            tone="success"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <KennzahlCard
          label="Maximale Kreditsumme"
          value={formatEuro(result.maxKreditsumme)}
          sub={`${result.laufzeitJahre} Jahre Laufzeit`}
          icon={HandCoins}
        />
        <KennzahlCard
          label="Geschätzte Monatsrate"
          value={formatEuro(result.monatlicheRate)}
          sub={`Belastungsquote ${Math.round(
            result.belastungsquote * 100
          )} %`}
          icon={Wallet}
        />
        <KennzahlCard
          label="Nebenkosten (~10 %)"
          value={formatEuro(result.nebenkosten)}
          sub="GrESt, Notar, Makler, Eintragung"
          icon={Receipt}
        />
        <KennzahlCard
          label="Eigenkapitalquote"
          value={`${Math.round(result.eigenmittelquote * 100)} %`}
          sub="KIM-V-Mindestwert: 20 %"
          icon={PiggyBank}
          tone="success"
        />
      </div>

      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold">
            Zusammensetzung Ihrer Finanzierung
          </h3>
        </div>
        <FinanzierungsDonut
          eigenkapital={ek}
          kredit={result.maxKreditsumme}
          nebenkosten={result.nebenkosten}
        />
      </section>

      <div className="flex flex-col gap-3 rounded-lg border bg-primary/5 p-4 sm:p-5">
        <h3 className="text-base font-semibold">
          Nächster Schritt: Finanzierung sichern
        </h3>
        <p className="text-sm text-muted-foreground">
          Ein unabhängiges Beratungs­gespräch klärt Konditionen, Förderungen
          und Ihre individuellen Optionen – in 30 Minuten, unverbindlich.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <LeadFormDialog
            ctaLabel="Beratung anfragen"
            trigger={
              <Button size="lg" className="flex-1">
                <CalendarCheck aria-hidden />
                Finanzierungsberater kontaktieren
              </Button>
            }
          />
          <Button asChild variant="outline" size="lg" className="flex-1">
            <a
              href={kaufSuche}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => analytics.immoscoutClicked("leistbar_cta")}
            >
              <ExternalLink aria-hidden />
              Passende Immobilien ansehen
            </a>
          </Button>
        </div>
      </div>

      <Alert>
        <AlertDescription className="text-xs">
          <strong>Hinweis:</strong> Dieses Ergebnis ist ein Richtwert auf Basis
          Ihrer Angaben und keine verbindliche Finanzierungs­zusage. Die
          tatsächlichen Konditionen hängen von Bonität, Objektwert und
          aktuellem Marktzins ab.
        </AlertDescription>
      </Alert>
    </div>
  );
}
