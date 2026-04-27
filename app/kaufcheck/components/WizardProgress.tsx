"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { STEPS, type StepIndex } from "@/app/kaufcheck/types";

interface WizardProgressProps {
  step: StepIndex;
}

export function WizardProgress({ step }: WizardProgressProps) {
  const progressPercent = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>
          Schritt {step + 1} von {STEPS.length}
        </span>
        <span className="text-primary">{Math.round(progressPercent)}%</span>
      </div>

      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <ol className="mt-4 grid grid-cols-4 gap-1 sm:gap-2">
        {STEPS.map((s, i) => {
          const isDone = i < step;
          const isActive = i === step;
          return (
            <li
              key={s.key}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  isActive &&
                    "border-primary bg-primary/10 text-primary ring-2 ring-primary/20",
                  !isDone &&
                    !isActive &&
                    "border-border bg-background text-muted-foreground"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isDone ? <Check className="h-3 w-3" aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium leading-tight sm:text-xs",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
