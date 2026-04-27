"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import { cn } from "@/lib/utils";
import { useKaufcheckStore } from "@/app/kaufcheck/lib/store";
import { isStepValid } from "@/app/kaufcheck/lib/validation";
import { STEPS, type StepIndex } from "@/app/kaufcheck/types";
import { analytics } from "@/lib/analytics";
import { captureUtm } from "@/lib/utm";

import { WizardProgress } from "./WizardProgress";
import { HaushaltStep } from "./HaushaltStep";
import { FinanzenStep } from "./FinanzenStep";
import { VorstellungStep } from "./VorstellungStep";
import { ErgebnisStep } from "./ErgebnisStep";
import { DevSeedButton } from "./DevSeedButton";

type Direction = "forward" | "backward";

export function Wizard() {
  const router = useRouter();
  const step = useKaufcheckStore((s) => s.step);
  const data = useKaufcheckStore((s) => s.data);
  const setStep = useKaufcheckStore((s) => s.setStep);
  const calculate = useKaufcheckStore((s) => s.calculate);
  const reset = useKaufcheckStore((s) => s.reset);

  const [direction, setDirection] = useState<Direction>("forward");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef<StepIndex>(step);

  // DSGVO-sauber: beim Mount immer frisch starten (keine persistierte Session).
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    reset();
    captureUtm();
    analytics.kaufcheckStarted(
      typeof document !== "undefined" ? document.referrer : undefined
    );
  }, [reset]);

  // Auto-Focus bei Step-Wechsel: erstes fokussierbares Element im Step.
  // Der erste Mount wird bewusst ausgelassen, damit kein Feld ungewollt
  // beim Landen auf der Seite fokussiert wird.
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;

    const container = stepContainerRef.current;
    if (!container) return;

    const first = container.querySelector<HTMLElement>(
      "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [role=combobox]:not([disabled]), button:not([disabled])"
    );
    // Kurz nach dem Render fokussieren (nach der Transition).
    const id = window.setTimeout(() => {
      first?.focus({ preventScroll: true });
    }, 180);
    return () => window.clearTimeout(id);
  }, [step]);

  const currentValid = isStepValid(step, data);
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  // "Daten wurden eingegeben" = irgendein relevantes Feld unterscheidet
  // sich vom Initial-Zustand. Schützt vor unnötigen Confirm-Dialogen.
  const hasEnteredData =
    data.haushalt.einkommensart !== "" ||
    data.haushalt.kinder > 0 ||
    data.haushalt.erwachsene > 1 ||
    data.haushalt.alterHauptantragsteller !== 35 ||
    data.finanzen.nettoEinkommen > 0 ||
    data.finanzen.bestehendeKreditraten > 0 ||
    data.finanzen.sonstigeFixkosten > 0 ||
    data.vorstellung.eigenkapital > 0 ||
    data.vorstellung.bundesland !== "" ||
    data.vorstellung.immobilienart !== "" ||
    data.vorstellung.wunschKaufpreis > 0 ||
    data.vorstellung.keineKaufpreisVorstellung;

  // beforeunload-Guard: warnt auf Schritt 2+3 wenn Daten eingegeben wurden.
  useEffect(() => {
    if (step < 1 || step > 2 || !hasEnteredData) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Chrome verlangt returnValue für den Native-Dialog.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [step, hasEnteredData]);

  const goBack = () => {
    if (isFirst) {
      // Nur nachfragen, wenn es tatsächlich etwas zu verlieren gibt.
      if (hasEnteredData) {
        setLeaveOpen(true);
      } else {
        reset();
        router.push("/kaufcheck");
      }
      return;
    }
    setDirection("backward");
    setStep(((step - 1) as StepIndex));
  };

  const goNext = () => {
    if (!currentValid) return;
    // Step-completed feuert VOR der Store-Mutation, damit die Nummer korrekt ist.
    analytics.stepCompleted(step + 1, STEPS[step].key);
    if (step === 2) calculate();
    if (isLast) return;
    setDirection("forward");
    setStep(((step + 1) as StepIndex));
  };

  const confirmLeave = () => {
    setLeaveOpen(false);
    reset();
    router.push("/kaufcheck");
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 px-4 py-6 sm:px-6 sm:py-10 print:max-w-none print:px-0 print:py-0">
      <div className="print:hidden">
        <WizardProgress step={step} />
      </div>

      <Card className="overflow-hidden print:border-0 print:shadow-none">
        <CardContent className="relative px-5 py-6 sm:px-8 sm:py-8">
          <div
            key={step}
            ref={stepContainerRef}
            className={cn(
              "animate-in fade-in-0 duration-300 ease-out",
              direction === "forward"
                ? "slide-in-from-right-4"
                : "slide-in-from-left-4"
            )}
            aria-live="polite"
          >
            {step === 0 && <HaushaltStep />}
            {step === 1 && <FinanzenStep />}
            {step === 2 && <VorstellungStep />}
            {step === 3 && <ErgebnisStep />}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 print:hidden">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={goBack}
          className="min-w-[7rem]"
        >
          <ArrowLeft className="mr-1" aria-hidden />
          Zurück
        </Button>

        {!isLast && (
          <Button
            type="button"
            size="lg"
            onClick={goNext}
            disabled={!currentValid}
            className="min-w-[7rem]"
          >
            Weiter
            <ArrowRight className="ml-1" aria-hidden />
          </Button>
        )}
      </div>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kaufcheck verlassen?</AlertDialogTitle>
            <AlertDialogDescription>
              Wenn Sie jetzt zurückgehen, gehen Ihre bisherigen Eingaben
              verloren. Möchten Sie wirklich abbrechen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Weiter bearbeiten</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave}>
              Abbrechen & verlassen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DevSeedButton />
    </div>
    </TooltipProvider>
  );
}
