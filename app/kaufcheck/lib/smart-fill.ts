/**
 * Smart-Fill – Merge-Logik für extrahierte Werte in den Wizard-Store.
 *
 * Regeln (aus Spec):
 *  - Manuell gesetzte Felder werden NIE überschrieben.
 *  - Default-Felder (Initialwert) werden ohne Rückfrage gefüllt.
 *  - Bereits extrahierte Felder mit signifikant abweichendem Wert
 *    landen als `Conflict` im Outcome – die UI entscheidet.
 *  - Sammel-Felder (bestehendeKreditraten, sonstigeFixkosten,
 *    eigenkapital) werden additiv akkumuliert, nicht überschrieben.
 *  - Bei Gehaltszetteln mit Sonderzahlung wird der Monatsbetrag mit
 *    14/12 hochgerechnet (österreichischer 14-Gehälter-Standard).
 *  - ESt-Bescheid-Jahreseinkommen → Monatswert über /12.
 */

import type {
  Bundesland,
  Einkommensart,
  FieldOrigin,
  FieldPath,
  FieldSourceInfo,
  HaushaltData,
  Immobilienart,
  KaufcheckInput,
} from "@/app/kaufcheck/types";
import type {
  DocumentType,
  ExtractedFields,
  ExtractSuccessResponse,
} from "@/app/kaufcheck/types/extraction";

// ------------------------------------------------------------------
// Konfiguration
// ------------------------------------------------------------------

/** Akzeptable Differenz zwischen "alt" und "neu", damit es KEIN Konflikt ist. */
const NETTO_TOLERANZ = 0.05; // 5 %
const SUMMENFELD_TOLERANZ = 0.0; // exakt – Summen sind eindeutig
/** Schwellwert, ab dem ein Dokument als "alt" markiert wird. */
const ALT_DOKUMENT_MONATE = 12;

// ------------------------------------------------------------------
// Public Types
// ------------------------------------------------------------------

export type ConflictKind = "value" | "sum_or_replace";

export interface Conflict {
  /** Eindeutiger Pfad im Store (z. B. "finanzen.nettoEinkommen"). */
  path: FieldPath;
  label: string;
  existing: number | string | null;
  incoming: number | string | null;
  /**
   * Bei numerischen Konflikten zusätzlich die "Summe"-Option erlauben –
   * z. B. zwei Gehaltszettel im Haushalt.
   */
  kind: ConflictKind;
  existingSource?: FieldSourceInfo;
  incomingSource: FieldSourceInfo;
  unit?: string;
}

export interface SmartFillContext {
  current: KaufcheckInput;
  fieldSources: Partial<Record<FieldPath, FieldSourceInfo>>;
}

export interface SmartFillOutcome {
  /** Nur die geänderten Slices – kann direkt in `updateData` einfließen. */
  patches: Partial<KaufcheckInput>;
  /** Updates für `fieldSources`. */
  newSources: Partial<Record<FieldPath, FieldSourceInfo>>;
  /** Felder, deren Pfad wir gerade auto-gefüllt haben (für Pulse-Animation). */
  appliedFields: FieldPath[];
  /** Felder, die manuell besetzt waren und nicht angefasst wurden. */
  skipped: FieldPath[];
  /** Konflikte → erfordern UI-Auflösung. */
  conflicts: Conflict[];
  /** Info-Hinweise für Toasts (z. B. "14 Gehälter erkannt"). */
  notes: string[];
}

// ------------------------------------------------------------------
// Public API – exakte Signatur aus der User-Spec.
// ------------------------------------------------------------------

export function mergeExtractedData(
  current: Partial<KaufcheckInput>,
  extracted: ExtractedFields,
  documentType: DocumentType
): Partial<KaufcheckInput> {
  // Spec-konforme Variante: nur die Patches zurückgeben, keine Quellen.
  const ctx: SmartFillContext = {
    current: ensureFullInput(current),
    fieldSources: {},
  };
  const fakeResult: ExtractSuccessResponse = {
    success: true,
    documentType,
    documentTypeLabel: documentType,
    confidence: 1,
    extracted,
    sourceHighlights: [],
    warnings: [],
  };
  return smartFill(ctx, fakeResult).patches;
}

