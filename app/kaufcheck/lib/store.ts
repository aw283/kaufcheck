"use client";

import { create } from "zustand";

import type {
  FieldPath,
  FieldSourceInfo,
  FinanzenData,
  HaushaltData,
  KaufcheckInput,
  KaufcheckResult,
  StepIndex,
  VorstellungData,
} from "@/app/kaufcheck/types";
import {
  DEFAULT_LAUFZEIT,
  DEFAULT_ZINSSATZ,
} from "@/app/kaufcheck/lib/constants";
import { berechneLeistbarkeit } from "@/app/kaufcheck/lib/affordability";
import {
  smartFill,
  type SmartFillOutcome,
} from "@/app/kaufcheck/lib/smart-fill";
import type { ExtractSuccessResponse } from "@/app/kaufcheck/types/extraction";

const initialHaushalt: HaushaltData = {
  erwachsene: 1,
  kinder: 0,
  alterHauptantragsteller: 35,
  einkommensart: "",
};

const initialFinanzen: FinanzenData = {
  nettoEinkommen: 0,
  bestehendeKreditraten: 0,
  sonstigeFixkosten: 0,
};

const initialVorstellung: VorstellungData = {
  eigenkapital: 0,
  bundesland: "",
  immobilienart: "",
  wunschKaufpreis: 0,
  keineKaufpreisVorstellung: false,
  laufzeitJahre: DEFAULT_LAUFZEIT,
  zinssatz: DEFAULT_ZINSSATZ,
};

const initialInput: KaufcheckInput = {
  haushalt: initialHaushalt,
  finanzen: initialFinanzen,
  vorstellung: initialVorstellung,
};

type SectionKey = keyof KaufcheckInput;
type FieldSources = Partial<Record<FieldPath, FieldSourceInfo>>;

interface KaufcheckState {
  step: StepIndex;
  data: KaufcheckInput;
  result: KaufcheckResult | null;
  /** Pro Feld die Quelle (manuell, extrahiert, default). */
  fieldSources: FieldSources;
  /** Steigt bei jeder Auto-Fill-Aktion → Steps können RHF-Inputs neu seeden. */
  extractionVersion: number;

  setStep: (step: StepIndex) => void;
  /**
   * Manuelle Updates aus Form-Inputs. Geänderte Felder werden auf
   * `manual` markiert; gleichbleibende Werte erhalten ihre Quelle.
   */
  updateData: <K extends SectionKey>(
    section: K,
    patch: Partial<KaufcheckInput[K]>
  ) => void;
  /** Smart-Fill aus extrahiertem Dokument; gibt das Outcome zurück. */
  applyExtraction: (
    result: ExtractSuccessResponse,
    meta?: { documentName?: string }
  ) => SmartFillOutcome;
  /** Auflösung eines Konflikts durch User-Entscheidung (Modal). */
  resolveConflict: (
    path: FieldPath,
    value: number | string,
    source: FieldSourceInfo
  ) => void;
  calculate: () => void;
  reset: () => void;
}

function applyPatchesToState(
  state: KaufcheckInput,
  patches: Partial<KaufcheckInput>
): KaufcheckInput {
  return {
    haushalt: { ...state.haushalt, ...patches.haushalt },
    finanzen: { ...state.finanzen, ...patches.finanzen },
    vorstellung: { ...state.vorstellung, ...patches.vorstellung },
  };
}

function writeFieldByPath<V>(
  data: KaufcheckInput,
  path: FieldPath,
  value: V
): KaufcheckInput {
  const [section, field] = path.split(".") as [SectionKey, string];
  const slice = {
    ...(data[section] as unknown as Record<string, unknown>),
  };
  slice[field] = value;
  return { ...data, [section]: slice };
}

export const useKaufcheckStore = create<KaufcheckState>((set, get) => ({
  step: 0,
  data: initialInput,
  result: null,
  fieldSources: {},
  extractionVersion: 0,

  setStep: (step) => set({ step }),

  updateData: (section, patch) =>
    set((state) => {
      const currentSlice = state.data[section] as unknown as Record<
        string,
        unknown
      >;
      const newSlice = { ...currentSlice, ...patch };

      // Sources nur für Felder berühren, deren Wert sich tatsächlich
      // ändert. Wird `updateData` von einem RHF-Watch mit identischem
      // Wert aufgerufen (z. B. nach setValue durch Auto-Fill), bleibt
      // die "extracted"-Quelle erhalten.
      const newSources: FieldSources = { ...state.fieldSources };
      for (const [key, value] of Object.entries(patch)) {
        if (currentSlice[key] !== value) {
          const path = `${section}.${key}` as FieldPath;
          newSources[path] = {
            source: "manual",
            at: new Date().toISOString(),
          };
        }
      }

      return {
        data: { ...state.data, [section]: newSlice },
        fieldSources: newSources,
      };
    }),

  applyExtraction: (result, meta) => {
    const { data, fieldSources } = get();
    const outcome = smartFill({ current: data, fieldSources }, result, meta);

    if (
      Object.keys(outcome.patches).length === 0 &&
      Object.keys(outcome.newSources).length === 0
    ) {
      // Nichts auto-applied – Conflicts/Notes werden trotzdem
      // zurückgegeben, damit die UI Toasts anzeigen kann.
      return outcome;
    }

    set((state) => ({
      data: applyPatchesToState(state.data, outcome.patches),
      fieldSources: { ...state.fieldSources, ...outcome.newSources },
      extractionVersion: state.extractionVersion + 1,
    }));

    return outcome;
  },

  resolveConflict: (path, value, source) =>
    set((state) => ({
      data: writeFieldByPath(state.data, path, value),
      fieldSources: { ...state.fieldSources, [path]: source },
      extractionVersion: state.extractionVersion + 1,
    })),

  calculate: () => {
    const { data } = get();
    set({ result: berechneLeistbarkeit(data) });
  },

  reset: () =>
    set({
      step: 0,
      data: initialInput,
      result: null,
      fieldSources: {},
      extractionVersion: 0,
    }),
}));
