"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCheckStore } from "@/lib/store";
import {
  berechne,
  eigenkapitalAus,
  emptyAssets,
  formatEuro,
  type Assets,
  type CheckInput,
} from "@/lib/calc";
import { step1Schema, step2Schema, step3Schema } from "@/lib/schemas";

const STEPS = [
  { label: "Einkommen" },
  { label: "Vermögen" },
  { label: "Wunschimmobilie" },
];

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

interface AssetMeta {
  key: keyof Assets;
  label: string;
  examples: string;
  hint: string;
  faktor: number;
}

const ASSET_CARDS: AssetMeta[] = [
  {
    key: "sparguthaben",
    label: "Spar- & Bausparguthaben",
    examples: "Sparbuch, Tagesgeld, Bausparvertrag",
    hint: "Tipp: Auch ein Bausparvertrag mit aktueller Sparphase zählt voll.",
    faktor: 1.0,
  },
  {
    key: "wertpapiere",
    label: "Wertpapiere, ETFs, Aktien",
    examples: "Depot, Fondsanteile, Anleihen",
    hint: "Banken zählen ca. 70 % des aktuellen Depotwerts an.",
    faktor: 0.7,
  },
  {
    key: "edelmetalle",
    label: "Gold & Edelmetalle",
    examples: "Münzen, Barren, Silber",
    hint: "Physisches Gold wird mit ca. 70 % angerechnet.",
    faktor: 0.7,
  },
  {
    key: "lebensversicherung",
    label: "Lebensversicherung",
    examples: "Aktueller Rückkaufswert",
    hint: "Der Rückkaufswert zählt zu 100 %. Nicht die garantierte Ablaufleistung!",
    faktor: 1.0,
  },
  {
    key: "schenkung",
    label: "Schenkung / Erbe",
    examples: "Zugesagte Beträge von Familie",
    hint: "Auch eine schriftlich zugesagte Schenkung Ihrer Eltern zählt.",
    faktor: 1.0,
  },
];

function NumInput({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  placeholder,
}: {
  id?: string;
  value: number | undefined;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={value === 0 ? "" : (value ?? "")}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value === "" ? 0 : Number(e.target.value))
        }
        className={suffix ? "pr-12" : undefined}
      />
      {suffix ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

function AssetCard({
  meta,
  value,
  onChange,
}: {
  meta: AssetMeta;
  value: number;
  onChange: (n: number) => void;
}) {
  const counted = value * meta.faktor;
  const isWeighted = meta.faktor < 1;
  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4 shadow-sm space-y-2">
      <div>
        <p className="text-sm font-semibold">{meta.label}</p>
        <p className="text-xs text-muted-foreground">{meta.examples}</p>
      </div>
      <NumInput
        value={value}
        onChange={onChange}
        min={0}
        max={5_000_000}
        step={1000}
        suffix="€"
        placeholder="0"
      />
      {value > 0 ? (
        <p className="text-xs font-medium text-[color:var(--success)]">
          ✓ Zählt als Eigenkapital: {formatEuro(counted)}
          {isWeighted ? ` (${Math.round(meta.faktor * 100)} %)` : ""}
        </p>
      ) : (
        <p className="text-xs italic text-muted-foreground">💡 {meta.hint}</p>
      )}
    </div>
  );
}

function ImmobilieCard({
  wert,
  restschuld,
  onWert,
  onRestschuld,
}: {
  wert: number;
  restschuld: number;
  onWert: (n: number) => void;
  onRestschuld: (n: number) => void;
}) {
  const counted = Math.max(0, wert * 0.7 - restschuld);
  return (
    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3 sm:p-4 shadow-sm space-y-3">
      <div>
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          Bestehende Immobilie
        </p>
        <p className="text-xs text-muted-foreground">
          Eine vorhandene Wohnung oder Haus kann als Sicherheit dienen — viele
          wissen das nicht!
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="immo-wert">Aktueller Verkehrswert</Label>
        <NumInput
          id="immo-wert"
          value={wert}
          onChange={onWert}
          min={0}
          max={10_000_000}
          step={5_000}
          suffix="€"
          placeholder="z. B. 350.000"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="immo-schuld">Restschuld (laufender Kredit darauf)</Label>
        <NumInput
          id="immo-schuld"
          value={restschuld}
          onChange={onRestschuld}
          min={0}
          max={10_000_000}
          step={5_000}
          suffix="€"
          placeholder="0"
        />
      </div>
      {wert > 0 ? (
        <p className="text-xs font-medium text-[color:var(--success)]">
          ✓ Zusätzliches Eigenkapital: {formatEuro(counted)}{" "}
          <span className="text-muted-foreground font-normal">
            (70 % vom Wert − Restschuld)
          </span>
        </p>
      ) : (
        <p className="text-xs italic text-muted-foreground">
          💡 70 % des Werts minus Restschuld werden angerechnet.
        </p>
      )}
    </div>
  );
}

