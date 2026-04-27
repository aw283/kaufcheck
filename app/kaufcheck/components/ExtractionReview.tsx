"use client";

import { forwardRef, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Edit3,
  FileText,
  Lock,
  Search,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import type {
  ExtractedFields,
  ExtractSuccessResponse,
  SourceHighlight,
} from "@/app/kaufcheck/types/extraction";

import {
  FIELDS_BY_DOCTYPE,
  FIELD_META,
  type FieldKey,
  type FieldMeta,
} from "./documents/field-meta";
import { PdfPreview } from "./documents/PdfPreview";

export interface ExtractionReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  file: File;
  result: ExtractSuccessResponse;

  /** Multi-Dokument-Navigation – falls mehrere Reviews offen sind. */
  position?: { current: number; total: number };
  onPrev?: () => void;
  onNext?: () => void;

  /** Übernimmt die (ggf. editierten) Werte. */
  onApply: (result: ExtractSuccessResponse) => void;
  /** Schließt ohne Übernahme – Card bleibt im "zur Prüfung"-Zustand. */
  onDiscard: () => void;
}

// ===================================================================
// Konfidenz-Badge-Helpers
// ===================================================================

type BadgeVariant = "high" | "medium" | "low" | "edited" | "missing";

function confidenceVariant(c: number | undefined): BadgeVariant {
  if (typeof c !== "number") return "low";
  if (c >= 0.9) return "high";
  if (c >= 0.7) return "medium";
  return "low";
}

function ConfidenceBadge({ variant }: { variant: BadgeVariant }) {
  const config = {
    high: {
      Icon: CircleCheck,
      label: "Hohe Konfidenz",
      className:
        "bg-[color:var(--success)]/10 text-[color:var(--success)] ring-[color:var(--success)]/30",
    },
    medium: {
      Icon: CircleAlert,
      label: "Mittlere Konfidenz",
      className:
        "bg-[color:var(--warning)]/10 text-[color:var(--warning)] ring-[color:var(--warning)]/30",
    },
    low: {
      Icon: AlertTriangle,
      label: "Niedrige Konfidenz – bitte prüfen",
      className:
        "bg-destructive/10 text-destructive ring-destructive/30",
    },
    edited: {
      Icon: Edit3,
      label: "Manuell geändert",
      className: "bg-primary/10 text-primary ring-primary/30",
    },
    missing: {
      Icon: AlertTriangle,
      label: "Nicht erkannt",
      className: "bg-muted text-muted-foreground ring-border",
    },
  }[variant];
  const I = config.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
        config.className
      )}
      title={config.label}
    >
      <I className="h-3 w-3" aria-hidden />
      {config.label}
    </span>
  );
}

