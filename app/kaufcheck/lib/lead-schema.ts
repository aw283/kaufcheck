import { z } from "zod";

export const KONTAKTZEIT_VALUES = ["vormittag", "nachmittag", "abend"] as const;
export type Kontaktzeit = (typeof KONTAKTZEIT_VALUES)[number];

/** Reines Lead-Formular – Felder, die der User im Dialog ausfüllt. */
export const leadFormSchema = z.object({
  vorname: z
    .string()
    .trim()
    .min(2, "Bitte Vornamen angeben")
    .max(60, "Maximal 60 Zeichen"),
  nachname: z
    .string()
    .trim()
    .min(2, "Bitte Nachnamen angeben")
    .max(60, "Maximal 60 Zeichen"),
  email: z
    .string()
    .trim()
    .min(1, "Bitte E-Mail-Adresse angeben")
    .email("Bitte eine gültige E-Mail-Adresse angeben")
    .max(120, "Maximal 120 Zeichen"),
  telefon: z
    .string()
    .trim()
    .min(5, "Bitte Telefonnummer angeben")
    .max(30, "Maximal 30 Zeichen")
    .regex(
      /^[+0-9 ()/.\-]+$/,
      "Nur Ziffern und +, (), /, . oder - erlaubt"
    ),
  kontaktzeit: z
    .string()
    .refine(
      (v): v is Kontaktzeit =>
        (KONTAKTZEIT_VALUES as readonly string[]).includes(v),
      { message: "Bitte bevorzugte Kontaktzeit wählen" }
    ),
  einwilligungWeitergabe: z
    .boolean()
    .refine((v) => v === true, {
      message:
        "Ohne Zustimmung zur Datenweitergabe kann keine Beratung vermittelt werden.",
    }),
  newsletter: z.boolean(),
});

export type LeadFormInput = z.input<typeof leadFormSchema>;
export type LeadFormOutput = z.output<typeof leadFormSchema>;

/** Vollständiger API-Payload: Formular + Kontext. */
export const leadApiSchema = z.object({
  lead: leadFormSchema,
  kaufcheck: z.object({
    input: z.record(z.string(), z.unknown()),
    result: z.record(z.string(), z.unknown()),
  }),
  context: z.object({
    utm: z.record(z.string(), z.string()).optional(),
    referrer: z.string().optional(),
    url: z.string().optional(),
    userAgent: z.string().optional(),
    submittedAt: z.string(),
  }),
});

export type LeadApiPayload = z.infer<typeof leadApiSchema>;
