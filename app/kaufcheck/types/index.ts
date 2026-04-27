export type Bundesland =
  | "wien"
  | "noe"
  | "bgld"
  | "stmk"
  | "ktn"
  | "sbg"
  | "ooe"
  | "tirol"
  | "vbg";

export type Einkommensart =
  | "unbefristet"
  | "befristet"
  | "selbststaendig"
  | "pension";

export type Immobilienart = "wohnung" | "haus";

export interface HaushaltData {
  erwachsene: number;
  kinder: number;
  alterHauptantragsteller: number;
  einkommensart: Einkommensart | "";
}

export interface FinanzenData {
  nettoEinkommen: number;
  bestehendeKreditraten: number;
  sonstigeFixkosten: number;
}

export interface VorstellungData {
  eigenkapital: number;
  bundesland: Bundesland | "";
  immobilienart: Immobilienart | "";
  wunschKaufpreis: number;
  keineKaufpreisVorstellung: boolean;
  // Intern für Berechnung – nicht im UI erfasst:
  laufzeitJahre: number;
  zinssatz: number;
}

export interface KaufcheckInput {
  haushalt: HaushaltData;
  finanzen: FinanzenData;
  vorstellung: VorstellungData;
}

export type LeistbarkeitsStatus = "leistbar" | "grenzfall" | "nicht_leistbar";

export interface KaufcheckResult {
  status: LeistbarkeitsStatus;
  maxKaufpreis: number;
  maxKreditsumme: number;
  monatlicheRate: number;
  verfuegbaresEinkommen: number;
  belastungsquote: number;
  eigenmittelquote: number;
  nebenkosten: number;
  gesamtkosten: number;
  laufzeitJahre: number;
  hinweise: string[];
  kimvErfuellt: {
    eigenmittelquote: boolean;
    belastungsquote: boolean;
    laufzeit: boolean;
  };
}

export const STEPS = [
  { id: 0, key: "haushalt", label: "Haushalt" },
  { id: 1, key: "finanzen", label: "Finanzen" },
  { id: 2, key: "vorstellung", label: "Vorstellung" },
  { id: 3, key: "ergebnis", label: "Ergebnis" },
] as const;

export type StepIndex = 0 | 1 | 2 | 3;

// ==================================================================
// Audit-Trail: Quelle pro Feld (manuell / extrahiert / Default)
// ==================================================================

export type FieldOrigin = "default" | "manual" | "extracted";

export interface FieldSourceInfo {
  source: FieldOrigin;
  /** Bei "extracted": welcher Dokumentname war die Quelle? */
  documentName?: string;
  /** Bei "extracted": Dokumenttyp aus Stufe 1. */
  documentType?: string;
  /** ISO-Timestamp – fürs Backend-Audit. */
  at?: string;
}

export type FieldPath =
  | `haushalt.${keyof HaushaltData}`
  | `finanzen.${keyof FinanzenData}`
  | `vorstellung.${keyof VorstellungData}`;

export const KAUFPREIS_MIN = 50_000;
export const KAUFPREIS_MAX = 2_000_000;
export const KAUFPREIS_STEP = 10_000;
