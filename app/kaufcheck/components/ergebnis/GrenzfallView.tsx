"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Clock,
  ExternalLink,
  PiggyBank,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { KaufcheckInput, KaufcheckResult } from "@/app/kaufcheck/types";
import { berechneLeistbarkeit } from "@/app/kaufcheck/lib/affordability";
import {
  buildKaufSearchUrl,
  buildMietSearchUrl,
  mietRichtwert,
} from "@/app/kaufcheck/lib/immoscout";
import { analytics } from "@/lib/analytics";

import { KaufpreisRange } from "./KaufpreisRange";
import { KennzahlCard } from "./KennzahlCard";
import { LeadFormDialog } from "./LeadFormDialog";

function formatEuro(n: number): string {
  return Math.round(n).toLocaleString("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

interface GrenzfallViewProps {
  input: KaufcheckInput;
  result: KaufcheckResult;
}

export function GrenzfallView({ input, result }: GrenzfallViewProps) {
  const szenarien = useMemo(() => {
    const mehrEk = berechneLeistbarkeit(input, { extraEigenkapital: 20_000 });
    const laengereLaufzeit = berechneLeistbarkeit(input, {
      laufzeitJahreDefault: 35,
    });
    return { mehrEk, laengereLaufzeit };
  }, [input]);

  const kaufSuche = buildKaufSearchUrl({
    bundesland: input.vorstellung.bundesland,
    immobilienart: input.vorstellung.immobilienart,
    maxPreis: result.maxKaufpreis,
  });

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

  const hinweisEk =
    result.eigenmittelquote < 0.2 && result.eigenmittelquote >= 0.15;
  const hinweisPreis =
    result.maxKaufpreis >= 100_000 && result.maxKaufpreis < 150_000;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--warning)]">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Grenzfall
        </div>
        <h2 className="mt-1 text-balance text-2xl font-bold leading-tight tracking-tight text-[color:var(--warning)] sm:text-3xl">
          Unter bestimmten Voraussetzungen leistbar
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ihr aktueller Rahmen liegt bei rund{" "}
          <strong className="text-foreground">
            {formatEuro(result.maxKaufpreis)}
          </strong>
          . Mit gezielten Anpassungen lässt sich das Budget spürbar erweitern.
        </p>

        <div className="mt-5">
          <KaufpreisRange
            maxKaufpreis={
              result.maxKaufpreis > 0 ? result.maxKaufpreis : 150_000
            }
            zielAb={result.maxKaufpreis * 0.9}
            zielBis={result.maxKaufpreis}
            tone="warning"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <KennzahlCard
          label="Monatsrate"
          value={formatEuro(result.monatlicheRate)}
          sub={`${result.laufzeitJahre} Jahre Laufzeit`}
        />
        <KennzahlCard
          label="Eigenkapitalquote"
          value={`${Math.round(result.eigenmittelquote * 100)} %`}
          sub={hinweisEk ? "Zu wenig – 20 % nötig" : "KIM-V Mindestwert 20 %"}
          tone={hinweisEk ? "warning" : "default"}
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold">
            So erweitern Sie Ihren Rahmen
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <PiggyBank className="h-3.5 w-3.5" aria-hidden />
              +20.000 € Eigenkapital
            </div>
            <div className="text-xl font-semibold tabular-nums">
              bis {formatEuro(szenarien.mehrEk.maxKaufpreis)}
            </div>
            <p className="text-xs text-muted-foreground">
              {szenarien.mehrEk.maxKaufpreis > result.maxKaufpreis
                ? `Plus ${formatEuro(
                    szenarien.mehrEk.maxKaufpreis - result.maxKaufpreis
                  )} Spielraum`
                : "Aktueller Rahmen bleibt"}
              {" · "}EK-Quote{" "}
              {Math.round(szenarien.mehrEk.eigenmittelquote * 100)} %
            </p>
          </article>

          <article className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              35 Jahre Laufzeit
            </div>
            <div className="text-xl font-semibold tabular-nums">
              bis {formatEuro(szenarien.laengereLaufzeit.maxKaufpreis)}
            </div>
            <p className="text-xs text-muted-foreground">
              {szenarien.laengereLaufzeit.laufzeitJahre} Jahre möglich
              {szenarien.laengereLaufzeit.maxKaufpreis > result.maxKaufpreis
                ? ` · +${formatEuro(
                    szenarien.laengereLaufzeit.maxKaufpreis -
                      result.maxKaufpreis
                  )}`
                : ""}
            </p>
          </article>

          <article className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Users className="h-3.5 w-3.5" aria-hidden />
              Partner-Einkommen
            </div>
            <div className="text-xl font-semibold leading-tight">
              Gemeinsam neu rechnen
            </div>
            <Link
              href="/kaufcheck"
              prefetch={false}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Berechnung neu starten
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </article>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-lg border bg-primary/5 p-4 sm:p-5">
        <h3 className="text-base font-semibold">
          Individuelle Optionen besprechen
        </h3>
        <p className="text-sm text-muted-foreground">
          Förderungen, Bausparer, Familien­bürgschaften – in Grenzfällen lohnt
          sich eine persönliche Beratung besonders.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <LeadFormDialog
            ctaLabel="Beratung anfragen"
            trigger={
              <Button size="lg" className="flex-1">
                <CalendarCheck aria-hidden />
                Kostenlose Beratung anfragen
              </Button>
            }
          />
          <Button asChild variant="outline" size="lg" className="flex-1">
            <a
              href={mietSuche}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => analytics.mietobjekteClicked("grenzfall_cta")}
            >
              <ExternalLink aria-hidden />
              Mietobjekte ansehen
            </a>
          </Button>
        </div>
        {hinweisPreis ? (
          <p className="text-xs text-muted-foreground">
            Alternativ: Eine{" "}
            <a
              href={kaufSuche}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => analytics.immoscoutClicked("grenzfall_fallback")}
              className="font-medium text-primary hover:underline"
            >
              Immobilien­suche bis {formatEuro(result.maxKaufpreis)}
            </a>{" "}
            öffnen.
          </p>
        ) : null}
      </div>

      <Alert>
        <AlertDescription className="text-xs">
          Die Szenarien sind Orientierungs­werte auf Basis Ihrer Angaben.
          Tatsächliche Konditionen hängen von Bonität, Objekt und Marktzins ab.
        </AlertDescription>
      </Alert>
    </div>
  );
}
