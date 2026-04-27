"use client";

import { useEffect, useMemo, useRef } from "react";

import { useKaufcheckStore } from "@/app/kaufcheck/lib/store";
import type { KaufcheckResult } from "@/app/kaufcheck/types";
import { analytics } from "@/lib/analytics";

import { ShareActions } from "./ergebnis/ShareActions";
import { LeistbarView } from "./ergebnis/LeistbarView";
import { GrenzfallView } from "./ergebnis/GrenzfallView";
import { NichtLeistbarView } from "./ergebnis/NichtLeistbarView";

function formatEuro(n: number): string {
  return Math.round(n).toLocaleString("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

function buildShareText(result: KaufcheckResult): {
  titel: string;
  zusammenfassung: string;
} {
  if (result.status === "leistbar") {
    return {
      titel: "Mein Immobilien-Kaufbudget",
      zusammenfassung: `Mein leistbarer Kaufrahmen laut ImmoScout-Kaufcheck: bis ${formatEuro(
        result.maxKaufpreis
      )} (Monatsrate ${formatEuro(result.monatlicheRate)}).`,
    };
  }
  if (result.status === "grenzfall") {
    return {
      titel: "Kaufcheck-Ergebnis: Grenzfall",
      zusammenfassung: `Grenzfall-Ergebnis vom ImmoScout-Kaufcheck: aktuell bis ${formatEuro(
        result.maxKaufpreis
      )}. Mit Anpassungen (mehr EK, längere Laufzeit) erweiterbar.`,
    };
  }
  return {
    titel: "Kaufcheck-Ergebnis",
    zusammenfassung:
      "Mein ImmoScout-Kaufcheck zeigt: ein Immobilien­kauf ist aktuell noch nicht die beste Option – es gibt aber einen klaren Plan für die nächsten 12 Monate.",
  };
}

export function ErgebnisStep() {
  const input = useKaufcheckStore((s) => s.data);
  const result = useKaufcheckStore((s) => s.result);
  const calculate = useKaufcheckStore((s) => s.calculate);

  useEffect(() => {
    if (!result) calculate();
  }, [result, calculate]);

  // Analytics: einmal pro berechnetem Ergebnis feuern.
  const trackedStatus = useRef<string | null>(null);
  useEffect(() => {
    if (!result) return;
    const key = `${result.status}:${result.maxKaufpreis}:${result.laufzeitJahre}`;
    if (trackedStatus.current === key) return;
    trackedStatus.current = key;
    analytics.calculated(
      result.status,
      result.maxKaufpreis,
      result.laufzeitJahre
    );
  }, [result]);

  const share = useMemo(
    () => (result ? buildShareText(result) : null),
    [result]
  );

  if (!result || !share) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Ergebnis wird berechnet …
      </div>
    );
  }

  return (
    <div className="space-y-6" id="kaufcheck-ergebnis">
      {result.status === "leistbar" && (
        <LeistbarView input={input} result={result} />
      )}
      {result.status === "grenzfall" && (
        <GrenzfallView input={input} result={result} />
      )}
      {result.status === "nicht_leistbar" && (
        <NichtLeistbarView input={input} result={result} />
      )}

      {result.hinweise.length > 0 && (
        <section className="rounded-lg border bg-muted/30 p-4 text-sm print:border-0 print:bg-transparent print:p-0">
          <h3 className="mb-2 text-sm font-semibold">Hinweise zu Ihrer Berechnung</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {result.hinweise.map((h, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden>•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ShareActions
        titel={share.titel}
        zusammenfassung={share.zusammenfassung}
      />
    </div>
  );
}
