import { z } from "zod";

import {
  DOCUMENT_LANGUAGES,
  DOCUMENT_QUALITIES,
  DOCUMENT_TYPES,
  type DocumentType,
} from "@/app/kaufcheck/types/extraction";

/* ==================================================================
 * STUFE 1 – Klassifizierung (Haiku)
 * ================================================================== */

export const CLASSIFICATION_SYSTEM = `Du bist ein Klassifizierer für österreichische Finanzdokumente. Analysiere das PDF und antworte AUSSCHLIESSLICH mit validem JSON:
{
  "type": "gehaltszettel" | "kontoauszug" | "kreditvertrag" | "einkommensteuerbescheid" | "arbeitsvertrag" | "ksv_auskunft" | "expose" | "unbekannt",
  "confidence": 0.0-1.0,
  "language": "de" | "en" | "other",
  "pages": number,
  "quality": "gut" | "schlecht_lesbar" | "eingescannt_schraeg"
}

Österreichische Besonderheiten:
- Gehaltszettel enthalten typisch: 'Auszahlungsbetrag', 'SV-Beitrag', 'Lohnsteuer', 'BV-Beitrag'
- Kontoauszüge: 'Kontoauszug', 'Saldo', 'Umsatz', Bank-Namen (Erste, Raiffeisen, Bank Austria, BAWAG, Oberbank, Hypo)
- Kreditverträge: 'Darlehen', 'Kreditrate', 'Annuität', 'Pfandrecht'
- Einkommensteuerbescheid: kommt vom Finanzamt, enthält 'Einkünfte aus...'

Antworte NUR mit dem JSON, keine Erklärung davor oder danach.`;

export const classificationSchema = z.object({
  type: z.enum(DOCUMENT_TYPES),
  confidence: z.number(),
  language: z.enum(DOCUMENT_LANGUAGES),
  pages: z.number().int(),
  quality: z.enum(DOCUMENT_QUALITIES),
});
export type ClassificationResult = z.infer<typeof classificationSchema>;

/* ==================================================================
 * Helpers für die Stufe-2-Schemas
 * ================================================================== */

const nullableNumber = z.number().nullable();
const nullableString = z.string().nullable();
const confidenceMap = z.record(z.string(), z.number());
const excerptMap = z.record(z.string(), z.string());
const warnings = z.array(z.string());

/* ==================================================================
 * STUFE 2 – Gehaltszettel (Opus)
 * ================================================================== */

export const GEHALTSZETTEL_SYSTEM = `Du extrahierst strukturierte Daten aus einem österreichischen Gehaltszettel.

WICHTIGE REGELN:
- Antworte AUSSCHLIESSLICH mit validem JSON nach dem angegebenen Schema
- Nettoeinkommen = 'Auszahlungsbetrag' oder 'Netto' am Ende der Abrechnung
- Bei Werten mit Komma: als Dezimalzahl (z.B. 3.500,50 → 3500.50)
- Wenn ein Wert nicht erkennbar: null, nicht raten
- 14 Gehälter in Österreich üblich → monatliches Nettoeinkommen aus Einzelabrechnung extrahieren, NICHT hochrechnen
- confidence pro Feld: 0-1 basierend auf Lesbarkeit + Eindeutigkeit

Schema:
{
  "nettoeinkommen_monatlich": number | null,
  "bruttoeinkommen_monatlich": number | null,
  "arbeitgeber": string | null,
  "abrechnungsmonat": "YYYY-MM" | null,
  "sonderzahlung": boolean,
  "sv_beitrag": number | null,
  "lohnsteuer": number | null,
  "confidence_per_field": { <feldname>: 0-1 },
  "source_excerpts": { <feldname>: "wörtlicher Textausschnitt aus PDF" },
  "warnings": ["Hinweis falls etwas unsicher ist"]
}

Antworte NUR mit dem JSON, keine Erklärung davor oder danach.`;