/**
 * Reichere Variante mit Konfliktanalyse + Source-Tracking.
 * Wird vom Store aufgerufen.
 */
export function smartFill(
  ctx: SmartFillContext,
  result: ExtractSuccessResponse,
  meta?: { documentName?: string }
): SmartFillOutcome {
  const out = makeEmptyOutcome();
  const docName =
    meta?.documentName ?? result.documentTypeLabel ?? result.documentType;
  const sourceMeta: FieldSourceInfo = {
    source: "extracted",
    documentName: docName,
    documentType: result.documentType,
    at: new Date().toISOString(),
  };

  switch (result.documentType) {
    case "gehaltszettel":
      mergeGehaltszettel(ctx, result.extracted, sourceMeta, out);
      break;
    case "kontoauszug":
      mergeKontoauszug(ctx, result.extracted, sourceMeta, out);
      break;
    case "kreditvertrag":
      mergeKreditvertrag(ctx, result.extracted, sourceMeta, out);
      break;
    case "einkommensteuerbescheid":
      mergeEinkommensteuerbescheid(ctx, result.extracted, sourceMeta, out);
      break;
    case "arbeitsvertrag":
      mergeArbeitsvertrag(ctx, result.extracted, sourceMeta, out);
      break;
    case "expose":
      mergeExpose(ctx, result.extracted, sourceMeta, out);
      break;
    case "ksv_auskunft":
    case "unbekannt":
      out.notes.push(
        "Aus diesem Dokumenttyp werden keine Werte automatisch übernommen."
      );
      break;
  }

  // Alters-Hinweis (Dokument > 12 Monate alt) wird nicht zentral gemacht –
  // die Warnings aus Stufe 1/2 enthalten das schon. Hier nur ergänzen,
  // wenn explizites Datum extrahiert wurde.
  appendOldDocumentNote(result.extracted, out);

  return out;
}

function makeEmptyOutcome(): SmartFillOutcome {
  return {
    patches: {},
    newSources: {},
    appliedFields: [],
    skipped: [],
    conflicts: [],
    notes: [],
  };
}

// ------------------------------------------------------------------
// Field-Setter mit Quell- und Konflikt-Logik
// ------------------------------------------------------------------

interface SetFieldOptions {
  /** Toleranz: relative Abweichung (0..1), bei der KEIN Konflikt entsteht. */
  tolerance?: number;
  /** Bei numerischen Werten: Sammel-Modus → addieren statt ersetzen. */
  cumulative?: boolean;
  /** Anzeige-Label für Konflikte / Notes. */
  label: string;
  /** Anzeige-Einheit für Konflikte (z. B. "€/Monat"). */
  unit?: string;
  /** Erlaubt "Summe" als Konflikt-Auflösung (z. B. zwei Gehälter). */
  allowSum?: boolean;
}

function setField<K extends FieldPath, V extends number | string>(
  ctx: SmartFillContext,
  path: K,
  newValue: V | null | undefined,
  source: FieldSourceInfo,
  out: SmartFillOutcome,
  opts: SetFieldOptions
) {
  if (newValue === null || newValue === undefined) return;

  const existing = readPath(ctx.current, path);
  const existingSource = ctx.fieldSources[path];
  const isManual = existingSource?.source === "manual";
  const isDefault = !existingSource || existingSource.source === "default";

  // 1) Manuell gesetzt → nie überschreiben.
  if (isManual) {
    out.skipped.push(path);
    out.notes.push(
      `Feld „${opts.label}" hat bereits einen manuell gesetzten Wert – nicht überschrieben.`
    );
    return;
  }

  // 2) Sammel-Felder: addieren.
  if (opts.cumulative && typeof newValue === "number") {
    const summed =
      typeof existing === "number" && existing > 0
        ? Math.round((existing + newValue) * 100) / 100
        : newValue;
    writePatch(out, path, summed);
    out.newSources[path] = source;
    out.appliedFields.push(path);
    return;
  }

  // 3) Default → einfach übernehmen.
  if (isDefault || isEffectivelyEmpty(existing)) {
    writePatch(out, path, newValue);
    out.newSources[path] = source;
    out.appliedFields.push(path);
    return;
  }

  // 4) Bereits extrahiert → Konfliktcheck.
  if (typeof existing === "number" && typeof newValue === "number") {
    const tol = opts.tolerance ?? 0;
    const diff =
      existing === 0 ? 1 : Math.abs(newValue - existing) / Math.abs(existing);
    if (diff <= tol) {
      // praktisch identisch → höhere Konfidenz gewinnt; wir lassen den
      // bestehenden Wert stehen (vermeidet Flackern).
      return;
    }
    out.conflicts.push({
      path,
      label: opts.label,
      existing,
      incoming: newValue,
      existingSource,
      incomingSource: source,
      kind: opts.allowSum ? "sum_or_replace" : "value",
      unit: opts.unit,
    });
    return;
  }

  if (typeof existing === "string" && typeof newValue === "string") {
    if (existing.toLowerCase().trim() === newValue.toLowerCase().trim()) return;
    out.conflicts.push({
      path,
      label: opts.label,
      existing,
      incoming: newValue,
      existingSource,
      incomingSource: source,
      kind: "value",
    });
    return;
  }

  // Typmischung – einfach überschreiben.
  writePatch(out, path, newValue);
  out.newSources[path] = source;
  out.appliedFields.push(path);
}

