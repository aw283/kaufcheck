import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import {
  DOCUMENT_TYPE_LABEL,
  type ExtractedFields,
  type ExtractResponse,
  type ExtractSuccessResponse,
  type SourceHighlight,
  UPLOAD_CONTEXTS,
  type UploadContext,
} from "@/app/kaufcheck/types/extraction";
import {
  checkPdfStructure,
  deepScanPdf,
  isPdf,
} from "@/app/kaufcheck/lib/pdf-check";
import {
  ClaudeEmptyResponseError,
  ClaudeInvalidJsonError,
  extractDocument,
  MissingApiKeyError,
  type ExtractionPipelineResult,
  type RawExtractionData,
} from "@/lib/claude-extraction";
import {
  getClientIp,
  rateLimit,
  rateLimitMessage,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ------------------------------------------------------------------
// Konstanten
// ------------------------------------------------------------------
const MAX_SIZE_BYTES = 15 * 1024 * 1024;

// ------------------------------------------------------------------
// Logging – NUR Metadaten, niemals Content / extrahierte Werte.
// ------------------------------------------------------------------
type LogLevel = "info" | "warn" | "error";
interface LogPayload {
  action: string;
  ip?: string;
  size_bytes?: number;
  size_mime?: string;
  status_code?: number;
  duration_ms?: number;
  document_type?: string;
  doc_quality?: string;
  doc_language?: string;
  stage1_input_tokens?: number;
  stage1_output_tokens?: number;
  stage2_input_tokens?: number;
  stage2_output_tokens?: number;
  stage2_skipped?: boolean;
  total_cost_usd?: number;
  error_type?: string;
}
function safeLog(level: LogLevel, payload: LogPayload) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    src: "/api/kaufcheck/extract",
    level,
    ...payload,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
  // Sentry-Einhängepunkt (falls konfiguriert): Sentry.captureMessage(line).
}

function errorResponse(
  status: number,
  message: string,
  opts?: { retryable?: boolean }
) {
  const body: ExtractResponse = {
    success: false,
    error: message,
    retryable: opts?.retryable,
  };
  return NextResponse.json(body, { status });
}

