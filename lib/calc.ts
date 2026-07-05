// KIM-V-konforme Leistbarkeits-Berechnung für AT-Wohnkredite.
// Pure function – kein React, keine I/O.

// Leitplanken. Stand Mitte 2026: Die KIM-V ist am 30.06.2025 ausgelaufen.
// EK-Quote (20 %) und DSTI (40 %) sind seither nur noch FMA-Leitlinie/
// Empfehlung – Banken dürfen wieder flexibler finanzieren (bis 90 %+ Beleihung).
// Wir kalibrieren daher mutig-fair (Produktversprechen "mehr möglich als du denkst"),
// bleiben aber bei Unsicherheit (Krypto, Bonus) konservativ und beim Audit transparent.
export const CONFIG = {
  // DSTI-Anker: auch nach KIM-V-Ende die gängige Bank-Daumenregel für die
  // maximale Rate. Bleibt 40 % (bewusst nicht angehoben – seriöse Kappe).
  DSTI_MAX: 0.4,
  // Referenz-EK-Quote nur noch für Status-Einstufung (nicht als harte Grenze).
  // Stand Mitte 2026: Banken finanzieren wieder bis 90 %+, "leistbar" ist
  // schon ab ~15 % EK vertretbar – siehe statusAus().
  EK_QUOTE_MIN: 0.15,
  // Rechenzins: AT-Fixzinsen liegen Mitte 2026 bei ~3,0–3,3 %. 3,5 % drückte
  // den maxKredit unnötig; 3,2 % ist realistisch-fair (leicht unter Mitte).
  ZINSSATZ_PA: 0.032,
  // Banken akzeptieren regelmäßig Laufzeiten bis 35 J. (Endalter-Kappe bleibt).
  // Längere Laufzeit senkt die Rate → höherer maxKredit bei gleicher DSTI.
  LAUFZEIT_DEFAULT: 35,
  ENDALTER_MAX: 80,
  // Kaufnebenkosten AT real ~11,2 % (GrESt 3,5 % + Eintragung 1,1 % +
  // Vertrag/Makler/NoGeb). Hier bleiben wir ehrlich – nicht schöngerechnet.
  NEBENKOSTEN_QUOTE: 0.112,
  // Variables Einkommen (Bonus/Provision): Banken rechnen regelmäßige,
  // belegbare Boni oft mit 60–80 % an. Stand Mitte 2026: 70 % (fair, nicht
  // aggressiv – volle 100 % blieben unseriös bei schwankendem Einkommen).
  BONUS_ANRECHNUNG: 0.7,
} as const;

// Beleihungsfaktoren wie sie AT-Banken (Erste, Raiffeisen, BAWAG, ING)
// üblicherweise anrechnen. Stand Mitte 2026: mutig-fair, aber am Markt gedeckt.
export const BELEIHUNG = {
  sparguthaben: 1.0,
  // Lombard-/Depotbeleihung bei Blue Chips & breiten ETFs geht regelmäßig bis
  // 80 %. Stand Mitte 2026 daher 0.8 statt 0.7.
  wertpapiere: 0.8,
  edelmetalle: 0.7,
  // Krypto bleibt der konservativste Posten (hohe Volatilität, viele Banken
  // akzeptieren es gar nicht). Leicht angehoben auf 0.6 – lieber unter- als
  // überschätzen. Stand Mitte 2026.
  crypto: 0.6,
  lebensversicherung: 1.0,
  schenkung: 1.0,
  // Immobilie wird gesondert berechnet: 70% Verkehrswert − Restschuld
  immobilie: 0.7,
} as const;

export type Bundesland =
  | "wien" | "noe" | "ooe" | "sbg" | "tirol" | "vbg" | "stmk" | "ktn" | "bgld";
export type Immobilienart = "wohnung" | "haus";
export type Status = "leistbar" | "grenzfall" | "nicht_leistbar";
export type NettoPeriode = "monat" | "jahr";
export type ObjektStatus = "im_auge" | "suche_noch";
export type Nutzung = "eigennutzung" | "anlage";

