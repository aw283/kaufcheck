"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

function formatGroup(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "";
  return new Intl.NumberFormat("de-AT", {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(Math.trunc(n));
}

function parseDigits(raw: string): number {
  // Entfernt alles außer Ziffern (dt. Tausendertrennzeichen = Punkt).
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

export interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  value: number | undefined;
  onChange: (value: number) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  max?: number;
  suffix?: string;
  suffixClassName?: string;
}

export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(
  (
    {
      value,
      onChange,
      onBlur,
      max,
      suffix = "€",
      suffixClassName,
      className,
      inputMode = "numeric",
      ...props
    },
    ref
  ) => {
    const [display, setDisplay] = React.useState<string>(() =>
      value ? formatGroup(value) : ""
    );

    // Keep display in sync when value changes from outside (e.g. store/defaultValues).
    React.useEffect(() => {
      const expected = value ? formatGroup(value) : "";
      setDisplay((prev) =>
        parseDigits(prev) === (value ?? 0) ? prev : expected
      );
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let n = parseDigits(e.target.value);
      if (typeof max === "number" && n > max) n = max;
      setDisplay(formatGroup(n));
      onChange(n);
    };

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode={inputMode}
          value={display}
          onChange={handleChange}
          onBlur={onBlur}
          className={cn("pr-10", className)}
          autoComplete="off"
        />
        <span
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground",
            suffixClassName
          )}
          aria-hidden
        >
          {suffix}
        </span>
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
