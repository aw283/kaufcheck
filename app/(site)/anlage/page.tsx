import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, TrendingUp, Coins, Home, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MODELL_INFO } from "@/lib/anleger";

export const metadata: Metadata = {
  title: "Immobilie als Steuerhebel | immoampel",
  description:
    "Vorsorgewohnung, Bauherrenmodell oder Anlegerwohnung — wir zeigen Ihnen, welches Modell zu Ihrem Profil passt. Kostenlos, in 3 Minuten, ohne Anlageberatung.",
};

const SCHRITTE = [
  {
    Icon: TrendingUp,
    title: "1 · Profil angeben",
    text: "Anlageziel, Horizont, Steuerlast und Budget — drei Minuten, keine Unterlagen.",
  },
  {
    Icon: Coins,
    title: "2 · Modell finden",
    text: "Wir zeigen, ob Vorsorgewohnung, Bauherrenmodell oder Anlegerwohnung zu Ihnen passt — mit ehrlicher Begründung.",
  },
  {
    Icon: Home,
    title: "3 · Spezialist:in sprechen",
    text: "Ein spezialisierter Partner meldet sich bei Ihnen. Sie entscheiden, ob und wie es weitergeht.",
  },
];

const MODELLE = [
  { key: "vorsorgewohnung" as const },
  { key: "bauherrenmodell" as const },
  { key: "anlegerwohnung" as const },
];

export default function AnlageLanding() {
  return (
    <main className="flex flex-1 flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden border-b bg-[#0e1b3d] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#2a4cad]/40 blur-3xl" />
          <div className="absolute right-[-10%] bottom-[-20%] h-80 w-80 rounded-full bg-[var(--success)]/15 blur-3xl" />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:py-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            F&uuml;r Anleger &amp; Vorsorge-Interessierte
          </p>
          <h1 className="mt-5 max-w-3xl text-balance font-serif text-5xl leading-[1.05] sm:text-6xl">
            Immobilie als Steuerhebel &mdash; welches Modell passt zu Ihnen?
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/70">
            Vorsorgewohnung, Bauherrenmodell oder Anlegerwohnung: immoampel zeigt
            Ihnen in drei Minuten, welches Anlagemodell zu Ihrem Profil passt &mdash;
            kostenlos und unverbindlich.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="xl" className="bg-white px-7 text-base text-[#0e1b3d] shadow-lg shadow-black/20 hover:bg-white/90">
              <Link href="/anlage/anfrage">
                Modell finden
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-white/50">
            Kostenlos &middot; Unverbindlich &middot; Keine Steuer- oder Anlageberatung
          </p>
        </div>
      </section>

      {/* WIE */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl">So l&auml;uft es ab</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {SCHRITTE.map(({ Icon, title, text }) => (
            <div key={title} className="rounded-xl border bg-surface p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-serif text-2xl">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MODELL-ÜBERBLICK */}
      <section className="border-t bg-surface">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl">Die drei g&auml;ngigen Anlagemodelle</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Jedes Modell hat andere Voraussetzungen, Steuereffekte und Risiken.
            Welches zu Ihnen passt, h&auml;ngt von Ihrem Ziel, Horizont und Budget ab.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {MODELLE.map(({ key }) => {
              const info = MODELL_INFO[key];
              return (
                <div key={key} className="rounded-xl border bg-background p-6 shadow-sm">
                  <h3 className="font-serif text-xl">{info.titel}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{info.beschreibung}</p>
                  <p className="mt-3 text-xs font-medium text-primary">
                    Richtwert-Rendite: {info.renditeRange}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Eignung: {info.eignung}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-8">
            <Button asChild size="xl" className="px-7 text-base">
              <Link href="/anlage/anfrage">
                <ShieldCheck aria-hidden />
                Jetzt Modell finden
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="border-t">
        <div className="mx-auto w-full max-w-6xl px-5 py-8">
          <p className="text-center text-xs text-muted-foreground">
            immoampel vermittelt Kontakte &mdash; keine Steuer- oder Anlageberatung.
            Alle Angaben sind Richtwerte. Vor jeder Investition ist eine individuelle
            Pr&uuml;fung durch eine Steuerberater:in erforderlich (insb. Prognoserechnung /
            Liebhaberei).
          </p>
        </div>
      </section>
    </main>
  );
}