export const gehaltszettelSchema = z.object({
  nettoeinkommen_monatlich: nullableNumber,
  bruttoeinkommen_monatlich: nullableNumber,
  arbeitgeber: nullableString,
  abrechnungsmonat: nullableString,
  sonderzahlung: z.boolean(),
  sv_beitrag: nullableNumber,
  lohnsteuer: nullableNumber,
  confidence_per_field: confidenceMap,
  source_excerpts: excerptMap,
  warnings,
});

/* ==================================================================
 * STUFE 2 – Kontoauszug
 * ================================================================== */

export const KONTOAUSZUG_SYSTEM = `Du extrahierst strukturierte Daten aus einem österreichischen Kontoauszug.

WICHTIGE REGELN:
- Antworte AUSSCHLIESSLICH mit validem JSON nach dem angegebenen Schema.
- Erkenne regelmäßige Eingänge (Gehalt / Pension / Mieteinnahmen) und regelmäßige Ausgänge (Kredite, Miete, Versicherungen, Leasing).
- Keywords für Kreditraten: "Dauerauftrag", "SEPA-Lastschrift", "Kreditrate", "Darlehen", "Annuität", "Leasing".
- Clustere Umsätze nach Empfänger und erkenne monatliche Muster (gleicher Betrag ± 2 €).
- Gehaltseingang = Durchschnitt der als "Gehalt" oder "Lohn" erkannten Eingänge aus den letzten 3 sichtbaren Monaten.
- Werte mit Komma als Dezimalzahl (z.B. "3.500,50 €" → 3500.50).
- Wenn ein Wert unsicher: null bzw. Eintrag weglassen, nicht raten.
- confidence pro Feld: 0-1 basierend auf Lesbarkeit + Mustererkennung.

Schema:
{
  "kontoinhaber": string | null,
  "zeitraum_von": "YYYY-MM-DD" | null,
  "zeitraum_bis": "YYYY-MM-DD" | null,
  "durchschnittlicher_gehaltseingang": number | null,
  "erkannte_kreditraten": [
    { "glaeubiger": string, "monatliche_rate": number }
  ],
  "erkannte_fixkosten": [
    { "empfaenger": string, "kategorie": "miete"|"versicherung"|"leasing"|"sonstiges"|null, "monatlicher_betrag": number }
  ],
  "confidence_per_field": { <feldname>: 0-1 },
  "source_excerpts": { <feldname>: "wörtlicher Textausschnitt aus PDF" },
  "warnings": ["Hinweis falls etwas unsicher ist"]
}

Antworte NUR mit dem JSON, keine Erklärung davor oder danach.`;

export const kontoauszugSchema = z.object({
  kontoinhaber: nullableString,
  zeitraum_von: nullableString,
  zeitraum_bis: nullableString,
  durchschnittlicher_gehaltseingang: nullableNumber,
  erkannte_kreditraten: z.array(
    z.object({
      glaeubiger: z.string(),
      monatliche_rate: z.number(),
    })
  ),
  erkannte_fixkosten: z.array(
    z.object({
      empfaenger: z.string(),
      kategorie: z.string().nullable(),
      monatlicher_betrag: z.number(),
    })
  ),
  confidence_per_field: confidenceMap,
  source_excerpts: excerptMap,
  warnings,
});

/* ==================================================================
 * STUFE 2 – Kreditvertrag
 * ================================================================== */

export const KREDITVERTRAG_SYSTEM = `Du extrahierst strukturierte Daten aus einem österreichischen Kreditvertrag oder Darlehensvertrag.

WICHTIGE REGELN:
- Antworte AUSSCHLIESSLICH mit validem JSON nach dem angegebenen Schema.
- Monatliche Rate = wiederkehrende monatliche Annuität / Rate (inklusive Zinsen und Tilgung, exklusive Sondertilgung).
- Gesamtsumme = ursprünglicher Kredit-/Darlehensbetrag (Nominalbetrag).
- Zinssatz in Prozent p.a. als Dezimalzahl (z.B. 3,25 % → 3.25).
- Restlaufzeit in Monaten; falls nur in Jahren: multipliziere × 12.
- Wenn ein Wert nicht erkennbar: null.
- confidence pro Feld: 0-1.

Schema:
{
  "monatliche_kreditrate": number | null,
  "gesamtsumme": number | null,
  "restlaufzeit_monate": number | null,
  "zinssatz": number | null,
  "kreditgeber": string | null,
  "confidence_per_field": { <feldname>: 0-1 },
  "source_excerpts": { <feldname>: "wörtlicher Textausschnitt aus PDF" },
  "warnings": ["Hinweis falls etwas unsicher ist"]
}

Antworte NUR mit dem JSON.`;