// ------------------------------------------------------------------
// Per-Doctype-Mapper
// ------------------------------------------------------------------

function mergeGehaltszettel(
  ctx: SmartFillContext,
  e: ExtractedFields,
  source: FieldSourceInfo,
  out: SmartFillOutcome
) {
  // Sonderzahlung erkannt → Monatswert × 14/12 ist der "echte" Schnitt.
  let monatsnetto = e.nettoeinkommen_monatlich ?? null;
  if (e.sonderzahlung === true && typeof monatsnetto === "number") {
    monatsnetto = Math.round(monatsnetto * (14 / 12));
    out.notes.push(
      "14 Gehälter (Sonderzahlung) erkannt – Nettoeinkommen wurde auf einen 12-Monats-Durchschnitt hochgerechnet."
    );
  }

  setField(ctx, "finanzen.nettoEinkommen", monatsnetto, source, out, {
    label: "Nettoeinkommen",
    unit: "€/Monat",
    tolerance: NETTO_TOLERANZ,
    allowSum: true, // mehrere Gehaltszettel im Haushalt → Summe optional
  });
}

function mergeKontoauszug(
  ctx: SmartFillContext,
  e: ExtractedFields,
  source: FieldSourceInfo,
  out: SmartFillOutcome
) {
  // Gehaltseingang nur als Fallback – Gehaltszettel hat Vorrang.
  if (typeof e.durchschnittlicher_gehaltseingang === "number") {
    setField(
      ctx,
      "finanzen.nettoEinkommen",
      e.durchschnittlicher_gehaltseingang,
      source,
      out,
      {
        label: "Nettoeinkommen",
        unit: "€/Monat",
        tolerance: NETTO_TOLERANZ,
      }
    );
  }

  // Kreditraten: SUMME aller Einträge.
  const krediteSum = sum(
    (e.erkannte_kreditraten ?? []).map((r) => r.monatliche_rate)
  );
  if (krediteSum > 0) {
    setField(
      ctx,
      "finanzen.bestehendeKreditraten",
      krediteSum,
      source,
      out,
      {
        label: "Bestehende Kreditraten",
        unit: "€/Monat",
        cumulative: true,
        tolerance: SUMMENFELD_TOLERANZ,
      }
    );
  }

  // Fixkosten: SUMME aller wiederkehrenden Nicht-Kredit-Zahlungen.
  // Die Klassifikation passiert bereits im Extraktor (kategorie != "kredit"),
  // wir verlassen uns darauf und summieren alle Einträge in erkannte_fixkosten.
  const fixkostenSum = sum(
    (e.erkannte_fixkosten ?? []).map((r) => r.monatlicher_betrag)
  );
  if (fixkostenSum > 0) {
    setField(
      ctx,
      "finanzen.sonstigeFixkosten",
      fixkostenSum,
      source,
      out,
      {
        label: "Sonstige Fixkosten",
        unit: "€/Monat",
        cumulative: true,
        tolerance: SUMMENFELD_TOLERANZ,
      }
    );
  }
}