export default function CheckPage() {
  const router = useRouter();
  const step = useCheckStore((s) => s.step);
  const data = useCheckStore((s) => s.data);
  const setStep = useCheckStore((s) => s.setStep);
  const updateAssets = useCheckStore((s) => s.updateAssets);
  const setResult = useCheckStore((s) => s.setResult);

  const assets = data.assets ?? emptyAssets();
  const ek = useMemo(() => eigenkapitalAus(assets), [assets]);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(
      "[data-step] input, [data-step] [role=combobox]"
    );
    el?.focus({ preventScroll: true });
  }, [step]);

  const valid = useMemo(() => {
    if (step === 0) {
      return step1Schema.safeParse({
        netto: data.netto,
        raten: data.raten,
        fix: data.fix,
      }).success;
    }
    if (step === 1) {
      return step2Schema.safeParse(assets).success;
    }
    return step3Schema.safeParse({
      bundesland: data.bundesland,
      immobilienart: data.immobilienart,
      wunschKaufpreis: data.wunschKaufpreis,
      alter: data.alter,
      erwachsene: data.erwachsene,
      kinder: data.kinder,
    }).success;
  }, [step, data, assets]);

  const progress = ((step + 1) / STEPS.length) * 100;

  function goNext() {
    if (!valid) return;
    if (step < 2) {
      setStep((step + 1) as 0 | 1 | 2);
      return;
    }
    setResult(berechne(data as CheckInput));
    router.push("/check/ergebnis");
  }
  function goBack() {
    if (step === 0) {
      router.push("/");
      return;
    }
    setStep((step - 1) as 0 | 1 | 2);
  }

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-10">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Schritt {step + 1} von {STEPS.length}: {STEPS[step].label}</span>
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
            data-step={step}
            key={step}
            className="space-y-5 px-5 py-6 sm:px-8 sm:py-8 animate-in fade-in-0 duration-300"
          >
            {step === 0 && <Step1 />}
            {step === 1 && (
              <Step2
                assets={assets}
                updateAssets={updateAssets}
                ekTotal={ek.total}
              />
            )}
            {step === 2 && <Step3 />}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" size="lg" onClick={goBack}>
            <ArrowLeft className="mr-1" aria-hidden />
            Zurück
          </Button>
          <Button type="button" size="lg" disabled={!valid} onClick={goNext}>
            {step === 2 ? "Ergebnis ansehen" : "Weiter"}
            <ArrowRight className="ml-1" aria-hidden />
          </Button>
        </div>
      </div>

    </main>
  );
}

function Step1() {
  const data = useCheckStore((s) => s.data);
  const update = useCheckStore((s) => s.update);
  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight">
        Einkommen &amp; laufende Kosten
      </h2>
      <p className="text-sm text-muted-foreground">
        Monatlich, netto. Bei Paaren: <strong>beide</strong> Einkommen
        zusammenrechnen.
      </p>
      <div className="space-y-2">
        <Label htmlFor="netto">Nettohaushalts-Einkommen</Label>
        <NumInput
          id="netto"
          value={data.netto}
          onChange={(n) => update({ netto: n })}
          min={0}
          max={50_000}
          step={10}
          suffix="€"
          placeholder="z. B. 3.500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="raten">Bestehende Kreditraten</Label>
        <NumInput
          id="raten"
          value={data.raten}
          onChange={(n) => update({ raten: n })}
          min={0}
          max={20_000}
          step={10}
          suffix="€"
          placeholder="0"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fix">Sonstige Fixkosten</Label>
        <NumInput
          id="fix"
          value={data.fix}
          onChange={(n) => update({ fix: n })}
          min={0}
          max={20_000}
          step={10}
          suffix="€"
          placeholder="0"
        />
      </div>
    </>
  );
}

