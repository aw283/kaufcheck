// Bauträger-Lead-Strecke: Klassifizierung des Kapitalbedarfs.
// Reine Lead-Qualifizierung — keine Finanzierungsberatung.
// Quelle der Schwellen siehe research/bautraeger-finanzierung.md.

import { z } from "zod";

export type Projektart = "neubau_wohnen" | "sanierung" | "gewerbe" | "mixed";
export type Projektphase =
  | "grundstueck"
  | "baugenehmigung"
  | "bau_laeuft"
  | "vertrieb";
export type Kapitalart = "mezzanine" | "eigenkapital" | "gesamt" | "egal";
export type Partnerweg = "crowd_mezzanine" | "bank_institutionell";

// ECSP-VO: Crowd-Funding bis 5 Mio. € / Projektträger / Jahr.
// Darüber: Bank / institutionelle Geldgeber (Prospektpflicht etc.).
export const SCHWELLE_EUR = 5_000_000;
// Bauträger brauchen üblicherweise 15–30 % Eigenkapital.
export const EK_QUOTE_MIN = 0.15;

export interface BautraegerInput {
  projektart: Projektart;
  bundesland: string;
  ort: string;
  phase: Projektphase;
  volumen: number;
  eigenkapital: number;
  bankzusage: number;
  zusatzkapital: number;
  kapitalart: Kapitalart;
  firma: string;
  ansprechpartner: string;
  email: string;
  telefon: string;
  website?: string;
  einwilligung: boolean;
}

export interface BautraegerResult {
  weg: Partnerweg;
  zusatzkapital: number;
  ekQuote: number;
  ekFlag: "ok" | "knapp";
  schwelleMio: number;
}

function num(n: unknown, min: number, max: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.min(Math.max(v, min), max);
}

export function klassifiziere(
  input: Pick<
    BautraegerInput,
    "volumen" | "eigenkapital" | "bankzusage" | "zusatzkapital"
  >
): BautraegerResult {
  const volumen = num(input.volumen, 0, 5_000_000_000);
  const eigenkapital = num(input.eigenkapital, 0, 5_000_000_000);
  const zusatzkapital = num(input.zusatzkapital, 0, 5_000_000_000);

  const weg: Partnerweg =
    zusatzkapital <= SCHWELLE_EUR ? "crowd_mezzanine" : "bank_institutionell";
  const ekQuote = volumen > 0 ? eigenkapital / volumen : 0;
  const ekFlag: "ok" | "knapp" = ekQuote >= EK_QUOTE_MIN ? "ok" : "knapp";

  return {
    weg,
    zusatzkapital: Math.round(zusatzkapital),
    ekQuote: Math.round(ekQuote * 100) / 100,
    ekFlag,
    schwelleMio: SCHWELLE_EUR / 1_000_000,
  };
}

export const PARTNERWEG_LABEL: Record<
  Partnerweg,
  { titel: string; beschreibung: string }
> = {
  crowd_mezzanine: {
    titel: "Crowdinvesting- & Mezzanine-Partner",
    beschreibung:
      "Bis 5 Mio. € Zusatzkapital passen spezialisierte Crowdinvesting- und Mezzanine-Geber am besten — schnell, flexibel, nachrangig zur Bank.",
  },
  bank_institutionell: {
    titel: "Bank- & institutionelle Partner",
    beschreibung:
      "Ab 5 Mio. € Zusatzkapital sind Projektfinanzierungs-Banken und institutionelle Kapitalgeber die richtige Adresse — größere Tickets, strukturierte Prüfung.",
  },
};

// --- Zod-Schemas (Wizard-Schritte) ---

const BUNDESLAND = [
  "wien", "noe", "ooe", "sbg", "tirol", "vbg", "stmk", "ktn", "bgld",
] as const;

export const bauStep1Schema = z.object({
  projektart: z.enum(["neubau_wohnen", "sanierung", "gewerbe", "mixed"]),
  bundesland: z.string().refine(
    (v): v is (typeof BUNDESLAND)[number] =>
      (BUNDESLAND as readonly string[]).includes(v),
    { message: "Bitte Bundesland wählen" }
  ),
  ort: z.string().trim().min(2, "Ort angeben").max(80),
  phase: z.enum(["grundstueck", "baugenehmigung", "bau_laeuft", "vertrieb"]),
});

export const bauStep2Schema = z.object({
  volumen: z.number().min(100_000, "Projektvolumen angeben").max(5_000_000_000),
  eigenkapital: z.number().min(0).max(5_000_000_000),
  bankzusage: z.number().min(0).max(5_000_000_000),
  zusatzkapital: z
    .number()
    .min(1, "Benötigtes Zusatzkapital angeben")
    .max(5_000_000_000),
  kapitalart: z.enum(["mezzanine", "eigenkapital", "gesamt", "egal"]),
});

export const bauStep3Schema = z.object({
  firma: z.string().trim().min(2, "Firmenname angeben").max(120),
  ansprechpartner: z.string().trim().min(2, "Ansprechpartner:in angeben").max(120),
  email: z.string().trim().email("Gültige E-Mail angeben").max(120),
  telefon: z
    .string()
    .trim()
    .min(5, "Telefonnummer angeben")
    .max(30)
    .regex(/^[+0-9 ()/.\-]+$/, "Nur Ziffern und +, (), /, ., -"),
  website: z.string().trim().max(160).optional(),
  einwilligung: z.boolean().refine((v) => v === true, {
    message: "Ohne Einwilligung können wir Ihre Anfrage nicht weiterleiten",
  }),
});

export const bautraegerApiSchema = bauStep1Schema
  .and(bauStep2Schema)
  .and(bauStep3Schema);

export type BautraegerApiPayload = z.infer<typeof bautraegerApiSchema>;
