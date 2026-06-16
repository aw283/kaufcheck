// Anleger-Lead-Strecke "Immobilie als Steuerhebel": Modell-Matching.
// Reine Lead-Qualifizierung + ehrliche Richtwerte — KEINE KIM-V-Leistbarkeit.
//
// WICHTIG: immoampel gibt KEINE Steuer- oder Anlageberatung. Alle Zahlen,
// Renditen und Steueraussagen sind unverbindliche Richtwerte aus der
// Research-Notiz (research/spezialfinanzierungen-anlage.md). Vor jeder
// Investition ist eine individuelle Prüfung durch Steuerberater:in
// (insb. Prognoserechnung/Liebhaberei) erforderlich.
//
// Bewusst NICHT beworben: Fremdwährungs- und endfällige Kredite/Tilgungsträger
// (FMA-Marktrealität, hohes Risiko). Werden hier weder gematcht noch empfohlen.

import { z } from "zod";

export type Anlageziel =
  | "steueroptimierung"
  | "rendite"
  | "vermoegensaufbau"
  | "altersvorsorge";
// kurz = <5 J · mittel = 5–15 J · lang = >15 J
export type Anlagehorizont = "kurz" | "mittel" | "lang";
export type Steuerlast = "hoch" | "mittel" | "niedrig";
export type Modell = "vorsorgewohnung" | "bauherrenmodell" | "anlegerwohnung";

// Richtwert-Schwellen für die Eignung (Annahme, fachlich plausibel).
// Bauherrenmodell ist ein Miteigentumsanteil mit höherem Mindestticket;
// Vorsorgewohnung als ganze Einheit liegt typ. darunter.
export const BUDGET_MIN_SINNVOLL = 30_000; // darunter: Immobilie als Anlage fraglich
export const BUDGET_BAUHERREN_MIN = 60_000; // Richtwert Mindestbeteiligung

export interface AnlegerInput {
  // Step 1 — Profil/Ziel
  anlageziel: Anlageziel;
  horizont: Anlagehorizont;
  steuerlast: Steuerlast;
  budget: number; // verfügbares Eigenkapital fürs Investment, €
  finanzierung: boolean; // will (zusätzlich) fremdfinanzieren
  // Step 2 — Region/Profil
  bundesland: string;
  // Kontakt (Step 3)
  name: string;
  email: string;
  telefon: string;
  einwilligung: boolean;
}

export interface AnlegerResult {
  primaer: Modell;
  alternativen: Modell[];
  begruendung: string;
  hinweis?: string;
}

function num(n: unknown, min: number, max: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.min(Math.max(v, min), max);
}

// Transparente Matching-Regeln. Reihenfolge = Priorität.
// HINWEIS: keine Steuer-/Anlageberatung, nur Richtwert-Zuordnung (s. o.).
export function empfiehl(
  input: Pick<
    AnlegerInput,
    "anlageziel" | "horizont" | "steuerlast" | "budget" | "finanzierung"
  >
): AnlegerResult {
  const { anlageziel, horizont, steuerlast, finanzierung } = input;
  const budget = num(input.budget, 0, 1_000_000_000);

  const alleModelle: Modell[] = [
    "vorsorgewohnung",
    "bauherrenmodell",
    "anlegerwohnung",
  ];
  const altern = (primaer: Modell): Modell[] =>
    alleModelle.filter((m) => m !== primaer);

  // Ehrlicher Ausschluss-Hinweis: Immobilie als Anlage braucht Kapital + Zeit.
  // (Liebhaberei: Totalüberschuss-Prognose über ~25 J. → kurzer Horizont passt nicht.)
  let hinweis: string | undefined;
  if (budget > 0 && budget < BUDGET_MIN_SINNVOLL) {
    hinweis =
      "Bei diesem Eigenkapital ist eine Anlageimmobilie oft (noch) nicht sinnvoll — Nebenkosten und Mindesttickets sind hoch. Ehrlich gesagt lohnt sich erst der Aufbau von Eigenkapital. Werte sind Richtwerte, keine Steuer-/Anlageberatung.";
  } else if (horizont === "kurz") {
    hinweis =
      "Anlageimmobilien sind langfristig gedacht: Die steuerliche Anerkennung verlangt einen Totalüberschuss über rund 25 Jahre. Bei einem Horizont unter 5 Jahren ist das meist ungeeignet. Werte sind Richtwerte, keine Steuer-/Anlageberatung.";
  }

  // Regel 1: Hohe Steuerlast + langer Horizont → Bauherrenmodell (verkürzte AfA
  // 10/15 J., Sofortabschreibung Werbungskosten). Budget muss das Ticket tragen.
  if (
    steuerlast === "hoch" &&
    horizont === "lang" &&
    budget >= BUDGET_BAUHERREN_MIN
  ) {
    return {
      primaer: "bauherrenmodell",
      alternativen: altern("bauherrenmodell"),
      begruendung:
        "Hohe Steuerlast und langer Horizont sprechen für das Bauherrenmodell: verkürzte Abschreibung und anteiliges Risiko-Pooling im geförderten Wohnbau.",
      hinweis,
    };
  }

  // Regel 2: Steueroptimierung als Ziel → Vorsorgewohnung (USt-Rückerstattung
  // 20 % Vorsteuer, klar verständliche Einzeleinheit), wenn nicht kurzfristig.
  if (anlageziel === "steueroptimierung" && horizont !== "kurz") {
    return {
      primaer: "vorsorgewohnung",
      alternativen: altern("vorsorgewohnung"),
      begruendung:
        "Mit Fokus auf Steueroptimierung passt die Vorsorgewohnung: 20 % Vorsteuer-Rückerstattung und planbare Vermietung, Prognoserechnung vorausgesetzt.",
      hinweis,
    };
  }

  // Regel 3: Altersvorsorge / langfristiger Vermögensaufbau → Vorsorgewohnung
  // (stabile, langfristige Vermietung, ~2–3,5 % laufende Rendite + Wertsteigerung).
  if (
    (anlageziel === "altersvorsorge" || anlageziel === "vermoegensaufbau") &&
    horizont === "lang"
  ) {
    return {
      primaer: "vorsorgewohnung",
      alternativen: altern("vorsorgewohnung"),
      begruendung:
        "Für langfristige Vorsorge eignet sich die Vorsorgewohnung: laufende Mieteinnahmen plus Wertsteigerung über einen langen Zeitraum.",
      hinweis,
    };
  }

  // Regel 4: Rendite-/Cashflow-Fokus oder mittlerer/kurzer Horizont →
  // Anlegerwohnung (höhere freie Mieten, konkrete Einzelwohnung, einfacher).
  // Fällt auch als Default-Match für alle übrigen Profile.
  return {
    primaer: "anlegerwohnung",
    alternativen: altern("anlegerwohnung"),
    begruendung:
      finanzierung
        ? "Mit Renditefokus passt die Anlegerwohnung: konkrete Einzelwohnung mit freien Mieten — eine ergänzende Finanzierung lässt sich separat prüfen."
        : "Mit Renditefokus passt die Anlegerwohnung: eine konkrete Einzelwohnung mit höheren, frei vereinbarten Mieten ist überschaubar und gut kalkulierbar.",
    hinweis,
  };
}

