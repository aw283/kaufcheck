import type {
  KaufcheckInput,
  KaufcheckResult,
  LeistbarkeitsStatus,
} from "@/app/kaufcheck/types";

export const CONFIG = {
  DSTI_MAX: 0.4, // Schuldendienstquote max
  EK_QUOTE_MIN: 0.2, // Min Eigenkapitalquote (inkl. Nebenkosten)
  LAUFZEIT_JAHRE_DEFAULT: 30,
  ENDALTER_MAX: 80, // Max Alter bei Kreditende
  ZINSSATZ_DEFAULT: 0.035, // 3,5 % p.a. fix (später aus Config-Service)
  NEBENKOSTEN_QUOTE: 0.1, // 10 % des Kaufpreises
  PUFFER_HAUSHALT_PRO_PERSON: 350, // EUR/Monat Lebenshaltung pro Erwachsenem
  PUFFER_PRO_KIND: 250, // EUR/Monat pro Kind
} as const;

const STATUS_SCHWELLE_LEISTBAR = 150_000;
const STATUS_SCHWELLE_NICHT_LEISTBAR = 100_000;
const VERFUEGBAR_MIN_LEISTBAR = 500;
const VERFUEGBAR_MIN_MACHBAR = 300;

/**
 * Barwert einer nachschüssigen Annuität.
 * PV = PMT × (1 - (1 + i)^-n) / i
 */
function annuitaetenBarwert(
  ratePM: number,
  zinsMonat: number,
  monate: number
): number {
  if (ratePM <= 0 || monate <= 0) return 0;
  if (zinsMonat === 0) return ratePM * monate;
  return (ratePM * (1 - Math.pow(1 + zinsMonat, -monate))) / zinsMonat;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function roundEur(n: number): number {
  return Math.round(n);
}

interface InterneWerte {
  alter: number;
  netto: number;
  bestehende: number;
  fix: number;
  ek: number;
  erwachsene: number;
  kinder: number;
  laufzeitJahre: number;
  mindestLebenshaltung: number;
  verfuegbar: number;
  maxKredit: number;
  gesamtbudget: number;
  maxKaufpreis: number;
  ekQuote: number;
  belastungsquote: number;
  restNachRate: number;
  ekKorrekturAktiv: boolean;
}

export interface BerechnungsOverrides {
  /** Überschreibt den Default-Laufzeit-Ceiling (z. B. 35 für Grenzfall-Szenarien). */
  laufzeitJahreDefault?: number;
  /** Zusätzliches Eigenkapital auf dem Input-EK (z. B. +20.000 für Szenarien). */
  extraEigenkapital?: number;
}

/** Zwingt einen Wert in [min, max] und ersetzt NaN/Infinity durch `fallback`. */
function safeNumber(
  n: unknown,
  min: number,
  max: number,
  fallback = 0
): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return Math.min(Math.max(fallback, min), max);
  return Math.min(Math.max(v, min), max);
}

function safeInt(
  n: unknown,
  min: number,
  max: number,
  fallback = 0
): number {
  return Math.floor(safeNumber(n, min, max, fallback));
}

