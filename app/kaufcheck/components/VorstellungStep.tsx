"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Home } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useKaufcheckStore } from "@/app/kaufcheck/lib/store";
import {
  vorstellungSchema,
  type VorstellungForm,
} from "@/app/kaufcheck/lib/schemas";
import type { Bundesland, Immobilienart } from "@/app/kaufcheck/types";
import {
  KAUFPREIS_MAX,
  KAUFPREIS_MIN,
  KAUFPREIS_STEP,
} from "@/app/kaufcheck/types";
import type { ExtractSuccessResponse } from "@/app/kaufcheck/types/extraction";
import type { Conflict } from "@/app/kaufcheck/lib/smart-fill";

import { InfoTooltip } from "./InfoTooltip";
import { DocumentUpload } from "./DocumentUpload";
import { AutoFilledBadge, AutoFilledPulse } from "./AutoFilledBadge";
import {
  ExtractionConflictDialog,
  type ResolvedConflict,
} from "./ExtractionConflictDialog";

const BUNDESLAND_KEYS: Bundesland[] = [
  "wien",
  "noe",
  "bgld",
  "stmk",
  "ktn",
  "sbg",
  "ooe",
  "tirol",
  "vbg",
];
const IMMOBILIENART_KEYS: Immobilienart[] = ["wohnung", "haus"];

function toBundesland(v: unknown): Bundesland | "" {
  return typeof v === "string" && (BUNDESLAND_KEYS as string[]).includes(v)
    ? (v as Bundesland)
    : "";
}
function toImmobilienart(v: unknown): Immobilienart | "" {
  return typeof v === "string" && (IMMOBILIENART_KEYS as string[]).includes(v)
    ? (v as Immobilienart)
    : "";
}

const BUNDESLAENDER: { value: string; label: string }[] = [
  { value: "wien", label: "Wien" },
  { value: "noe", label: "Niederösterreich" },
  { value: "bgld", label: "Burgenland" },
  { value: "stmk", label: "Steiermark" },
  { value: "ktn", label: "Kärnten" },
  { value: "sbg", label: "Salzburg" },
  { value: "ooe", label: "Oberösterreich" },
  { value: "tirol", label: "Tirol" },
  { value: "vbg", label: "Vorarlberg" },
];

