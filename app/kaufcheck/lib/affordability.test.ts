import { describe, it, expect } from "vitest";

import type { KaufcheckInput } from "@/app/kaufcheck/types";
import {
  DEFAULT_LAUFZEIT,
  DEFAULT_ZINSSATZ,
} from "@/app/kaufcheck/lib/constants";
import { berechneLeistbarkeit, CONFIG } from "./affordability";

/**
 * Hilfs-Builder, der ein KaufcheckInput-Objekt mit sinnvollen Defaults liefert.
 * Nur die im Test relevanten Felder werden überschrieben.
 */
function input(overrides: {
  erwachsene?: number;
  kinder?: number;
  alter?: number;
  einkommensart?: KaufcheckInput["haushalt"]["einkommensart"];
  netto?: number;
  bestehende?: number;
  fix?: number;
  ek?: number;
  bundesland?: KaufcheckInput["vorstellung"]["bundesland"];
}): KaufcheckInput {
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

describe("berechneLeistbarkeit", () => {
  it("Standardfall: Familie 2+1 in Wien, 4.500 € netto, 80 k EK → leistbar", () => {
    const result = berechneLeistbarkeit(
      input({
        erwachsene: 2,
        kinder: 1,
        alter: 35,
        netto: 4500,
        ek: 80_000,
      })
    );

    expect(result.status).toBe("leistbar");
    expect(result.laufzeitJahre).toBe(30);
    // EK-Korrektur greift (80k / 400k = 20 % genau)
    expect(result.eigenmittelquote).toBeCloseTo(0.2, 2);
    expect(result.maxKaufpreis).toBeGreaterThan(150_000);
    expect(result.monatlicheRate).toBeGreaterThan(500);
    expect(result.kimvErfuellt.eigenmittelquote).toBe(true);
    expect(result.kimvErfuellt.belastungsquote).toBe(true);
    expect(
      result.hinweise.some((h) => /berater|beratung/i.test(h))
    ).toBe(true);
  });

  it("Single: 3.000 € netto, 30 k EK → grenzfall", () => {
    const result = berechneLeistbarkeit(
      input({
        erwachsene: 1,
        kinder: 0,
        alter: 35,
        netto: 3000,
        ek: 30_000,
      })
    );

    expect(result.status).toBe("grenzfall");
    // Nach EK-Korrektur liegt maxKaufpreis im Band 100–150k
    expect(result.maxKaufpreis).toBeGreaterThanOrEqual(100_000);
    expect(result.maxKaufpreis).toBeLessThan(150_000);
  });

  it("Familie: 3.500 € netto, 2 Kinder, 10 k EK → nicht_leistbar", () => {
    const result = berechneLeistbarkeit(
      input({
        erwachsene: 2,
        kinder: 2,
        alter: 35,
        netto: 3500,
        ek: 10_000,
      })
    );

    expect(result.status).toBe("nicht_leistbar");
    // Nach EK-Korrektur bleibt nur noch < 100 k übrig (EK × 5 = 50 k gesamt)
    expect(result.maxKaufpreis).toBeLessThan(100_000);
    expect(result.hinweise.length).toBeGreaterThan(0);
  });

  it("Pensionist 65 Jahre → Laufzeit auf 15 Jahre begrenzt", () => {
    const jungOhneBegrenzung = berechneLeistbarkeit(
      input({
        erwachsene: 1,
        alter: 35,
        netto: 5000,
        ek: 150_000,
      })
    );
    const pensionist = berechneLeistbarkeit(
      input({
        erwachsene: 1,
        alter: 65,
        einkommensart: "pension",
        netto: 5000,
        ek: 150_000,
      })
    );

    // 80 - 65 = 15 (schlägt auf LAUFZEIT_JAHRE_DEFAULT=30 durch)
    expect(pensionist.laufzeitJahre).toBe(15);
    expect(jungOhneBegrenzung.laufzeitJahre).toBe(30);

    // Kürzere Laufzeit → geringere Kreditsumme → kleinerer Kaufpreis-Rahmen
    expect(pensionist.maxKreditsumme).toBeLessThan(
      jungOhneBegrenzung.maxKreditsumme
    );
    expect(pensionist.maxKaufpreis).toBeLessThan(
      jungOhneBegrenzung.maxKaufpreis
    );
  });

  it("Hohes Einkommen mit bestehenden Kreditraten → reduziertes Budget", () => {
    const ohneAltlasten = berechneLeistbarkeit(
      input({
        erwachsene: 1,
        alter: 35,
        netto: 8000,
        ek: 100_000,
      })
    );
    const mitAltlasten = berechneLeistbarkeit(
      input({
        erwachsene: 1,
        alter: 35,
        netto: 8000,
        bestehende: 2000,
        fix: 500,
        ek: 100_000,
      })
    );

    // Mit Altlasten bleibt deutlich weniger für neue Kreditrate übrig
    expect(mitAltlasten.monatlicheRate).toBeLessThan(
      ohneAltlasten.monatlicheRate
    );
    // → und damit auch kleinere maxKreditsumme / maxKaufpreis
    expect(mitAltlasten.maxKreditsumme).toBeLessThan(
      ohneAltlasten.maxKreditsumme
    );
    expect(mitAltlasten.maxKaufpreis).toBeLessThan(ohneAltlasten.maxKaufpreis);

    // Verfügbar für neue Rate: 8000 × 0.40 − 2000 − 500 = 700 (> 500 → noch leistbar)
    expect(mitAltlasten.monatlicheRate).toBeCloseTo(700, 0);
    expect(mitAltlasten.status).toBe("leistbar");
  });

  it("Edge Case: 0 € Eigenkapital → nicht_leistbar", () => {
    const result = berechneLeistbarkeit(
      input({
        erwachsene: 2,
        kinder: 1,
        alter: 35,
        netto: 4500,
        ek: 0,
      })
    );

    expect(result.status).toBe("nicht_leistbar");
    expect(result.maxKaufpreis).toBe(0);
    expect(result.eigenmittelquote).toBe(0);
    expect(result.kimvErfuellt.eigenmittelquote).toBe(false);
    // Hinweis muss explizit auf fehlendes Eigenkapital eingehen
    expect(
      result.hinweise.some((h) => h.toLowerCase().includes("eigenkapital"))
    ).toBe(true);
  });

  it("CONFIG-Werte entsprechen der Spezifikation", () => {
    expect(CONFIG.DSTI_MAX).toBe(0.4);
    expect(CONFIG.EK_QUOTE_MIN).toBe(0.2);
    expect(CONFIG.LAUFZEIT_JAHRE_DEFAULT).toBe(30);
    expect(CONFIG.ENDALTER_MAX).toBe(80);
    expect(CONFIG.ZINSSATZ_DEFAULT).toBe(0.035);
    expect(CONFIG.NEBENKOSTEN_QUOTE).toBe(0.1);
    expect(CONFIG.PUFFER_HAUSHALT_PRO_PERSON).toBe(350);
    expect(CONFIG.PUFFER_PRO_KIND).toBe(250);
  });
});
