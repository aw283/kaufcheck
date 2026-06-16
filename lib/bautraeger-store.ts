"use client";

import { create } from "zustand";

import type { BautraegerInput, BautraegerResult } from "@/lib/bautraeger";

export type BauStepIndex = 0 | 1 | 2;

const INITIAL: Partial<BautraegerInput> = {
  ort: "",
  volumen: 0,
  eigenkapital: 0,
  bankzusage: 0,
  zusatzkapital: 0,
  firma: "",
  ansprechpartner: "",
  email: "",
  telefon: "",
  website: "",
  einwilligung: false,
  // projektart, bundesland, phase, kapitalart bewusst offen -> Auswahl erzwingen
};

interface State {
  step: BauStepIndex;
  data: Partial<BautraegerInput>;
  result: BautraegerResult | null;
  setStep: (s: BauStepIndex) => void;
  update: (patch: Partial<BautraegerInput>) => void;
  setResult: (r: BautraegerResult) => void;
  reset: () => void;
}

export const useBautraegerStore = create<State>((set) => ({
  step: 0,
  data: { ...INITIAL },
  result: null,
  setStep: (step) => set({ step }),
  update: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),
  setResult: (result) => set({ result }),
  reset: () => set({ step: 0, data: { ...INITIAL }, result: null }),
}));
