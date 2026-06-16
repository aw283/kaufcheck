"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAnlegerStore } from "@/lib/anleger-store";
import {
  anlageStep1Schema,
  anlageStep2Schema,
  anlageStep3Schema,
  empfiehl,
  MODELL_INFO,
  type AnlegerInput,
} from "@/lib/anleger";

const STEPS = [{ label: "Profil" }, { label: "Region" }, { label: "Kontakt" }];

const BUNDESLAENDER = [
  { value: "wien", label: "Wien" },
  { value: "noe", label: "Nieder&ouml;sterreich" },
  { value: "ooe", label: "Ober&ouml;sterreich" },
  { value: "sbg", label: "Salzburg" },
  { value: "tirol", label: "Tirol" },
  { value: "vbg", label: "Vorarlberg" },
  { value: "stmk", label: "Steiermark" },
  { value: "ktn", label: "K&auml;rnten" },
  { value: "bgld", label: "Burgenland" },
];

const ANLAGEZIELE = [
  { v: "steueroptimierung", label: "Steueroptimierung", sub: "Steuer sparen" },
  { v: "rendite", label: "Rendite / Cashflow", sub: "Laufende Einnahmen" },
  { v: "vermoegensaufbau", label: "Verm&ouml;gensaufbau", sub: "Langfristig aufbauen" },
  { v: "altersvorsorge", label: "Altersvorsorge", sub: "F&uuml;r sp&auml;ter absichern" },
] as const;

const HORIZONTE = [
  { v: "kurz", label: "Kurz", sub: "Unter 5 Jahre" },
  { v: "mittel", label: "Mittel", sub: "5 &ndash; 15 Jahre" },
  { v: "lang", label: "Lang", sub: "&Uuml;ber 15 Jahre" },
] as const;

const STEUERLASTEN = [
  { v: "hoch", label: "Hoch", sub: "Grenzsteuersatz 50 %" },
  { v: "mittel", label: "Mittel", sub: "Grenzsteuersatz ca. 35 &ndash; 42 %" },
  { v: "niedrig", label: "Niedrig", sub: "Unter 35 %" },
] as const;

function NumInput({
  id,
  value,
  onChange,
  step = 1000,
  placeholder,
}: {
  id?: string;
  value: number | undefined;
  onChange: (n: number) => void;
  step?: number;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={step}
        value={value === 0 ? "" : (value ?? "")}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className="pr-9"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
        &euro;
      </span>
    </div>
  );
}

function Choice({
  active,
  onClick,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onClick={onClick}
      className={`flex flex-col rounded-lg border bg-surface p-4 text-left shadow-sm transition-colors ${
        active ? "border-primary ring-2 ring-primary/20" : "hover:bg-muted/40"
      }`}
    >
      <span
        className="text-sm font-semibold"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      {sub ? (
        <span
          className="text-xs text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: sub }}
        />
      ) : null}
    </motion.button>
  );
}

