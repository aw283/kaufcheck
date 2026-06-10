// KIM-V-konforme Leistbarkeits-Berechnung für AT-Wohnkredite.
// Pure function – kein React, keine I/O.

export const CONFIG = {
  DSTI_MAX: 0.4,
  EK_QUOTE_MIN: 0.2,
  ZINSSATZ_PA: 0.035,
  LAUFZEIT_DEFAULT: 30,
  ENDALTER_MAX: 80,
  NEBENKOSTEN_QUOTE: 0.1,
} as const;

export type Bundesland =
  | "wien" | "noe" | "ooe" | "sbg" | "tirol" | "vbg" | "stmk" | "ktn" | "bgld";
export type Immobilienart = "wohnung" | "haus";
export type Status = "leistbar" | "grenzfall" | "nicht_leistbar";

export interface CheckInput {
  netto: number;
  raten: number;
  fix: number;
  eigenkapital: number;
  bundesland: Bundesland;
  immobilienart: Immobilienart;
  wunschKaufpreis: number;
  alter: number;
  erwachsene: number;
  kinder: number;
}

export interface CheckResult {
  status: Status;
  maxKaufpreis: number;
  maxKredit: number;
  monatlicheRate: number;
  ekQuote: number;
  nebenkosten: number;
  laufzeitJahre: number;
}

function clampInt(n: unknown, min: number, max: number, fallback: number) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.floor(Math.min(Math.max(v, min), max));
}
function clampNum(n: unknown, min: number, max: number, fallback = 0) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(Math.max(v, min), max);
}

export function berechne(input: CheckInput): CheckResult {
  const alter = clampInt(input.alter, 18, 120, 35);
  const netto = clampNum(input.netto, 0, 1_000_000);
  const raten = clampNum(input.raten, 0, 500_000);
  const fix = clampNum(input.fix, 0, 500_000);
  const ek = clampNum(input.eigenkapital, 0, 50_000_000);

  const laufzeitJahre = Math.max(
    1,
    Math.min(CONFIG.LAUFZEIT_DEFAULT, CONFIG.ENDALTER_MAX - alter)
  );

  const verfügbar = Math.max(0, netto * CONFIG.DSTI_MAX - raten - fix);

  const i = CONFIG.ZINSSATZ_PA / 12;
  const n = laufzeitJahre * 12;
  const pvFactor = i === 0 ? n : (1 - Math.pow(1 + i, -n)) / i;
  const maxKredit = verfügbar * pvFactor;

  const gesamtbudget = ek + maxKredit;
  const maxKaufpreis = gesamtbudget / (1 + CONFIG.NEBENKOSTEN_QUOTE);
  const nebenkosten = maxKaufpreis * CONFIG.NEBENKOSTEN_QUOTE;
  const ekQuote = gesamtbudget > 0 ? ek / gesamtbudget : 0;

  let status: Status;
  if (maxKaufpreis < 100_000 || verfügbar < 300) {
    status = "nicht_leistbar";
  } else if (
    (maxKaufpreis >= 100_000 && maxKaufpreis < 150_000) ||
    (ekQuote >= 0.15 && ekQuote < CONFIG.EK_QUOTE_MIN)
  ) {
    status = "grenzfall";
  } else if (
    maxKaufpreis >= 150_000 &&
    ekQuote >= CONFIG.EK_QUOTE_MIN &&
    verfügbar > 500
  ) {
    status = "leistbar";
  } else {
    status = "grenzfall";
  }

  return {
    status,
    maxKaufpreis: Math.round(maxKaufpreis),
    maxKredit: Math.round(maxKredit),
    monatlicheRate: Math.round(verfügbar),
    ekQuote: Math.round(ekQuote * 100) / 100,
    nebenkosten: Math.round(nebenkosten),
    laufzeitJahre,
  };
}

export function formatEuro(n: number): string {
  return Math.round(n).toLocaleString("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}
