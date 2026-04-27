/**
 * Zwei-Stufen-Pipeline zur Dokumentenextraktion.
 *
 * Stufe 1 – Klassifizierung mit claude-haiku-4-5 (günstig & schnell).
 * Stufe 2 – Extraktion mit claude-opus-4-7 (höchste Qualität),
 *           System-Prompt dynamisch je nach erkanntem Dokumenttyp.
 *
 * Wird die Klassifikation \`ksv_auskunft\` oder \`unbekannt\`, bleibt
 * Stufe 2 aus – Kostenersparnis.
 *
 * Dieses Modul enthält KEINE Next.js-spezifischen Imports (Request /
 * Response / cookies etc.), damit es auch aus Background-Jobs, Cron-
 * Funktionen oder Tests benutzt werden kann.
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import type { DocumentType } from "@/app/kaufcheck/types/extraction";
import {
  CLASSIFICATION_SYSTEM,
  classificationSchema,
  EXTRACTION_PROMPTS,
  hasExtractionPrompt,
  SKIP_EXTRACTION_TYPES,
  type ClassificationResult,
} from "@/lib/prompts/extraction-prompts";

// ------------------------------------------------------------------
// Modelle / Limits
// ------------------------------------------------------------------

export const CLASSIFICATION_MODEL = "claude-haiku-4-5";
export const EXTRACTION_MODEL = "claude-opus-4-7";
const CLASSIFICATION_MAX_TOKENS = 200;
const EXTRACTION_MAX_TOKENS = 2_000;

// Preise pro 1 M Tokens (USD) – Stand Skill-Cache 2026-04-15.
// Zentral, damit die Cost-Metric bei Preisänderungen an genau einer
// Stelle nachgezogen wird.
const PRICING_PER_1M: Record<
  string,
  { input_usd: number; output_usd: number }
> = {
  "claude-haiku-4-5": { input_usd: 1.0, output_usd: 5.0 },
  "claude-opus-4-7": { input_usd: 5.0, output_usd: 25.0 },
};

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface StageUsage {
  model: string;
  input_tokens: number;
  output_tokens: number;
  /**
   * Gecachte Input-Tokens (Reads). Schreibungen werden separat verbucht,
   * fließen aber nicht in \`cost_usd\` ein – dafür fehlt uns der offizielle
   * Multiplikator in der Prod-Preisliste. Grober Richtwert: × 1,25.
   */
  cache_read_input_tokens: number;
  cost_usd: number;
}

export interface RawExtractionData {
  confidence_per_field: Record<string, number>;
  source_excerpts: Record<string, string>;
  warnings: string[];
  /** Alle übrigen Felder (doctype-spezifisch). */
  fields: Record<string, unknown>;
}

export interface ExtractionPipelineResult {
  classification: ClassificationResult;
  /** Bei ksv_auskunft / unbekannt wird Stufe 2 übersprungen. */
  extraction: RawExtractionData | null;
  usage: {
    stage1: StageUsage;
    stage2: StageUsage | null;
    total_cost_usd: number;
  };
}

// ------------------------------------------------------------------
// Client + Kostenrechnung
// ------------------------------------------------------------------

let cachedClient: Anthropic | null = null;
export function getAnthropicClient(): Anthropic {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();

  // Zero-Data-Retention: Anthropic Enterprise-Feature, das verhindert,
  // dass Anfragen / Antworten über die Bearbeitung hinaus gespeichert
  // werden. Wird auf Anthropic-Seite vertraglich aktiviert; das Setzen
  // dieses Flags via metadata + custom header signalisiert die Absicht
  // explizit und wird auf Enterprise-Konten respektiert. Auf
  // Standard-Konten ist es ein No-Op (und wird ignoriert).
  const zdrEnabled = process.env.ANTHROPIC_ZDR === "true";
  cachedClient = new Anthropic({
    apiKey,
    defaultHeaders: zdrEnabled
      ? { "anthropic-zdr": "true" }
      : undefined,
  });
  return cachedClient;
}

export class MissingApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not configured.");
    this.name = "MissingApiKeyError";
  }
}

function calcCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadInputTokens: number
): number {
  const price = PRICING_PER_1M[model];
  if (!price) return 0;
  // Cache-Reads ~10 % des regulären Input-Preises (Prompt-Caching-Doku).
  const uncachedInput = Math.max(0, inputTokens - cacheReadInputTokens);
  const input =
    (uncachedInput * price.input_usd) / 1_000_000 +
    (cacheReadInputTokens * price.input_usd * 0.1) / 1_000_000;
  const output = (outputTokens * price.output_usd) / 1_000_000;
  return Math.round((input + output) * 10_000) / 10_000; // 4 Nachkommastellen
}

