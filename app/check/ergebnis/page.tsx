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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCheckStore } from "@/lib/store";
import { formatEuro } from "@/lib/calc";
import { SiteFooter } from "@/components/site-footer";

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

      <SiteFooter />
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
          <Stat label="Monatliche Rate" value={`${formatEuro(result.monatlicheRate)}`} sub={`${result.laufzeitJahre} Jahre Laufzeit`} />
          <Stat label="Eigenkapitalquote" value={`${Math.round(result.ekQuote * 100)} %`} sub="KIM-V-Minimum: 20 %" />
          <Stat label="Nebenkosten (~10 %)" value={formatEuro(result.nebenkosten)} sub="GrESt, Notar, Makler" />
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
          Aktueller Rahmen: <strong className="text-foreground">{formatEuro(result.maxKaufpreis)}</strong> · Monatsrate: <strong className="text-foreground">{formatEuro(result.monatlicheRate)}</strong>
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Tip title="Mehr Eigenkapital">
            Schon +20.000 € erweitern den Rahmen spürbar – auch
            Familien­bürgschaften oder Bauspardarlehen zählen.
          </Tip>
          <Tip title="Längere Laufzeit">
            Bis zu 35 Jahre KIM-V-konform – senkt die Monats­rate und erweitert
            den maximalen Kaufpreis.
          </Tip>
        </div>
      </div>

      <div className="rounded-lg border bg-primary/5 p-5">
        <h2 className="text-lg font-semibold">
          Welche Stellschraube passt zu Ihnen?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ein unabhängiger Berater zeigt Ihnen Förderungen und Bank-Optionen,
          die Sie selbst nicht finden würden.
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
          Aktuell noch nicht der richtige Zeitpunkt
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Mit Ihren aktuellen Eckdaten ist eine tragfähige Finanzierung
          schwierig. Das heißt nicht, dass der Wunsch auf Eis liegt – sondern
          dass ein Zwischen­schritt sinnvoller ist (Eigen­kapital aufbauen,
          bestehende Kredite ablösen, Förderungen prüfen).
        </p>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold">Update bekommen, wenn es passt?</h2>
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

function Tip({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{children}</p>
    </div>
  );
}
