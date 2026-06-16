"use client";

import { create } from "zustand";

import type { AnlegerInput, AnlegerResult } from "@/lib/anleger";

export type AnlageStepIndex = 0 | 1 | 2;

const INITIAL: Partial<AnlegerInput> = {
  budget: 0,
  finanzierung: false,
  bundesland: "",
  name: "",
  email: "",
  telefon: "",
  einwilligung: false,
  // anlageziel, horizont, steuerlast bewusst offen -> Auswahl erzwingen
};

interface State {
  step: AnlageStepIndex;
  data: Partial<AnlegerInput>;
  result: AnlegerResult | null;
  setStep: (s: AnlageStepIndex) => void;
  update: (patch: Partial<AnlegerInput>) => void;
  setResult: (r: AnlegerResult) => void;
  reset: () => void;
}

export const useAnlegerStore = create<State>((set) => ({
  step: 0,
  data: { ...INITIAL },
  result: null,
  setStep: (step) => set({ step }),
  update: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),
  setResult: (result) => set({ result }),
  reset: () => set({ step: 0, data: { ...INITIAL }, result: null }),
}));
