import { z } from "zod";

import { KAUFPREIS_MAX, KAUFPREIS_MIN } from "@/app/kaufcheck/types";

const BUNDESLAENDER_VALUES = [
  "wien",
  "noe",
  "bgld",
  "stmk",
  "ktn",
  "sbg",
  "ooe",
  "tirol",
  "vbg",
] as const;

const EINKOMMENSART_VALUES = [
  "unbefristet",
  "befristet",
  "selbststaendig",
  "pension",
] as const;

const IMMOBILIENART_VALUES = ["wohnung", "haus"] as const;

export const haushaltSchema = z.object({
  erwachsene: z
    .number({ error: "Bitte eine Zahl eingeben" })
    .int("Bitte eine ganze Zahl angeben")
    .min(1, "Mindestens 1 Erwachsener")
    .max(4, "Maximal 4 Erwachsene"),
  kinder: z
    .number({ error: "Bitte eine Zahl eingeben" })
    .int("Bitte eine ganze Zahl angeben")
    .min(0, "Kann nicht negativ sein")
    .max(8, "Maximal 8 Kinder"),
  alterHauptantragsteller: z
    .number({ error: "Bitte ein Alter eingeben" })
    .int("Bitte ein ganzes Jahr angeben")
    .min(18, "Mindestens 18 Jahre")
    .max(75, "Maximal 75 Jahre"),
  einkommensart: z
    .string()
    .refine(
      (v): v is (typeof EINKOMMENSART_VALUES)[number] =>
        (EINKOMMENSART_VALUES as readonly string[]).includes(v),
      { message: "Bitte Einkommensart auswählen" }
    ),
});

export const finanzenSchema = z
  .object({
    nettoEinkommen: z
      .number({ error: "Bitte einen Betrag eingeben" })
      .finite("Bitte einen gültigen Betrag eingeben")
      .min(500, "Bitte plausibles Monatsnetto ab 500 € angeben")
      .max(50_000, "Maximal 50.000 €/Monat (Plausibilitäts­grenze)"),
    bestehendeKreditraten: z
      .number({ error: "Bitte einen Betrag eingeben" })
      .finite("Bitte einen gültigen Betrag eingeben")
      .min(0, "Kann nicht negativ sein")
      .max(20_000, "Bitte plausiblen Monatsbetrag angeben"),
    sonstigeFixkosten: z
      .number({ error: "Bitte einen Betrag eingeben" })
      .finite("Bitte einen gültigen Betrag eingeben")
      .min(0, "Kann nicht negativ sein")
      .max(20_000, "Bitte plausiblen Monatsbetrag angeben"),
  })
  .superRefine((v, ctx) => {
    // Summe der laufenden Verpflichtungen darf das Einkommen nicht übersteigen.
    if (v.bestehendeKreditraten + v.sonstigeFixkosten > v.nettoEinkommen) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sonstigeFixkosten"],
        message:
          "Summe aus Kreditraten und Fixkosten übersteigt das Einkommen – bitte Werte prüfen.",
      });
    }
  });

export const vorstellungSchema = z
  .object({
    eigenkapital: z
      .number({ error: "Bitte einen Betrag eingeben" })
      .finite("Bitte einen gültigen Betrag eingeben")
      .min(0, "Kann nicht negativ sein")
      .max(5_000_000, "Bitte plausiblen Betrag angeben"),
    bundesland: z
      .string()
      .refine(
        (v): v is (typeof BUNDESLAENDER_VALUES)[number] =>
          (BUNDESLAENDER_VALUES as readonly string[]).includes(v),
        { message: "Bitte Bundesland auswählen" }
      ),
    immobilienart: z
      .string()
      .refine(
        (v): v is (typeof IMMOBILIENART_VALUES)[number] =>
          (IMMOBILIENART_VALUES as readonly string[]).includes(v),
        { message: "Bitte Immobilienart auswählen" }
      ),
    wunschKaufpreis: z
      .number({ error: "Bitte einen Betrag eingeben" })
      .min(0, "Kann nicht negativ sein")
      .max(KAUFPREIS_MAX, "Bitte plausiblen Betrag angeben"),
    keineKaufpreisVorstellung: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.keineKaufpreisVorstellung) return;
    if (v.wunschKaufpreis < KAUFPREIS_MIN || v.wunschKaufpreis > KAUFPREIS_MAX) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wunschKaufpreis"],
        message: `Kaufpreis zwischen ${KAUFPREIS_MIN.toLocaleString("de-AT")} und ${KAUFPREIS_MAX.toLocaleString("de-AT")} € – oder "Noch keine Vorstellung" wählen`,
      });
    }
  });

// z.input = pre-refinement shape (for useForm values — allows "" initial state).
// z.output = post-refinement shape (narrowed enums — for submitted data).
export type HaushaltForm = z.input<typeof haushaltSchema>;
export type FinanzenForm = z.input<typeof finanzenSchema>;
export type VorstellungForm = z.input<typeof vorstellungSchema>;
