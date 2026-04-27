"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useKaufcheckStore } from "@/app/kaufcheck/lib/store";

const PRESETS = [
  {
    label: "Familie leistbar",
    data: {
      haushalt: {
        erwachsene: 2,
        kinder: 1,
        alterHauptantragsteller: 36,
        einkommensart: "unbefristet" as const,
      },
      finanzen: {
        nettoEinkommen: 4500,
        bestehendeKreditraten: 0,
        sonstigeFixkosten: 200,
      },
      vorstellung: {
        eigenkapital: 80_000,
        bundesland: "wien" as const,
        immobilienart: "wohnung" as const,
        wunschKaufpreis: 350_000,
        keineKaufpreisVorstellung: false,
      },
    },
  },
  {
    label: "Single grenzfall",
    data: {
      haushalt: {
        erwachsene: 1,
        kinder: 0,
        alterHauptantragsteller: 34,
        einkommensart: "unbefristet" as const,
      },
      finanzen: {
        nettoEinkommen: 3000,
        bestehendeKreditraten: 0,
        sonstigeFixkosten: 0,
      },
      vorstellung: {
        eigenkapital: 30_000,
        bundesland: "stmk" as const,
        immobilienart: "wohnung" as const,
        wunschKaufpreis: 200_000,
        keineKaufpreisVorstellung: false,
      },
    },
  },
  {
    label: "Nicht leistbar",
    data: {
      haushalt: {
        erwachsene: 2,
        kinder: 2,
        alterHauptantragsteller: 38,
        einkommensart: "befristet" as const,
      },
      finanzen: {
        nettoEinkommen: 3200,
        bestehendeKreditraten: 350,
        sonstigeFixkosten: 150,
      },
      vorstellung: {
        eigenkapital: 10_000,
        bundesland: "noe" as const,
        immobilienart: "haus" as const,
        wunschKaufpreis: 0,
        keineKaufpreisVorstellung: true,
      },
    },
  },
];

/** Rendert NUR in Nicht-Production-Builds. */
export function DevSeedButton() {
  const setState = useKaufcheckStore.setState;

  if (process.env.NODE_ENV === "production") return null;

  const applyPreset = (idx: number) => {
    const preset = PRESETS[idx];
    setState((s) => ({
      data: {
        haushalt: { ...s.data.haushalt, ...preset.data.haushalt },
        finanzen: { ...s.data.finanzen, ...preset.data.finanzen },
        vorstellung: { ...s.data.vorstellung, ...preset.data.vorstellung },
      },
    }));
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex flex-col gap-1.5 rounded-lg border-2 border-dashed border-primary/40 bg-background/95 p-2 shadow-lg backdrop-blur print:hidden"
      role="group"
      aria-label="Entwickler: Beispielwerte einfügen"
    >
      <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
        Dev · Beispielwerte
      </span>
      {PRESETS.map((p, i) => (
        <Button
          key={p.label}
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 justify-start gap-1.5 px-2 text-xs"
          onClick={() => applyPreset(i)}
        >
          <Sparkles className="h-3 w-3" aria-hidden />
          {p.label}
        </Button>
      ))}
    </div>
  );
}
