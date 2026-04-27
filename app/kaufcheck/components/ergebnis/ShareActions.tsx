"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Link2, Printer, RefreshCcw, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useKaufcheckStore } from "@/app/kaufcheck/lib/store";

interface ShareActionsProps {
  titel: string;
  zusammenfassung: string;
}

export function ShareActions({ titel, zusammenfassung }: ShareActionsProps) {
  const router = useRouter();
  const reset = useKaufcheckStore((s) => s.reset);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleReset = () => {
    reset();
    router.push("/kaufcheck");
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    if (typeof window === "undefined") {
      setSharing(false);
      return;
    }
    const url = window.location.href;
    const nav = window.navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
      clipboard?: { writeText: (s: string) => Promise<void> };
    };

    try {
      if (typeof nav.share === "function") {
        await nav.share({ title: titel, text: zusammenfassung, url });
      } else if (nav.clipboard?.writeText) {
        await nav.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Nutzer hat abgebrochen – bewusst leise.
    } finally {
      setSharing(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleShare}
        aria-label="Ergebnis teilen"
      >
        {copied ? (
          <>
            <Check aria-hidden /> Link kopiert
          </>
        ) : (
          <>
            <Share2 aria-hidden className="hidden sm:inline" />
            <Link2 aria-hidden className="sm:hidden" />
            Teilen
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePrint}
        aria-label="Ergebnis drucken"
      >
        <Printer aria-hidden />
        Drucken
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleReset}
        aria-label="Neu berechnen"
        className="ml-auto"
      >
        <RefreshCcw aria-hidden />
        Neu berechnen
      </Button>
    </div>
  );
}