function mergeKreditvertrag(
  ctx: SmartFillContext,
  e: ExtractedFields,
  source: FieldSourceInfo,
  out: SmartFillOutcome
) {
  // Multiple Kreditverträge → addieren.
  if (typeof e.monatliche_kreditrate === "number") {
    setField(
      ctx,
      "finanzen.bestehendeKreditraten",
      e.monatliche_kreditrate,
      source,
      out,
      {
        label: "Bestehende Kreditraten",
        unit: "€/Monat",
        cumulative: true,
      }
    );
  }
}

function mergeEinkommensteuerbescheid(
  ctx: SmartFillContext,
  e: ExtractedFields,
  source: FieldSourceInfo,
  out: SmartFillOutcome
) {
  if (typeof e.jahreseinkommen === "number" && e.jahreseinkommen > 0) {
    const monatsschnitt = Math.round(e.jahreseinkommen / 12);
    setField(ctx, "finanzen.nettoEinkommen", monatsschnitt, source, out, {
      label: "Nettoeinkommen",
      unit: "€/Monat",
      tolerance: NETTO_TOLERANZ,
    });
    out.notes.push(
      "Jahreseinkommen aus Einkommensteuer­bescheid auf Monatswert (÷ 12) umgerechnet."
    );
  }
}

function mergeArbeitsvertrag(
  ctx: SmartFillContext,
  e: ExtractedFields,
  source: FieldSourceInfo,
  out: SmartFillOutcome
) {
  const mapped = mapBeschaeftigungsartToEinkommensart(e.beschaeftigungsart);
  if (mapped) {
    setField(ctx, "haushalt.einkommensart", mapped, source, out, {
      label: "Einkommensart",
    });
  }
}

function mergeExpose(
  ctx: SmartFillContext,
  e: ExtractedFields,
  source: FieldSourceInfo,
  out: SmartFillOutcome
) {
  if (typeof e.kaufpreis === "number" && e.kaufpreis > 0) {
    setField(ctx, "vorstellung.wunschKaufpreis", e.kaufpreis, source, out, {
      label: "Wunsch-Kaufpreis",
      unit: "€",
      tolerance: 0.02,
    });
    // Wenn vorher "keineKaufpreisVorstellung=true" war, sollten wir das
    // zurücknehmen, sonst wird der Slider ignoriert. Direkt patchen.
    if (ctx.current.vorstellung.keineKaufpreisVorstellung) {
      mergeIntoPatch(out, "vorstellung", { keineKaufpreisVorstellung: false });
    }
  }
  const art = mapImmobilienart(e.immobilienart);
  if (art) {
    setField(ctx, "vorstellung.immobilienart", art, source, out, {
      label: "Immobilienart",
    });
  }
  const land = mapBundeslandFromPlz(e.adresse_plz);
  if (land) {
    setField(ctx, "vorstellung.bundesland", land, source, out, {
      label: "Bundesland",
    });
  }
}

// ------------------------------------------------------------------
// Mapper / Helpers
// ------------------------------------------------------------------

function mapBeschaeftigungsartToEinkommensart(
  v: string | null | undefined
): Einkommensart | null {
  if (!v) return null;
  const s = v.toLowerCase();
  if (s.includes("unbefristet")) return "unbefristet";
  if (s.includes("befristet")) return "befristet";
  if (
    s.includes("selbst") ||
    s.includes("freier") ||
    s.includes("werkvertrag") ||
    s.includes("geringfügig") ||
    s.includes("geringfuegig") ||
    s.includes("leiharbeit")
  ) {
    return "selbststaendig";
  }
  if (s.includes("pension")) return "pension";
  return null;
}

function mapImmobilienart(v: string | null | undefined): Immobilienart | null {
  if (!v) return null;
  const s = v.toLowerCase();
  if (s.includes("wohnung")) return "wohnung";
  if (s.includes("haus") || s.includes("reihen") || s.includes("doppel"))
    return "haus";
  return null;
}

/**
 * Heuristisches Mapping PLZ → Bundesland für Österreich. Deckt nur die
 * groben PLZ-Bereiche ab – ausreichend für Auto-Fill, der User kann
 * korrigieren.
 */
