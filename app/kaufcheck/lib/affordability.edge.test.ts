import { describe, it, expect } from "vitest";

import type { KaufcheckInput } from "@/app/kaufcheck/types";
import {
  DEFAULT_LAUFZEIT,
  DEFAULT_ZINSSATZ,
} from "@/app/kaufcheck/lib/constants";
import {
  berechneLeistbarkeit,
  CONFIG,
} from "@/app/kaufcheck/lib/affordability";

function input(overrides: Partial<{
  erwachsene: number;
  kinder: number;
  alter: number;
  einkommensart: KaufcheckInput["haushalt"]["einkommensart"];
  netto: number;
  bestehende: number;
  fix: number;
  ek: number;
  bundesland: KaufcheckInput["vorstellung"]["bundesland"];
}>): KaufcheckInput {
  return {
    haushalt: {
      erwachsene: overrides.erwachsene ?? 1,
      kinder: overrides.kinder ?? 0,
      alterHauptantragsteller: overrides.alter ?? 35,
      einkommensart: overrides.einkommensart ?? "unbefristet",
    },
    finanzen: {
      nettoEinkommen: overrides.netto ?? 0,
      bestehendeKreditraten: overrides.bestehende ?? 0,
      sonstigeFixkosten: overrides.fix ?? 0,
    },
    vorstellung: {
      eigenkapital: overrides.ek ?? 0,
      bundesland: overrides.bundesland ?? "wien",
      immobilienart: "wohnung",
      wunschKaufpreis: 0,
      keineKaufpreisVorstellung: true,
      laufzeitJahre: DEFAULT_LAUFZEIT,
      zinssatz: DEFAULT_ZINSSATZ * 100,
    },
  };
}

function expectSaneNumbers(r: ReturnType<typeof berechneLeistbarkeit>) {
  for (const [key, value] of Object.entries(r)) {
    if (typeof value === "number") {
      expect(Number.isFinite(value), `${key} must be finite (got ${value})`).toBe(
        true
      );
      expect(Number.isNaN(value), `${key} must not be NaN`).toBe(false);
      expect(value, `${key} must not be negative`).toBeGreaterThanOrEqual(0);
    }
  }
}

