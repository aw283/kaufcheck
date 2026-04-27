"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CalendarCheck, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KONTAKTZEIT_VALUES,
  leadFormSchema,
  type LeadFormInput,
} from "@/app/kaufcheck/lib/lead-schema";
import { useKaufcheckStore } from "@/app/kaufcheck/lib/store";
import { analytics } from "@/lib/analytics";
import { readUtm } from "@/lib/utm";

const KONTAKTZEIT_LABEL: Record<(typeof KONTAKTZEIT_VALUES)[number], string> = {
  vormittag: "Vormittag (8–12 Uhr)",
  nachmittag: "Nachmittag (12–17 Uhr)",
  abend: "Abend (17–20 Uhr)",
};

type Status = "idle" | "submitting" | "success" | "error";

interface LeadFormDialogProps {
  trigger: React.ReactNode;
  ctaLabel?: string;
}

export function LeadFormDialog({
  trigger,
  ctaLabel = "Anfrage senden",
}: LeadFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const input = useKaufcheckStore((s) => s.data);
  const result = useKaufcheckStore((s) => s.result);

  const form = useForm<LeadFormInput>({
    resolver: zodResolver(leadFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      vorname: "",
      nachname: "",
      email: "",
      telefon: "",
      kontaktzeit: "" as LeadFormInput["kontaktzeit"],
      einwilligungWeitergabe: false,
      newsletter: false,
    },
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // Dialog-Reset nach kurzer Verzögerung, damit die Schließ-Animation sauber läuft.
      setTimeout(() => {
        setStatus("idle");
        setErrorMsg(null);
        form.reset();
      }, 200);
    }
  };

  const onSubmit = async (values: LeadFormInput) => {
    setStatus("submitting");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: values,
          kaufcheck: {
            input,
            result: result ?? {},
          },
          context: {
            utm: readUtm(),
            referrer: typeof document !== "undefined" ? document.referrer : "",
            url: typeof window !== "undefined" ? window.location.href : "",
            userAgent:
              typeof navigator !== "undefined" ? navigator.userAgent : "",
            submittedAt: new Date().toISOString(),
          },
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      analytics.leadSubmitted(values.kontaktzeit, values.newsletter);
      setStatus("success");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unbekannter Fehler beim Absenden.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent>
        {status === "success" ? (
          <SuccessView onClose={() => onOpenChange(false)} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Kostenlose Finanzierungsberatung</DialogTitle>
              <DialogDescription>
                Tragen Sie Ihre Kontaktdaten ein – ein:e unabhängige:r Berater:in
                meldet sich binnen 24 Stunden.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
                className="space-y-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="vorname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vorname</FormLabel>
                        <FormControl>
                          <Input autoComplete="given-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nachname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nachname</FormLabel>
                        <FormControl>
                          <Input autoComplete="family-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail-Adresse</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="max.muster@mail.at"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon­nummer</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="+43 660 1234567"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="kontaktzeit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bevorzugte Kontaktzeit</FormLabel>
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
                          {KONTAKTZEIT_VALUES.map((v) => (
                            <SelectItem key={v} value={v}>
                              {KONTAKTZEIT_LABEL[v]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="einwilligungWeitergabe"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-3">
                        <FormControl>
                          <Checkbox
                            id="einwilligungWeitergabe"
                            checked={field.value}
                            onCheckedChange={(v) => field.onChange(!!v)}
                          />
                        </FormControl>
                        <Label
                          htmlFor="einwilligungWeitergabe"
                          className="text-sm font-normal leading-snug"
                        >
                          Ich stimme zu, dass ImmobilienScout24 meine Daten an
                          Finanzierungs­partner weitergibt.{" "}
                          <Link
                            href="/kaufcheck/datenschutz"
                            prefetch={false}
                            className="font-medium text-primary hover:underline"
                            target="_blank"
                          >
                            Datenschutz­hinweis
                          </Link>
                          . <span className="text-destructive">*</span>
                        </Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newsletter"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <div className="flex items-start gap-3 rounded-md p-1">
                        <FormControl>
                          <Checkbox
                            id="newsletter"
                            checked={field.value}
                            onCheckedChange={(v) => field.onChange(!!v)}
                          />
                        </FormControl>
                        <Label
                          htmlFor="newsletter"
                          className="text-sm font-normal leading-snug"
                        >
                          Newsletter mit Immobilien-Tipps abonnieren (optional)
                        </Label>
                      </div>
                    </FormItem>
                  )}
                />

                {status === "error" && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden
                    />
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">
                        Absenden hat nicht funktioniert.
                      </p>
                      <p className="text-xs opacity-90">
                        {errorMsg ||
                          "Bitte Verbindung prüfen und erneut versuchen."}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => form.handleSubmit(onSubmit)()}
                    >
                      Erneut senden
                    </Button>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    disabled={status === "submitting"}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    disabled={status === "submitting"}
                    className="min-w-[9rem]"
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 className="animate-spin" aria-hidden />
                        Wird gesendet …
                      </>
                    ) : (
                      <>
                        <CalendarCheck aria-hidden />
                        {ctaLabel}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--success)]/15 text-[color:var(--success)]">
        <CheckCircle2 className="h-8 w-8" aria-hidden />
      </div>
      <DialogHeader className="sm:text-center">
        <DialogTitle className="text-center">
          Ein Berater meldet sich binnen 24 Stunden
        </DialogTitle>
        <DialogDescription className="text-center">
          Wir haben Ihre Anfrage erhalten. Sie bekommen zusätzlich eine
          Bestätigung per E-Mail – bitte auch den Spam-Ordner prüfen.
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-center">
        <Button type="button" onClick={onClose}>
          Schließen
        </Button>
      </div>
    </div>
  );
}
