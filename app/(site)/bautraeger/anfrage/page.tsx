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
import { useBautraegerStore } from "@/lib/bautraeger-store";
import {
  bauStep1Schema,
  bauStep2Schema,
  bauStep3Schema,
  klassifiziere,
  PARTNERWEG_LABEL,
  type BautraegerInput,
} from "@/lib/bautraeger";

const STEPS = [{ label: "Projekt" }, { label: "Finanzierung" }, { label: "Kontakt" }];

const BUNDESLAENDER = [
  { value: "wien", label: "Wien" },
  { value: "noe", label: "Niederösterreich" },
  { value: "ooe", label: "Oberösterreich" },
  { value: "sbg", label: "Salzburg" },
  { value: "tirol", label: "Tirol" },
  { value: "vbg", label: "Vorarlberg" },
  { value: "stmk", label: "Steiermark" },
  { value: "ktn", label: "Kärnten" },
  { value: "bgld", label: "Burgenland" },
];

const PROJEKTARTEN = [
  { v: "neubau_wohnen", label: "Neubau Wohnen", sub: "Wohnungen / Reihenhäuser" },
  { v: "sanierung", label: "Sanierung", sub: "Bestand / Dachausbau" },
  { v: "gewerbe", label: "Gewerbe", sub: "Büro / Handel / Hotel" },
  { v: "mixed", label: "Mischnutzung", sub: "Wohnen + Gewerbe" },
] as const;

const PHASEN = [
  { v: "grundstueck", label: "Grundstück gesichert" },
  { v: "baugenehmigung", label: "Baugenehmigung da" },
  { v: "bau_laeuft", label: "Bau läuft" },
  { v: "vertrieb", label: "In Vertrieb" },
] as const;

const KAPITALARTEN = [
  { v: "mezzanine", label: "Mezzanine", sub: "Nachrangkapital" },
  { v: "eigenkapital", label: "Eigenkapital-Partner", sub: "Echte Beteiligung" },
  { v: "gesamt", label: "Gesamtfinanzierung", sub: "Senior + Nachrang" },
  { v: "egal", label: "Offen / beraten", sub: "Bin flexibel" },
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
        €
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
      <span className="text-sm font-semibold">{title}</span>
      {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
    </motion.button>
  );
}

