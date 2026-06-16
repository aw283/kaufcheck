import { z } from "zod";

// --- Wizard Steps ---

export const step1Schema = z.object({
  netto: z.number().min(1, "Bitte Einkommen angeben").max(12_000_000),
  nettoPeriode: z.enum(["monat", "jahr"]),
  bonus: z.number().min(0).max(5_000_000),
  bonusPeriode: z.enum(["monat", "jahr"]),
  raten: z.number().min(0).max(20_000, "Max 20.000 €"),
  umschuldung: z.number().min(0).max(10_000_000),
});

export const assetsSchema = z.object({
  sparguthaben: z.number().min(0).max(5_000_000),
  wertpapiere: z.number().min(0).max(5_000_000),
  edelmetalle: z.number().min(0).max(5_000_000),
  crypto: z.number().min(0).max(5_000_000),
  lebensversicherung: z.number().min(0).max(5_000_000),
  schenkung: z.number().min(0).max(5_000_000),
  immobilie_wert: z.number().min(0).max(10_000_000),
  immobilie_restschuld: z.number().min(0).max(10_000_000),
});

// Step 2: Vermögen. Mindestens irgendwo > 0 sein, sonst kein EK.
export const step2Schema = assetsSchema.refine(
  (a) =>
    a.sparguthaben +
      a.wertpapiere +
      a.edelmetalle +
      a.crypto +
      a.lebensversicherung +
      a.schenkung +
      a.immobilie_wert >
    0,
  { message: "Bitte mindestens einen Vermögenswert eintragen" }
);

const BUNDESLAND = ["wien","noe","ooe","sbg","tirol","vbg","stmk","ktn","bgld"] as const;
const IMMOART = ["wohnung","haus"] as const;

export const step3Schema = z.object({
  bundesland: z.string().refine(
    (v): v is (typeof BUNDESLAND)[number] => (BUNDESLAND as readonly string[]).includes(v),
    { message: "Bitte Bundesland wählen" }
  ),
  immobilienart: z.string().refine(
    (v): v is (typeof IMMOART)[number] => (IMMOART as readonly string[]).includes(v),
    { message: "Bitte Immobilienart wählen" }
  ),
  objektStatus: z.enum(["im_auge", "suche_noch"]),
  nutzung: z.enum(["eigennutzung", "anlage"]),
  alter: z.number().int().min(18, "Mind. 18").max(75, "Max 75"),
  erwachsene: z.number().int().min(1, "Mind. 1").max(4, "Max 4"),
  kinderAlter: z.array(z.number().int().min(0).max(27)).max(8),
});

// --- Lead Form ---

const KONTAKTZEIT = ["vormittag","nachmittag","abend"] as const;

export const leadFormSchema = z.object({
  vorname: z.string().trim().min(2, "Bitte Vornamen angeben").max(60),
  nachname: z.string().trim().min(2, "Bitte Nachnamen angeben").max(60),
  email: z.string().trim().email("Gültige E-Mail-Adresse angeben").max(120),
  telefon: z
    .string()
    .trim()
    .min(5, "Telefonnummer angeben")
    .max(30)
    .regex(/^[+0-9 ()/.\-]+$/, "Nur Ziffern und +, (), /, ., -"),
  kontaktzeit: z.string().refine(
    (v): v is (typeof KONTAKTZEIT)[number] => (KONTAKTZEIT as readonly string[]).includes(v),
    { message: "Bevorzugte Kontaktzeit wählen" }
  ),
  einwilligung: z.boolean().refine((v) => v === true, {
    message: "Ohne Einwilligung können wir Ihre Anfrage nicht weiterleiten",
  }),
  newsletter: z.boolean(),
});

export type LeadForm = z.input<typeof leadFormSchema>;

// --- API ---

export const leadApiSchema = z.object({
  lead: leadFormSchema,
  typ: z.enum(["finanzierung", "immobilie"]),
  check: z
    .object({
      status: z.string(),
      maxKaufpreis: z.number(),
      monatlicheRate: z.number(),
      ekQuote: z.number(),
      eigenkapital: z.number(),
      effektivNetto: z.number().optional(),
      umschuldung: z.number().optional(),
      raten: z.number().optional(),
      bonus: z.number().optional(),
      bonusPeriode: z.enum(["monat", "jahr"]).optional(),
      alter: z.number().optional(),
      assets: assetsSchema.optional(),
      bundesland: z.string().optional(),
      immobilienart: z.string().optional(),
      objektStatus: z.enum(["im_auge", "suche_noch"]).optional(),
      nutzung: z.enum(["eigennutzung", "anlage"]).optional(),
      kinderAlter: z.array(z.number()).optional(),
    })
    .optional(),
});

export type LeadApiPayload = z.infer<typeof leadApiSchema>;
