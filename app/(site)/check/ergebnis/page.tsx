"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  Heart,
  Home,
  Lightbulb,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCheckStore } from "@/lib/store";
import { formatEuro } from "@/lib/calc";

export default function ErgebnisPage() {
  const router = useRouter();
  const result = useCheckStore((s) => s.result);
  const reset = useCheckStore((s) => s.reset);

  useEffect(() => {
    if (!result) router.replace("/check");
  }, [result, router]);

  if (!result) return null;

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/check"
          prefetch={false}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Eingaben anpassen
        </Link>

        {result.status === "leistbar" && <LeistbarView />}
        {result.status === "grenzfall" && <GrenzfallView />}
        {result.status === "nicht_leistbar" && <NichtLeistbarView />}

        <EkBreakdown />

        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              router.push("/");
            }}
          >
            Neu berechnen
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Orientierungswert basierend auf KIM-V-Richtlinien. Keine verbindliche
          Kreditzusage – die konkrete Finanzierung hängt von Bonität und
          Banken-Konditionen ab.
        </p>
      </div>

    </main>
  );
}

function LeistbarView() {
  const result = useCheckStore((s) => s.result)!;
  return (
    <>
      <div className="rounded-xl border border-[color:var(--success)]/30 bg-[color:var(--success)]/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--success)]">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Leistbar
        </div>
        <h1 className="mt-1 text-balance text-3xl font-bold tracking-tight text-[color:var(--success)] sm:text-4xl">
          Bis {formatEuro(result.maxKaufpreis)} leistbar
        </h1>
        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat
            label="Monatliche Rate"
            value={formatEuro(result.monatlicheRate)}
            sub={`${result.laufzeitJahre} Jahre Laufzeit`}
          />
          <Stat
            label="Eigenkapital"
            value={formatEuro(result.eigenkapital)}
            sub={`${Math.round(result.ekQuote * 100)} % Quote`}
          />
          <Stat
            label="Nebenkosten (~11 %)"
            value={formatEuro(result.nebenkosten)}
            sub="GrESt, Notar, Makler"
          />
        </dl>
      </div>

      <div className="rounded-lg border bg-primary/5 p-5">
        <h2 className="text-lg font-semibold">Wie geht es weiter?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Unabhängige Beratung &amp; passende Objektvorschläge – kostenlos und
          unverbindlich.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button asChild size="lg" className="flex-1">
            <Link href="/lead?typ=finanzierung">
              <CalendarCheck aria-hidden />
              Finanzierungs­beratung anfragen
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-1">
            <Link href="/lead?typ=immobilie">
              <Home aria-hidden />
              Passende Objekte vorschlagen
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}

function GrenzfallView() {
  const result = useCheckStore((s) => s.result)!;
  return (
    <>
      <div className="rounded-xl border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--warning)]">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Grenzfall
        </div>
        <h1 className="mt-1 text-balance text-3xl font-bold tracking-tight text-[color:var(--warning)] sm:text-4xl">
          Mit Anpassungen erreichbar
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aktueller Rahmen:{" "}
          <strong className="text-foreground">
            {formatEuro(result.maxKaufpreis)}
          </strong>{" "}
          · Monatsrate:{" "}
          <strong className="text-foreground">
            {formatEuro(result.monatlicheRate)}
          </strong>
        </p>
      </div>

      <HiddenEquityTips />

      <div className="rounded-lg border bg-primary/5 p-5">
        <h2 className="text-lg font-semibold">
          Ein Berater findet meistens noch Spielraum
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Förderungen, Bank-Vergleich, alternative Sicherheiten – kostenlos und
          unverbindlich.
        </p>
        <Button asChild size="lg" className="mt-4 w-full sm:w-auto">
          <Link href="/lead?typ=finanzierung">
            <CalendarCheck aria-hidden />
            Optionen mit Berater prüfen
          </Link>
        </Button>
      </div>
    </>
  );
}

function NichtLeistbarView() {
  return (
    <>
      <div className="rounded-xl border bg-muted/40 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Heart className="h-4 w-4" aria-hidden />
          Ehrliche Einschätzung
        </div>
        <h1 className="mt-1 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Aktuell knapp – aber nicht aussichtslos
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Mit den aktuellen Eckdaten ist eine tragfähige Finanzierung
          schwierig. Aber: Sie haben womöglich Hebel, die noch nicht alle
          erkannt sind.
        </p>
      </div>

      <HiddenEquityTips />

      <div className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold">
          Update bekommen, wenn es passt?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Wir melden uns mit Marktinfos und Förderungs-Tipps für Ihre Region –
          ohne Spam, jederzeit abbestellbar.
        </p>
        <Button asChild size="lg" variant="outline" className="mt-4 w-full sm:w-auto">
          <Link href="/lead?typ=finanzierung">
            Newsletter-Update anfragen
          </Link>
        </Button>
      </div>
    </>
  );
}

function HiddenEquityTips() {
  return (
    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
          Verstecktes Eigenkapital — oft übersehen
        </h3>
      </div>
      <ul className="space-y-2 text-sm">
        <Tip
          title="Zweiter Kreditnehmer hinzufügen"
          body="Wer den Kredit gemeinsam mit Partner:in oder einer dritten Person aufnimmt, verdoppelt die DSTI-Basis. Oft der größte Hebel."
        />
        <Tip
          title="Bestehende Immobilie als Sicherheit"
          body="Auch eine vorhandene Wohnung oder Haus (auch elterlich) kann zu 70 % als Sicherheit dienen – minus Restschuld."
        />
        <Tip
          title="Eltern-Bürgschaft oder Schenkung"
          body="In AT üblich: Eltern verbürgen sich oder schenken einen Betrag schriftlich. Beides erhöht das Eigenkapital signifikant."
        />
        <Tip
          title="Wertpapier-Depot beleihen statt verkaufen"
          body="ETFs & Aktien können beliehen werden — Sie verlieren keine Renditechancen und haben trotzdem mehr EK."
        />
        <Tip
          title="Förderungen prüfen"
          body="Wohnbau­förderung (Bundesland), Jungfamilien-Bonus, Sanierungs­förderung. Spart oft 20–50 k über die Laufzeit."
        />
      </ul>
    </div>
  );
}

function Tip({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex items-start gap-2 rounded-md bg-background/60 p-2.5">
      <TrendingUp
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
        aria-hidden
      />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

function EkBreakdown() {
  const result = useCheckStore((s) => s.result)!;
  const rows = result.ekBreakdown.filter((r) => r.gezaehlt > 0);
  if (rows.length === 0) return null;
  return (
    <details className="rounded-lg border bg-card p-4 text-sm shadow-sm">
      <summary className="cursor-pointer font-semibold">
        Ihr Eigenkapital im Detail
      </summary>
      <dl className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.key}
            className="flex items-baseline justify-between gap-3 border-b border-dashed pb-1.5 last:border-0"
          >
            <dt className="text-muted-foreground">
              {r.label}
              {r.faktor < 1 ? (
                <span className="ml-1 text-xs">
                  ({Math.round(r.faktor * 100)} %)
                </span>
              ) : null}
            </dt>
            <dd className="font-semibold tabular-nums">
              {formatEuro(r.gezaehlt)}
            </dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 pt-2 text-base">
          <dt className="font-semibold">Gesamt</dt>
          <dd className="font-bold tabular-nums text-[color:var(--success)]">
            {formatEuro(result.eigenkapital)}
          </dd>
        </div>
      </dl>
    </details>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-4 shadow-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-xl font-semibold tabular-nums sm:text-2xl">
        {value}
      </span>
      {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
    </div>
  );
}