export const kreditvertragSchema = z.object({
  monatliche_kreditrate: nullableNumber,
  gesamtsumme: nullableNumber,
  restlaufzeit_monate: nullableNumber,
  zinssatz: nullableNumber,
  kreditgeber: nullableString,
  confidence_per_field: confidenceMap,
  source_excerpts: excerptMap,
  warnings,
});

/* ==================================================================
 * STUFE 2 – Einkommensteuerbescheid
 * ================================================================== */

export const EINKOMMENSTEUERBESCHEID_SYSTEM = `Du extrahierst strukturierte Daten aus einem österreichischen Einkommensteuerbescheid (Finanzamt).

WICHTIGE REGELN:
- Antworte AUSSCHLIESSLICH mit validem JSON nach dem angegebenen Schema.
- jahreseinkommen = "Gesamtbetrag der Einkünfte" (vor Sonderausgaben / außergewöhnliche Belastungen).
- einkunftsart = dominierende Einkunftsart, z.B. "nichtselbstaendige_arbeit", "selbstaendig", "gewerbebetrieb", "vermietung_verpachtung", "pension", "kapitalvermoegen".
- Veranlagungsjahr als Jahreszahl im Format "YYYY".
- Wenn ein Wert nicht erkennbar: null.
- confidence pro Feld: 0-1.

Schema:
{
  "jahreseinkommen": number | null,
  "veranlagungsjahr": "YYYY" | null,
  "einkunftsart": string | null,
  "confidence_per_field": { <feldname>: 0-1 },
  "source_excerpts": { <feldname>: "wörtlicher Textausschnitt aus PDF" },
  "warnings": ["Hinweis falls etwas unsicher ist"]
}

Antworte NUR mit dem JSON.`;

export const einkommensteuerbescheidSchema = z.object({
  jahreseinkommen: nullableNumber,
  veranlagungsjahr: nullableString,
  einkunftsart: nullableString,
  confidence_per_field: confidenceMap,
  source_excerpts: excerptMap,
  warnings,
});

/* ==================================================================
 * STUFE 2 – Arbeitsvertrag
 * ================================================================== */

export const ARBEITSVERTRAG_SYSTEM = `Du extrahierst strukturierte Daten aus einem österreichischen Arbeits- oder Dienstvertrag.

WICHTIGE REGELN:
- Antworte AUSSCHLIESSLICH mit validem JSON nach dem angegebenen Schema.
- beschaeftigungsart: "unbefristet" | "befristet" | "leiharbeit" | "geringfuegig" | "freier_dienstvertrag" | "werkvertrag" | "selbststaendig".
- befristung = Enddatum "YYYY-MM-DD" wenn befristet, sonst null.
- eintrittsdatum = vereinbarter Arbeitsbeginn "YYYY-MM-DD".
- Keine Werte erfinden – nicht Erkennbares auf null setzen.
- confidence pro Feld: 0-1.

Schema:
{
  "arbeitgeber": string | null,
  "beschaeftigungsart": string | null,
  "befristung": "YYYY-MM-DD" | null,
  "eintrittsdatum": "YYYY-MM-DD" | null,
  "confidence_per_field": { <feldname>: 0-1 },
  "source_excerpts": { <feldname>: "wörtlicher Textausschnitt aus PDF" },
  "warnings": ["Hinweis falls etwas unsicher ist"]
}

Antworte NUR mit dem JSON.`;

