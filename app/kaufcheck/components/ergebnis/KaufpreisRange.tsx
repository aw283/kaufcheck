"use client";

import { cn } from "@/lib/utils";

function formatEuro(n: number): string {
  return Math.round(n).toLocaleString("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

interface KaufpreisRangeProps {
  maxKaufpreis: number;
  /** Erwarteter "Ziel"-Bereich – meist 80-100 % von max */
  zielBis?: number;
  zielAb?: number;
  tone?: "success" | "warning" | "error";
  className?: string;
}

const TONE_GRADIENT: Record<
  NonNullable<KaufpreisRangeProps["tone"]>,
  string
> = {
  success:
    "bg-gradient-to-r from-[color:var(--success)]/20 via-[color:var(--success)]/60 to-[color:var(--success)]",
  warning:
    "bg-gradient-to-r from-[color:var(--warning)]/20 via-[color:var(--warning)]/60 to-[color:var(--warning)]",
  error:
    "bg-gradient-to-r from-muted via-muted-foreground/40 to-muted-foreground/70",
};

const TONE_MARK: Record<NonNullable<KaufpreisRangeProps["tone"]>, string> = {
  success: "bg-[color:var(--success)]",
  warning: "bg-[color:var(--warning)]",
  error: "bg-muted-foreground",
};

export function KaufpreisRange({
  maxKaufpreis,
  zielAb,
  zielBis,
  tone = "success",
  className,
}: KaufpreisRangeProps) {
  const max = Math.max(1, maxKaufpreis);
  const start = Math.round(zielAb ?? max * 0.8);
  const end = Math.round(zielBis ?? max);

  const startPct = Math.min(100, Math.max(0, (start / max) * 100));
  const endPct = Math.min(100, Math.max(startPct, (end / max) * 100));

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full", TONE_GRADIENT[tone])}
          style={{ width: "100%" }}
          aria-hidden
        />
        {/* Zielbereich-Markierung */}
        <div
          className={cn(
            "absolute inset-y-0 rounded-full opacity-90 ring-2 ring-background",
            TONE_MARK[tone]
          )}
          style={{
            left: `${startPct}%`,
            width: `${Math.max(2, endPct - startPct)}%`,
          }}
          aria-hidden
        />
      </div>
      <div className="flex items-start justify-between gap-2 text-xs">
        <div className="text-muted-foreground">
          <div>ab</div>
          <div className="font-semibold text-foreground tabular-nums">
            {formatEuro(0)}
          </div>
        </div>
        <div className="text-center text-muted-foreground">
          <div>Zielbereich</div>
          <div className="font-semibold text-foreground tabular-nums">
            {formatEuro(start)} – {formatEuro(end)}
          </div>
        </div>
        <div className="text-right text-muted-foreground">
          <div>bis</div>
          <div className="font-semibold text-foreground tabular-nums">
            {formatEuro(max)}
          </div>
        </div>
      </div>
    </div>
  );
}
