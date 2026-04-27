"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Lock, MousePointerClick, UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  DocumentEntry,
  ExtractResponse,
  ExtractSuccessResponse,
  TargetField,
  UploadContext,
} from "@/app/kaufcheck/types/extraction";

import { DocumentCard } from "./documents/DocumentCard";
import { ExtractionReview } from "./ExtractionReview";
import {
  hasUploadConsent,
  UploadConsentDialog,
} from "./UploadConsentDialog";

export type DocumentUploadProps = {
  /** Welche Datenfelder soll der Extraktor priorisieren? */
  targetFields: TargetField[];
  /**
   * Callback wenn Daten extrahiert und vom User übernommen wurden.
   * Liefert das (ggf. editierte) Result + die Original-Datei (für
   * Source-Tracking bzw. Tooltip).
   */
  onDataExtracted: (result: ExtractSuccessResponse, file: File) => void;
  /** Wizard-Schritt – steuert Prompt-Fokus im Backend. */
  context: UploadContext;
  /** `"compact"` rendert eine schlankere Variante für dichte Wizard-Einbettungen. */
  variant?: "full" | "compact";
  /** Falls gesetzt, wird das Netzwerk-Ziel überschrieben (Tests / Mocks). */
  endpoint?: string;
  /** Überschreibt das Default-Feld-Limit (10 gleichzeitige Dateien). */
  maxFiles?: number;
  className?: string;
};

const DEFAULT_MAX_FILES = 10;
const MAX_SIZE_BYTES = 15 * 1024 * 1024;
const DEFAULT_ENDPOINT = "/api/kaufcheck/extract";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatRejection(rejection: FileRejection): string {
  const code = rejection.errors[0]?.code;
  switch (code) {
    case "file-too-large":
      return `${rejection.file.name} ist größer als 15 MB.`;
    case "file-invalid-type":
      return `${rejection.file.name} ist kein PDF.`;
    case "too-many-files":
      return "Maximal 10 Dateien gleichzeitig.";
    default:
      return `${rejection.file.name} konnte nicht hinzugefügt werden.`;
  }
}