// ===================================================================
// Currency-Formatter (für die Anzeige der Werte in den Sidebar-Inputs)
// ===================================================================
function formatEuro(n: number): string {
  return Math.round(n).toLocaleString("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

// ===================================================================
// Hauptkomponente
// ===================================================================

export function ExtractionReview({
  open,
  onOpenChange,
  file,
  result,
  position,
  onPrev,
  onNext,
  onApply,
  onDiscard,
}: ExtractionReviewProps) {
  const fieldsToShow = FIELDS_BY_DOCTYPE[result.documentType] ?? [];

  // Editierter State – initialisiert aus Claude-Antwort.
  const [edited, setEdited] = useState<ExtractedFields>(() => ({
    ...result.extracted,
  }));
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [highlightField, setHighlightField] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"data" | "pdf">("data");
  const [applying, setApplying] = useState<"idle" | "animating">("idle");

  // Bei Kontoauszug-Listen pro Eintrag merken, ob der User ihn übernehmen will.
  const [creditSelection, setCreditSelection] = useState<boolean[]>(() =>
    result.extracted.erkannte_kreditraten?.map(() => true) ?? []
  );
  const [fixkostenSelection, setFixkostenSelection] = useState<boolean[]>(
    () => result.extracted.erkannte_fixkosten?.map(() => true) ?? []
  );

  // Render-time sync: bei Dokument-Wechsel (Multi-Doc-Nav) alle internen
  // States zurücksetzen. Pattern aus den React-19-Docs ("Storing
  // information from previous renders") – über useState statt useRef.
  const [seenResult, setSeenResult] = useState(result);
  if (seenResult !== result) {
    setSeenResult(result);
    setEdited({ ...result.extracted });
    setDirty(new Set());
    setHighlightField(null);
    setMobileTab("data");
    setApplying("idle");
    setCreditSelection(
      result.extracted.erkannte_kreditraten?.map(() => true) ?? []
    );
    setFixkostenSelection(
      result.extracted.erkannte_fixkosten?.map(() => true) ?? []
    );
  }

  const updateField = <K extends FieldKey>(
    key: K,
    value: ExtractedFields[K]
  ) => {
    setEdited((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const highlightFor = useMemo(
    () =>
      highlightField
        ? result.sourceHighlights.find((h) => h.field === highlightField) ??
          null
        : null,
    [highlightField, result.sourceHighlights]
  );

  const handleApply = () => {
    if (applying !== "idle") return;
    setApplying("animating");

    const finalFields: ExtractedFields = {
      ...edited,
      erkannte_kreditraten: edited.erkannte_kreditraten
        ? edited.erkannte_kreditraten.filter(
            (_, i) => creditSelection[i] !== false
          )
        : edited.erkannte_kreditraten,
      erkannte_fixkosten: edited.erkannte_fixkosten
        ? edited.erkannte_fixkosten.filter(
            (_, i) => fixkostenSelection[i] !== false
          )
        : edited.erkannte_fixkosten,
    };

    // Kurze Erfolg-Animation, dann Übergabe + Schließen.
    window.setTimeout(() => {
      onApply({ ...result, extracted: finalFields });
      onOpenChange(false);
      setApplying("idle");
    }, 650);
  };

  const handleDiscard = () => {
    onDiscard();
    onOpenChange(false);
  };

  const Header = (
    <div className="flex items-center gap-3 border-b px-4 py-3 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <FileText
          className="h-4 w-4 shrink-0 text-primary"
          aria-hidden
        />
        <DialogTitle className="truncate text-sm font-semibold sm:text-base">
          {file.name}
        </DialogTitle>
      </div>
      {position && position.total > 1 ? (
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onPrev}
            disabled={position.current <= 1 || !onPrev}
            aria-label="Voriges Dokument"
          >
            <ChevronLeft aria-hidden />
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            Dokument {position.current} von {position.total}
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onNext}
            disabled={position.current >= position.total || !onNext}
            aria-label="Nächstes Dokument"
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      ) : null}
      <DialogClose asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          aria-label="Review schließen"
        >
          <X aria-hidden />
        </Button>
      </DialogClose>
    </div>
  );

  const PrivacyBanner = (
    <div className="border-b bg-[color:var(--success)]/5 px-4 py-2 text-[11px] text-[color:var(--success)] sm:px-5">
      <span className="inline-flex items-center gap-1.5">
        <Lock className="h-3 w-3" aria-hidden />
        Ihr Dokument wird nach der Bestätigung sofort aus unseren Systemen
        gelöscht.
      </span>
    </div>
  );

  const Datenpanel = (
    <DataPanel
      result={result}
      fieldsToShow={fieldsToShow}
      edited={edited}
      dirty={dirty}
      highlightField={highlightField}
      onHighlight={setHighlightField}
      onUpdate={updateField}
      creditSelection={creditSelection}
      onCreditSelect={(i, v) =>
        setCreditSelection((prev) => {
          const next = [...prev];
          next[i] = v;
          return next;
        })
      }
      fixkostenSelection={fixkostenSelection}
      onFixkostenSelect={(i, v) =>
        setFixkostenSelection((prev) => {
          const next = [...prev];
          next[i] = v;
          return next;
        })
      }
    />
  );

  const Pdfpanel = (
    <div className="flex h-full min-h-[360px] flex-col p-3 sm:p-4">
      <PdfPreview
        file={file}
        highlight={highlightFor}
        className="h-full"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[calc(100vh-2rem)] max-h-none w-[calc(100%-1rem)] max-w-none gap-0 overflow-hidden p-0 sm:max-w-5xl sm:rounded-lg md:h-[min(90vh,820px)]">
        {Header}
        {PrivacyBanner}

        {/* Mobile Tabs */}
        <div className="flex border-b bg-muted/30 md:hidden">
          <TabButton
            active={mobileTab === "data"}
            onClick={() => setMobileTab("data")}
          >
            Erkannte Daten
          </TabButton>
          <TabButton
            active={mobileTab === "pdf"}
            onClick={() => setMobileTab("pdf")}
          >
            <Search className="h-3.5 w-3.5" aria-hidden />
            Dokument ansehen
          </TabButton>
        </div>

        {/* Body */}
        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[1fr_minmax(420px,1fr)]">
          <div
            className={cn(
              "min-h-0 overflow-hidden border-b md:order-1 md:border-b-0 md:border-r",
              mobileTab === "pdf" ? "block" : "hidden md:block"
            )}
          >
            {Pdfpanel}
          </div>
          <div
            className={cn(
              "min-h-0 overflow-y-auto md:order-2",
              mobileTab === "data" ? "block" : "hidden md:block"
            )}
          >
            {Datenpanel}
          </div>
        </div>

        {/* Footer-Aktionen */}
        <div className="flex flex-col gap-2 border-t bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-5">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDiscard}
            disabled={applying !== "idle"}
            className="sm:order-1"
          >
            Verwerfen
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={applying !== "idle"}
            className="sm:order-2"
          >
            <Check aria-hidden />
            Werte übernehmen
          </Button>
        </div>

        <AnimatePresence>
          {applying === "animating" && <ApplyOverlay />}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
// Daten-Panel (rechts oben in der Desktop-Ansicht)
// ===================================================================

interface DataPanelProps {
  result: ExtractSuccessResponse;
  fieldsToShow: FieldKey[];
  edited: ExtractedFields;
  dirty: Set<string>;
  highlightField: string | null;
  onHighlight: (key: string | null) => void;
  onUpdate: <K extends FieldKey>(key: K, value: ExtractedFields[K]) => void;
  creditSelection: boolean[];
  onCreditSelect: (index: number, value: boolean) => void;
  fixkostenSelection: boolean[];
  onFixkostenSelect: (index: number, value: boolean) => void;
}

function DataPanel({
  result,
  fieldsToShow,
  edited,
  dirty,
  highlightField,
  onHighlight,
  onUpdate,
  creditSelection,
  onCreditSelect,
  fixkostenSelection,
  onFixkostenSelect,
}: DataPanelProps) {
  return (
    <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Erkannt
          </p>
          <h3 className="text-lg font-semibold tracking-tight">
            {result.documentTypeLabel}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Konfidenz {Math.round(result.confidence * 100)} % ·{" "}
            {result.pages ?? 1}{" "}
            {(result.pages ?? 1) === 1 ? "Seite" : "Seiten"}
            {result.quality === "schlecht_lesbar"
              ? " · schlecht lesbar"
              : ""}
            {result.quality === "eingescannt_schraeg" ? " · schief gescannt" : ""}
          </p>
        </div>
        <ConfidenceBadge variant={confidenceVariant(result.confidence)} />
      </div>

      {result.warnings.length > 0 && (
        <ul
          role="alert"
          className="space-y-1 rounded-md border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/5 p-3 text-xs"
        >
          {result.warnings.map((w, i) => (
            <li
              key={i}
              className="flex items-start gap-1.5 text-[color:var(--warning)]"
            >
              <AlertTriangle
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                aria-hidden
              />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}

      {fieldsToShow.length === 0 ? (
        <div className="rounded-md border bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
          Aus diesem Dokumenttyp werden keine Werte automatisch übernommen.
          Sie können das Dokument trotzdem als Referenz behalten.
        </div>
      ) : (
        <div className="space-y-3">
          {fieldsToShow.map((key) => {
            const meta = FIELD_META[key];
            if (!meta) return null;
            const fieldConfidence = result.confidencePerField?.[key];
            const excerpt = result.sourceHighlights.find(
              (h) => h.field === key
            )?.excerpt;
            const isDirty = dirty.has(key);
            const isHighlighted = highlightField === key;
            const value = edited[key];

            const variant: BadgeVariant = isDirty
              ? "edited"
              : value === null || value === undefined
                ? "missing"
                : confidenceVariant(fieldConfidence);

            return (
              <FieldRow
                key={key}
                field={key}
                meta={meta}
                value={value}
                onChange={(v) => onUpdate(key, v as ExtractedFields[FieldKey])}
                badge={<ConfidenceBadge variant={variant} />}
                excerpt={excerpt}
                hasSource={!!excerpt}
                isHighlighted={isHighlighted}
                onSelect={() => onHighlight(isHighlighted ? null : key)}
                creditSelection={creditSelection}
                onCreditSelect={onCreditSelect}
                fixkostenSelection={fixkostenSelection}
                onFixkostenSelect={onFixkostenSelect}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===================================================================
// Einzel-Feld
// ===================================================================

interface FieldRowProps {
  field: FieldKey;
  meta: FieldMeta;
  value: unknown;
  onChange: (v: unknown) => void;
  badge: ReactNode;
  excerpt?: string;
  hasSource: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  creditSelection: boolean[];
  onCreditSelect: (i: number, v: boolean) => void;
  fixkostenSelection: boolean[];
  onFixkostenSelect: (i: number, v: boolean) => void;
}

const FieldRow = forwardRef<HTMLDivElement, FieldRowProps>(function FieldRow(
  {
    field,
    meta,
    value,
    onChange,
    badge,
    excerpt,
    hasSource,
    isHighlighted,
    onSelect,
    creditSelection,
    onCreditSelect,
    fixkostenSelection,
    onFixkostenSelect,
  },
  ref
) {
  const inputId = `field-${field}`;

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card p-3 transition-colors",
        isHighlighted && "border-yellow-400 bg-yellow-50",
        !isHighlighted && hasSource && "hover:border-primary/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Label
          htmlFor={inputId}
          className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {meta.label}
        </Label>
        {badge}
      </div>
      {meta.helper ? (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {meta.helper}
        </p>
      ) : null}

      <div className="mt-2">
        <FieldInput
          id={inputId}
          field={field}
          meta={meta}
          value={value}
          onChange={onChange}
          creditSelection={creditSelection}
          onCreditSelect={onCreditSelect}
          fixkostenSelection={fixkostenSelection}
          onFixkostenSelect={onFixkostenSelect}
        />
      </div>

      {hasSource && excerpt ? (
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "mt-2 flex w-full items-start gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] italic text-muted-foreground transition-colors hover:bg-muted/50",
            isHighlighted &&
              "bg-yellow-100/80 not-italic font-medium text-yellow-900 hover:bg-yellow-100"
          )}
          aria-pressed={isHighlighted}
        >
          <Search
            className="mt-0.5 h-3 w-3 shrink-0"
            aria-hidden
          />
          <span className="line-clamp-2">
            Quelle: &bdquo;{excerpt}&ldquo;
          </span>
        </button>
      ) : value === null || value === undefined ? (
        <p className="mt-2 text-[11px] italic text-muted-foreground">
          Nicht erkannt – bitte ergänzen.
        </p>
      ) : null}
    </div>
  );
});

// ===================================================================
// Inputs nach Feld-Typ
// ===================================================================

function FieldInput({
  id,
  field,
  meta,
  value,
  onChange,
  creditSelection,
  onCreditSelect,
  fixkostenSelection,
  onFixkostenSelect,
}: {
  id: string;
  field: FieldKey;
  meta: FieldMeta;
  value: unknown;
  onChange: (v: unknown) => void;
  creditSelection: boolean[];
  onCreditSelect: (i: number, v: boolean) => void;
  fixkostenSelection: boolean[];
  onFixkostenSelect: (i: number, v: boolean) => void;
}) {
  switch (meta.kind) {
    case "money":
      return (
        <CurrencyInput
          id={id}
          value={(typeof value === "number" ? value : undefined) ?? 0}
          onChange={(n) => onChange(n === 0 ? null : n)}
          placeholder="Nicht erkannt – bitte ergänzen"
        />
      );
    case "percent":
      return (
        <div className="relative">
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            min={0}
            max={20}
            step={0.05}
            value={typeof value === "number" ? value : ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? null : Number(e.target.value))
            }
            className="pr-12"
            placeholder="—"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            % p.a.
          </span>
        </div>
      );
    case "integer":
      return (
        <div className="relative">
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={typeof value === "number" ? value : ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? null : Number(e.target.value))
            }
            className={meta.suffix ? "pr-14" : undefined}
            placeholder="—"
          />
          {meta.suffix ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {meta.suffix}
            </span>
          ) : null}
        </div>
      );
    case "yearmonth":
      return (
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="\d{4}-\d{2}"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="JJJJ-MM"
        />
      );
    case "text":
      return (
        <Input
          id={id}
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="—"
        />
      );
    case "boolean":
      return (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
        >
          <Checkbox
            id={id}
            checked={value === true}
            onCheckedChange={(v) => onChange(v === true)}
          />
          <span>{meta.label}</span>
        </label>
      );
    case "list-kreditraten":
      return (
        <KreditratenList
          rows={(value as ExtractedFields["erkannte_kreditraten"]) ?? null}
          selection={creditSelection}
          onSelect={onCreditSelect}
        />
      );
    case "list-fixkosten":
      return (
        <FixkostenList
          rows={(value as ExtractedFields["erkannte_fixkosten"]) ?? null}
          selection={fixkostenSelection}
          onSelect={onFixkostenSelect}
        />
      );
  }
  // exhaustive
  return null;
}

// ===================================================================
// Listen-Editoren
// ===================================================================

function KreditratenList({
  rows,
  selection,
  onSelect,
}: {
  rows: ExtractedFields["erkannte_kreditraten"] | null | undefined;
  selection: boolean[];
  onSelect: (i: number, v: boolean) => void;
}) {
  if (!rows || rows.length === 0) {
    return (
      <p className="rounded-md bg-muted/40 px-3 py-2 text-xs italic text-muted-foreground">
        Keine wiederkehrenden Kreditraten erkannt.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {rows.map((row, i) => {
        const checked = selection[i] !== false;
        const id = `kredit-${i}`;
        return (
          <li
            key={`${row.glaeubiger}-${i}`}
            className={cn(
              "flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-sm",
              checked ? "border-primary/40 bg-primary/5" : "border-border"
            )}
          >
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={(v) => onSelect(i, v === true)}
            />
            <label htmlFor={id} className="flex flex-1 cursor-pointer items-baseline justify-between gap-3">
              <span className="truncate font-medium">{row.glaeubiger}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatEuro(row.monatliche_rate)} / Monat
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function FixkostenList({
  rows,
  selection,
  onSelect,
}: {
  rows: ExtractedFields["erkannte_fixkosten"] | null | undefined;
  selection: boolean[];
  onSelect: (i: number, v: boolean) => void;
}) {
  if (!rows || rows.length === 0) {
    return (
      <p className="rounded-md bg-muted/40 px-3 py-2 text-xs italic text-muted-foreground">
        Keine wiederkehrenden Fixkosten erkannt.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {rows.map((row, i) => {
        const checked = selection[i] !== false;
        const id = `fix-${i}`;
        return (
          <li
            key={`${row.empfaenger}-${i}`}
            className={cn(
              "flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-sm",
              checked ? "border-primary/40 bg-primary/5" : "border-border"
            )}
          >
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={(v) => onSelect(i, v === true)}
            />
            <label htmlFor={id} className="flex flex-1 cursor-pointer items-baseline justify-between gap-3">
              <span className="truncate font-medium">
                {row.empfaenger}
                {row.kategorie ? (
                  <span className="ml-1 text-xs text-muted-foreground">
                    · {row.kategorie}
                  </span>
                ) : null}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatEuro(row.monatlicher_betrag)} / Monat
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

// ===================================================================
// Tab-Button (mobil)
// ===================================================================
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

// ===================================================================
// Erfolgs-Overlay nach Übernahme
// ===================================================================
function ApplyOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--success)]/15 text-[color:var(--success)]">
          <CheckCheck className="h-8 w-8" aria-hidden />
        </div>
        <p className="text-sm font-semibold">Werte übernommen</p>
      </motion.div>
    </motion.div>
  );
}