export default function BautraegerAnfrage() {
  const router = useRouter();
  const step = useBautraegerStore((s) => s.step);
  const data = useBautraegerStore((s) => s.data);
  const setStep = useBautraegerStore((s) => s.setStep);
  const update = useBautraegerStore((s) => s.update);
  const setResult = useBautraegerStore((s) => s.setResult);

  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const vorschau = useMemo(
    () =>
      klassifiziere({
        volumen: data.volumen ?? 0,
        eigenkapital: data.eigenkapital ?? 0,
        bankzusage: data.bankzusage ?? 0,
        zusatzkapital: data.zusatzkapital ?? 0,
      }),
    [data.volumen, data.eigenkapital, data.bankzusage, data.zusatzkapital]
  );

  const valid = useMemo(() => {
    if (step === 0) return bauStep1Schema.safeParse(data).success;
    if (step === 1) return bauStep2Schema.safeParse(data).success;
    return bauStep3Schema.safeParse(data).success;
  }, [step, data]);

  const fehlt = useMemo(() => {
    if (valid) return null;
    if (step === 0) {
      const o: string[] = [];
      if (!data.projektart) o.push("Projektart");
      if (!data.bundesland) o.push("Bundesland");
      if (!data.ort || data.ort.trim().length < 2) o.push("Ort");
      if (!data.phase) o.push("Projektphase");
      return o.length ? `Bitte noch angeben: ${o.join(", ")}.` : "Bitte Eingaben prüfen.";
    }
    if (step === 1) {
      if (!data.volumen || data.volumen < 100_000) return "Bitte Projektvolumen angeben.";
      if (!data.zusatzkapital || data.zusatzkapital < 1) return "Bitte benötigtes Zusatzkapital angeben.";
      if (!data.kapitalart) return "Bitte gewünschte Kapitalart wählen.";
      return "Bitte Eingaben prüfen.";
    }
    return "Bitte Firma, Ansprechpartner:in, E-Mail, Telefon und Einwilligung ausfüllen.";
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
      router.push("/bautraeger");
      return;
    }
    setStep((step - 1) as 0 | 1 | 2);
  }

  async function submit() {
    setStatus("submitting");
    setErrorMsg(null);
    const result = klassifiziere({
      volumen: data.volumen ?? 0,
      eigenkapital: data.eigenkapital ?? 0,
      bankzusage: data.bankzusage ?? 0,
      zusatzkapital: data.zusatzkapital ?? 0,
    });
    setResult(result);
    try {
      const res = await fetch("/api/bautraeger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      router.push("/bautraeger/danke");
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
                <h2 className="text-2xl font-semibold tracking-tight">Ihr Projekt</h2>
                <div className="space-y-2">
                  <Label>Projektart</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {PROJEKTARTEN.map((p) => (
                      <Choice
                        key={p.v}
                        active={data.projektart === p.v}
                        onClick={() => update({ projektart: p.v as BautraegerInput["projektart"] })}
                        title={p.label}
                        sub={p.sub}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Bundesland</Label>
                    <Select
                      value={data.bundesland || undefined}
                      onValueChange={(v) => update({ bundesland: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Bitte wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUNDESLAENDER.map((b) => (
                          <SelectItem key={b.value} value={b.value}>
                            {b.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ort">Ort / Gemeinde</Label>
                    <Input
                      id="ort"
                      value={data.ort ?? ""}
                      placeholder="z. B. Graz"
                      onChange={(e) => update({ ort: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Projektphase</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {PHASEN.map((p) => (
                      <Choice
                        key={p.v}
                        active={data.phase === p.v}
                        onClick={() => update({ phase: p.v as BautraegerInput["phase"] })}
                        title={p.label}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-2xl font-semibold tracking-tight">Finanzierung</h2>
                <div className="space-y-2">
                  <Label htmlFor="volumen">Projektvolumen (Gesamtinvestition)</Label>
                  <NumInput id="volumen" value={data.volumen} onChange={(n) => update({ volumen: n })} step={50_000} placeholder="z. B. 8.000.000" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ek">Vorhandenes Eigenkapital</Label>
                    <NumInput id="ek" value={data.eigenkapital} onChange={(n) => update({ eigenkapital: n })} step={50_000} placeholder="z. B. 1.500.000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank">Zugesagte Bankfinanzierung</Label>
                    <NumInput id="bank" value={data.bankzusage} onChange={(n) => update({ bankzusage: n })} step={50_000} placeholder="z. B. 5.000.000" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zk">Benötigtes Zusatzkapital</Label>
                  <NumInput id="zk" value={data.zusatzkapital} onChange={(n) => update({ zusatzkapital: n })} step={50_000} placeholder="z. B. 2.000.000" />
                </div>
                <div className="space-y-2">
                  <Label>Gewünschte Kapitalart</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {KAPITALARTEN.map((k) => (
                      <Choice
                        key={k.v}
                        active={data.kapitalart === k.v}
                        onClick={() => update({ kapitalart: k.v as BautraegerInput["kapitalart"] })}
                        title={k.label}
                        sub={k.sub}
                      />
                    ))}
                  </div>
                </div>
                {data.zusatzkapital && data.zusatzkapital > 0 ? (
                  <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 text-sm">
                    <p className="font-semibold text-primary">{PARTNERWEG_LABEL[vorschau.weg].titel}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {PARTNERWEG_LABEL[vorschau.weg].beschreibung}
                    </p>
                    {data.volumen && data.volumen > 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        EK-Quote: <strong className="text-foreground">{Math.round(vorschau.ekQuote * 100)} %</strong>
                        {vorschau.ekFlag === "knapp" ? " — unter 15 %, Geldgeber sehen das kritisch." : " — solide."}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-2xl font-semibold tracking-tight">Kontakt</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firma">Firma</Label>
                    <Input id="firma" value={data.firma ?? ""} onChange={(e) => update({ firma: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ap">Ansprechpartner:in</Label>
                    <Input id="ap" autoComplete="name" value={data.ansprechpartner ?? ""} onChange={(e) => update({ ansprechpartner: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input id="email" type="email" inputMode="email" autoComplete="email" value={data.email ?? ""} onChange={(e) => update({ email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tel">Telefon</Label>
                    <Input id="tel" type="tel" inputMode="tel" autoComplete="tel" value={data.telefon ?? ""} onChange={(e) => update({ telefon: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="web">Website (optional)</Label>
                  <Input id="web" value={data.website ?? ""} placeholder="https://" onChange={(e) => update({ website: e.target.value })} />
                </div>
                <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-3">
                  <Checkbox
                    id="einw"
                    checked={!!data.einwilligung}
                    onCheckedChange={(v) => update({ einwilligung: !!v })}
                  />
                  <Label htmlFor="einw" className="text-sm font-normal leading-snug">
                    Ich stimme zu, dass meine Angaben zur Finanzierungsanbahnung an
                    passende Kapitalpartner (Crowdinvesting-Plattformen, Mezzanine-
                    bzw. Bankpartner) weitergegeben werden. Widerruf jederzeit
                    möglich.{" "}
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
              Zurück
            </Button>
            <Button type="button" size="lg" disabled={!valid || status === "submitting"} onClick={goNext}>
              {status === "submitting" ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Wird gesendet …
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
            <p role="status" className="text-right text-xs text-muted-foreground">
              {fehlt}
            </p>
          ) : null}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          immoampel vermittelt Kontakte — keine Finanzierungs- oder Anlageberatung.
        </p>
      </div>
    </main>
  );
}
