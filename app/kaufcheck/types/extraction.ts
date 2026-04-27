export const TARGET_FIELDS = [
  "einkommen",
  "kreditraten",
  "fixkosten",
  "eigenkapital",
  "objekt",
] as const;
export type TargetField = (typeof TARGET_FIELDS)[number];

export const UPLOAD_CONTEXTS = [
  "haushalt",
  "finanzen",
  "eigenkapital",
  "objekt",
] as const;
export type UploadContext = (typeof UPLOAD_CONTEXTS)[number];

/**
 * Dokumenttypen, die der Extraktor zurückgeben darf.
 * "unbekannt" ist kein Fehler, sondern das bewusste Ergebnis, wenn
 * Claude das Dokument nicht eindeutig zuordnen kann.
 */
export const DOCUMENT_TYPES = [
  "gehaltszettel",
  "kontoauszug",
  "kreditvertrag",
  "einkommensteuerbescheid",
  "arbeitsvertrag",
  "ksv_auskunft",
  "expose",
  "unbekannt",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  gehaltszettel: "Gehaltszettel",
  kontoauszug: "Kontoauszug",
  kreditvertrag: "Kreditvertrag",
  einkommensteuerbescheid: "Einkommensteuerbescheid",
  arbeitsvertrag: "Arbeitsvertrag",
  ksv_auskunft: "KSV-Auskunft",
  expose: "Exposé",
  unbekannt: "Unbekannter Dokumenttyp",
};

export const DOCUMENT_QUALITIES = [
  "gut",
  "schlecht_lesbar",
  "eingescannt_schraeg",
] as const;
export type DocumentQuality = (typeof DOCUMENT_QUALITIES)[number];

export const DOCUMENT_LANGUAGES = ["de", "en", "other"] as const;
export type DocumentLanguage = (typeof DOCUMENT_LANGUAGES)[number];

/**
 * Union aller Felder, die Claude extrahieren darf – über alle
 * Dokumenttypen hinweg. Jedes Feld ist optional & darf `null` sein,
 * wenn Claude es im Dokument nicht findet.
 */
/**
 * Flache Union aller Felder, die der Extraktor liefern kann. Der Client
 * zeigt nur die Felder an, die im aktuellen Dokument gesetzt sind.
 */
export interface ExtractedFields {
  // --- Gehaltszettel -----------------------------------------------
  nettoeinkommen_monatlich?: number | null;
  bruttoeinkommen_monatlich?: number | null;
  arbeitgeber?: string | null;
  abrechnungsmonat?: string | null;
  sonderzahlung?: boolean | null;
  sv_beitrag?: number | null;
  lohnsteuer?: number | null;

  // --- Kontoauszug -------------------------------------------------
  kontoinhaber?: string | null;
  zeitraum_von?: string | null;
  zeitraum_bis?: string | null;
  durchschnittlicher_gehaltseingang?: number | null;
  erkannte_fixkosten?: Array<{
    empfaenger: string;
    kategorie?: string | null;
    monatlicher_betrag: number;
  }> | null;
  erkannte_kreditraten?: Array<{
    glaeubiger: string;
    monatliche_rate: number;
  }> | null;

  // --- Kreditvertrag -----------------------------------------------
  monatliche_kreditrate?: number | null;
  gesamtsumme?: number | null;
  restlaufzeit_monate?: number | null;
  zinssatz?: number | null;
  kreditgeber?: string | null;

  // --- Einkommensteuerbescheid -------------------------------------
  jahreseinkommen?: number | null;
  veranlagungsjahr?: string | null;
  einkunftsart?: string | null;

  // --- Arbeitsvertrag ----------------------------------------------
  beschaeftigungsart?: string | null;
  befristung?: string | null;
  eintrittsdatum?: string | null;

  // --- Exposé ------------------------------------------------------
  kaufpreis?: number | null;
  wohnflaeche_qm?: number | null;
  adresse_plz?: string | null;
  immobilienart?: string | null;
  baujahr?: number | null;
}

export interface SourceHighlight {
  field: string;
  page: number;
  /**
   * [x, y, w, h] auf der Seite – Prozent-Koordinaten (0–1). Optional.
   * Akzeptiert als number[] (Claude liefert eine JSON-Array), Länge 4 erwartet.
   */
  bbox?: number[] | null;
  excerpt: string;
}

export interface ExtractSuccessResponse {
  success: true;
  documentType: DocumentType;
  documentTypeLabel: string;
  confidence: number;
  /** Qualitätsbewertung aus Stufe 1 – nützlich für UI-Hinweise. */
  quality?: DocumentQuality;
  language?: DocumentLanguage;
  pages?: number;
  extracted: ExtractedFields;
  /** Feldweise Konfidenz der Extraktion (Stufe 2). */
  confidencePerField?: Record<string, number>;
  sourceHighlights: SourceHighlight[];
  warnings: string[];
}

export interface ExtractErrorResponse {
  success: false;
  error: string;
  /** Hinweis an Client: darf es einen neuen Versuch starten? */
  retryable?: boolean;
}

export type ExtractResponse = ExtractSuccessResponse | ExtractErrorResponse;

// --- Client-seitiger Status (vom Upload-Hook verwaltet) -------------

export type DocumentStatus =
  | { phase: "uploading"; progress: number }
  | { phase: "analyzing" }
  | { phase: "success"; result: ExtractSuccessResponse }
  | { phase: "error"; message: string };

export interface DocumentEntry {
  id: string;
  file: File;
  status: DocumentStatus;
  applied?: boolean;
}
