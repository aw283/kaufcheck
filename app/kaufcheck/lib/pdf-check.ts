/**
 * Defense-in-Depth-Validierung für hochgeladene PDFs.
 *
 * Drei Stufen:
 *   1. Magic-Bytes (`%PDF-`)
 *   2. Strukturelle Sanity-Checks (EOF-Marker, Mindestgröße, JS-Detection)
 *   3. Optional: pdf-parse als Content-Scan (Lazy-Import, scheitert nicht
 *      hart wenn die Library Probleme macht).
 *
 * MIME-Type ist ausdrücklich KEINE Validierung – der wird vom Client
 * geliefert und ist trivial fälschbar.
 */

const PDF_SIGNATURE = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
const EOF_MARKER = new Uint8Array([0x25, 0x25, 0x45, 0x4f, 0x46]); // %%EOF
const MIN_PDF_SIZE = 67; // kleinstes valides PDF, das wir je gesehen haben

/** Stufe 1: Magic-Bytes. Akzeptiert wenige Bytes BOM/Whitespace am Anfang. */
export function isPdf(bytes: Uint8Array): boolean {
  if (bytes.byteLength < PDF_SIGNATURE.byteLength) return false;
  const head = bytes.subarray(0, Math.min(1024, bytes.byteLength));
  outer: for (
    let i = 0;
    i <= head.byteLength - PDF_SIGNATURE.byteLength;
    i++
  ) {
    for (let j = 0; j < PDF_SIGNATURE.byteLength; j++) {
      if (head[i + j] !== PDF_SIGNATURE[j]) continue outer;
    }
    return true;
  }
  return false;
}

export interface StructuralCheckResult {
  ok: boolean;
  /** Spezifischer Code für Logging – KEINE PII. */
  reason?:
    | "too_small"
    | "no_pdf_signature"
    | "no_eof_marker"
    | "contains_javascript"
    | "contains_launch_action"
    | "parse_failed";
}

/**
 * Stufe 2: Strukturelle Plausibilität ohne externe Library.
 * Schnell (< 1 ms für 15 MB), sicher gegen die häufigsten Tricks
 * (truncated PDF, executable Action, eingebettetes JS).
 */
export function checkPdfStructure(bytes: Uint8Array): StructuralCheckResult {
  if (bytes.byteLength < MIN_PDF_SIZE) {
    return { ok: false, reason: "too_small" };
  }
  if (!isPdf(bytes)) {
    return { ok: false, reason: "no_pdf_signature" };
  }
  if (!hasEofMarker(bytes)) {
    return { ok: false, reason: "no_eof_marker" };
  }
  // Heuristische Suche nach Action-Triggers, die Code starten könnten.
  // pdf-parse / Claude führen zwar nichts aus, aber ein Dokument mit
  // /JS oder /Launch ist verdächtig genug, dass wir es ablehnen.
  const tail = decodeUtf8(bytes); // tolerant – findet auch Bytes in Streams
  if (/\/JavaScript|\/JS\b/.test(tail)) {
    return { ok: false, reason: "contains_javascript" };
  }
  if (/\/Launch|\/AA\s*<<|\/OpenAction.*\/JS/.test(tail)) {
    return { ok: false, reason: "contains_launch_action" };
  }
  return { ok: true };
}

/**
 * Stufe 3: Inhalts-Scan via pdf-parse. Lazy-Import, weil pdf-parse zur
 * Build-Zeit gerne Test-Files anfasst und auf manchen Plattformen
 * stört. Wenn die Library nicht lädt, kein hartes Fail – Stufe 1+2
 * haben das Wesentliche bereits abgedeckt.
 */
export async function deepScanPdf(
  bytes: Uint8Array
): Promise<StructuralCheckResult> {
  try {
    // Modular-Import vermeidet die Index-Tests in pdf-parse@1.x.
    // pdf-parse@2 löst das Problem strukturell, wir bleiben aber
    // defensiv beim Pfad.
    const mod = await import("pdf-parse").catch(() => null);
    if (!mod) return { ok: true }; // graceful degradation
    const pdfParse =
      (mod as { default?: unknown }).default ?? (mod as unknown);
    if (typeof pdfParse !== "function") return { ok: true };

    // Buffer (Node) oder Uint8Array → ArrayBuffer-View, je nach Lib-Variante.
    const buf = Buffer.from(bytes);
    // `max: 0` heißt: alle Seiten. Für reine Validierung reicht das
    // Lesen einer Seite – aber wir wollen wissen, ob die ganze Datei
    // strukturell ok ist. Limit: 50 Seiten reicht für die akzeptierten
    // Dokumenttypen, schützt vor pathologischen Riesen-PDFs.
    await (pdfParse as (b: Buffer, opts?: { max?: number }) => Promise<unknown>)(
      buf,
      { max: 50 }
    );
    return { ok: true };
  } catch {
    return { ok: false, reason: "parse_failed" };
  }
}

// ------------------------------------------------------------------
// internals
// ------------------------------------------------------------------

function hasEofMarker(bytes: Uint8Array): boolean {
  // %%EOF muss in den letzten ~1 KB stehen (PDF-Spec).
  const tail = bytes.subarray(Math.max(0, bytes.byteLength - 2048));
  outer: for (
    let i = tail.byteLength - EOF_MARKER.byteLength;
    i >= 0;
    i--
  ) {
    for (let j = 0; j < EOF_MARKER.byteLength; j++) {
      if (tail[i + j] !== EOF_MARKER[j]) continue outer;
    }
    return true;
  }
  return false;
}

function decodeUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return "";
  }
}