// Modell-Infos. Renditen/Fakten NUR aus research/spezialfinanzierungen-anlage.md,
// konservativ. Jede Steueraussage neutral und als Richtwert formuliert.
// KEINE Beratung — Steuerberater:in nötig (Prognoserechnung/Liebhaberei).
export const MODELL_INFO: Record<
  Modell,
  { titel: string; beschreibung: string; renditeRange: string; eignung: string }
> = {
  vorsorgewohnung: {
    titel: "Vorsorgewohnung",
    beschreibung:
      "Neubau-Mietwohnung als Einzeleinheit. Richtwert: 20 % Vorsteuer rückforderbar (Miete dann mit 10 % USt). Steuerliche Anerkennung verlangt eine Prognoserechnung mit Totalüberschuss (Richtwert ~25 Jahre). Keine Beratung — bitte mit Steuerberater:in prüfen.",
    renditeRange: "ca. 2–3,5 % p.a. laufend plus mögliche Wertsteigerung",
    eignung:
      "Langfristige Vorsorge und Steueroptimierung, Horizont über 15 Jahre, mittleres Budget.",
  },
  bauherrenmodell: {
    titel: "Bauherrenmodell",
    beschreibung:
      "Prozentualer Miteigentumsanteil an einer ganzen Wohnanlage (meist geförderter Wohnbau). Richtwert-Steuervorteil: verkürzte Abschreibung über 10 bzw. 15 Jahre. Einnahmen und Risiken werden anteilig gepoolt. Keine Beratung — bitte mit Steuerberater:in prüfen.",
    renditeRange:
      "stabilere, geförderte Mieten (gedeckelt); Hauptnutzen ist der Steuerhebel",
    eignung:
      "Hohe Steuerlast und langer Horizont, höheres Mindestticket, Wunsch nach Risiko-Pooling.",
  },
  anlegerwohnung: {
    titel: "Anlegerwohnung",
    beschreibung:
      "Konkrete Einzelwohnung mit frei vereinbarten Mieten — einfach verständlich und gut kalkulierbar. Keine Beratung — bitte mit Steuerberater:in prüfen.",
    renditeRange: "höhere, frei vereinbarte Mieten (kein fester Richtwert belegt)",
    eignung:
      "Rendite-/Cashflow-Fokus, mittlerer Horizont, einfacher Einstieg.",
  },
};

// --- Zod-Schemas (Wizard-Schritte) ---

const BUNDESLAND = [
  "wien", "noe", "ooe", "sbg", "tirol", "vbg", "stmk", "ktn", "bgld",
] as const;

export const anlageStep1Schema = z.object({
  anlageziel: z.enum([
    "steueroptimierung",
    "rendite",
    "vermoegensaufbau",
    "altersvorsorge",
  ]),
  horizont: z.enum(["kurz", "mittel", "lang"]),
  steuerlast: z.enum(["hoch", "mittel", "niedrig"]),
  budget: z
    .number()
    .min(1, "Verfügbares Eigenkapital angeben")
    .max(1_000_000_000),
  finanzierung: z.boolean(),
});

export const anlageStep2Schema = z.object({
  bundesland: z.string().refine(
    (v): v is (typeof BUNDESLAND)[number] =>
      (BUNDESLAND as readonly string[]).includes(v),
    { message: "Bitte Bundesland wählen" }
  ),
});

export const anlageStep3Schema = z.object({
  name: z.string().trim().min(2, "Name angeben").max(120),
  email: z.string().trim().email("Gültige E-Mail angeben").max(120),
  telefon: z
    .string()
    .trim()
    .min(5, "Telefonnummer angeben")
    .max(30)
    .regex(/^[+0-9 ()/.\-]+$/, "Nur Ziffern und +, (), /, ., -"),
  einwilligung: z.boolean().refine((v) => v === true, {
    message: "Ohne Einwilligung können wir Ihre Anfrage nicht weiterleiten",
  }),
});

export const anlegerApiSchema = anlageStep1Schema
  .and(anlageStep2Schema)
  .and(anlageStep3Schema);

export type AnlegerApiPayload = z.infer<typeof anlegerApiSchema>;
