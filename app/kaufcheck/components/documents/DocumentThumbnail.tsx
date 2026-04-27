"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

import { cn } from "@/lib/utils";

type PdfModule = typeof import("react-pdf");

/**
 * react-pdf lazy laden – vermeidet SSR-Issues und hält die Initial-Bundle
 * klein. Die pdf.js-Worker-URL wird aus der installierten Version gebildet
 * und von einem CDN geladen, um Turbopack-Worker-Konfiguration zu umgehen.
 */
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

interface DocumentThumbnailProps {
  file: File;
  width?: number;
  className?: string;
}

export function DocumentThumbnail({
  file,
  width = 88,
  className,
}: DocumentThumbnailProps) {
  const [pdfModule, setPdfModule] = useState<PdfModule | null>(null);
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

  if (failed) return <Fallback className={className} />;
  if (!pdfModule) return <Skeleton width={width} className={className} />;

  const { Document, Page } = pdfModule;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border bg-white shadow-sm",
        className
      )}
      style={{ width, height: (width * 4) / 3 }}
      aria-hidden
    >
      <Document
        file={file}
        loading={<Skeleton width={width} className="h-full w-full" />}
        error={<Fallback />}
        onLoadError={() => setFailed(true)}
        noData={<Fallback />}
      >
        <Page
          pageNumber={1}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={<Skeleton width={width} className="h-full w-full" />}
          error={<Fallback />}
        />
      </Document>
    </div>
  );
}

function Skeleton({
  width,
  className,
}: {
  width: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border bg-muted/40",
        className
      )}
      style={{ width, height: (width * 4) / 3 }}
      aria-hidden
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

function Fallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex aspect-[3/4] w-[88px] items-center justify-center rounded-md border bg-gradient-to-br from-orange-50 to-white",
        className
      )}
      aria-hidden
    >
      <FileText className="h-8 w-8 text-primary/70" />
    </div>
  );
}
