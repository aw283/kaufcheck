"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAnlegerStore } from "@/lib/anleger-store";
import { MODELL_INFO } from "@/lib/anleger";

export default function AnlageDanke() {
  const router = useRouter();
  const result = useAnlegerStore((s) => s.result);
  const reset = useAnlegerStore((s) => s.reset);

  useEffect(() => {
    if (!result) router.replace("/anlage");
  }, [result, router]);

  if (!result) return null;

  const info = MODELL_INFO[result.primaer];

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-xl border border-[color:var(--success)]/30 bg-[color:var(--success)]/5 p-6">
          <div className="flex items-center gap-2 text-[color:var(--success)]">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            <span className="text-sm font-semibold uppercase tracking-wide">Anfrage eingegangen</span>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Danke &mdash; wir melden uns.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Wir haben Ihr Profil erhalten und leiten es an einen passenden
            Anlageimmobilien-Spezialisten weiter. Sie h&ouml;ren in der Regel
            innerhalb von zwei Werktagen von uns.
          </p>
        </div>

        {/* Empfohlenes Modell */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold">Ihr empfohlenes Anlagemodell</h2>
          <p className="mt-2 font-serif text-xl text-primary">{info.titel}</p>
          <p className="mt-1 text-sm text-muted-foreground">{info.beschreibung}</p>
          <p className="mt-3 text-xs font-medium text-primary">
            Richtwert-Rendite: {info.renditeRange}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Eignung: {info.eignung}
          </p>
          <p className="mt-3 text-xs text-muted-foreground italic">
            {result.begruendung}
          </p>
        </div>

        {/* Alternativen */}
        {result.alternativen.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">Weitere Modelle im &Uuml;berblick:</p>
            <ul className="mt-2 space-y-1">
              {result.alternativen.map((alt) => (
                <li key={alt} className="text-sm text-muted-foreground">
                  &bull; {MODELL_INFO[alt].titel} &mdash; {MODELL_INFO[alt].eignung}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Hinweis-Kasten (wenn vorhanden) */}
        {result.hinweis ? (
          <div role="alert" className="rounded-lg border border-amber-300/40 bg-amber-50/60 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <p className="font-semibold">Hinweis</p>
            <p className="mt-1">{result.hinweis}</p>
          </div>
        ) : null}

        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>
            Tipp: Halten Sie Ihre Einkommens- und Steuerunterlagen bereit &mdash;
            das beschleunigt das Gespr&auml;ch mit dem Spezialisten erheblich.
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
              router.push("/anlage/anfrage");
            }}
          >
            Neue Anfrage starten
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          immoampel vermittelt Kontakte und bietet keine Steuer- oder
          Anlageberatung. Alle Angaben sind unverbindliche Richtwerte.
          Vor jeder Investition individuelle Pr&uuml;fung durch Steuerberater:in
          erforderlich.
        </p>
      </div>
    </main>
  );
}