export function berechneLeistbarkeit(
  input: KaufcheckInput,
  overrides: BerechnungsOverrides = {}
): KaufcheckResult {
  const { haushalt, finanzen, vorstellung } = input;

  const laufzeitCap = Math.max(
    1,
    safeInt(
      overrides.laufzeitJahreDefault ?? CONFIG.LAUFZEIT_JAHRE_DEFAULT,
      1,
      50,
      CONFIG.LAUFZEIT_JAHRE_DEFAULT
    )
  );
  const extraEk = safeNumber(overrides.extraEigenkapital ?? 0, 0, 10_000_000);

  // Harte Clamps auf plausible Wertebereiche (NaN/Infinity → 0).
  const alter = safeInt(haushalt.alterHauptantragsteller, 0, 120, 35);
  const erwachsene = safeInt(haushalt.erwachsene, 1, 10, 1);
  const kinder = safeInt(haushalt.kinder, 0, 15, 0);
  const netto = safeNumber(finanzen.nettoEinkommen, 0, 1_000_000);
  const bestehende = safeNumber(finanzen.bestehendeKreditraten, 0, 500_000);
  const fix = safeNumber(finanzen.sonstigeFixkosten, 0, 500_000);
  const ek = safeNumber(vorstellung.eigenkapital, 0, 50_000_000) + extraEk;

  // 1. Effektive Laufzeit (min. 1 Jahr)
  const laufzeitJahre = Math.max(
    1,
    Math.min(laufzeitCap, CONFIG.ENDALTER_MAX - alter)
  );

  // 2. Verfügbares Einkommen für Schuldendienst (neuer Kredit)
  let verfuegbar = Math.max(
    0,
    netto * CONFIG.DSTI_MAX - bestehende - fix
  );

  // 3. Plausibilitäts-Check Lebenshaltung
  const mindestLebenshaltung =
    erwachsene * CONFIG.PUFFER_HAUSHALT_PRO_PERSON +
    kinder * CONFIG.PUFFER_PRO_KIND;

  let restNachRate = netto - verfuegbar - bestehende - fix;
  if (restNachRate < mindestLebenshaltung) {
    verfuegbar = Math.max(0, netto - bestehende - fix - mindestLebenshaltung);
    restNachRate = netto - verfuegbar - bestehende - fix;
  }

  // 4. Max Kreditsumme via PV-Annuität
  const zinsMonat = CONFIG.ZINSSATZ_DEFAULT / 12;
  const monate = laufzeitJahre * 12;
  const maxKredit = annuitaetenBarwert(verfuegbar, zinsMonat, monate);

  // 5-6. Gesamtbudget und Max Kaufpreis (netto vor Nebenkosten)
  let gesamtbudget = ek + maxKredit;
  let maxKaufpreis = gesamtbudget / (1 + CONFIG.NEBENKOSTEN_QUOTE);

  // 8. Eigenkapitalquote-Check (EK bezogen auf Gesamtkosten inkl. NK)
  let ekQuote = gesamtbudget > 0 ? ek / gesamtbudget : 0;
  let ekKorrekturAktiv = false;

  if (ekQuote < CONFIG.EK_QUOTE_MIN) {
    // Gesamtbudget so reduzieren, dass EK genau 20 % ausmacht (=EK/0.20),
    // aber gedeckelt auf EK × 5 (= dasselbe Ergebnis: EK/0.20 === EK×5).
    const gesamtbudgetKorr = Math.min(
      ek / CONFIG.EK_QUOTE_MIN,
      ek * 5
    );
    gesamtbudget = gesamtbudgetKorr;
    maxKaufpreis = gesamtbudget / (1 + CONFIG.NEBENKOSTEN_QUOTE);
    ekQuote = gesamtbudget > 0 ? ek / gesamtbudget : 0;
    ekKorrekturAktiv = true;
  }

  // 7. Echter Nebenkosten-Betrag und Gesamtkosten
  const nebenkosten = maxKaufpreis * CONFIG.NEBENKOSTEN_QUOTE;
  const gesamtkosten = maxKaufpreis + nebenkosten;

  // Tatsächliche Belastungsquote (für Ergebnis-Anzeige)
  const belastungsquote =
    netto > 0 ? (bestehende + verfuegbar) / netto : 0;

  // Status
  const status = ermittleStatus({
    maxKaufpreis,
    ekQuote,
    verfuegbar,
  });

  const werte: InterneWerte = {
    alter,
    netto,
    bestehende,
    fix,
    ek,
    erwachsene,
    kinder,
    laufzeitJahre,
    mindestLebenshaltung,
    verfuegbar,
    maxKredit,
    gesamtbudget,
    maxKaufpreis,
    ekQuote,
    belastungsquote,
    restNachRate,
    ekKorrekturAktiv,
  };

  const hinweise = buildHinweise(status, werte);

  return {
    status,
    maxKaufpreis: roundEur(maxKaufpreis),
    maxKreditsumme: roundEur(maxKredit),
    monatlicheRate: roundEur(verfuegbar),
    verfuegbaresEinkommen: roundEur(restNachRate),
    belastungsquote: round2(belastungsquote),
    eigenmittelquote: round2(ekQuote),
    nebenkosten: roundEur(nebenkosten),
    gesamtkosten: roundEur(gesamtkosten),
    laufzeitJahre,
    hinweise,
    kimvErfuellt: {
      eigenmittelquote: ekQuote >= CONFIG.EK_QUOTE_MIN,
      belastungsquote: belastungsquote <= CONFIG.DSTI_MAX,
      laufzeit: laufzeitJahre <= 35,
    },
  };
}

