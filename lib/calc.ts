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

// ============================================================
// Calculation Audit — Nachvollziehbarkeit jeder Zwischen­rechnung
// ============================================================

export interface CalcAuditStep {
  formel: string;
  ergebnis: number;
}
export interface CalcAudit {
  laufzeitJahre: CalcAuditStep & {
    alter: number;
    default: number;
    endalterMax: number;
  };
  verfuegbar: CalcAuditStep & {
    netto: number;
    dstiMax: number;
    raten: number;
    fix: number;
  };
  pvFactor: CalcAuditStep & {
    zinsPa: number;
    zinsMonatlich: number;
    monate: number;
  };
  maxKredit: CalcAuditStep & {
    verfuegbar: number;
    pvFactor: number;
  };
  ekBreakdown: EkRow[];
  eigenkapital: { total: number; formel: string };
  gesamtbudget: CalcAuditStep & {
    eigenkapital: number;
    maxKredit: number;
  };
  maxKaufpreis: CalcAuditStep & {
    gesamtbudget: number;
    nebenkostenQuote: number;
  };
  nebenkosten: CalcAuditStep & {
    maxKaufpreis: number;
    quote: number;
  };
  ekQuote: CalcAuditStep & {
    eigenkapital: number;
    gesamtbudget: number;
  };
  statusEntscheidung: {
    geprueft: string[];
    griff: string;
    status: Status;
  };
}

const fmt = (n: number) => Math.round(n).toLocaleString("de-AT");
const fmt2 = (n: number) => n.toFixed(4);