// ------------------------------------------------------------------
// Haupt-Pipeline
// ------------------------------------------------------------------

export interface ExtractDocumentOptions {
  /** Bereits base64-kodiertes PDF (ohne data:-Präfix). */
  base64Pdf: string;
  /** Optional: Override-Modell für Tests / Staging. */
  classificationModel?: string;
  extractionModel?: string;
  /** Override des Default-SDK-Clients (z. B. für Tests). */
  client?: Anthropic;
  /** Signal zum Abbruch (z. B. bei User-Cancel im Frontend). */
  signal?: AbortSignal;
}

export async function extractDocument(
  opts: ExtractDocumentOptions
): Promise<ExtractionPipelineResult> {
  const client = opts.client ?? getAnthropicClient();

  // ---- Stufe 1 ----
  const { classification, usage: stage1 } = await classifyDocument({
    client,
    base64Pdf: opts.base64Pdf,
    model: opts.classificationModel ?? CLASSIFICATION_MODEL,
    signal: opts.signal,
  });

  // Kein Extraktionsschritt, wenn das Dokument nicht verwertbar ist.
  if (SKIP_EXTRACTION_TYPES.includes(classification.type)) {
    return {
      classification,
      extraction: null,
      usage: {
        stage1,
        stage2: null,
        total_cost_usd: stage1.cost_usd,
      },
    };
  }

  if (!hasExtractionPrompt(classification.type)) {
    return {
      classification,
      extraction: null,
      usage: {
        stage1,
        stage2: null,
        total_cost_usd: stage1.cost_usd,
      },
    };
  }

  // ---- Stufe 2 ----
  const { extraction, usage: stage2 } = await extractWithSchema({
    client,
    base64Pdf: opts.base64Pdf,
    docType: classification.type,
    model: opts.extractionModel ?? EXTRACTION_MODEL,
    signal: opts.signal,
  });

  return {
    classification,
    extraction,
    usage: {
      stage1,
      stage2,
      total_cost_usd: Math.round((stage1.cost_usd + stage2.cost_usd) * 10_000) /
        10_000,
    },
  };
}

// ------------------------------------------------------------------
// Stufe 1 – Klassifizierung
// ------------------------------------------------------------------

async function classifyDocument(args: {
  client: Anthropic;
  base64Pdf: string;
  model: string;
  signal?: AbortSignal;
}): Promise<{ classification: ClassificationResult; usage: StageUsage }> {
  const response = await args.client.messages.create(
    {
      model: args.model,
      max_tokens: CLASSIFICATION_MAX_TOKENS,
      system: CLASSIFICATION_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: args.base64Pdf,
              },
            },
            { type: "text", text: "Klassifiziere das Dokument." },
          ],
        },
      ],
    },
    { signal: args.signal }
  );

  const raw = extractJsonText(response);
  const parsed = parseJsonWithRetry(raw, async () => {
    const retryResponse = await args.client.messages.create(
      {
        model: args.model,
        max_tokens: CLASSIFICATION_MAX_TOKENS,
        system: CLASSIFICATION_SYSTEM,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: args.base64Pdf,
                },
              },
              {
                type: "text",
                text: "Antworte NUR mit dem validen JSON-Objekt, ohne Erklärung, ohne Markdown-Fences.",
              },
            ],
          },
        ],
      },
      { signal: args.signal }
    );
    return extractJsonText(retryResponse);
  });

  const classification = classificationSchema.parse(parsed);
  const usage = toStageUsage(args.model, response.usage);
  return { classification, usage };
}

// ------------------------------------------------------------------
// Stufe 2 – Extraktion
// ------------------------------------------------------------------

