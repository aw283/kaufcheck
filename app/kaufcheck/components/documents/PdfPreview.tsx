"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SourceHighlight } from "@/app/kaufcheck/types/extraction";

type PdfModule = typeof import("react-pdf");

let cachedPdfModulePromise: Promise<PdfModule> | null = null;
function loadPdfModule(): Promise<PdfModule> {
  if (!cachedPdfModulePromise) {
    cachedPdfModulePromise = import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.pdfjs.version}/pdf.worker.min.mjs`;
      return mod;
    });
  }
  return cachedPdfModulePromise;
}

interface PdfPreviewProps {
  file: File;
  /** Aktuell hervorzuhebendes Feld – Component springt zur Seite und zeichnet Bbox. */
  highlight?: SourceHighlight | null;
  className?: string;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.25;

export function PdfPreview({ file, highlight, className }: PdfPreviewProps) {
  const [pdfModule, setPdfModule] = useState<PdfModule | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadPdfModule()
      .then((mod) => {
        if (active) setPdfModule(mod);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Render-time sync: bei neuem Highlight zur Quelle springen.
  // Pattern aus den React-19-Docs ("Storing information from previous
  // renders"): über useState statt useRef tracken, setState im Render
  // ist explizit erlaubt.
  const [seenHighlight, setSeenHighlight] = useState<
    SourceHighlight | null | undefined
  >(undefined);
  if (seenHighlight !== highlight) {
    setSeenHighlight(highlight);
    if (highlight?.page) {
      const target = Math.max(
        1,
        Math.min(numPages ?? highlight.page, highlight.page)
      );
      if (target !== page) setPage(target);
    }
  }

  const validBbox =
    highlight?.bbox &&
    Array.isArray(highlight.bbox) &&
    highlight.bbox.length === 4 &&
    highlight.bbox.every((n) => Number.isFinite(n))
      ? (highlight.bbox as [number, number, number, number])
      : null;

  const showOverlay = highlight && highlight.page === page && !!validBbox;

  if (failed) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[300px] flex-col items-center justify-center gap-2 rounded-md border bg-muted/40 p-6 text-center text-sm text-muted-foreground",
          className
        )}
      >
        <FileText className="h-8 w-8 text-muted-foreground/60" aria-hidden />
        <p>PDF-Vorschau ist hier nicht verfügbar.</p>
        <p className="text-xs">
          Die Original-Datei bleibt zur Prüfung in Ihrem Browser.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col gap-2", className)}>
      <Toolbar
        page={page}
        numPages={numPages}
        scale={scale}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() =>
          setPage((p) => (numPages ? Math.min(numPages, p + 1) : p))
        }
        onZoomIn={() =>
          setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP))
        }
        onZoomOut={() =>
          setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP))
        }
        onResetZoom={() => setScale(1.0)}
      />

      <div className="relative flex-1 overflow-auto rounded-md border bg-muted/30">
        {!pdfModule ? (
          <div className="flex h-full min-h-[400px] items-center justify-center text-xs text-muted-foreground">
            PDF-Vorschau wird geladen …
          </div>
        ) : (
          <PdfRendererInner
            pdfModule={pdfModule}
            file={file}
            page={page}
            scale={scale}
            onLoadSuccess={(n) => setNumPages(n)}
            onLoadError={() => setFailed(true)}
            overlay={
              showOverlay && validBbox ? (
                <BboxHighlight bbox={validBbox} />
              ) : null
            }
          />
        )}
      </div>

      {highlight ? (
        <p className="rounded-md bg-yellow-50 px-2.5 py-1.5 text-[11px] italic text-yellow-900 ring-1 ring-yellow-300">
          Quelle: &bdquo;{highlight.excerpt}&ldquo;
        </p>
      ) : null}
    </div>
  );
}

function Toolbar({
  page,
  numPages,
  scale,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: {
  page: number;
  numPages: number | null;
  scale: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}) {
  const hasMultiplePages = (numPages ?? 1) > 1;
  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-1.5 py-1">
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onPrev}
          disabled={!hasMultiplePages || page <= 1}
          aria-label="Vorige Seite"
        >
          <ChevronLeft aria-hidden />
        </Button>
        <span className="min-w-[64px] text-center text-xs tabular-nums">
          Seite {page}
          {numPages ? ` / ${numPages}` : ""}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onNext}
          disabled={!numPages || page >= numPages}
          aria-label="Nächste Seite"
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onZoomOut}
          disabled={scale <= MIN_SCALE + 0.01}
          aria-label="Verkleinern"
        >
          <ZoomOut aria-hidden />
        </Button>
        <span className="min-w-[44px] text-center text-xs tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onZoomIn}
          disabled={scale >= MAX_SCALE - 0.01}
          aria-label="Vergrößern"
        >
          <ZoomIn aria-hidden />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onResetZoom}
          aria-label="Zoom zurücksetzen"
        >
          <RotateCcw aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function PdfRendererInner({
  pdfModule,
  file,
  page,
  scale,
  onLoadSuccess,
  onLoadError,
  overlay,
}: {
  pdfModule: PdfModule;
  file: File;
  page: number;
  scale: number;
  onLoadSuccess: (numPages: number) => void;
  onLoadError: () => void;
  overlay: React.ReactNode;
}) {
  const { Document, Page } = pdfModule;
  return (
    <div className="flex justify-center p-3">
      <div className="relative inline-block">
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
          onLoadError={onLoadError}
          loading={
            <div className="px-6 py-12 text-xs text-muted-foreground">
              PDF wird geladen …
            </div>
          }
        >
          <Page
            pageNumber={page}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
        {overlay}
      </div>
    </div>
  );
}

function BboxHighlight({ bbox }: { bbox: [number, number, number, number] }) {
  const [x, y, w, h] = bbox;
  return (
    <motion.div
      key={`${x}-${y}-${w}-${h}`}
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="pointer-events-none absolute rounded-sm border-2 border-yellow-400 bg-yellow-200/30 shadow-[0_0_0_4px_rgba(250,204,21,0.15)]"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${w * 100}%`,
        height: `${h * 100}%`,
      }}
      aria-hidden
    />
  );
}