export function berechneMitAudit(
  input: CheckInput
): { result: CheckResult; audit: CalcAudit } {
  const alter = int(input.alter, 18, 120, 35);
  const netto = num(input.netto, 0, 1_000_000);
  const raten = num(input.raten, 0, 500_000);
  const fix = num(input.fix, 0, 500_000);

  const ek = eigenkapitalAus(input.assets);
  const eigenkapital = ek.total;

  // 1) Laufzeit
  const laufzeitJahre = Math.max(
    1,
    Math.min(CONFIG.LAUFZEIT_DEFAULT, CONFIG.ENDALTER_MAX - alter)
  );

  // 2) Verfügbar für Schuldendienst
  const verfuegbar = Math.max(0, netto * CONFIG.DSTI_MAX - raten - fix);

  // 3) PV-Annuitäten-Faktor
  const i = CONFIG.ZINSSATZ_PA / 12;
  const n = laufzeitJahre * 12;
  const pvFactor = i === 0 ? n : (1 - Math.pow(1 + i, -n)) / i;

  // 4) Max. Kredit
  const maxKredit = verfuegbar * pvFactor;

  // 5) Gesamtbudget & Kaufpreis
  const gesamtbudget = eigenkapital + maxKredit;
  const maxKaufpreis = gesamtbudget / (1 + CONFIG.NEBENKOSTEN_QUOTE);
  const nebenkosten = maxKaufpreis * CONFIG.NEBENKOSTEN_QUOTE;
  const ekQuote = gesamtbudget > 0 ? eigenkapital / gesamtbudget : 0;

  // 6) Status-Entscheidung (Regeln in dieser Reihenfolge geprueft)
  const geprueft: string[] = [];
  let status: Status;
  let griff: string;

  const r1 = `Wenn maxKaufpreis < 100.000 ODER verfügbar < 300 → nicht_leistbar`;
  geprueft.push(r1);
  if (maxKaufpreis < 100_000 || verfuegbar < 300) {
    status = "nicht_leistbar";
    griff = r1;
  } else {
    const r2 = `Wenn maxKaufpreis im Band 100k–150k ODER ekQuote 15%–20% → grenzfall`;
    geprueft.push(r2);
    if (
      (maxKaufpreis >= 100_000 && maxKaufpreis < 150_000) ||
      (ekQuote >= 0.15 && ekQuote < CONFIG.EK_QUOTE_MIN)
    ) {
      status = "grenzfall";
      griff = r2;
    } else {
      const r3 = `Wenn maxKaufpreis ≥ 150k UND ekQuote ≥ 20% UND verfügbar > 500 → leistbar`;
      geprueft.push(r3);
      if (
        maxKaufpreis >= 150_000 &&
        ekQuote >= CONFIG.EK_QUOTE_MIN &&
        verfuegbar > 500
      ) {
        status = "leistbar";
        griff = r3;
      } else {
        status = "grenzfall";
        griff = "Fallback (keine Regel hat klar gegriffen) → grenzfall";
      }
    }
  }

  // EK-Breakdown gerundet für Result-Output
  const ekBreakdownRounded = ek.rows.map((r) => ({
    ...r,
    gezaehlt: Math.round(r.gezaehlt),
  }));

  const result: CheckResult = {
    status,
    maxKaufpreis: Math.round(maxKaufpreis),
    maxKredit: Math.round(maxKredit),
    monatlicheRate: Math.round(verfuegbar),
    eigenkapital: Math.round(eigenkapital),
    ekQuote: Math.round(ekQuote * 100) / 100,
    nebenkosten: Math.round(nebenkosten),
    laufzeitJahre,
    ekBreakdown: ekBreakdownRounded,
  };

  const audit: CalcAudit = {
    laufzeitJahre: {
      alter,
      default: CONFIG.LAUFZEIT_DEFAULT,
      endalterMax: CONFIG.ENDALTER_MAX,
      formel: `max(1, min(${CONFIG.LAUFZEIT_DEFAULT}, ${CONFIG.ENDALTER_MAX} − ${alter})) = ${laufzeitJahre}`,
      ergebnis: laufzeitJahre,
    },
    verfuegbar: {
      netto,
      dstiMax: CONFIG.DSTI_MAX,
      raten,
      fix,
      formel: `max(0, ${fmt(netto)} × ${CONFIG.DSTI_MAX} − ${fmt(raten)} − ${fmt(fix)}) = ${fmt(verfuegbar)} €/Monat`,
      ergebnis: Math.round(verfuegbar),
    },
    pvFactor: {
      zinsPa: CONFIG.ZINSSATZ_PA,
      zinsMonatlich: i,
      monate: n,
      formel: `(1 − (1 + ${fmt2(i)})^−${n}) / ${fmt2(i)} = ${fmt2(pvFactor)}`,
      ergebnis: Math.round(pvFactor * 10000) / 10000,
    },
    maxKredit: {
      verfuegbar: Math.round(verfuegbar),
      pvFactor: Math.round(pvFactor * 10000) / 10000,
      formel: `${fmt(verfuegbar)} × ${fmt2(pvFactor)} = ${fmt(maxKredit)} €`,
      ergebnis: Math.round(maxKredit),
    },
    ekBreakdown: ekBreakdownRounded,
    eigenkapital: {
      total: Math.round(eigenkapital),
      formel: `Summe gewichteter Vermögenswerte (Beleihungsfaktoren je Asset-Klasse) = ${fmt(eigenkapital)} €`,
    },
    gesamtbudget: {
      eigenkapital: Math.round(eigenkapital),
      maxKredit: Math.round(maxKredit),
      formel: `${fmt(eigenkapital)} + ${fmt(maxKredit)} = ${fmt(gesamtbudget)} €`,
      ergebnis: Math.round(gesamtbudget),
    },
    maxKaufpreis: {
      gesamtbudget: Math.round(gesamtbudget),
      nebenkostenQuote: CONFIG.NEBENKOSTEN_QUOTE,
      formel: `${fmt(gesamtbudget)} / (1 + ${CONFIG.NEBENKOSTEN_QUOTE}) = ${fmt(maxKaufpreis)} €`,
      ergebnis: Math.round(maxKaufpreis),
    },
    nebenkosten: {
      maxKaufpreis: Math.round(maxKaufpreis),
      quote: CONFIG.NEBENKOSTEN_QUOTE,
      formel: `${fmt(maxKaufpreis)} × ${CONFIG.NEBENKOSTEN_QUOTE} = ${fmt(nebenkosten)} €`,
      ergebnis: Math.round(nebenkosten),
    },
    ekQuote: {
      eigenkapital: Math.round(eigenkapital),
      gesamtbudget: Math.round(gesamtbudget),
      formel: `${fmt(eigenkapital)} / ${fmt(gesamtbudget)} = ${(ekQuote * 100).toFixed(1)} %`,
      ergebnis: Math.round(ekQuote * 100) / 100,
    },
    statusEntscheidung: { geprueft, griff, status },
  };

  return { result, audit };
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