async function extractWithSchema(args: {
  client: Anthropic;
  base64Pdf: string;
  docType: DocumentType;
  model: string;
  signal?: AbortSignal;
}): Promise<{ extraction: RawExtractionData; usage: StageUsage }> {
  if (!hasExtractionPrompt(args.docType)) {
    throw new Error(`No extraction prompt configured for ${args.docType}`);
  }
  const cfg = EXTRACTION_PROMPTS[args.docType];

  const callClaude = async (nudge: string) =>
    args.client.messages.create(
      {
        model: args.model,
        max_tokens: EXTRACTION_MAX_TOKENS,
        // Opus 4.7 unterstützt ausschließlich adaptive Thinking.
        thinking: { type: "adaptive" },
        system: cfg.system,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: args.base64Pdf,
                },
              },
              { type: "text", text: nudge },
            ],
          },
        ],
      },
      { signal: args.signal }
    );

  const response = await callClaude("Extrahiere die Daten gemäß Schema.");
  const raw = extractJsonText(response);
  const parsed = await parseJsonWithRetry(raw, async () => {
    const retryResponse = await callClaude(
      "Antworte AUSSCHLIESSLICH mit dem validen JSON-Objekt nach dem Schema – keine Erklärung, keine Markdown-Fences, kein führender/nachfolgender Text."
    );
    return extractJsonText(retryResponse);
  });

  const validated = (cfg.schema as z.ZodTypeAny).parse(parsed) as z.infer<
    typeof cfg.schema
  >;
  const extraction = splitExtractionMeta(validated);
  const usage = toStageUsage(args.model, response.usage);
  return { extraction, usage };
}

// ------------------------------------------------------------------
// Antwort-Parsing / Fehler-Handling
// ------------------------------------------------------------------

function extractJsonText(response: Anthropic.Messages.Message): string {
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new ClaudeEmptyResponseError();
  }
  return textBlock.text;
}

/**
 * JSON-Parsing mit optionalem Retry. Manche Modelle wrappen JSON in
 * Markdown-Fences ("```json …```") – wir strippen das defensiv, bevor
 * wir den ersten Versuch scheitern lassen.
 */
async function parseJsonWithRetry(
  raw: string,
  retry: () => Promise<string>
): Promise<unknown> {
  const firstAttempt = tryParseJson(raw);
  if (firstAttempt.ok) return firstAttempt.value;

  // Retry mit stärkerer Anweisung – max. 1 Versuch, sonst werfen.
  const secondRaw = await retry();
  const secondAttempt = tryParseJson(secondRaw);
  if (secondAttempt.ok) return secondAttempt.value;

  throw new ClaudeInvalidJsonError();
}

function tryParseJson(
  raw: string
): { ok: true; value: unknown } | { ok: false } {
  const candidates = [raw, stripCodeFences(raw), extractFirstJsonObject(raw)];
  for (const c of candidates) {
    if (!c) continue;
    try {
      return { ok: true, value: JSON.parse(c) };
    } catch {
      // nächster Versuch
    }
  }
  return { ok: false };
}

function stripCodeFences(s: string): string {
  return s
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function extractFirstJsonObject(s: string): string | null {
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return s.slice(start, end + 1);
}

export class ClaudeEmptyResponseError extends Error {
  constructor() {
    super("Claude returned no text content block.");
    this.name = "ClaudeEmptyResponseError";
  }
}
export class ClaudeInvalidJsonError extends Error {
  constructor() {
    super("Claude returned content that could not be parsed as JSON.");
    this.name = "ClaudeInvalidJsonError";
  }
}

// ------------------------------------------------------------------
// Helpers: Meta-Felder (confidence / excerpts / warnings) abspalten
// ------------------------------------------------------------------

function splitExtractionMeta(parsed: unknown): RawExtractionData {
  // Zod hat bereits validiert, aber wir greifen defensiv zu.
  const obj = parsed as Record<string, unknown>;
  const confidence_per_field =
    (obj.confidence_per_field as Record<string, number>) ?? {};
  const source_excerpts =
    (obj.source_excerpts as Record<string, string>) ?? {};
  const warnings = Array.isArray(obj.warnings)
    ? (obj.warnings as string[])
    : [];
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (
      k === "confidence_per_field" ||
      k === "source_excerpts" ||
      k === "warnings"
    ) {
      continue;
    }
    fields[k] = v;
  }
  return { confidence_per_field, source_excerpts, warnings, fields };
}

// ------------------------------------------------------------------
// Helpers: Usage-Normalisierung (SDK-Shape → StageUsage)
// ------------------------------------------------------------------

function toStageUsage(
  model: string,
  usage: Anthropic.Messages.Usage
): StageUsage {
  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  return {
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cache_read_input_tokens: cacheRead,
    cost_usd: calcCost(model, inputTokens, outputTokens, cacheRead),
  };
}
