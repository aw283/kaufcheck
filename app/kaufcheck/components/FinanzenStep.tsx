"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Wallet, X } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useKaufcheckStore } from "@/app/kaufcheck/lib/store";
import { finanzenSchema, type FinanzenForm } from "@/app/kaufcheck/lib/schemas";
import type { ExtractSuccessResponse } from "@/app/kaufcheck/types/extraction";
import type { Conflict } from "@/app/kaufcheck/lib/smart-fill";

import { InfoTooltip } from "./InfoTooltip";
import { DocumentUpload } from "./DocumentUpload";
import {
  AutoFilledBadge,
  AutoFilledPulse,
} from "./AutoFilledBadge";
import {
  ExtractionConflictDialog,
  type ResolvedConflict,
} from "./ExtractionConflictDialog";

export function FinanzenStep() {
  const finanzen = useKaufcheckStore((s) => s.data.finanzen);
  const fieldSources = useKaufcheckStore((s) => s.fieldSources);
  const extractionVersion = useKaufcheckStore((s) => s.extractionVersion);
  const updateData = useKaufcheckStore((s) => s.updateData);
  const applyExtraction = useKaufcheckStore((s) => s.applyExtraction);
  const resolveConflict = useKaufcheckStore((s) => s.resolveConflict);

  const form = useForm<FinanzenForm>({
    resolver: zodResolver(finanzenSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      nettoEinkommen: finanzen.nettoEinkommen || 0,
      bestehendeKreditraten: finanzen.bestehendeKreditraten || 0,
      sonstigeFixkosten: finanzen.sonstigeFixkosten || 0,
    },
  });

  useEffect(() => {
    const sub = form.watch((values) => {
      updateData("finanzen", {
        nettoEinkommen: Number(values.nettoEinkommen) || 0,
        bestehendeKreditraten: Number(values.bestehendeKreditraten) || 0,
        sonstigeFixkosten: Number(values.sonstigeFixkosten) || 0,
      });
    });
    return () => sub.unsubscribe();
  }, [form, updateData]);

  const [pendingConflicts, setPendingConflicts] = useState<Conflict[]>([]);
  const [notes, setNotes] = useState<string[]>([]);

  const syncFormFromStore = () => {
    const next = useKaufcheckStore.getState().data.finanzen;
    form.setValue("nettoEinkommen", next.nettoEinkommen);
    form.setValue("bestehendeKreditraten", next.bestehendeKreditraten);
    form.setValue("sonstigeFixkosten", next.sonstigeFixkosten);
  };

  const handleExtraction = (
    result: ExtractSuccessResponse,
    file: File
  ) => {
    const outcome = applyExtraction(result, { documentName: file.name });
    syncFormFromStore();
    if (outcome.notes.length > 0) {
      setNotes((prev) => [...outcome.notes, ...prev]);
    }
    if (outcome.conflicts.length > 0) {
      setPendingConflicts(outcome.conflicts);
    }
  };

  const handleResolve = (resolutions: ResolvedConflict[]) => {
    for (const r of resolutions) {
      resolveConflict(r.conflict.path, r.finalValue, r.finalSource);
    }
    syncFormFromStore();
    setPendingConflicts([]);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <Wallet className="h-3.5 w-3.5" aria-hidden />
          Finanzen
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Wie schaut Ihre finanzielle Situation aus?
        </h2>
        <p className="text-sm text-muted-foreground">
          Alle Beträge monatlich, netto.
        </p>
      </header>

      {/* Hero-Upload: Schnellster Weg zum Ziel */}
      <section
        aria-label="Dokumente hochladen"
        className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4 sm:p-5"
      >
        <div className="mb-3 flex items-start gap-2">
          <Sparkles
            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold tracking-tight">
              Schnellste Option: Gehaltszettel + Kontoauszug hochladen
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Wir füllen Einkommen, laufende Kredite und Fixkosten automatisch
              aus.
            </p>
          </div>
        </div>
        <DocumentUpload
          variant="full"
          context="finanzen"
          targetFields={["einkommen", "kreditraten", "fixkosten"]}
          onDataExtracted={handleExtraction}
        />
      </section>

      {/* Trenner */}
      <div className="relative flex items-center">
        <div className="flex-1 border-t" />
        <span className="mx-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          oder manuell ausfüllen
        </span>
        <div className="flex-1 border-t" />
      </div>

      <ExtractionNotes notes={notes} onDismiss={(i) =>
        setNotes((prev) => prev.filter((_, idx) => idx !== i))
      } />

      <Form {...form}>
        <form className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="nettoEinkommen"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Nettohaushalts­einkommen pro Monat</FormLabel>
                  <InfoTooltip>
                    Summe aller Nettoeinkommen im Haushalt pro Monat. Bei 14
                    Gehältern: Jahresnetto / 12.
                  </InfoTooltip>
                  <AutoFilledBadge
                    source={fieldSources["finanzen.nettoEinkommen"]}
                    pulseKey={extractionVersion}
                  />
                </div>
                <FormControl>
                  <AutoFilledPulse
                    active={
                      fieldSources["finanzen.nettoEinkommen"]?.source ===
                      "extracted"
                    }
                    pulseKey={extractionVersion}
                  >
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="z. B. 3.500"
                      max={50_000}
                    />
                  </AutoFilledPulse>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bestehendeKreditraten"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Bestehende Kreditraten pro Monat</FormLabel>
                  <InfoTooltip>
                    Summe aller laufenden Kreditraten – z. B. Autokredit,
                    Konsumkredit.
                  </InfoTooltip>
                  <AutoFilledBadge
                    source={fieldSources["finanzen.bestehendeKreditraten"]}
                    pulseKey={extractionVersion}
                  />
                </div>
                <FormControl>
                  <AutoFilledPulse
                    active={
                      fieldSources["finanzen.bestehendeKreditraten"]
                        ?.source === "extracted"
                    }
                    pulseKey={extractionVersion}
                  >
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="0"
                      max={20_000}
                    />
                  </AutoFilledPulse>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sonstigeFixkosten"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Sonstige Fixkosten pro Monat</FormLabel>
                  <InfoTooltip>
                    Unterhaltszahlungen, Leasing, regelmäßige Verpflichtungen.
                  </InfoTooltip>
                  <AutoFilledBadge
                    source={fieldSources["finanzen.sonstigeFixkosten"]}
                    pulseKey={extractionVersion}
                  />
                </div>
                <FormControl>
                  <AutoFilledPulse
                    active={
                      fieldSources["finanzen.sonstigeFixkosten"]?.source ===
                      "extracted"
                    }
                    pulseKey={extractionVersion}
                  >
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="0"
                      max={20_000}
                    />
                  </AutoFilledPulse>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <ExtractionConflictDialog
        open={pendingConflicts.length > 0}
        onOpenChange={(o) => {
          if (!o) setPendingConflicts([]);
        }}
        conflicts={pendingConflicts}
        onResolve={handleResolve}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// Auto-Fill-Notes (kleine animiertere Liste mit Dismiss)
// ----------------------------------------------------------------------
function ExtractionNotes({
  notes,
  onDismiss,
}: {
  notes: string[];
  onDismiss: (index: number) => void;
}) {
  return (
    <AnimatePresence initial={false}>
      {notes.length > 0 && (
        <motion.ul
          key="notes"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-1.5 overflow-hidden"
        >
          {notes.map((n, i) => (
            <motion.li
              key={`${i}-${n}`}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-start gap-2 rounded-md border border-[color:var(--success)]/30 bg-[color:var(--success)]/5 px-3 py-2 text-xs text-[color:var(--success)]"
            >
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="flex-1 leading-relaxed">{n}</span>
              <button
                type="button"
                onClick={() => onDismiss(i)}
                aria-label="Hinweis ausblenden"
                className="rounded p-0.5 text-[color:var(--success)]/80 hover:text-[color:var(--success)]"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </AnimatePresence>
  );
}
