"use client";

import { create } from "zustand";

import type { CheckInput, CheckResult } from "@/lib/calc";
import { emptyAssets } from "@/lib/calc";

export type StepIndex = 0 | 1 | 2;

const INITIAL: Partial<CheckInput> = {
  netto: 0,
  raten: 0,
  fix: 0,
  assets: emptyAssets(),
  wunschKaufpreis: 250_000,
  alter: 35,
  erwachsene: 1,
  kinder: 0,
};

interface State {
  step: StepIndex;
  data: Partial<CheckInput>;
  result: CheckResult | null;
  setStep: (s: StepIndex) => void;
  update: (patch: Partial<CheckInput>) => void;
  updateAssets: (patch: Partial<CheckInput["assets"]>) => void;
  setResult: (r: CheckResult) => void;
  reset: () => void;
}

export const useCheckStore = create<State>((set) => ({
  step: 0,
  data: { ...INITIAL, assets: emptyAssets() },
  result: null,
  setStep: (step) => set({ step }),
  update: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),
  updateAssets: (patch) =>
    set((s) => ({
      data: {
        ...s.data,
        assets: { ...(s.data.assets ?? emptyAssets()), ...patch },
      },
    })),
  setResult: (result) => set({ result }),
  reset: () =>
    set({
      step: 0,
      data: { ...INITIAL, assets: emptyAssets() },
      result: null,
    }),
}));