// ------------------------------------------------------------------
// Haupt-Handler
// ------------------------------------------------------------------
export async function POST(request: Request) {
  const startedAt = Date.now();
  const ip = getClientIp(request);

  // 1) Rate-Limit (Dual-Window: 10 / 5 Min UND 100 / 24 h)
  const rl = rateLimit("extract", ip);
  if (!rl.ok) {
    safeLog("warn", {
      action: "rate_limited",
      ip,
      status_code: 429,
      duration_ms: Date.now() - startedAt,
      error_type: rl.reason,
    });
    return NextResponse.json<ExtractResponse>(
      {
        success: false,
        error: rateLimitMessage(rl),
        retryable: rl.reason !== "long_window",
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  // 2) Multipart parsen
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    safeLog("warn", {
      action: "invalid_multipart",
      ip,
      status_code: 400,
      duration_ms: Date.now() - startedAt,
    });
    return errorResponse(400, "Ungültiger Upload. Bitte erneut versuchen.");
  }

  const fileEntry = formData.get("file");
  const contextRaw = formData.get("context");

  if (!(fileEntry instanceof File)) {
    return errorResponse(400, "Keine Datei erhalten.");
  }
  const context =
    typeof contextRaw === "string" &&
    (UPLOAD_CONTEXTS as readonly string[]).includes(contextRaw)
      ? (contextRaw as UploadContext)
      : null;
  if (!context) {
    return errorResponse(
      400,
      "Ungültiger Upload-Kontext. Bitte Seite neu laden und erneut versuchen."
    );
  }

  if (fileEntry.size > MAX_SIZE_BYTES) {
    safeLog("warn", {
      action: "file_too_large",
      ip,
      size_bytes: fileEntry.size,
      status_code: 400,
      duration_ms: Date.now() - startedAt,
    });
    return errorResponse(
      400,
      "Die Datei ist größer als 15 MB. Bitte kleinere PDF-Version hochladen."
    );
  }

  // 3) Validation Defense-in-Depth.
  //    MIME-Type wird ignoriert – ist client-gesteuert.
  //    Stufe a) Magic-Bytes  Stufe b) Strukturcheck (EOF, JS, Launch)
  //    Stufe c) Deep-Scan via pdf-parse (Lazy, soft-fail).
  const arrayBuffer = await fileEntry.arrayBuffer();
  let bytes: Uint8Array | null = new Uint8Array(arrayBuffer);
  if (!isPdf(bytes)) {
    safeLog("warn", {
      action: "not_a_pdf",
      ip,
      size_bytes: fileEntry.size,
      size_mime: fileEntry.type,
      status_code: 400,
      duration_ms: Date.now() - startedAt,
    });
    return errorResponse(
      400,
      "Die Datei ist kein gültiges PDF. Bitte ein PDF-Dokument hochladen."
    );
  }

  const struct = checkPdfStructure(bytes);
  if (!struct.ok) {
    safeLog("warn", {
      action: "pdf_structural_check_failed",
      ip,
      size_bytes: fileEntry.size,
      status_code: 400,
      duration_ms: Date.now() - startedAt,
      error_type: struct.reason,
    });
    const msg =
      struct.reason === "contains_javascript" ||
      struct.reason === "contains_launch_action"
        ? "Das PDF enthält ausführbare Inhalte (Skripte/Aktionen) und wurde aus Sicherheitsgründen abgelehnt."
        : "Die PDF-Datei ist beschädigt oder unvollständig. Bitte mit einem anderen Programm neu speichern und erneut hochladen.";
    return errorResponse(400, msg);
  }

  const deep = await deepScanPdf(bytes);
  if (!deep.ok) {
    safeLog("warn", {
      action: "pdf_deep_scan_failed",
      ip,
      size_bytes: fileEntry.size,
      status_code: 400,
      duration_ms: Date.now() - startedAt,
      error_type: deep.reason,
    });
    return errorResponse(
      400,
      "Die PDF-Datei konnte nicht gelesen werden – möglicherweise verschlüsselt oder beschädigt."
    );
  }

  // 4) Pipeline (Stufe 1 + Stufe 2)
  let pipeline: ExtractionPipelineResult;
  try {
    const base64 = Buffer.from(bytes).toString("base64");
    // Bytes-Referenz so früh wie möglich freigeben – die base64-Variante
    // hat alles, was Claude braucht. Der Rohdaten-Buffer wird nicht mehr
    // gehalten, sodass GC ihn unmittelbar nach dem Pipeline-Call freigibt.
    bytes = null;
    pipeline = await extractDocument({ base64Pdf: base64 });
  } catch (err) {
    bytes = null;
    return handleClaudeError(err, {
      ip,
      duration: Date.now() - startedAt,
      sizeBytes: fileEntry.size,
    });
  } finally {
    // Doppelt sicher: nach Pipeline-Ende ist der Rohbuffer nicht mehr
    // referenziert, das base64-String dito (lokal-scoped). Kein Disk-IO
    // hat stattgefunden – das gesamte PDF lebte ausschließlich im RAM.
    bytes = null;
  }

  const { classification, extraction, usage } = pipeline;

  // 5) Konfidenz-Gate – sehr schwache Klassifikationen explizit ablehnen.
  if (classification.confidence < 0.4 || classification.type === "unbekannt") {
    safeLog("warn", {
      action: "classification_unusable",
      ip,
      document_type: classification.type,
      doc_quality: classification.quality,
      stage1_input_tokens: usage.stage1.input_tokens,
      stage1_output_tokens: usage.stage1.output_tokens,
      stage2_skipped: usage.stage2 === null,
      total_cost_usd: usage.total_cost_usd,
      duration_ms: Date.now() - startedAt,
      status_code: 422,
    });
    return NextResponse.json<ExtractResponse>(
      {
        success: false,
        error:
          "Das Dokument konnte nicht sicher klassifiziert werden. Bitte ein klareres Scan-PDF hochladen oder Werte manuell eingeben.",
        retryable: false,
      },
      { status: 422 }
    );
  }

  // 6) Payload zusammenbauen (flache Wire-Shape für den Client).
  const extracted = extraction
    ? mapExtractedFields(classification.type, extraction)
    : {};
  const sourceHighlights = extraction
    ? buildSourceHighlights(extraction)
    : [];
  const warnings = buildWarnings(pipeline, context);

  const response: ExtractSuccessResponse = {
    success: true,
    documentType: classification.type,
    documentTypeLabel: DOCUMENT_TYPE_LABEL[classification.type],
    confidence: clamp01(classification.confidence),
    quality: classification.quality,
    language: classification.language,
    pages: classification.pages,
    extracted,
    confidencePerField: extraction?.confidence_per_field,
    sourceHighlights,
    warnings,
  };

  safeLog("info", {
    action: "extract_success",
    ip,
    size_bytes: fileEntry.size,
    size_mime: fileEntry.type,
    status_code: 200,
    duration_ms: Date.now() - startedAt,
    document_type: classification.type,
    doc_quality: classification.quality,
    doc_language: classification.language,
    stage1_input_tokens: usage.stage1.input_tokens,
    stage1_output_tokens: usage.stage1.output_tokens,
    stage2_input_tokens: usage.stage2?.input_tokens,
    stage2_output_tokens: usage.stage2?.output_tokens,
    stage2_skipped: usage.stage2 === null,
    total_cost_usd: usage.total_cost_usd,
  });

  return NextResponse.json<ExtractResponse>(response);
}

// ------------------------------------------------------------------
// Per-Doctype-Mapping → flache ExtractedFields
// ------------------------------------------------------------------

type Fields = Record<string, unknown>;

function pickNumber(src: Fields, key: string): number | null {
  const v = src[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function pickString(src: Fields, key: string): string | null {
  const v = src[key];
  return typeof v === "string" && v.trim().length > 0 ? v : null;
}
function pickBoolean(src: Fields, key: string): boolean | null {
  const v = src[key];
  return typeof v === "boolean" ? v : null;
}

function mapExtractedFields(
  docType: string,
  extraction: RawExtractionData
): ExtractedFields {
  const f = extraction.fields;
  const out: ExtractedFields = {};

  switch (docType) {
    case "gehaltszettel":
      out.nettoeinkommen_monatlich = pickNumber(f, "nettoeinkommen_monatlich");
      out.bruttoeinkommen_monatlich = pickNumber(
        f,
        "bruttoeinkommen_monatlich"
      );
      out.arbeitgeber = pickString(f, "arbeitgeber");
      out.abrechnungsmonat = pickString(f, "abrechnungsmonat");
      out.sonderzahlung = pickBoolean(f, "sonderzahlung");
      out.sv_beitrag = pickNumber(f, "sv_beitrag");
      out.lohnsteuer = pickNumber(f, "lohnsteuer");
      break;
    case "kontoauszug":
      out.kontoinhaber = pickString(f, "kontoinhaber");
      out.zeitraum_von = pickString(f, "zeitraum_von");
      out.zeitraum_bis = pickString(f, "zeitraum_bis");
      out.durchschnittlicher_gehaltseingang = pickNumber(
        f,
        "durchschnittlicher_gehaltseingang"
      );
      out.erkannte_kreditraten = Array.isArray(f.erkannte_kreditraten)
        ? (f.erkannte_kreditraten as ExtractedFields["erkannte_kreditraten"])
        : null;
      out.erkannte_fixkosten = Array.isArray(f.erkannte_fixkosten)
        ? (f.erkannte_fixkosten as ExtractedFields["erkannte_fixkosten"])
        : null;
      break;
    case "kreditvertrag":
      out.monatliche_kreditrate = pickNumber(f, "monatliche_kreditrate");
      out.gesamtsumme = pickNumber(f, "gesamtsumme");
      out.restlaufzeit_monate = pickNumber(f, "restlaufzeit_monate");
      out.zinssatz = pickNumber(f, "zinssatz");
      out.kreditgeber = pickString(f, "kreditgeber");
      break;
    case "einkommensteuerbescheid":
      out.jahreseinkommen = pickNumber(f, "jahreseinkommen");
      out.veranlagungsjahr = pickString(f, "veranlagungsjahr");
      out.einkunftsart = pickString(f, "einkunftsart");
      break;
    case "arbeitsvertrag":
      out.arbeitgeber = pickString(f, "arbeitgeber");
      out.beschaeftigungsart = pickString(f, "beschaeftigungsart");
      out.befristung = pickString(f, "befristung");
      out.eintrittsdatum = pickString(f, "eintrittsdatum");
      break;
    case "expose":
      out.kaufpreis = pickNumber(f, "kaufpreis");
      out.wohnflaeche_qm = pickNumber(f, "wohnflaeche_qm");
      out.adresse_plz = pickString(f, "adresse_plz");
      out.immobilienart = pickString(f, "immobilienart");
      out.baujahr = pickNumber(f, "baujahr");
      break;
  }
  return out;
}

function buildSourceHighlights(e: RawExtractionData): SourceHighlight[] {
  return Object.entries(e.source_excerpts).map(([field, excerpt]) => ({
    field,
    page: 1, // Stufe 2 liefert (noch) keine Seitenzahl – Default 1.
    excerpt,
  }));
}

function buildWarnings(
  p: ExtractionPipelineResult,
  context: UploadContext
): string[] {
  const w = [...(p.extraction?.warnings ?? [])];
  if (p.classification.quality === "schlecht_lesbar") {
    w.push(
      "Das Dokument ist nur eingeschränkt lesbar – bitte die erkannten Werte besonders sorgfältig prüfen."
    );
  } else if (p.classification.quality === "eingescannt_schraeg") {
    w.push(
      "Scan ist schief – einzelne Werte könnten ungenau erkannt worden sein."
    );
  }
  if (p.classification.language !== "de") {
    w.push(
      "Dokumentsprache ist nicht Deutsch – die Extraktion ist dafür nicht optimiert."
    );
  }
  if (
    p.classification.type === "ksv_auskunft" &&
    context === "finanzen"
  ) {
    w.push(
      "KSV-Auskunft erkannt – wir zeigen sie nur zur Information an, übernehmen aber keine Werte automatisch."
    );
  }
  return w;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

// ------------------------------------------------------------------
// Fehler-Mapping (deutsch, kein Stack im Client)
// ------------------------------------------------------------------
function handleClaudeError(
  err: unknown,
  ctx: { ip: string; duration: number; sizeBytes: number }
) {
  if (err instanceof MissingApiKeyError) {
    safeLog("error", {
      action: "missing_api_key",
      ip: ctx.ip,
      status_code: 500,
      duration_ms: ctx.duration,
      error_type: err.name,
    });
    return errorResponse(
      500,
      "Dokument-Analyse ist vorübergehend nicht verfügbar. Bitte später erneut versuchen.",
      { retryable: true }
    );
  }

  if (err instanceof Anthropic.RateLimitError) {
    safeLog("warn", {
      action: "anthropic_rate_limit",
      ip: ctx.ip,
      status_code: 413,
      duration_ms: ctx.duration,
      error_type: err.name,
    });
    return NextResponse.json<ExtractResponse>(
      {
        success: false,
        error:
          "Unsere Dokument-Analyse ist gerade stark ausgelastet. Bitte in einer Minute erneut versuchen.",
        retryable: true,
      },
      { status: 413, headers: { "Retry-After": "60" } }
    );
  }

  if (err instanceof Anthropic.BadRequestError) {
    safeLog("error", {
      action: "anthropic_bad_request",
      ip: ctx.ip,
      status_code: 422,
      duration_ms: ctx.duration,
      error_type: err.name,
    });
    return errorResponse(
      422,
      "Das Dokument konnte nicht verarbeitet werden. Mögliche Ursachen: geschütztes/verschlüsseltes PDF oder reines Scan-PDF ohne Text.",
      { retryable: false }
    );
  }

  if (err instanceof Anthropic.AuthenticationError) {
    safeLog("error", {
      action: "anthropic_auth",
      ip: ctx.ip,
      status_code: 500,
      duration_ms: ctx.duration,
      error_type: err.name,
    });
    return errorResponse(
      500,
      "Dokument-Analyse derzeit nicht verfügbar. Bitte später erneut versuchen.",
      { retryable: true }
    );
  }

  if (err instanceof Anthropic.APIError) {
    safeLog("error", {
      action: "anthropic_api_error",
      ip: ctx.ip,
      status_code: err.status ?? 500,
      duration_ms: ctx.duration,
      error_type: err.name,
    });
    return errorResponse(
      500,
      "Die KI-Analyse hat einen Fehler gemeldet. Bitte erneut versuchen.",
      { retryable: true }
    );
  }

  if (
    err instanceof ClaudeEmptyResponseError ||
    err instanceof ClaudeInvalidJsonError
  ) {
    safeLog("error", {
      action: "claude_malformed",
      ip: ctx.ip,
      status_code: 500,
      duration_ms: ctx.duration,
      error_type: err.name,
    });
    return errorResponse(
      500,
      "Die KI-Antwort konnte nicht gelesen werden. Bitte erneut versuchen.",
      { retryable: true }
    );
  }

  // Zod-Fehler → Schema-Abweichung
  if (
    err instanceof Error &&
    (err.name === "ZodError" || err.constructor.name === "ZodError")
  ) {
    safeLog("warn", {
      action: "schema_violation",
      ip: ctx.ip,
      status_code: 422,
      duration_ms: ctx.duration,
      error_type: err.name,
    });
    return errorResponse(
      422,
      "Das Dokument konnte nicht eindeutig erfasst werden. Bitte klareres PDF hochladen oder Werte manuell eingeben.",
      { retryable: false }
    );
  }

  safeLog("error", {
    action: "unhandled_error",
    ip: ctx.ip,
    status_code: 500,
    duration_ms: ctx.duration,
    error_type: err instanceof Error ? err.name : "Unknown",
  });
  return errorResponse(
    500,
    "Unerwarteter Fehler bei der Dokument-Analyse. Bitte erneut versuchen.",
    { retryable: true }
  );
}