function mapBundeslandFromPlz(plz: string | null | undefined): Bundesland | null {
  if (!plz) return null;
  const m = plz.match(/(\d{4})/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n)) return null;
  if (n >= 1000 && n <= 1999) return "wien";
  if (n >= 2000 && n <= 3999) return "noe";
  if (n >= 4000 && n <= 4999) return "ooe";
  if (n >= 5000 && n <= 5999) return "sbg";
  if (n >= 6000 && n <= 6999) return "tirol";
  if (n >= 6700 && n <= 6999) return "vbg"; // Überlapp Tirol/Vorarlberg – grob
  if (n >= 7000 && n <= 7999) return "bgld";
  if (n >= 8000 && n <= 8999) return "stmk";
  if (n >= 9000 && n <= 9999) return "ktn";
  return null;
}

function appendOldDocumentNote(e: ExtractedFields, out: SmartFillOutcome) {
  const dateStr = e.abrechnungsmonat ?? e.zeitraum_bis ?? null;
  if (!dateStr) return;
  // YYYY-MM oder YYYY-MM-DD akzeptieren.
  const match = dateStr.match(/^(\d{4})-(\d{2})/);
  if (!match) return;
  const docDate = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    1
  ).getTime();
  const ageMonths =
    (Date.now() - docDate) / (1000 * 60 * 60 * 24 * 30.44);
  if (ageMonths > ALT_DOKUMENT_MONATE) {
    out.notes.push(
      `Das Dokument ist ca. ${Math.round(ageMonths)} Monate alt – Werte trotzdem übernommen, bitte auf Aktualität prüfen.`
    );
  }
}

// ------------------------------------------------------------------
// Path-Handling (Read/Write per "section.field"-Pfad)
// ------------------------------------------------------------------

function readPath(input: KaufcheckInput, path: FieldPath): unknown {
  const [section, field] = path.split(".") as [
    keyof KaufcheckInput,
    string,
  ];
  const slice = input[section] as unknown as Record<string, unknown>;
  return slice[field];
}

function writePatch<V>(
  out: SmartFillOutcome,
  path: FieldPath,
  value: V
) {
  const [section, field] = path.split(".") as [
    keyof KaufcheckInput,
    string,
  ];
  const existing =
    (out.patches[section] as Record<string, unknown> | undefined) ?? {};
  (out.patches as Record<string, unknown>)[section] = {
    ...existing,
    [field]: value,
  };
}

function mergeIntoPatch<S extends keyof KaufcheckInput>(
  out: SmartFillOutcome,
  section: S,
  patch: Partial<KaufcheckInput[S]>
) {
  const existing =
    (out.patches[section] as Record<string, unknown> | undefined) ?? {};
  (out.patches as Record<string, unknown>)[section] = {
    ...existing,
    ...patch,
  };
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function sum(arr: number[]): number {
  return arr.reduce((s, n) => s + (Number.isFinite(n) ? n : 0), 0);
}

function isEffectivelyEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (typeof v === "number") return v === 0;
  return false;
}

function ensureFullInput(p: Partial<KaufcheckInput>): KaufcheckInput {
  return {
    haushalt: {
      erwachsene: 1,
      kinder: 0,
      alterHauptantragsteller: 35,
      einkommensart: "",
      ...p.haushalt,
    } as HaushaltData,
    finanzen: {
      nettoEinkommen: 0,
      bestehendeKreditraten: 0,
      sonstigeFixkosten: 0,
      ...p.finanzen,
    },
    vorstellung: {
      eigenkapital: 0,
      bundesland: "",
      immobilienart: "",
      wunschKaufpreis: 0,
      keineKaufpreisVorstellung: false,
      laufzeitJahre: 30,
      zinssatz: 3.5,
      ...p.vorstellung,
    },
  };
}

// ------------------------------------------------------------------
// Source-Helper für UI-Komponenten
// ------------------------------------------------------------------

export function isAutoFilled(
  source: FieldSourceInfo | undefined
): source is FieldSourceInfo & { source: "extracted" } {
  return source?.source === "extracted";
}

export function buildAutoFilledTooltip(s: FieldSourceInfo): string {
  if (s.source !== "extracted") return "";
  const docName = s.documentName ?? "Ihr Dokument";
  return `Automatisch aus „${docName}" extrahiert. Klicken zum Bearbeiten.`;
}

export function makeManualSource(): FieldSourceInfo {
  return { source: "manual" as FieldOrigin, at: new Date().toISOString() };
}