function Step2({
  assets,
  updateAssets,
  ekTotal,
}: {
  assets: Assets;
  updateAssets: (p: Partial<Assets>) => void;
  ekTotal: number;
}) {
  return (
    <>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Ihr Vermögen</h2>
        <p className="text-sm text-muted-foreground">
          Mehr zählt als Sie denken — Banken rechnen auch{" "}
          <strong>Wertpapiere, Lebens­versicherungen und bestehende Immobilien</strong>{" "}
          als Eigenkapital an.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ASSET_CARDS.map((meta) => (
          <AssetCard
            key={meta.key}
            meta={meta}
            value={assets[meta.key] as number}
            onChange={(n) => updateAssets({ [meta.key]: n } as Partial<Assets>)}
          />
        ))}
      </div>

      <ImmobilieCard
        wert={assets.immobilie_wert}
        restschuld={assets.immobilie_restschuld}
        onWert={(n) => updateAssets({ immobilie_wert: n })}
        onRestschuld={(n) => updateAssets({ immobilie_restschuld: n })}
      />

      <div className="sticky bottom-2 sm:static rounded-lg border-2 border-[color:var(--success)]/40 bg-[color:var(--success)]/5 p-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--success)]">
          Ihr Gesamt-Eigenkapital
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-[color:var(--success)]">
          {formatEuro(ekTotal)}
        </p>
      </div>
    </>
  );
}

function Step3() {
  const data = useCheckStore((s) => s.data);
  const update = useCheckStore((s) => s.update);
  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight">
        Wunschimmobilie &amp; Eckdaten
      </h2>
      <p className="text-sm text-muted-foreground">
        Wohin soll&apos;s gehen?
      </p>
      <div className="space-y-2">
        <Label>Bundesland</Label>
        <Select
          value={data.bundesland || undefined}
          onValueChange={(v) =>
            update({ bundesland: v as CheckInput["bundesland"] })
          }
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
        <Label>Immobilienart</Label>
        <div className="grid grid-cols-2 gap-3">
          {(["wohnung", "haus"] as const).map((art) => {
            const active = data.immobilienart === art;
            return (
              <button
                key={art}
                type="button"
                onClick={() => update({ immobilienart: art })}
                className={`rounded-md border bg-background p-3 text-sm font-medium shadow-sm transition-colors ${
                  active
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:bg-accent/40"
                }`}
              >
                {art === "wohnung" ? "Wohnung" : "Haus"}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="kp">Wunsch-Kaufpreis</Label>
          <span className="text-sm font-semibold tabular-nums">
            {formatEuro(data.wunschKaufpreis ?? 250_000)}
          </span>
        </div>
        <Slider
          id="kp"
          min={50_000}
          max={2_000_000}
          step={10_000}
          value={[data.wunschKaufpreis ?? 250_000]}
          onValueChange={([v]) => update({ wunschKaufpreis: v })}
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{formatEuro(50_000)}</span>
          <span>{formatEuro(2_000_000)}</span>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="alter">Alter Hauptantragsteller:in</Label>
        <NumInput
          id="alter"
          value={data.alter}
          onChange={(n) => update({ alter: n })}
          min={18}
          max={75}
          suffix="Jahre"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="erw">Erwachsene im Haushalt</Label>
          <NumInput
            id="erw"
            value={data.erwachsene}
            onChange={(n) => update({ erwachsene: n })}
            min={1}
            max={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kinder">Kinder</Label>
          <NumInput
            id="kinder"
            value={data.kinder}
            onChange={(n) => update({ kinder: n })}
            min={0}
            max={8}
          />
        </div>
      </div>
    </>
  );
}
