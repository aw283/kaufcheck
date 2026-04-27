import type {
  DocumentType,
  ExtractedFields,
} from "@/app/kaufcheck/types/extraction";

export type FieldKey = keyof ExtractedFields;

export type FieldKind =
  | "money"
  | "percent"
  | "integer"
  | "text"
  | "yearmonth"
  | "boolean"
  | "list-kreditraten"
  | "list-fixkosten";

export interface FieldMeta {
  label: string;
  kind: FieldKind;
  /** Optionaler Hilfstext unter dem Label. */
  helper?: string;
  /** Optionaler Suffix (z. B. "Monate", "m²"). */
  suffix?: string;
}

export const FIELD_META: Partial<Record<FieldKey, FieldMeta>> = {
  // Gehaltszettel
  nettoeinkommen_monatlich: {
    label: "Nettoeinkommen (monatlich)",
    kind: "money",
  },
  bruttoeinkommen_monatlich: {
    label: "Bruttoeinkommen (monatlich)",
    kind: "money",
  },
  arbeitgeber: { label: "Arbeitgeber", kind: "text" },
  abrechnungsmonat: {
    label: "Abrechnungsmonat",
    kind: "yearmonth",
    helper: "Format JJJJ-MM",
  },
  sonderzahlung: {
    label: "Sonderzahlung erkannt",
    kind: "boolean",
    helper: "z. B. Urlaubs- oder Weihnachtsgeld",
  },
  sv_beitrag: { label: "SV-Beitrag", kind: "money" },
  lohnsteuer: { label: "Lohnsteuer", kind: "money" },

  // Kontoauszug
  kontoinhaber: { label: "Kontoinhaber:in", kind: "text" },
  zeitraum_von: { label: "Zeitraum von", kind: "text" },
  zeitraum_bis: { label: "Zeitraum bis", kind: "text" },
  durchschnittlicher_gehaltseingang: {
    label: "Ø Gehaltseingang",
    kind: "money",
  },
  erkannte_kreditraten: {
    label: "Erkannte Kreditraten",
    kind: "list-kreditraten",
    helper: "Bitte auswählen, welche als bestehende Kreditrate zählen",
  },
  erkannte_fixkosten: {
    label: "Erkannte Fixkosten",
    kind: "list-fixkosten",
    helper: "Auswählen, welche als sonstige Fixkosten gelten",
  },

  // Kreditvertrag
  monatliche_kreditrate: { label: "Monatliche Kreditrate", kind: "money" },
  gesamtsumme: { label: "Ursprüngliche Kreditsumme", kind: "money" },
  restlaufzeit_monate: {
    label: "Restlaufzeit",
    kind: "integer",
    suffix: "Monate",
  },
  zinssatz: { label: "Zinssatz p.a.", kind: "percent" },
  kreditgeber: { label: "Kreditgeber", kind: "text" },

  // Einkommensteuerbescheid
  jahreseinkommen: {
    label: "Jahreseinkommen",
    kind: "money",
    helper: "Gesamtbetrag der Einkünfte",
  },
  veranlagungsjahr: { label: "Veranlagungsjahr", kind: "text" },
  einkunftsart: { label: "Einkunftsart", kind: "text" },

  // Arbeitsvertrag
  beschaeftigungsart: { label: "Beschäftigungsart", kind: "text" },
  befristung: { label: "Befristet bis", kind: "text" },
  eintrittsdatum: { label: "Eintrittsdatum", kind: "text" },

  // Exposé
  kaufpreis: { label: "Kaufpreis", kind: "money" },
  wohnflaeche_qm: { label: "Wohnfläche", kind: "integer", suffix: "m²" },
  adresse_plz: { label: "PLZ", kind: "text" },
  immobilienart: { label: "Immobilienart", kind: "text" },
  baujahr: { label: "Baujahr", kind: "integer" },
};

/**
 * Reihenfolge, in der Felder im Review angezeigt werden – pro Dokumenttyp.
 * Felder, die nicht in der Liste stehen, werden ausgeblendet (auch wenn
 * Claude sie liefert) – das hält die UI fokussiert.
 */
export const FIELDS_BY_DOCTYPE: Record<DocumentType, FieldKey[]> = {
  gehaltszettel: [
    "nettoeinkommen_monatlich",
    "bruttoeinkommen_monatlich",
    "arbeitgeber",
    "abrechnungsmonat",
    "sonderzahlung",
    "sv_beitrag",
    "lohnsteuer",
  ],
  kontoauszug: [
    "kontoinhaber",
    "zeitraum_von",
    "zeitraum_bis",
    "durchschnittlicher_gehaltseingang",
    "erkannte_kreditraten",
    "erkannte_fixkosten",
  ],
  kreditvertrag: [
    "kreditgeber",
    "monatliche_kreditrate",
    "gesamtsumme",
    "restlaufzeit_monate",
    "zinssatz",
  ],
  einkommensteuerbescheid: [
    "jahreseinkommen",
    "veranlagungsjahr",
    "einkunftsart",
  ],
  arbeitsvertrag: [
    "arbeitgeber",
    "beschaeftigungsart",
    "befristung",
    "eintrittsdatum",
  ],
  expose: [
    "kaufpreis",
    "wohnflaeche_qm",
    "adresse_plz",
    "immobilienart",
    "baujahr",
  ],
  ksv_auskunft: [],
  unbekannt: [],
};
