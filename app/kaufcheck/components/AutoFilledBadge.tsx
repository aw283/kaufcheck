"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FieldSourceInfo } from "@/app/kaufcheck/types";
import { buildAutoFilledTooltip } from "@/app/kaufcheck/lib/smart-fill";

interface AutoFilledBadgeProps {
  source: FieldSourceInfo | undefined;
  /**
   * Counter, der bei jedem neuen Auto-Fill steigt – wird als animation-key
   * verwendet, damit die Pulse-Animation auch bei wiederholter Übernahme
   * fresh fired.
   */
  pulseKey?: number;
}

export function AutoFilledBadge({ source, pulseKey }: AutoFilledBadgeProps) {
  if (source?.source !== "extracted") return null;
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className="inline-flex items-center justify-center rounded-full p-0.5 text-[color:var(--success)] transition-colors hover:text-[color:var(--success)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Automatisch ausgefüllt"
      >
        <motion.span
          key={pulseKey ?? 0}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
        </motion.span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start">
        {buildAutoFilledTooltip(source)}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Wrapper für Inputs/Selects, der bei Auto-Fill kurz grün pulsiert
 * und das übergeordnete Container-Element neutral rendert. Wird per
 * `pulseKey` neu gemounted, damit die Animation jedes Mal startet.
 */
export function AutoFilledPulse({
  active,
  pulseKey,
  children,
}: {
  active: boolean;
  pulseKey: number;
  children: React.ReactNode;
}) {
  if (!active) return <>{children}</>;
  return (
    <motion.div
      key={pulseKey}
      initial={{ boxShadow: "0 0 0 0 rgba(0,168,89,0.55)" }}
      animate={{
        boxShadow: [
          "0 0 0 0 rgba(0,168,89,0.55)",
          "0 0 0 6px rgba(0,168,89,0.0)",
          "0 0 0 0 rgba(0,168,89,0.0)",
        ],
      }}
      transition={{ duration: 1.1, ease: "easeOut" }}
      className="rounded-md"
    >
      {children}
    </motion.div>
  );
}