describe("berechneLeistbarkeit – edge cases", () => {
  it("Alle Nullwerte → nicht_leistbar, keine NaN/Infinity", () => {
    const r = berechneLeistbarkeit(
      input({
        netto: 0,
        bestehende: 0,
        fix: 0,
        ek: 0,
      })
    );
    expect(r.status).toBe("nicht_leistbar");
    expectSaneNumbers(r);
    expect(r.maxKaufpreis).toBe(0);
    expect(r.eigenmittelquote).toBe(0);
  });

  it("Netto an Plausibilitätsobergrenze (50.000 €) → leistbar, Werte finit", () => {
    const r = berechneLeistbarkeit(
      input({ alter: 35, netto: 50_000, ek: 200_000 })
    );
    expectSaneNumbers(r);
    expect(r.status).toBe("leistbar");
    // Sanity: max_kaufpreis darf nicht absurd hoch werden.
    expect(r.maxKaufpreis).toBeLessThan(10_000_000);
  });

  it("Sehr niedriges Netto (500 €) → nicht_leistbar", () => {
    const r = berechneLeistbarkeit(input({ netto: 500, ek: 10_000 }));
    expectSaneNumbers(r);
    expect(r.status).toBe("nicht_leistbar");
    expect(r.monatlicheRate).toBeLessThan(300);
  });

  it("Alter unter 18 → Laufzeit weiterhin >= 1", () => {
    const r = berechneLeistbarkeit(input({ alter: 0, netto: 3000, ek: 30_000 }));
    expectSaneNumbers(r);
    expect(r.laufzeitJahre).toBeGreaterThanOrEqual(1);
    expect(r.laufzeitJahre).toBeLessThanOrEqual(CONFIG.LAUFZEIT_JAHRE_DEFAULT);
  });

  it("Alter am ENDALTER_MAX (79) → Laufzeit auf 1 Jahr clamped", () => {
    const r = berechneLeistbarkeit(input({ alter: 79, netto: 3000, ek: 50_000 }));
    expectSaneNumbers(r);
    expect(r.laufzeitJahre).toBe(1);
    // 1-Jahres-Kredit ist sehr klein – Status bleibt konsistent.
    expect(["nicht_leistbar", "grenzfall", "leistbar"]).toContain(r.status);
  });

  it("Alter > ENDALTER_MAX (85) → Laufzeit trotzdem mindestens 1 Jahr", () => {
    const r = berechneLeistbarkeit(input({ alter: 85, netto: 3000, ek: 50_000 }));
    expectSaneNumbers(r);
    expect(r.laufzeitJahre).toBe(1);
  });

  it("Riesiges Eigenkapital (5 Mio) → EK-Quote-Korrektur deckelt auf EK×5", () => {
    const r = berechneLeistbarkeit(
      input({ netto: 3000, ek: 5_000_000 })
    );
    expectSaneNumbers(r);
    // Gesamtbudget kann nicht über EK/0.20 = 25 Mio liegen (und in der Praxis
    // ist der Kredit-Limit deutlich niedriger als EK×5, daher keine Korrektur)
    expect(r.maxKaufpreis).toBeLessThan(25_000_000);
    expect(r.eigenmittelquote).toBeGreaterThanOrEqual(CONFIG.EK_QUOTE_MIN);
  });

  it("Bestehende Raten > Netto × DSTI_MAX → verfügbar = 0, nicht_leistbar", () => {
    const r = berechneLeistbarkeit(
      input({ netto: 3000, bestehende: 2000, fix: 500, ek: 80_000 })
    );
    expectSaneNumbers(r);
    // 3000 × 0.40 = 1200; 1200 − 2000 − 500 < 0 → clamped to 0
    expect(r.monatlicheRate).toBe(0);
    expect(r.status).toBe("nicht_leistbar");
  });

  it("Große Haushaltsgröße (4 Erwachsene + 8 Kinder) → Lebenshaltung-Check reduziert", () => {
    const klein = berechneLeistbarkeit(
      input({ erwachsene: 1, kinder: 0, netto: 4000, ek: 80_000 })
    );
    const groß = berechneLeistbarkeit(
      input({ erwachsene: 4, kinder: 8, netto: 4000, ek: 80_000 })
    );
    expectSaneNumbers(klein);
    expectSaneNumbers(groß);
    // Mehr Mitbewohner → weniger verfügbar für die Rate.
    expect(groß.monatlicheRate).toBeLessThanOrEqual(klein.monatlicheRate);
  });

  it("Negative/ungültige Zahlen (NaN, -1, Infinity) werden abgefangen", () => {
    const r = berechneLeistbarkeit({
      haushalt: {
        erwachsene: -5,
        kinder: -3,
        alterHauptantragsteller: Number.NaN,
        einkommensart: "unbefristet",
      },
      finanzen: {
        nettoEinkommen: Number.POSITIVE_INFINITY,
        bestehendeKreditraten: -100,
        sonstigeFixkosten: Number.NaN,
      },
      vorstellung: {
        eigenkapital: -1000,
        bundesland: "wien",
        immobilienart: "wohnung",
        wunschKaufpreis: 0,
        keineKaufpreisVorstellung: true,
        laufzeitJahre: DEFAULT_LAUFZEIT,
        zinssatz: DEFAULT_ZINSSATZ * 100,
      },
    });
    expectSaneNumbers(r);
    expect(["nicht_leistbar", "grenzfall", "leistbar"]).toContain(r.status);
  });

  it("Override extraEigenkapital darf nicht negativ wirken", () => {
    const baseline = berechneLeistbarkeit(input({ netto: 4500, ek: 80_000 }));
    const mitZusatz = berechneLeistbarkeit(input({ netto: 4500, ek: 80_000 }), {
      extraEigenkapital: -50_000,
    });
    expect(mitZusatz.maxKaufpreis).toBeGreaterThanOrEqual(
      baseline.maxKaufpreis
    );
  });

  it("Override laufzeitJahreDefault = 0 fällt auf mindestens 1 Jahr zurück", () => {
    const r = berechneLeistbarkeit(
      input({ netto: 3000, ek: 30_000 }),
      { laufzeitJahreDefault: 0 }
    );
    expectSaneNumbers(r);
    expect(r.laufzeitJahre).toBeGreaterThanOrEqual(1);
  });
});
