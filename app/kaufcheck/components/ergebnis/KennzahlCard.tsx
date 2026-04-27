import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface KennzahlCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "muted";
}

const TONES: Record<NonNullable<KennzahlCardProps["tone"]>, string> = {
  default: "bg-card",
  success:
    "bg-[color:var(--success)]/5 border-[color:var(--success)]/30",
  warning:
    "bg-[color:var(--warning)]/5 border-[color:var(--warning)]/30",
  muted: "bg-muted/50",
};

export function KennzahlCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: KennzahlCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border p-4 shadow-sm",
        TONES[tone]
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
        <span>{label}</span>
      </div>
      <div className="text-xl font-semibold tabular-nums sm:text-2xl">
        {value}
      </div>
      {sub ? (
        <div className="text-xs text-muted-foreground">{sub}</div>
      ) : null}
    </div>
  );
}
