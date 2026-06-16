"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBautraegerStore } from "@/lib/bautraeger-store";
import { PARTNERWEG_LABEL } from "@/lib/bautraeger";

export default function BautraegerDanke() {
  const router = useRouter();
  const result = useBautraegerStore((s) => s.result);
  const reset = useBautraegerStore((s) => s.reset);

  useEffect(() => {
    if (!result) router.replace("/bautraeger");
  }, [result, router]);

  if (!result) return null;
  const weg = PARTNERWEG_LABEL[result.weg];

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-xl border border-[color:var(--success)]/30 bg-[color:var(--success)]/5 p-6">
          <div className="flex items-center gap-2 text-[color:var(--success)]">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            <span className="text-sm font-semibold uppercase tracking-wide">Anfrage eingegangen</span>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Danke — wir melden uns.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Wir haben Ihr Projekt erhalten und ordnen es einem passenden
            Kapitalpartner zu. Sie hören in der Regel innerhalb von zwei
            Werktagen von uns.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold">Ihr empfohlener Weg</h2>
          <p className="mt-2 font-serif text-xl text-primary">{weg.titel}</p>
          <p className="mt-1 text-sm text-muted-foreground">{weg.beschreibung}</p>
          {result.ekFlag === "knapp" ? (
            <p className="mt-3 rounded-md bg-warning/10 p-3 text-xs text-[color:var(--warning)]">
              Hinweis: Ihre Eigenkapital-Quote liegt unter 15 %. Viele Geldgeber
              erwarten mehr — wir besprechen mögliche Strukturen mit Ihnen.
            </p>
          ) : null}
        </div>

        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>
            Tipp: Halten Sie Projektkalkulation, Grundstücksnachweis und (falls
            vorhanden) die Baugenehmigung bereit — das beschleunigt das Gespräch
            mit dem Kapitalgeber.
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/">Zur Startseite</Link>
          </Button>
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => {
              reset();
              router.push("/bautraeger/anfrage");
            }}
          >
            Weiteres Projekt einreichen
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          immoampel vermittelt Kontakte und bietet keine Anlage- oder
          Finanzierungsberatung. Kein Angebot und keine Zusage von Kapital.
        </p>
      </div>
    </main>
  );
}