export function DocumentUpload({
  targetFields,
  onDataExtracted,
  context,
  variant = "full",
  endpoint = DEFAULT_ENDPOINT,
  maxFiles = DEFAULT_MAX_FILES,
  className,
}: DocumentUploadProps) {
  const [entries, setEntries] = useState<DocumentEntry[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [reviewEntryId, setReviewEntryId] = useState<string | null>(null);

  // Consent-Gate: erste Drop-Aktion öffnet das Modal, gepufferte Files
  // werden danach freigegeben. Wenn der User schon einmal zugestimmt hat
  // (sessionStorage), schalten wir den Modal-Schritt aus.
  const [consentOpen, setConsentOpen] = useState(false);
  const [pendingDropFiles, setPendingDropFiles] = useState<File[]>([]);

  // Laufende AbortControllers, damit remove() nicht in den Store schreibt
  // nachdem das DOM-Element längst weg ist.
  const controllersRef = useRef<Map<string, AbortController>>(new Map());

  const updateEntry = useCallback(
    (id: string, patch: Partial<DocumentEntry>) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
      );
    },
    []
  );

  const processFile = useCallback(
    async (entry: DocumentEntry) => {
      const controller = new AbortController();
      controllersRef.current.set(entry.id, controller);

      // Simulierte Progression – fetch liefert kein echtes Upload-Progress.
      // Der Status wechselt proaktiv auf "analyzing" bevor Claude antwortet,
      // damit der User den Shimmer-Zustand tatsächlich sieht.
      updateEntry(entry.id, {
        status: { phase: "uploading", progress: 15 },
      });
      const progressTick = window.setTimeout(() => {
        updateEntry(entry.id, {
          status: { phase: "uploading", progress: 60 },
        });
      }, 200);
      const toAnalyzing = window.setTimeout(() => {
        updateEntry(entry.id, { status: { phase: "analyzing" } });
      }, 700);

      const cleanup = () => {
        window.clearTimeout(progressTick);
        window.clearTimeout(toAnalyzing);
      };

      try {
        const form = new FormData();
        form.append("file", entry.file, entry.file.name);
        form.append("context", context);
        form.append("targetFields", JSON.stringify(targetFields));

        const res = await fetch(endpoint, {
          method: "POST",
          body: form,
          signal: controller.signal,
        });
        cleanup();

        const data = (await res.json().catch(() => null)) as
          | ExtractResponse
          | null;

        if (!res.ok || !data || data.success === false) {
          const msg =
            data && data.success === false
              ? data.error
              : `Server antwortete mit Status ${res.status}.`;
          throw new Error(msg);
        }

        updateEntry(entry.id, {
          status: { phase: "success", result: data },
        });
      } catch (err) {
        cleanup();
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          // Entry wurde vom User entfernt – nichts tun.
          return;
        }
        const msg =
          err instanceof Error ? err.message : "Unbekannter Fehler.";
        updateEntry(entry.id, { status: { phase: "error", message: msg } });
      } finally {
        controllersRef.current.delete(entry.id);
      }
    },
    [context, endpoint, targetFields, updateEntry]
  );

  const startUpload = useCallback(
    (accepted: File[]) => {
      const fresh: DocumentEntry[] = accepted.map((file) => ({
        id: makeId(),
        file,
        status: { phase: "uploading", progress: 0 },
      }));

      setEntries((prev) => {
        const combined = [...prev, ...fresh];
        return combined.length > maxFiles
          ? combined.slice(-maxFiles)
          : combined;
      });

      fresh.forEach((entry) => void processFile(entry));
    },
    [maxFiles, processFile]
  );

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length > 0) {
        setRejections((prev) => [
          ...prev,
          ...rejected.map(formatRejection),
        ]);
        window.setTimeout(() => setRejections([]), 4000);
      }
      if (accepted.length === 0) return;

      // Erst-Upload in dieser Session: Consent-Modal öffnen, Datei
      // bis zur Bestätigung puffern. Spätere Uploads laufen direkt
      // durch (sessionStorage-Flag).
      if (!hasUploadConsent()) {
        setPendingDropFiles(accepted);
        setConsentOpen(true);
        return;
      }
      startUpload(accepted);
    },
    [startUpload]
  );

  const handleConsent = useCallback(() => {
    if (pendingDropFiles.length > 0) {
      startUpload(pendingDropFiles);
      setPendingDropFiles([]);
    }
  }, [pendingDropFiles, startUpload]);

  const handleConsentCancel = useCallback(() => {
    setPendingDropFiles([]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isFocused, open } =
    useDropzone({
      onDrop,
      accept: { "application/pdf": [".pdf"] },
      maxSize: MAX_SIZE_BYTES,
      maxFiles,
      multiple: true,
      noClick: false,
      noKeyboard: false,
    });

  const handleRemove = useCallback((id: string) => {
    const controller = controllersRef.current.get(id);
    if (controller) {
      controller.abort();
      controllersRef.current.delete(id);
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleReview = useCallback((id: string) => {
    setReviewEntryId(id);
  }, []);

  const handleApply = useCallback(
    (id: string, result: ExtractSuccessResponse) => {
      const entry = entries.find((e) => e.id === id);
      const file = entry?.file ?? new File([], "Dokument");
      onDataExtracted(result, file);
      updateEntry(id, { applied: true });
      setReviewEntryId(null);
    },
    [entries, onDataExtracted, updateEntry]
  );

  // Liste der review-fähigen Entries (success + nicht angewendet) – Basis
  // für die Multi-Dokument-Navigation im Review-Modal.
  const reviewable = useMemo(
    () => entries.filter((e) => e.status.phase === "success" && !e.applied),
    [entries]
  );
  const reviewIndex = reviewEntryId
    ? reviewable.findIndex((e) => e.id === reviewEntryId)
    : -1;
  const activeReview =
    reviewIndex >= 0 ? reviewable[reviewIndex] : null;

  const isCompact = variant === "compact";

  return (
    <section
      className={cn("flex flex-col gap-4", className)}
      aria-label="Dokumente hochladen"
    >
      <motion.div
        {...getRootProps({
          role: "button",
          "aria-label": "PDF-Dokumente hier ablegen oder klicken zum Auswählen",
        })}
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className={cn(
          "group relative cursor-pointer select-none rounded-2xl border-2 border-dashed bg-gradient-to-br from-orange-50 via-white to-orange-50 px-5 py-8 text-center shadow-sm transition-colors",
          "hover:border-orange-500 hover:border-solid",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragActive && "border-orange-500 border-solid bg-orange-50",
          !isDragActive && "border-orange-300",
          isFocused && "ring-2 ring-ring ring-offset-2",
          isCompact && "py-5"
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isDragActive ? "active" : "idle"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              animate={
                isDragActive
                  ? {
                      scale: [1, 1.08, 1],
                      transition: {
                        duration: 0.9,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }
                  : { scale: 1 }
              }
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-colors",
                isDragActive
                  ? "bg-orange-500 text-white"
                  : "bg-white text-orange-500 group-hover:bg-orange-500 group-hover:text-white"
              )}
            >
              <UploadCloud className="h-7 w-7" aria-hidden />
            </motion.div>

            <div className="space-y-0.5">
              <p className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {isDragActive
                  ? "Loslassen zum Hochladen"
                  : "Dokumente hier ablegen"}
              </p>
              <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground sm:text-sm">
                <MousePointerClick className="h-3.5 w-3.5" aria-hidden />
                oder klicken zum Auswählen
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Gehaltszettel · Kontoauszug · Kreditvertrag
            </p>
          </motion.div>
        </AnimatePresence>

        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-black/5">
          <Lock className="h-3 w-3 text-[color:var(--success)]" aria-hidden />
          Dokumente werden verschlüsselt verarbeitet und nach der Analyse
          sofort gelöscht.
        </p>

        {/* Tastatur-Fallback: Button öffnet Dateiwähler (react-dropzone
            bindet den Klick auf den Container). */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="sr-only"
          tabIndex={-1}
        >
          Datei auswählen
        </button>
      </motion.div>

      <AnimatePresence>
        {rejections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <ul className="flex-1 space-y-0.5">
              {rejections.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {entries.length > 0 && (
        <motion.ul
          layout
          className={cn(
            "grid gap-3",
            isCompact
              ? "grid-cols-1"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
          )}
        >
          <AnimatePresence mode="popLayout">
            {entries.map((entry, i) => (
              <motion.li
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { delay: i * 0.08 },
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  transition: { duration: 0.15 },
                }}
              >
                <DocumentCard
                  entry={entry}
                  onRemove={handleRemove}
                  onReview={handleReview}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <UploadConsentDialog
        open={consentOpen}
        onOpenChange={(o) => {
          setConsentOpen(o);
          if (!o) handleConsentCancel();
        }}
        onConsent={handleConsent}
      />

      {activeReview && activeReview.status.phase === "success" ? (
        <ExtractionReview
          open={true}
          onOpenChange={(o) => {
            if (!o) setReviewEntryId(null);
          }}
          file={activeReview.file}
          result={activeReview.status.result}
          position={
            reviewable.length > 1
              ? { current: reviewIndex + 1, total: reviewable.length }
              : undefined
          }
          onPrev={
            reviewIndex > 0
              ? () => setReviewEntryId(reviewable[reviewIndex - 1].id)
              : undefined
          }
          onNext={
            reviewIndex < reviewable.length - 1
              ? () => setReviewEntryId(reviewable[reviewIndex + 1].id)
              : undefined
          }
          onApply={(updatedResult) =>
            handleApply(activeReview.id, updatedResult)
          }
          onDiscard={() => setReviewEntryId(null)}
        />
      ) : null}
    </section>
  );
}
