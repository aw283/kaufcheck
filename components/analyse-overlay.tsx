"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { AmpelMark } from "@/components/brand";

const PHASEN = [
  "Ihre Angaben werden geprüft",
  "Aktuelle Banken-Konditionen werden abgerufen",
  "Passende Immobilien werden durchsucht",
  "Ihr persönliches Matching wird erstellt",
];

const PHASE_MS = 850;

export function AnalyseOverlay({ onComplete }: { onComplete: () => void }) {
  const [aktiv, setAktiv] = useState(0);

  useEffect(() => {
    if (aktiv >= PHASEN.length) {
      const t = setTimeout(onComplete, 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setAktiv((a) => a + 1), PHASE_MS);
    return () => clearTimeout(t);
  }, [aktiv, onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 px-6 backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-8">
        <div className="animate-pulse">
          <AmpelMark className="h-12 w-12" />
        </div>

        <div>
          <h2 className="text-center font-serif text-2xl sm:text-3xl">
            Wir analysieren Ihre Möglichkeiten …
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Einen Moment — das dauert nur wenige Sekunden.
          </p>
        </div>

        <ul className="w-full max-w-sm space-y-3">
          {PHASEN.map((label, i) => {
            const done = i < aktiv;
            const current = i === aktiv;
            return (
              <li
                key={label}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  done
                    ? "border-success/30 bg-success/5 text-foreground"
                    : current
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-border bg-surface text-muted-foreground"
                }`}
              >
                <span className="shrink-0">
                  {done ? (
                    <Check className="h-4 w-4 text-success" aria-hidden />
                  ) : current ? (
                    <Loader2
                      className="h-4 w-4 animate-spin text-primary"
                      aria-hidden
                    />
                  ) : (
                    <span className="block h-4 w-4 rounded-full border-2 border-border" />
                  )}
                </span>
                {label}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
