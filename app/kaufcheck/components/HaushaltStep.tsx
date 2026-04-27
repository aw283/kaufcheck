"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Users } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKaufcheckStore } from "@/app/kaufcheck/lib/store";
import { haushaltSchema, type HaushaltForm } from "@/app/kaufcheck/lib/schemas";
import type { Einkommensart } from "@/app/kaufcheck/types";
import type { ExtractSuccessResponse } from "@/app/kaufcheck/types/extraction";
import type { Conflict } from "@/app/kaufcheck/lib/smart-fill";

import { DocumentUpload } from "./DocumentUpload";
import { AutoFilledBadge, AutoFilledPulse } from "./AutoFilledBadge";
import {
  ExtractionConflictDialog,
  type ResolvedConflict,
} from "./ExtractionConflictDialog";

const EINKOMMENSART_KEYS: Einkommensart[] = [
  "unbefristet",
  "befristet",
  "selbststaendig",
  "pension",
];
function toEinkommensart(v: unknown): Einkommensart | "" {
  return typeof v === "string" &&
    (EINKOMMENSART_KEYS as string[]).includes(v)
    ? (v as Einkommensart)
    : "";
}

const EINKOMMENSARTEN: { value: string; label: string }[] = [
  { value: "unbefristet", label: "Unbefristet angestellt" },
  { value: "befristet", label: "Befristet angestellt" },
  { value: "selbststaendig", label: "Selbstständig" },
  { value: "pension", label: "Pension" },
];

export function HaushaltStep() {
  const haushalt = useKaufcheckStore((s) => s.data.haushalt);
  const fieldSources = useKaufcheckStore((s) => s.fieldSources);
  const extractionVersion = useKaufcheckStore((s) => s.extractionVersion);
  const updateData = useKaufcheckStore((s) => s.updateData);
  const applyExtraction = useKaufcheckStore((s) => s.applyExtraction);
  const resolveConflict = useKaufcheckStore((s) => s.resolveConflict);

  const form = useForm<HaushaltForm>({
    resolver: zodResolver(haushaltSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      erwachsene: haushalt.erwachsene || 1,
      kinder: haushalt.kinder ?? 0,
      alterHauptantragsteller: haushalt.alterHauptantragsteller || 35,
      einkommensart: haushalt.einkommensart || "",
    },
  });

  useEffect(() => {
    const sub = form.watch((values) => {
      updateData("haushalt", {
        erwachsene: Number(values.erwachsene) || 0,
        kinder: Number(values.kinder) || 0,
        alterHauptantragsteller: Number(values.alterHauptantragsteller) || 0,
        einkommensart: toEinkommensart(values.einkommensart),
      });
    });
    return () => sub.unsubscribe();
  }, [form, updateData]);

  const [pendingConflicts, setPendingConflicts] = useState<Conflict[]>([]);

  const syncFormFromStore = () => {
    const next = useKaufcheckStore.getState().data.haushalt;
    form.setValue("einkommensart", next.einkommensart);
  };

  const handleExtraction = (result: ExtractSuccessResponse, file: File) => {
    const outcome = applyExtraction(result, { documentName: file.name });
    syncFormFromStore();
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
          <Users className="h-3.5 w-3.5" aria-hidden />
          Haushalt
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Erzählen Sie uns von Ihrem Haushalt
        </h2>
        <p className="text-sm text-muted-foreground">
          Diese Angaben helfen uns, Ihren Lebensbedarf realistisch einzuschätzen.
        </p>
      </header>

      <DocumentUpload
        variant="compact"
        context="haushalt"
        targetFields={["einkommen"]}
        onDataExtracted={handleExtraction}
      />

      <Form {...form}>
        <form className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="erwachsene"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Erwachsene im Haushalt</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={4}
                      step={1}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kinder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unterhaltsberechtigte Kinder</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={8}
                      step={1}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="alterHauptantragsteller"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alter des Hauptantragstellers</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={18}
                      max={75}
                      step={1}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                      onBlur={field.onBlur}
                      className="pr-14"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      Jahre
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="einkommensart"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Einkommensart</FormLabel>
                  <AutoFilledBadge
                    source={fieldSources["haushalt.einkommensart"]}
                    pulseKey={extractionVersion}
                  />
                </div>
                <AutoFilledPulse
                  active={
                    fieldSources["haushalt.einkommensart"]?.source ===
                    "extracted"
                  }
                  pulseKey={extractionVersion}
                >
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bitte wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EINKOMMENSARTEN.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </AutoFilledPulse>
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
