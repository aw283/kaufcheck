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

// Beleihungsfaktoren wie sie AT-Banken (Erste, Raiffeisen, BAWAG, ING)
// üblicherweise anrechnen. Konservativ-realistisch – nicht überoptimistisch.
export const BELEIHUNG = {
  sparguthaben: 1.0,
  wertpapiere: 0.7,
  edelmetalle: 0.7,
  lebensversicherung: 1.0,
  schenkung: 1.0,
  // Immobilie wird gesondert berechnet: 70% Verkehrswert − Restschuld
  immobilie: 0.7,
} as const;

export type Bundesland =
  | "wien" | "noe" | "ooe" | "sbg" | "tirol" | "vbg" | "stmk" | "ktn" | "bgld";
export type Immobilienart = "wohnung" | "haus";
export type Status = "leistbar" | "grenzfall" | "nicht_leistbar";

export interface Assets {
  sparguthaben: number;
  wertpapiere: number;
  edelmetalle: number;
  lebensversicherung: number;
  schenkung: number;
  immobilie_wert: number;
  immobilie_restschuld: number;
}

export interface CheckInput {
  netto: number;
  raten: number;
  fix: number;
  assets: Assets;
  bundesland: Bundesland;
  immobilienart: Immobilienart;
  wunschKaufpreis: number;
  alter: number;
  erwachsene: number;
  kinder: number;
}

export interface EkRow {
  key: keyof Assets | "immobilie";
  label: string;
  raw: number;
  gezaehlt: number;
  faktor: number;
}

export interface CheckResult {
  status: Status;
  maxKaufpreis: number;
  maxKredit: number;
  monatlicheRate: number;
  eigenkapital: number;
  ekQuote: number;
  nebenkosten: number;
  laufzeitJahre: number;
  ekBreakdown: EkRow[];
}

function num(n: unknown, min: number, max: number, fb = 0): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fb;
  return Math.min(Math.max(v, min), max);
}
function int(n: unknown, min: number, max: number, fb: number): number {
  return Math.floor(num(n, min, max, fb));
}

export function eigenkapitalAus(a: Assets): {
  total: number;
  rows: EkRow[];
} {
  const sparguthaben = num(a.sparguthaben, 0, 5_000_000);
  const wertpapiere = num(a.wertpapiere, 0, 5_000_000);
  const edelmetalle = num(a.edelmetalle, 0, 5_000_000);
  const lebensvers = num(a.lebensversicherung, 0, 5_000_000);
  const schenkung = num(a.schenkung, 0, 5_000_000);
  const immoWert = num(a.immobilie_wert, 0, 10_000_000);
  const immoSchuld = num(a.immobilie_restschuld, 0, 10_000_000);

  const immoEk = Math.max(0, immoWert * BELEIHUNG.immobilie - immoSchuld);

  const rows: EkRow[] = [
    {
      key: "sparguthaben",
      label: "Spar- & Bausparguthaben",
      raw: sparguthaben,
      gezaehlt: sparguthaben * BELEIHUNG.sparguthaben,
      faktor: BELEIHUNG.sparguthaben,
    },
    {
      key: "wertpapiere",
      label: "Wertpapiere, ETFs, Aktien",
      raw: wertpapiere,
      gezaehlt: wertpapiere * BELEIHUNG.wertpapiere,
      faktor: BELEIHUNG.wertpapiere,
    },
    {
      key: "edelmetalle",
      label: "Gold & Edelmetalle",
      raw: edelmetalle,
      gezaehlt: edelmetalle * BELEIHUNG.edelmetalle,
      faktor: BELEIHUNG.edelmetalle,
    },
    {
      key: "lebensversicherung",
      label: "Lebensversicherung (Rückkaufswert)",
      raw: lebensvers,
      gezaehlt: lebensvers * BELEIHUNG.lebensversicherung,
      faktor: BELEIHUNG.lebensversicherung,
    },
    {
      key: "schenkung",
      label: "Schenkung / Erbe",
      raw: schenkung,
      gezaehlt: schenkung * BELEIHUNG.schenkung,
      faktor: BELEIHUNG.schenkung,
    },
    {
      key: "immobilie",
      label: "Bestehende Immobilie (beleihbar)",
      raw: immoWert,
      gezaehlt: immoEk,
      faktor: BELEIHUNG.immobilie,
    },
  ];

  const total = rows.reduce((s, r) => s + r.gezaehlt, 0);
  return { total, rows };
}

export function berechne(input: CheckInput): CheckResult {
  const alter = int(input.alter, 18, 120, 35);
  const netto = num(input.netto, 0, 1_000_000);
  const raten = num(input.raten, 0, 500_000);
  const fix = num(input.fix, 0, 500_000);

  const { total: eigenkapital, rows: ekBreakdown } = eigenkapitalAus(
    input.assets
  );

  const laufzeitJahre = Math.max(
    1,
    Math.min(CONFIG.LAUFZEIT_DEFAULT, CONFIG.ENDALTER_MAX - alter)
  );

  const verfügbar = Math.max(0, netto * CONFIG.DSTI_MAX - raten - fix);

  const i = CONFIG.ZINSSATZ_PA / 12;
  const n = laufzeitJahre * 12;
  const pvFactor = i === 0 ? n : (1 - Math.pow(1 + i, -n)) / i;
  const maxKredit = verfügbar * pvFactor;

  const gesamtbudget = eigenkapital + maxKredit;
  const maxKaufpreis = gesamtbudget / (1 + CONFIG.NEBENKOSTEN_QUOTE);
  const nebenkosten = maxKaufpreis * CONFIG.NEBENKOSTEN_QUOTE;
  const ekQuote = gesamtbudget > 0 ? eigenkapital / gesamtbudget : 0;

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
    eigenkapital: Math.round(eigenkapital),
    ekQuote: Math.round(ekQuote * 100) / 100,
    nebenkosten: Math.round(nebenkosten),
    laufzeitJahre,
    ekBreakdown: ekBreakdown.map((r) => ({
      ...r,
      gezaehlt: Math.round(r.gezaehlt),
    })),
  };
}

export function formatEuro(n: number): string {
  return Math.round(n).toLocaleString("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

export function emptyAssets(): Assets {
  return {
    sparguthaben: 0,
    wertpapiere: 0,
    edelmetalle: 0,
    lebensversicherung: 0,
    schenkung: 0,
    immobilie_wert: 0,
    immobilie_restschuld: 0,
  };
}