export const arbeitsvertragSchema = z.object({
  arbeitgeber: nullableString,
  beschaeftigungsart: nullableString,
  befristung: nullableString,
  eintrittsdatum: nullableString,
  confidence_per_field: confidenceMap,
  source_excerpts: excerptMap,
  warnings,
});

/* ==================================================================
 * STUFE 2 – Exposé / Kaufvertrag
 * ================================================================== */

export const EXPOSE_SYSTEM = `Du extrahierst strukturierte Daten aus einem österreichischen Immobilien-Exposé oder Kaufvertrag.

WICHTIGE REGELN:
- Antworte AUSSCHLIESSLICH mit validem JSON nach dem angegebenen Schema.
- kaufpreis = Brutto-Kaufpreis in EUR (ohne Nebenkosten / Maklerprovision separat ausweisen).
- wohnflaeche_qm = tatsächliche Wohnfläche in m², NICHT Nutzfläche oder Grundstücksfläche.
- immobilienart: "wohnung" | "haus" | "reihenhaus" | "doppelhaus" | "grundstueck".
- adresse_plz: 4-stellige österreichische PLZ falls erkennbar.
- baujahr als vierstellige Jahreszahl.
- Wenn ein Wert nicht erkennbar: null.
- confidence pro Feld: 0-1.

Schema:
{
  "kaufpreis": number | null,
  "wohnflaeche_qm": number | null,
  "adresse_plz": string | null,
  "immobilienart": string | null,
  "baujahr": number | null,
  "confidence_per_field": { <feldname>: 0-1 },
  "source_excerpts": { <feldname>: "wörtlicher Textausschnitt aus PDF" },
  "warnings": ["Hinweis falls etwas unsicher ist"]
}

Antworte NUR mit dem JSON.`;

export const exposeSchema = z.object({
  kaufpreis: nullableNumber,
  wohnflaeche_qm: nullableNumber,
  adresse_plz: nullableString,
  immobilienart: nullableString,
  baujahr: nullableNumber,
  confidence_per_field: confidenceMap,
  source_excerpts: excerptMap,
  warnings,
});

/* ==================================================================
 * Registry: pro Dokumenttyp System-Prompt + Zod-Schema
 * ================================================================== */

export interface ExtractionPromptConfig<
  S extends z.ZodTypeAny = z.ZodTypeAny,
> {
  system: string;
  schema: S;
}

/** Dokumenttypen ohne eigenes Extraktions-Schema (Stufe 2 wird übersprungen). */
export const SKIP_EXTRACTION_TYPES: DocumentType[] = [
  "ksv_auskunft",
  "unbekannt",
];

export const EXTRACTION_PROMPTS = {
  gehaltszettel: {
    system: GEHALTSZETTEL_SYSTEM,
    schema: gehaltszettelSchema,
  },
  kontoauszug: {
    system: KONTOAUSZUG_SYSTEM,
    schema: kontoauszugSchema,
  },
  kreditvertrag: {
    system: KREDITVERTRAG_SYSTEM,
    schema: kreditvertragSchema,
  },
  einkommensteuerbescheid: {
    system: EINKOMMENSTEUERBESCHEID_SYSTEM,
    schema: einkommensteuerbescheidSchema,
  },
  arbeitsvertrag: {
    system: ARBEITSVERTRAG_SYSTEM,
    schema: arbeitsvertragSchema,
  },
  expose: {
    system: EXPOSE_SYSTEM,
    schema: exposeSchema,
  },
} as const satisfies Partial<Record<DocumentType, ExtractionPromptConfig>>;

export type ExtractablePromptKey = keyof typeof EXTRACTION_PROMPTS;
export function hasExtractionPrompt(
  t: DocumentType
): t is ExtractablePromptKey {
  return t in EXTRACTION_PROMPTS;
}

/** Gemeinsame Felder jeder Stufe-2-Antwort (confidence_per_field etc.). */
export const commonExtractionMetaSchema = z.object({
  confidence_per_field: confidenceMap,
  source_excerpts: excerptMap,
  warnings,
});