function ermittleStatus(args: {
  maxKaufpreis: number;
  ekQuote: number;
  verfuegbar: number;
}): LeistbarkeitsStatus {
  const { maxKaufpreis, ekQuote, verfuegbar } = args;

  // 1. Harte Ausschluss­kriterien
  if (
    maxKaufpreis < STATUS_SCHWELLE_NICHT_LEISTBAR ||
    verfuegbar < VERFUEGBAR_MIN_MACHBAR
  ) {
    return "nicht_leistbar";
  }

  // 2. Grenzfall-Kriterien
  const preisGrenze =
    maxKaufpreis >= STATUS_SCHWELLE_NICHT_LEISTBAR &&
    maxKaufpreis < STATUS_SCHWELLE_LEISTBAR;
  const ekGrenze = ekQuote >= 0.15 && ekQuote < CONFIG.EK_QUOTE_MIN;

  if (preisGrenze || ekGrenze) return "grenzfall";

  // 3. Leistbar
  if (
    maxKaufpreis >= STATUS_SCHWELLE_LEISTBAR &&
    ekQuote >= CONFIG.EK_QUOTE_MIN &&
    verfuegbar > VERFUEGBAR_MIN_LEISTBAR
  ) {
    return "leistbar";
  }

  // 4. Fallback (z. B. verfügbar zwischen 300 und 500 € aber sonst alles ok)
  return "grenzfall";
}

function formatEuro(n: number): string {
  return Math.round(n).toLocaleString("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

const BERATUNGS_HINWEIS =
  "Dieses Ergebnis ist ein Orientierungswert – für eine verbindliche Finanzierung empfehlen wir ein Gespräch mit einer/einem unabhängigen Finanzierungsberater:in.";

function buildHinweise(
  status: LeistbarkeitsStatus,
  w: InterneWerte
): string[] {
  const out: string[] = [];

  if (status === "leistbar") {
    out.push(
      `Ihr Rahmen ist solide: Bei einer monatlichen Rate von ${formatEuro(
        w.verfuegbar
      )} über ${w.laufzeitJahre} Jahre ist ein Kaufpreis bis rund ${formatEuro(
        w.maxKaufpreis
      )} realistisch.`
    );
    if (w.ekQuote < 0.3) {
      out.push(
        `Mit etwas mehr Eigenkapital (aktuell ${Math.round(
          w.ekQuote * 100
        )} %) verbessern Sie Ihre Konditionen – ab 30 % EK werden häufig günstigere Zinsen angeboten.`
      );
    }
  }

  if (status === "grenzfall") {
    if (
      w.maxKaufpreis >= STATUS_SCHWELLE_NICHT_LEISTBAR &&
      w.maxKaufpreis < STATUS_SCHWELLE_LEISTBAR
    ) {
      out.push(
        `Ihr leistbarer Rahmen liegt bei rund ${formatEuro(
          w.maxKaufpreis
        )}. Das reicht in den meisten Bundesländern nur für kleinere Wohnungen oder sanierungsbedürftige Objekte.`
      );
    }
    if (w.ekQuote < CONFIG.EK_QUOTE_MIN) {
      out.push(
        `Ihre Eigenkapitalquote liegt bei ${Math.round(
          w.ekQuote * 100
        )} %. Für eine KIM-V-konforme Finanzierung sind 20 % nötig – planen Sie gezielt zusätzliches Eigenkapital ein oder binden Sie Sicherheiten ein.`
      );
    }
    out.push(
      "Prüfen Sie alternative Finanzierungsmodelle (z. B. Förderungen, Familien-Bürgschaften, Bauspardarlehen) – hier lohnt sich eine individuelle Beratung besonders."
    );
  }

  if (status === "nicht_leistbar") {
    if (w.ek === 0) {
      out.push(
        "Ohne Eigenkapital ist eine klassische Wohnbau­finanzierung derzeit nicht darstellbar. Empfehlung: über 12–24 Monate gezielt mind. 20 % des Wunschkaufpreises ansparen."
      );
    } else if (w.verfuegbar < VERFUEGBAR_MIN_MACHBAR) {
      out.push(
        `Nach Abzug Ihrer bestehenden Verpflichtungen bleiben nur ${formatEuro(
          w.verfuegbar
        )} für eine zusätzliche Kreditrate – zu wenig für eine tragfähige Finanzierung.`
      );
      if (w.bestehende > 0) {
        out.push(
          `Tipp: Bestehende Kreditraten von ${formatEuro(
            w.bestehende
          )} zuerst ablösen – das erhöht den Rahmen für die Immobilien­finanzierung deutlich.`
        );
      }
    } else {
      out.push(
        `Der errechnete Rahmen (${formatEuro(
          w.maxKaufpreis
        )}) liegt unter dem realistischen Mindestkaufpreis. Prüfen Sie Eigenkapital-Aufbau, günstigere Regionen oder kleinere Objekte.`
      );
    }
  }

  out.push(BERATUNGS_HINWEIS);
  return out;
}
