"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Building2,
  CheckCheck,
  CreditCard,
  FileQuestion,
  FileText,
  Home,
  Landmark,
  Loader2,
  ScrollText,
  Search,
  ShieldAlert,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  DocumentEntry,
  DocumentType,
  ExtractedFields,
} from "@/app/kaufcheck/types/extraction";

import { DocumentThumbnail } from "./DocumentThumbnail";
import { SuccessBurst } from "./SuccessBurst";

interface DocumentCardProps {
  entry: DocumentEntry;
  onRemove: (id: string) => void;
  /** Öffnet die Review-Ansicht – Übernahme passiert dort, nicht hier. */
  onReview: (id: string) => void;
}

const DOC_TYPE_META: Record<
  DocumentType,
  { Icon: typeof Building2; tone: string }
> = {
  gehaltszettel: { Icon: Wallet, tone: "text-[color:var(--success)]" },
  kontoauszug: { Icon: Landmark, tone: "text-primary" },
  kreditvertrag: { Icon: CreditCard, tone: "text-[color:var(--warning)]" },
  einkommensteuerbescheid: { Icon: ScrollText, tone: "text-primary" },
  arbeitsvertrag: { Icon: FileText, tone: "text-primary" },
  ksv_auskunft: { Icon: ShieldAlert, tone: "text-[color:var(--warning)]" },
  expose: { Icon: Home, tone: "text-primary" },
  unbekannt: { Icon: FileQuestion, tone: "text-muted-foreground" },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatEuro(n: number): string {
  return Math.round(n).toLocaleString("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

function truncateMiddle(s: string, max = 28): string {
  if (s.length <= max) return s;
  const keep = Math.floor((max - 1) / 2);
  return `${s.slice(0, keep)}…${s.slice(-keep)}`;
}

export function DocumentCard({ entry, onRemove, onReview }: DocumentCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isProcessed =
    entry.status.phase === "success" || entry.status.phase === "error";

  const handleRemoveClick = () => {
    if (isProcessed) {
      setConfirmOpen(true);
    } else {
      onRemove(entry.id);
    }
  };

  const handleConfirmRemove = () => {
    setConfirmOpen(false);
    onRemove(entry.id);
  };

  return (
    <motion.article
      layout
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-4 shadow-sm",
        entry.status.phase === "success" &&
          "border-[color:var(--success)]/40 bg-[color:var(--success)]/5",
        entry.status.phase === "error" && "border-destructive/40 bg-destructive/5"
      )}
    >
      {entry.status.phase === "success" && !entry.applied && <SuccessBurst />}

      <header className="flex items-start gap-3">
        <div className="hidden sm:block">
          <DocumentThumbnail file={entry.file} width={72} />
        </div>
        <div className="min-w-0 flex-1">
          <h4
            className="truncate text-sm font-semibold tracking-tight"
            title={entry.file.name}
          >
            {truncateMiddle(entry.file.name, 40)}
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            PDF · {formatSize(entry.file.size)}
          </p>
          <div className="mt-2">
            <StatusBadge entry={entry} />
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemoveClick}
          aria-label={`${entry.file.name} entfernen`}
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </header>

      <AnimatePresence mode="wait">
        {entry.status.phase === "uploading" && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-1"
          >
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${entry.status.progress}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>
          </motion.div>
        )}

        {entry.status.phase === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <ShimmerRow className="w-2/3" />
            <ShimmerRow className="w-1/2" />
          </motion.div>
        )}

        {entry.status.phase === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <ExtractedSummary
              documentType={entry.status.result.documentType}
              extracted={entry.status.result.extracted}
            />
            {entry.status.result.warnings.length > 0 && (
              <ul className="space-y-1 rounded-md border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/5 p-2 text-xs">
                {entry.status.result.warnings.map((w, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-[color:var(--warning)]"
                  >
                    <AlertCircle
                      className="mt-0.5 h-3 w-3 shrink-0"
                      aria-hidden
                    />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
            {entry.applied ? (
              <div className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--success)]">
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                Werte übernommen
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => onReview(entry.id)}
                className="w-full"
              >
                <Search aria-hidden />
                Werte prüfen
              </Button>
            )}
          </motion.div>
        )}

        {entry.status.phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 text-xs text-destructive"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <div className="flex-1">
              <p className="font-medium">Analyse fehlgeschlagen</p>
              <p className="opacity-80">{entry.status.message}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onRemove(entry.id)}
            >
              <Trash2 aria-hidden />
              Neu hochladen
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dokument entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieses Dokument wurde bereits analysiert. Beim Entfernen gehen die
              extrahierten Werte verloren – bereits übernommene Felder bleiben
              aber im Wizard bestehen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Behalten</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove}>
              Entfernen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.article>
  );
}

