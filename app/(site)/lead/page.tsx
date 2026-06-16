"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ChevronLeft, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { leadFormSchema, type LeadForm } from "@/lib/schemas";
import { useCheckStore } from "@/lib/store";

export default function LeadPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Lädt …</div>}>
      <LeadInner />
    </Suspense>
  );
}

function LeadInner() {
  const router = useRouter();
  const params = useSearchParams();
  const typ = params.get("typ") === "immobilie" ? "immobilie" : "finanzierung";

  const data = useCheckStore((s) => s.data);
  const result = useCheckStore((s) => s.result);

  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<LeadForm>({
    resolver: zodResolver(leadFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      vorname: "",
      nachname: "",
      email: "",
      telefon: "",
      kontaktzeit: "" as LeadForm["kontaktzeit"],
      einwilligung: false,
      newsletter: false,
    },
  });

  async function onSubmit(values: LeadForm) {
    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: values,
          typ,
          check: result
            ? {
                status: result.status,
                maxKaufpreis: result.maxKaufpreis,
                monatlicheRate: result.monatlicheRate,
                ekQuote: result.ekQuote,
                eigenkapital: result.eigenkapital,
                effektivNetto: result.effektivNetto,
                umschuldung: result.umschuldung,
                raten: data.raten,
                bonus: data.bonus,
                bonusPeriode: data.bonusPeriode,
                alter: data.alter,
                assets: data.assets,
                bundesland: data.bundesland,
                immobilienart: data.immobilienart,
                objektStatus: data.objektStatus,
                nutzung: data.nutzung,
                kinderAlter: data.kinderAlter,
              }
            : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      router.push("/lead/danke");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setStatus("error");
    }
  }

  const einwilligungText =
    typ === "finanzierung"
      ? "Ich stimme zu, dass meine Daten zur Finanzierungsberatung an unabhängige Bank-Partner (z. B. ING, BAWAG, Raiffeisen) weitergegeben werden. Widerruf jederzeit möglich."
      : "Ich stimme zu, dass meine Daten an regionale Immobilien-Makler weitergegeben werden, die mir passende Objekte vorschlagen. Widerruf jederzeit möglich.";

  const headline =
    typ === "finanzierung"
      ? "Kostenlose Finanzierungsberatung anfragen"
      : "Passende Objekte vorgeschlagen bekommen";
  const sub =
    typ === "finanzierung"
      ? "Ein unabhängiger Finanzierungs-Partner meldet sich binnen 24 Stunden."
      : "Ein regionaler Makler-Partner meldet sich mit passenden Vorschlägen.";

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/check/ergebnis"
          prefetch={false}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Zurück zum Ergebnis
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {headline}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 rounded-lg border bg-card p-5 shadow-sm"
            noValidate
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
                  <FormLabel>E-Mail</FormLabel>
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
                  <FormLabel>Telefonnummer</FormLabel>
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
                      <SelectItem value="vormittag">Vormittag (8–12)</SelectItem>
                      <SelectItem value="nachmittag">Nachmittag (12–17)</SelectItem>
                      <SelectItem value="abend">Abend (17–20)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="einwilligung"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-3">
                    <FormControl>
                      <Checkbox
                        id="einwilligung"
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(!!v)}
                      />
                    </FormControl>
                    <Label
                      htmlFor="einwilligung"
                      className="text-sm font-normal leading-snug"
                    >
                      {einwilligungText}{" "}
                      <Link
                        href="/datenschutz"
                        target="_blank"
                        prefetch={false}
                        className="font-medium text-primary hover:underline"
                      >
                        Datenschutzhinweis
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
                  <div className="flex items-start gap-3 p-1">
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
                      Newsletter mit Marktinfos und Förderungs-Tipps für meine
                      Region (optional)
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
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  Absenden hat nicht funktioniert. {errorMsg ?? ""} Bitte erneut
                  versuchen.
                </span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Wird gesendet …
                </>
              ) : (
                <>
                  <ShieldCheck aria-hidden />
                  Anfrage absenden
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>

    </main>
  );
}
