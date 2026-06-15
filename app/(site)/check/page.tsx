"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { AnalyseOverlay } from "@/components/analyse-overlay";

const STEPS = [{ label: "Einkommen" }, { label: "Vermögen" }, { label: "Ihr Ziel" }];

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
  { key: "sparguthaben", label: "Spar- & Bausparguthaben", examples: "Sparbuch, Tagesgeld, Bausparvertrag", hint: "Auch ein laufender Bausparvertrag zählt voll.", faktor: 1.0 },
  { key: "wertpapiere", label: "Wertpapiere, ETFs, Aktien", examples: "Depot, Fondsanteile, Anleihen", hint: "Banken zählen ca. 70 % des Depotwerts an.", faktor: 0.7 },
  { key: "edelmetalle", label: "Gold & Edelmetalle", examples: "Münzen, Barren, Silber", hint: "Physisches Gold zählt mit ca. 70 %.", faktor: 0.7 },
  { key: "crypto", label: "Krypto (Bitcoin, ETH …)", examples: "Wallet, Börsen-Guthaben", hint: "Viele Banken akzeptieren Krypto (noch) nicht — wir rechnen sehr konservativ mit 50 %.", faktor: 0.5 },
  { key: "lebensversicherung", label: "Lebensversicherung", examples: "Aktueller Rückkaufswert", hint: "Der Rückkaufswert zählt zu 100 %, nicht die Ablaufleistung.", faktor: 1.0 },
  { key: "schenkung", label: "Schenkung / Erbe", examples: "Zugesagte Beträge von Familie", hint: "Auch eine schriftlich zugesagte Schenkung zählt.", faktor: 1.0 },
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
        className={suffix ? "pr-14" : undefined}
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
  return (
    <div className="space-y-2 rounded-lg border bg-surface p-3 shadow-sm sm:p-4">
      <div>
        <p className="text-sm font-semibold">{meta.label}</p>
        <p className="text-xs text-muted-foreground">{meta.examples}</p>
      </div>
      <NumInput value={value} onChange={onChange} min={0} max={5_000_000} step={1000} suffix="€" placeholder="0" />
      {value > 0 ? (
        <p className="text-xs font-medium text-success">
          ✓ Zählt als Eigenkapital: {formatEuro(counted)}
          {meta.faktor < 1 ? ` (${Math.round(meta.faktor * 100)} %)` : ""}
        </p>
      ) : (
        <p className="text-xs italic text-muted-foreground">💡 {meta.hint}</p>
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

  const [analysiert, setAnalysiert] = useState(false);
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
        nettoPeriode: data.nettoPeriode,
        bonusJahr: data.bonusJahr,
        raten: data.raten,
      }).success;
    }
    if (step === 1) return step2Schema.safeParse(assets).success;
    return step3Schema.safeParse({
      bundesland: data.bundesland,
      immobilienart: data.immobilienart,
      objektStatus: data.objektStatus,
      alter: data.alter,
      erwachsene: data.erwachsene,
      kinderAlter: data.kinderAlter ?? [],
    }).success;
  }, [step, data, assets]);

  const progress = ((step + 1) / STEPS.length) * 100;

  function goNext() {
    if (!valid) return;
    if (step < 2) {
      setStep((step + 1) as 0 | 1 | 2);
      return;
    }
    // letzter Schritt → berechnen + Analyse-Overlay zeigen
    setResult(berechne(data as CheckInput));
    setAnalysiert(true);
  }
  function goBack() {
    if (step === 0) {
      router.push("/");
      return;
    }
    setStep((step - 1) as 0 | 1 | 2);
  }

  if (analysiert) {
    return (
      <AnalyseOverlay onComplete={() => router.push("/check/ergebnis")} />
    );
  }

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
            data-step={step}
            key={step}
            className="animate-in fade-in-0 space-y-5 px-5 py-6 duration-300 sm:px-8 sm:py-8"
          >
            {step === 0 && <Step1 />}
            {step === 1 && (
              <Step2 assets={assets} updateAssets={updateAssets} ekTotal={ek.total} />
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
            {step === 2 ? "Auswertung starten" : "Weiter"}
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
  const periode = data.nettoPeriode ?? "monat";
  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight">
        Einkommen des Haushalts
      </h2>
      <p className="text-sm text-muted-foreground">
        Netto. Bei Paaren: <strong>beide</strong> Einkommen zusammen.
      </p>

      <div className="space-y-2">
        <Label htmlFor="netto">Nettohaushalts-Einkommen</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <NumInput
              id="netto"
              value={data.netto}
              onChange={(n) => update({ netto: n })}
              min={0}
              max={12_000_000}
              step={periode === "jahr" ? 1000 : 50}
              suffix="€"
              placeholder={periode === "jahr" ? "z. B. 58.000" : "z. B. 3.500"}
            />
          </div>
          <div className="inline-flex shrink-0 overflow-hidden rounded-md border">
            {(["monat", "jahr"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => update({ nettoPeriode: p })}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  periode === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface hover:bg-muted"
                }`}
              >
                {p === "monat" ? "/ Monat" : "/ Jahr"}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {periode === "jahr"
            ? "Jahresnetto inkl. 13./14. Gehalt — wir rechnen auf den Monatsschnitt um."
            : "Monatliches Netto auf dem Konto."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bonus">Variables Gehalt / Bonus pro Jahr</Label>
        <NumInput
          id="bonus"
          value={data.bonusJahr}
          onChange={(n) => update({ bonusJahr: n })}
          min={0}
          max={5_000_000}
          step={500}
          suffix="€"
          placeholder="z. B. 6.000 (optional)"
        />
        <p className="text-xs text-muted-foreground">
          Provisionen, Boni, Überstundenpauschalen. Wird konservativ zu 50 %
          angerechnet — so wie Banken es tun.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="raten">Bestehende Kreditraten pro Monat</Label>
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
          Mehr zählt als Sie denken — auch{" "}
          <strong>Wertpapiere, Krypto und bestehende Immobilien</strong>{" "}
          gelten als Eigenkapital.
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

      <div className="space-y-3 rounded-lg border-2 border-primary/30 bg-primary/5 p-3 shadow-sm sm:p-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
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
          <NumInput id="immo-wert" value={assets.immobilie_wert} onChange={(n) => updateAssets({ immobilie_wert: n })} min={0} max={10_000_000} step={5000} suffix="€" placeholder="z. B. 350.000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="immo-schuld">Restschuld (laufender Kredit darauf)</Label>
          <NumInput id="immo-schuld" value={assets.immobilie_restschuld} onChange={(n) => updateAssets({ immobilie_restschuld: n })} min={0} max={10_000_000} step={5000} suffix="€" placeholder="0" />
        </div>
        {assets.immobilie_wert > 0 ? (
          <p className="text-xs font-medium text-success">
            ✓ Zusätzliches Eigenkapital:{" "}
            {formatEuro(Math.max(0, assets.immobilie_wert * 0.7 - assets.immobilie_restschuld))}{" "}
            <span className="font-normal text-muted-foreground">
              (70 % vom Wert − Restschuld)
            </span>
          </p>
        ) : (
          <p className="text-xs italic text-muted-foreground">
            💡 70 % des Werts minus Restschuld werden angerechnet.
          </p>
        )}
      </div>

      <div className="sticky bottom-2 rounded-lg border-2 border-success/40 bg-success/5 p-4 text-center sm:static">
        <p className="text-xs font-medium uppercase tracking-wide text-success">
          Ihr Gesamt-Eigenkapital
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-success">
          {formatEuro(ekTotal)}
        </p>
      </div>
    </>
  );
}

function Step3() {
  const data = useCheckStore((s) => s.data);
  const update = useCheckStore((s) => s.update);
  const kinderAlter = data.kinderAlter ?? [];

  function setKinderAnzahl(n: number) {
    const next = [...kinderAlter];
    while (next.length < n) next.push(0);
    next.length = n;
    update({ kinderAlter: next });
  }
  function setKindAlter(idx: number, alter: number) {
    const next = [...kinderAlter];
    next[idx] = alter;
    update({ kinderAlter: next });
  }

  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight">
        Ihr Ziel &amp; ein paar Eckdaten
      </h2>

      {/* Objekt-Status */}
      <div className="space-y-2">
        <Label>Haben Sie schon ein konkretes Objekt im Blick?</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { v: "im_auge", Icon: Building2, title: "Ja, ich habe ein Objekt", sub: "Ich brauche v. a. die Finanzierung" },
            { v: "suche_noch", Icon: Search, title: "Nein, ich suche noch", sub: "Schlagt mir passende Objekte vor" },
          ].map(({ v, Icon, title, sub }) => {
            const active = data.objektStatus === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => update({ objektStatus: v as CheckInput["objektStatus"] })}
                className={`flex items-start gap-3 rounded-lg border bg-surface p-4 text-left shadow-sm transition-colors ${
                  active ? "border-primary ring-2 ring-primary/20" : "hover:bg-muted/40"
                }`}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-muted-foreground">{sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Wunsch-Region (Bundesland)</Label>
        <Select
          value={data.bundesland || undefined}
          onValueChange={(v) => update({ bundesland: v as CheckInput["bundesland"] })}
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
                className={`rounded-md border bg-surface p-3 text-sm font-medium shadow-sm transition-colors ${
                  active ? "border-primary ring-2 ring-primary/20" : "hover:bg-muted/40"
                }`}
              >
                {art === "wohnung" ? "Wohnung" : "Haus"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="alter">Alter Hauptantragsteller:in</Label>
        <NumInput id="alter" value={data.alter} onChange={(n) => update({ alter: n })} min={18} max={75} suffix="Jahre" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="erw">Erwachsene im Haushalt</Label>
          <NumInput id="erw" value={data.erwachsene} onChange={(n) => update({ erwachsene: n })} min={1} max={4} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kinder-anzahl">Anzahl Kinder</Label>
          <NumInput
            id="kinder-anzahl"
            value={kinderAlter.length}
            onChange={(n) => setKinderAnzahl(Math.min(8, Math.max(0, n)))}
            min={0}
            max={8}
          />
        </div>
      </div>

      {kinderAlter.length > 0 ? (
        <div className="space-y-2">
          <Label>Alter der Kinder</Label>
          <div className="flex flex-wrap gap-2">
            {kinderAlter.map((alter, idx) => (
              <div key={idx} className="relative w-24">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={27}
                  value={alter === 0 ? "" : alter}
                  placeholder={`Kind ${idx + 1}`}
                  onChange={(e) =>
                    setKindAlter(idx, e.target.value === "" ? 0 : Number(e.target.value))
                  }
                  className="pr-7"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  J.
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Hilft, Ihren Lebensbedarf realistisch einzuschätzen.
          </p>
        </div>
      ) : null}
    </>
  );
}