export interface Assets {
  sparguthaben: number;
  wertpapiere: number;
  edelmetalle: number;
  crypto: number;
  lebensversicherung: number;
  schenkung: number;
  immobilie_wert: number;
  immobilie_restschuld: number;
}

export interface CheckInput {
  /** Betrag wie eingegeben (interpretiert über nettoPeriode). */
  netto: number;
  nettoPeriode: NettoPeriode;
  /** Variables Gehalt / Bonus / Provision (Betrag, interpretiert über bonusPeriode). */
  bonus: number;
  bonusPeriode: NettoPeriode;
  /** Bestehende monatliche Kreditraten, die bestehen bleiben. */
  raten: number;
  /** Restschuld bestehender Kredite, die umgeschuldet / mitfinanziert werden sollen. */
  umschuldung: number;
  assets: Assets;
  bundesland: Bundesland;
  immobilienart: Immobilienart;
  /** Hat die Person schon ein konkretes Objekt? */
  objektStatus: ObjektStatus;
  /** Eigennutzung oder Kapitalanlage? */
  nutzung: Nutzung;
  alter: number;
  erwachsene: number;
  /** Alter jedes Kindes (Länge = Anzahl Kinder). */
  kinderAlter: number[];
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
  /** Effektives anrechenbares Monatsnetto (inkl. anteiligem Bonus). */
  effektivNetto: number;
  eigenkapital: number;
  ekQuote: number;
  nebenkosten: number;
  /** Restschuld, die ins neue Darlehen mitfinanziert wird (Umschuldung). */
  umschuldung: number;
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

/** Rechnet Eingabe-Betrag + Bonus in ein anrechenbares Monatsnetto um. */
export function effektivesMonatsnetto(input: CheckInput): number {
  const betrag = num(input.netto, 0, 12_000_000);
  const monatsNetto = input.nettoPeriode === "jahr" ? betrag / 12 : betrag;
  const bonus = num(input.bonus, 0, 5_000_000);
  // Bonus wird zu 70 % angerechnet (CONFIG.BONUS_ANRECHNUNG, Stand Mitte 2026);
  // je nach Periode pro Monat direkt oder Jahresbetrag auf den Monat umgelegt.
  const bonusBasisMonatlich =
    input.bonusPeriode === "monat" ? bonus : bonus / 12;
  const bonusMonatlich = bonusBasisMonatlich * CONFIG.BONUS_ANRECHNUNG;
  return Math.min(1_000_000, monatsNetto + bonusMonatlich);
}

export function eigenkapitalAus(a: Assets): {
  total: number;
  rows: EkRow[];
} {
  const sparguthaben = num(a.sparguthaben, 0, 5_000_000);
  const wertpapiere = num(a.wertpapiere, 0, 5_000_000);
  const edelmetalle = num(a.edelmetalle, 0, 5_000_000);
  const crypto = num(a.crypto, 0, 5_000_000);
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
      key: "crypto",
      label: "Krypto (Bitcoin, ETH …)",
      raw: crypto,
      gezaehlt: crypto * BELEIHUNG.crypto,
      faktor: BELEIHUNG.crypto,
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

// Status-Einstufung. Stand Mitte 2026 (nach KIM-V-Ende) mutig-fair kalibriert:
// - EK-Quote ist keine harte Grenze mehr; Banken finanzieren wieder bis 90 %+,
//   daher gilt "leistbar" bereits ab 15 % EK, Grenzband 10–15 %.
// - maxKaufpreis-Härtegrenzen deutlich gesenkt: in Wien kauft man um 150k fast
//   nichts, ein "grenzfall"-Stempel hätte nur abgeschreckt. 80k = leistbar-Grenze,
//   50k = absolute Untergrenze (darunter ist real kein Kauf finanzierbar).
function statusAus(
  maxKaufpreis: number,
  ekQuote: number,
  verfuegbar: number
): Status {
  if (maxKaufpreis < 50_000 || verfuegbar < 300) return "nicht_leistbar";
  if (
    (maxKaufpreis >= 50_000 && maxKaufpreis < 80_000) ||
    (ekQuote >= 0.1 && ekQuote < CONFIG.EK_QUOTE_MIN)
  )
    return "grenzfall";
  if (
    maxKaufpreis >= 80_000 &&
    ekQuote >= CONFIG.EK_QUOTE_MIN &&
    verfuegbar > 450
  )
    return "leistbar";
  return "grenzfall";
}

export function berechne(input: CheckInput): CheckResult {
  return berechneMitAudit(input).result;
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
    effektivNetto: number;
    dstiMax: number;
    raten: number;
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
  const raten = num(input.raten, 0, 500_000);
  const umschuldung = num(input.umschuldung, 0, 10_000_000);
  const effektivNetto = effektivesMonatsnetto(input);

  const ek = eigenkapitalAus(input.assets);
  const eigenkapital = ek.total;

  const laufzeitJahre = Math.max(
    1,
    Math.min(CONFIG.LAUFZEIT_DEFAULT, CONFIG.ENDALTER_MAX - alter)
  );

  const verfuegbar = Math.max(0, effektivNetto * CONFIG.DSTI_MAX - raten);

  const i = CONFIG.ZINSSATZ_PA / 12;
  const n = laufzeitJahre * 12;
  const pvFactor = i === 0 ? n : (1 - Math.pow(1 + i, -n)) / i;
  const maxKredit = verfuegbar * pvFactor;

  const gesamtbudget = eigenkapital + maxKredit;
  // Umschuldung: die mitfinanzierte Restschuld wird aus dem Gesamtbudget
  // bedient, steht also NICHT für den Immobilienkauf zur Verfügung.
  const immobilienBudget = Math.max(0, gesamtbudget - umschuldung);
  const maxKaufpreis = immobilienBudget / (1 + CONFIG.NEBENKOSTEN_QUOTE);
  const nebenkosten = maxKaufpreis * CONFIG.NEBENKOSTEN_QUOTE;
  const ekQuote = immobilienBudget > 0 ? eigenkapital / immobilienBudget : 0;

  const status = statusAus(maxKaufpreis, ekQuote, verfuegbar);

  const geprueft = [
    `Wenn maxKaufpreis < 50.000 ODER verfügbar < 300 → nicht_leistbar`,
    `Wenn maxKaufpreis im Band 50k–80k ODER ekQuote 10%–15% → grenzfall`,
    `Wenn maxKaufpreis ≥ 80k UND ekQuote ≥ 15% UND verfügbar > 450 → leistbar`,
  ];
  const griff =
    status === "nicht_leistbar"
      ? geprueft[0]
      : status === "leistbar"
        ? geprueft[2]
        : geprueft[1];

  const ekBreakdownRounded = ek.rows.map((r) => ({
    ...r,
    gezaehlt: Math.round(r.gezaehlt),
  }));

  const result: CheckResult = {
    status,
    maxKaufpreis: Math.round(maxKaufpreis),
    maxKredit: Math.round(maxKredit),
    monatlicheRate: Math.round(verfuegbar),
    effektivNetto: Math.round(effektivNetto),
    eigenkapital: Math.round(eigenkapital),
    ekQuote: Math.round(ekQuote * 100) / 100,
    nebenkosten: Math.round(nebenkosten),
    umschuldung: Math.round(umschuldung),
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
      effektivNetto: Math.round(effektivNetto),
      dstiMax: CONFIG.DSTI_MAX,
      raten,
      formel: `max(0, ${fmt(effektivNetto)} × ${CONFIG.DSTI_MAX} − ${fmt(raten)}) = ${fmt(verfuegbar)} €/Monat`,
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
      formel: `(${fmt(gesamtbudget)}${umschuldung > 0 ? ` − ${fmt(umschuldung)} Umschuldung` : ""}) / (1 + ${CONFIG.NEBENKOSTEN_QUOTE}) = ${fmt(maxKaufpreis)} €`,
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
    crypto: 0,
    lebensversicherung: 0,
    schenkung: 0,
    immobilie_wert: 0,
    immobilie_restschuld: 0,
  };
}
