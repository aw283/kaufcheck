"use client";

import Link from "next/link";
import { Check, Lock, ShieldCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CONSENT_KEY = "kaufcheck:upload-consent";
/**
 * Bumpen, wenn sich die Consent-Texte signifikant ändern (Versionierung).
 * SessionStorage-Werte mit alter Version werden ignoriert → Modal taucht
 * neu auf.
 */
const CONSENT_VERSION = 1;

interface UploadConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Wird aufgerufen wenn der User zustimmt – Upload kann starten. */
  onConsent: () => void;
}

export function UploadConsentDialog({
  open,
  onOpenChange,
  onConsent,
}: UploadConsentDialogProps) {
  const handleConfirm = () => {
    persistConsent();
    onConsent();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--success)]/10 text-[color:var(--success)]">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </div>
          <DialogTitle>Vertrauliche Finanzdokumente hochladen</DialogTitle>
          <DialogDescription>
            Sie laden vertrauliche Finanzdokumente hoch. Bevor wir starten,
            möchten wir Ihnen transparent zeigen, was damit passiert.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2.5">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--success)]"
              aria-hidden
            />
            <span>
              Werden <strong>nur zur Extraktion</strong> der für die
              Berechnung benötigten Werte verwendet.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <Lock
              className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--success)]"
              aria-hidden
            />
            <span>
              Werden <strong>verschlüsselt</strong> (TLS 1.3) an unseren
              KI-Partner Anthropic übermittelt.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <Trash2
              className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--success)]"
              aria-hidden
            />
            <span>
              Werden <strong>nach erfolgreicher Extraktion sofort
              gelöscht</strong> – nicht auf Disk geschrieben, nicht ins
              Backup.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--success)]"
              aria-hidden
            />
            <span>
              Werden <strong>nicht langfristig gespeichert</strong> und{" "}
              <strong>nicht an Dritte weitergegeben</strong> (außer dem
              KI-Partner zur Bearbeitung).
            </span>
          </li>
        </ul>

        <p className="text-xs text-muted-foreground">
          Mehr Details und Ihre Rechte finden Sie in unserem{" "}
          <Link
            href="/kaufcheck/datenschutz"
            target="_blank"
            prefetch={false}
            className="font-medium text-primary hover:underline"
          >
            Datenschutz­hinweis
          </Link>
          .
        </p>

        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Abbrechen
          </Button>
          <Button type="button" onClick={handleConfirm}>
            <ShieldCheck aria-hidden />
            Verstanden &amp; hochladen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------
// Consent-Persistenz – SessionStorage (NICHT localStorage,
// NICHT Cookie). Kein Cross-Session-Tracking.
// ------------------------------------------------------------------

interface StoredConsent {
  version: number;
  acceptedAt: string;
}

export function hasUploadConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as StoredConsent;
    return parsed.version === CONSENT_VERSION;
  } catch {
    return false;
  }
}

function persistConsent() {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredConsent = {
      version: CONSENT_VERSION,
      acceptedAt: new Date().toISOString(),
    };
    window.sessionStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage kann blockiert sein – dann zeigen wir den Dialog
    // bei jedem Upload erneut. Akzeptabel.
  }
}