export default function AnlageAnfrage() {
  const router = useRouter();
  const step = useAnlegerStore((s) => s.step);
  const data = useAnlegerStore((s) => s.data);
  const setStep = useAnlegerStore((s) => s.setStep);
  const update = useAnlegerStore((s) => s.update);
  const setResult = useAnlegerStore((s) => s.setResult);

  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live-Vorschau ab Step 1 sobald Pflichtfelder gesetzt
  const vorschau = useMemo(() => {
    if (!data.anlageziel || !data.horizont || !data.steuerlast) return null;
    return empfiehl({
      anlageziel: data.anlageziel,
      horizont: data.horizont,
      steuerlast: data.steuerlast,
      budget: data.budget ?? 0,
      finanzierung: data.finanzierung ?? false,
    });
  }, [data.anlageziel, data.horizont, data.steuerlast, data.budget, data.finanzierung]);

  const valid = useMemo(() => {
    if (step === 0) return anlageStep1Schema.safeParse(data).success;
    if (step === 1) return anlageStep2Schema.safeParse(data).success;
    return anlageStep3Schema.safeParse(data).success;
  }, [step, data]);

  const fehlt = useMemo(() => {
    if (valid) return null;
    if (step === 0) {
      const o: string[] = [];
      if (!data.anlageziel) o.push("Anlageziel");
      if (!data.horizont) o.push("Horizont");
      if (!data.steuerlast) o.push("Steuerlast");
      if (!data.budget || data.budget < 1) o.push("Budget");
      return o.length ? `Bitte noch angeben: ${o.join(", ")}.` : "Bitte Eingaben pr&uuml;fen.";
    }
    if (step === 1) {
      return "Bitte Bundesland w&auml;hlen.";
    }
    return "Bitte Name, E-Mail, Telefon und Einwilligung ausf&uuml;llen.";
  }, [valid, step, data]);

  function goNext() {
    if (!valid) return;
    if (step < 2) {
      setStep((step + 1) as 0 | 1 | 2);
      return;
    }
    void submit();
  }
  function goBack() {
    if (step === 0) {
      router.push("/anlage");
      return;
    }
    setStep((step - 1) as 0 | 1 | 2);
  }

  async function submit() {
    setStatus("submitting");
    setErrorMsg(null);
    const result = empfiehl({
      anlageziel: data.anlageziel!,
      horizont: data.horizont!,
      steuerlast: data.steuerlast!,
      budget: data.budget ?? 0,
      finanzierung: data.finanzierung ?? false,
    });
    setResult(result);
    try {
      const res = await fetch("/api/anlage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || `HTTP ${res.status}`);
      }
      router.push("/anlage/danke");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setStatus("error");
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-10">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>
              Schritt {step + 1} von {STEPS.length}: {STEPS[step].label}
            </span>
            <span className="text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card>
          <CardContent
            key={step}
            className="animate-in fade-in-0 space-y-5 px-5 py-6 duration-300 sm:px-8 sm:py-8"
          >
            {step === 0 && (
              <>
                <h2 className="text-2xl font-semibold tracking-tight">Ihr Anlegerprofil</h2>

                <div className="space-y-2">
                  <Label>Anlageziel</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {ANLAGEZIELE.map((z) => (
                      <Choice
                        key={z.v}
                        active={data.anlageziel === z.v}
                        onClick={() => update({ anlageziel: z.v as AnlegerInput["anlageziel"] })}
                        title={z.label}
                        sub={z.sub}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Anlagehorizont</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {HORIZONTE.map((h) => (
                      <Choice
                        key={h.v}
                        active={data.horizont === h.v}
                        onClick={() => update({ horizont: h.v as AnlegerInput["horizont"] })}
                        title={h.label}
                        sub={h.sub}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pers&ouml;nliche Steuerlast</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {STEUERLASTEN.map((s) => (
                      <Choice
                        key={s.v}
                        active={data.steuerlast === s.v}
                        onClick={() => update({ steuerlast: s.v as AnlegerInput["steuerlast"] })}
                        title={s.label}
                        sub={s.sub}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Verf&uuml;gbares Eigenkapital (Richtwert)</Label>
                  <NumInput
                    id="budget"
                    value={data.budget}
                    onChange={(n) => update({ budget: n })}
                    step={10_000}
                    placeholder="z. B. 80.000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Zus&auml;tzliche Fremdfinanzierung gewünscht?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Choice
                      active={data.finanzierung === true}
                      onClick={() => update({ finanzierung: true })}
                      title="Ja"
                      sub="Kredit erg&auml;nzend"
                    />
                    <Choice
                      active={data.finanzierung === false && data.finanzierung !== undefined}
                      onClick={() => update({ finanzierung: false })}
                      title="Nein"
                      sub="Nur Eigenkapital"
                    />
                  </div>
                </div>

                {/* Live-Vorschau */}
                {vorschau ? (
                  <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 text-sm">
                    <p className="font-semibold text-primary">
                      Empfehlung (Vorschau): {MODELL_INFO[vorschau.primaer].titel}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {vorschau.begruendung}
                    </p>
                    {vorschau.hinweis ? (
                      <p className="mt-2 text-xs text-[color:var(--warning)]">
                        {vorschau.hinweis}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-2xl font-semibold tracking-tight">Ihre Region</h2>
                <div className="space-y-2">
                  <Label>Bundesland</Label>
                  <Select
                    value={data.bundesland || undefined}
                    onValueChange={(v) => update({ bundesland: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bitte w&auml;hlen" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUNDESLAENDER.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          <span dangerouslySetInnerHTML={{ __html: b.label }} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Der Standort beeinflusst Marktverf&uuml;gbarkeit und steuerliche Details &mdash;
                    unser Partner kontaktiert Sie mit regionalen Angeboten.
                  </p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-2xl font-semibold tracking-tight">Kontakt</h2>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    value={data.name ?? ""}
                    placeholder="Vorname Nachname"
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={data.email ?? ""}
                      onChange={(e) => update({ email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tel">Telefon</Label>
                    <Input
                      id="tel"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={data.telefon ?? ""}
                      onChange={(e) => update({ telefon: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-3">
                  <Checkbox
                    id="einw"
                    checked={!!data.einwilligung}
                    onCheckedChange={(v) => update({ einwilligung: !!v })}
                  />
                  <Label htmlFor="einw" className="text-sm font-normal leading-snug">
                    Ich stimme zu, dass meine Angaben zur Kontaktvermittlung an
                    spezialisierte Anlageimmobilien-Partner weitergegeben werden.
                    Widerruf jederzeit m&ouml;glich.{" "}
                    <Link href="/datenschutz" target="_blank" prefetch={false} className="font-medium text-primary hover:underline">
                      Datenschutzhinweis
                    </Link>
                    . <span className="text-destructive">*</span>
                  </Label>
                </div>

                {status === "error" && (
                  <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <span>Absenden hat nicht funktioniert. {errorMsg ?? ""} Bitte erneut versuchen.</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" size="lg" onClick={goBack}>
              <ArrowLeft className="mr-1" aria-hidden />
              Zur&uuml;ck
            </Button>
            <Button type="button" size="lg" disabled={!valid || status === "submitting"} onClick={goNext}>
              {status === "submitting" ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Wird gesendet &hellip;
                </>
              ) : step === 2 ? (
                <>
                  <ShieldCheck aria-hidden />
                  Anfrage absenden
                </>
              ) : (
                <>
                  Weiter
                  <ArrowRight className="ml-1" aria-hidden />
                </>
              )}
            </Button>
          </div>
          {fehlt ? (
            <p role="status" className="text-right text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: fehlt }} />
          ) : null}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          immoampel vermittelt Kontakte &mdash; keine Steuer- oder Anlageberatung.
          Alle Angaben sind Richtwerte.
        </p>
      </div>
    </main>
  );
}
