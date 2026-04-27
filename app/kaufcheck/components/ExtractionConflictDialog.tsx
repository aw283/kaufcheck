"use client";

import { useState } from "react";
import { GitMerge, Layers, Replace, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Conflict } from "@/app/kaufcheck/lib/smart-fill";
import type { FieldSourceInfo } from "@/app/kaufcheck/types";

export type ConflictChoice = "existing" | "incoming" | "sum";

export interface ResolvedConflict {
  conflict: Conflict;
  choice: ConflictChoice;
  /** Berechneter Endwert nach Auswahl. */
  finalValue: number | string;
  /** Quelle, die das Feld danach hat (extracted, mit beiden Dokumentnamen). */
  finalSource: FieldSourceInfo;
}

interface ExtractionConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: Conflict[];
  onResolve: (resolutions: ResolvedConflict[]) => void;
  /** Wird aufgerufen, wenn der User die Auflösung ganz abbricht. */
  onCancel?: () => void;
}

function formatValue(v: number | string | null, unit?: string): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") {
    const formatted = Math.round(v).toLocaleString("de-AT");
    return unit ? `${formatted} ${unit}` : formatted;
  }
  return String(v);
}

function formatSource(s?: FieldSourceInfo): string {
  if (!s) return "Default";
  if (s.source === "manual") return "Manuelle Eingabe";
  if (s.source === "extracted")
    return `Aus „${s.documentName ?? "Dokument"}"`;
  return "Default";
}

export function ExtractionConflictDialog({
  open,
  onOpenChange,
  conflicts,
  onResolve,
  onCancel,
}: ExtractionConflictDialogProps) {
  const [choices, setChoices] = useState<Record<string, ConflictChoice>>({});

  // Render-time sync: bei neuen Conflicts Default-Auswahl rebuilden.
  const [seenConflicts, setSeenConflicts] = useState(conflicts);
  if (seenConflicts !== conflicts) {
    setSeenConflicts(conflicts);
    const next: Record<string, ConflictChoice> = {};
    for (const c of conflicts) next[c.path] = "incoming";
    setChoices(next);
  }

  const handleApply = () => {
    const resolutions: ResolvedConflict[] = conflicts.map((c) => {
      const choice = choices[c.path] ?? "incoming";
      const finalValue = computeFinalValue(c, choice);
      const finalSource: FieldSourceInfo = mergeSources(c, choice);
      return { conflict: c, choice, finalValue, finalSource };
    });
    onResolve(resolutions);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Werte aus mehreren Dokumenten</DialogTitle>
          <DialogDescription>
            Wir haben für {conflicts.length === 1 ? "ein Feld" : `${conflicts.length} Felder`}{" "}
            mehrere Werte erkannt. Bitte legen Sie fest, was übernommen werden
            soll – nichts wird ohne Ihre Zustimmung gespeichert.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-4">
          {conflicts.map((c) => {
            const numericConflict =
              typeof c.existing === "number" && typeof c.incoming === "number";
            const sumValue =
              numericConflict && c.kind === "sum_or_replace"
                ? (c.existing as number) + (c.incoming as number)
                : null;
            const current = choices[c.path] ?? "incoming";
            return (
              <li
                key={c.path}
                className="space-y-2 rounded-lg border bg-card p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">{c.label}</p>
                  {c.unit ? (
                    <span className="text-xs text-muted-foreground">
                      {c.unit}
                    </span>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <ChoiceCard
                    selected={current === "existing"}
                    onSelect={() =>
                      setChoices((prev) => ({ ...prev, [c.path]: "existing" }))
                    }
                    icon={<X className="h-4 w-4" aria-hidden />}
                    title={formatValue(c.existing, c.unit)}
                    subtitle={formatSource(c.existingSource)}
                  />
                  <ChoiceCard
                    selected={current === "incoming"}
                    onSelect={() =>
                      setChoices((prev) => ({ ...prev, [c.path]: "incoming" }))
                    }
                    icon={<Replace className="h-4 w-4" aria-hidden />}
                    title={formatValue(c.incoming, c.unit)}
                    subtitle={formatSource(c.incomingSource)}
                    highlighted
                  />
                  {sumValue !== null ? (
                    <ChoiceCard
                      selected={current === "sum"}
                      onSelect={() =>
                        setChoices((prev) => ({ ...prev, [c.path]: "sum" }))
                      }
                      icon={
                        <Layers className="h-4 w-4" aria-hidden />
                      }
                      title={formatValue(sumValue, c.unit)}
                      subtitle="Summe (gemeinsamer Haushalt)"
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button type="button" onClick={handleApply}>
            <GitMerge aria-hidden />
            Auswahl übernehmen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceCard({
  selected,
  onSelect,
  icon,
  title,
  subtitle,
  highlighted,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  highlighted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border bg-background px-3 py-2 text-left transition-colors",
        selected && "border-primary bg-primary/5 ring-2 ring-primary/20",
        !selected && highlighted && "border-primary/40",
        !selected && !highlighted && "hover:bg-muted/50"
      )}
      aria-pressed={selected}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </span>
      <span className="flex flex-1 flex-col">
        <span className="font-semibold tabular-nums">{title}</span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}

function computeFinalValue(
  c: Conflict,
  choice: ConflictChoice
): number | string {
  if (choice === "existing") return c.existing ?? "";
  if (choice === "incoming") return c.incoming ?? "";
  if (
    choice === "sum" &&
    typeof c.existing === "number" &&
    typeof c.incoming === "number"
  ) {
    return c.existing + c.incoming;
  }
  return c.incoming ?? "";
}

function mergeSources(c: Conflict, choice: ConflictChoice): FieldSourceInfo {
  if (choice === "existing" && c.existingSource) return c.existingSource;
  if (choice === "incoming") return c.incomingSource;
  if (choice === "sum") {
    const both = [c.existingSource?.documentName, c.incomingSource.documentName]
      .filter(Boolean)
      .join(" + ");
    return {
      source: "extracted",
      documentName: both || c.incomingSource.documentName,
      documentType: c.incomingSource.documentType,
      at: new Date().toISOString(),
    };
  }
  return c.incomingSource;
}