function StatusBadge({ entry }: { entry: DocumentEntry }) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium";
  switch (entry.status.phase) {
    case "uploading":
      return (
        <span className={cn(base, "bg-primary/10 text-primary")}>
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Wird hochgeladen …
        </span>
      );
    case "analyzing":
      return (
        <span className={cn(base, "bg-primary/10 text-primary")}>
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Wird analysiert …
        </span>
      );
    case "success": {
      const meta = DOC_TYPE_META[entry.status.result.documentType];
      const Icon = meta.Icon;
      return (
        <span
          className={cn(
            base,
            "bg-[color:var(--success)]/10 text-[color:var(--success)]"
          )}
          title={`Konfidenz ${Math.round(entry.status.result.confidence * 100)} %`}
        >
          <Icon className={cn("h-3 w-3", meta.tone)} aria-hidden />
          {entry.status.result.documentTypeLabel} erkannt ·{" "}
          {Math.round(entry.status.result.confidence * 100)} %
        </span>
      );
    }
    case "error":
      return (
        <span className={cn(base, "bg-destructive/10 text-destructive")}>
          <AlertCircle className="h-3 w-3" aria-hidden />
          Fehler
        </span>
      );
  }
}

function ShimmerRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative h-3 overflow-hidden rounded-md bg-muted/40",
        className
      )}
      aria-hidden
    >
      <div className="absolute inset-0 -translate-x-full animate-[doc-shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <style jsx>{`
        @keyframes doc-shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

function ExtractedSummary({
  documentType,
  extracted,
}: {
  documentType: DocumentType;
  extracted: ExtractedFields;
}) {
  const rows: { label: string; value: string }[] = [];
  const pushMoney = (label: string, v: number | null | undefined) => {
    if (typeof v === "number") rows.push({ label, value: `${formatEuro(v)}` });
  };
  const pushMonthly = (label: string, v: number | null | undefined) => {
    if (typeof v === "number")
      rows.push({ label, value: `${formatEuro(v)} / Monat` });
  };
  const pushString = (label: string, v: string | null | undefined) => {
    if (typeof v === "string" && v.trim().length > 0)
      rows.push({ label, value: v });
  };

  // Gehaltszettel
  pushMonthly("Netto-Einkommen", extracted.nettoeinkommen_monatlich);
  pushMonthly("Brutto-Einkommen", extracted.bruttoeinkommen_monatlich);
  pushString("Arbeitgeber", extracted.arbeitgeber);
  pushString("Abrechnungsmonat", extracted.abrechnungsmonat);
  pushMoney("SV-Beitrag", extracted.sv_beitrag);
  pushMoney("Lohnsteuer", extracted.lohnsteuer);
  if (extracted.sonderzahlung === true) {
    rows.push({ label: "Sonderzahlung", value: "ja (Urlaubs-/Weihnachtsgeld)" });
  }

  // Kontoauszug
  pushString("Kontoinhaber", extracted.kontoinhaber);
  pushMonthly("Ø Gehaltseingang", extracted.durchschnittlicher_gehaltseingang);
  if (extracted.erkannte_kreditraten?.length) {
    const total = extracted.erkannte_kreditraten.reduce(
      (s, r) => s + r.monatliche_rate,
      0
    );
    rows.push({
      label: `Kreditraten (${extracted.erkannte_kreditraten.length})`,
      value: `${formatEuro(total)} / Monat`,
    });
  }
  if (extracted.erkannte_fixkosten?.length) {
    const total = extracted.erkannte_fixkosten.reduce(
      (s, r) => s + r.monatlicher_betrag,
      0
    );
    rows.push({
      label: `Fixkosten (${extracted.erkannte_fixkosten.length})`,
      value: `${formatEuro(total)} / Monat`,
    });
  }

  // Kreditvertrag
  pushMonthly("Kreditrate", extracted.monatliche_kreditrate);
  pushMoney("Gesamtsumme", extracted.gesamtsumme);
  pushString("Kreditgeber", extracted.kreditgeber);
  if (typeof extracted.restlaufzeit_monate === "number") {
    rows.push({
      label: "Restlaufzeit",
      value: `${extracted.restlaufzeit_monate} Monate`,
    });
  }
  if (typeof extracted.zinssatz === "number") {
    rows.push({
      label: "Zinssatz",
      value: `${extracted.zinssatz.toFixed(2)} % p.a.`,
    });
  }

  // ESt-Bescheid
  pushMoney("Jahreseinkommen", extracted.jahreseinkommen);
  pushString("Veranlagungsjahr", extracted.veranlagungsjahr);
  pushString("Einkunftsart", extracted.einkunftsart);

  // Arbeitsvertrag
  pushString("Beschäftigung", extracted.beschaeftigungsart);
  pushString("Befristung", extracted.befristung);
  pushString("Eintrittsdatum", extracted.eintrittsdatum);

  // Exposé
  pushMoney("Kaufpreis", extracted.kaufpreis);
  if (typeof extracted.wohnflaeche_qm === "number") {
    rows.push({ label: "Wohnfläche", value: `${extracted.wohnflaeche_qm} m²` });
  }
  pushString("PLZ / Adresse", extracted.adresse_plz);
  pushString("Immobilienart", extracted.immobilienart);
  if (typeof extracted.baujahr === "number") {
    rows.push({ label: "Baujahr", value: `${extracted.baujahr}` });
  }

  if (rows.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {documentType === "unbekannt"
          ? "Dokumenttyp konnte nicht eindeutig zugeordnet werden – Werte bitte manuell eintragen."
          : "Keine relevanten Werte gefunden – Werte bitte manuell eintragen."}
      </p>
    );
  }

  return (
    <dl className="grid gap-1.5 text-xs">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-baseline justify-between gap-3 rounded-md bg-background/60 px-2 py-1"
        >
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd className="text-right font-medium tabular-nums">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