function formatEuro(n: number): string {
  return n.toLocaleString("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

export function VorstellungStep() {
  const vorstellung = useKaufcheckStore((s) => s.data.vorstellung);
  const fieldSources = useKaufcheckStore((s) => s.fieldSources);
  const extractionVersion = useKaufcheckStore((s) => s.extractionVersion);
  const updateData = useKaufcheckStore((s) => s.updateData);
  const applyExtraction = useKaufcheckStore((s) => s.applyExtraction);
  const resolveConflict = useKaufcheckStore((s) => s.resolveConflict);

  const form = useForm<VorstellungForm>({
    resolver: zodResolver(vorstellungSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      eigenkapital: vorstellung.eigenkapital || 0,
      bundesland: vorstellung.bundesland || "",
      immobilienart: vorstellung.immobilienart || "",
      wunschKaufpreis: vorstellung.wunschKaufpreis || KAUFPREIS_MIN,
      keineKaufpreisVorstellung: vorstellung.keineKaufpreisVorstellung || false,
    },
  });

  useEffect(() => {
    const sub = form.watch((values) => {
      updateData("vorstellung", {
        eigenkapital: Number(values.eigenkapital) || 0,
        bundesland: toBundesland(values.bundesland),
        immobilienart: toImmobilienart(values.immobilienart),
        wunschKaufpreis: Number(values.wunschKaufpreis) || 0,
        keineKaufpreisVorstellung: Boolean(values.keineKaufpreisVorstellung),
      });
    });
    return () => sub.unsubscribe();
  }, [form, updateData]);

  const keineVorstellung = form.watch("keineKaufpreisVorstellung");
  const kaufpreis = form.watch("wunschKaufpreis");

  const [pendingConflicts, setPendingConflicts] = useState<Conflict[]>([]);

  const syncFormFromStore = () => {
    const next = useKaufcheckStore.getState().data.vorstellung;
    form.setValue("eigenkapital", next.eigenkapital);
    form.setValue("bundesland", next.bundesland);
    form.setValue("immobilienart", next.immobilienart);
    form.setValue("wunschKaufpreis", next.wunschKaufpreis);
    form.setValue("keineKaufpreisVorstellung", next.keineKaufpreisVorstellung);
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
          <Home className="h-3.5 w-3.5" aria-hidden />
          Vorstellung
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Eigenkapital &amp; Ihre Vorstellung
        </h2>
        <p className="text-sm text-muted-foreground">
          Letzter Schritt – dann berechnen wir Ihren leistbaren Rahmen.
        </p>
      </header>

      <DocumentUpload
        variant="compact"
        context="objekt"
        targetFields={["objekt"]}
        onDataExtracted={handleExtraction}
      />

      <Form {...form}>
        <form className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="eigenkapital"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Verfügbares Eigenkapital</FormLabel>
                  <InfoTooltip>
                    Erspartes, Bausparer, Wertpapiere, Schenkung – alles was Sie
                    in die Finanzierung einbringen können.
                  </InfoTooltip>
                </div>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="z. B. 60.000"
                    max={5_000_000}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bundesland"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Bundesland</FormLabel>
                  <AutoFilledBadge
                    source={fieldSources["vorstellung.bundesland"]}
                    pulseKey={extractionVersion}
                  />
                </div>
                <AutoFilledPulse
                  active={
                    fieldSources["vorstellung.bundesland"]?.source ===
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
                      {BUNDESLAENDER.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </AutoFilledPulse>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="immobilienart"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Immobilienart</FormLabel>
                  <AutoFilledBadge
                    source={fieldSources["vorstellung.immobilienart"]}
                    pulseKey={extractionVersion}
                  />
                </div>
                <FormControl>
                  <RadioGroup
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    className="grid grid-cols-2 gap-3"
                  >
                    {[
                      { value: "wohnung", label: "Wohnung" },
                      { value: "haus", label: "Haus" },
                    ].map((opt) => {
                      const active = field.value === opt.value;
                      return (
                        <label
                          key={opt.value}
                          htmlFor={`immobilienart-${opt.value}`}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-md border bg-background p-3 shadow-sm transition-colors",
                            active
                              ? "border-primary ring-2 ring-primary/20"
                              : "hover:bg-accent/40"
                          )}
                        >
                          <RadioGroupItem
                            id={`immobilienart-${opt.value}`}
                            value={opt.value}
                          />
                          <span className="text-sm font-medium">
                            {opt.label}
                          </span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="keineKaufpreisVorstellung"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 space-y-0 rounded-md border bg-muted/40 p-3">
                <FormControl>
                  <Checkbox
                    id="keineVorstellung"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                </FormControl>
                <Label
                  htmlFor="keineVorstellung"
                  className="text-sm font-medium leading-tight"
                >
                  Noch keine konkrete Vorstellung vom Kaufpreis
                </Label>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wunschKaufpreis"
            render={({ field }) => (
              <FormItem
                className={cn(
                  "space-y-3 transition-opacity",
                  keineVorstellung && "pointer-events-none opacity-50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FormLabel>Ungefährer Wunsch-Kaufpreis</FormLabel>
                    <AutoFilledBadge
                      source={fieldSources["vorstellung.wunschKaufpreis"]}
                      pulseKey={extractionVersion}
                    />
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatEuro(kaufpreis || KAUFPREIS_MIN)}
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={KAUFPREIS_MIN}
                    max={KAUFPREIS_MAX}
                    step={KAUFPREIS_STEP}
                    value={[
                      Math.min(
                        KAUFPREIS_MAX,
                        Math.max(KAUFPREIS_MIN, field.value || KAUFPREIS_MIN)
                      ),
                    ]}
                    onValueChange={([v]) => field.onChange(v)}
                    disabled={keineVorstellung}
                    aria-label="Wunsch-Kaufpreis"
                  />
                </FormControl>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{formatEuro(KAUFPREIS_MIN)}</span>
                  <span>{formatEuro(KAUFPREIS_MAX)}</span>
                </div>
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
