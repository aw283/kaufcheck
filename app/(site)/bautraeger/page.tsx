import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Coins, Layers, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Kapital für Ihr Bauträger-Projekt | immoampel",
  description:
    "Bauträger aufgepasst: Wir bringen Ihr Projekt mit passenden Kapitalgebern zusammen — Crowdinvesting, Mezzanine oder institutionell. Kostenlos, in 3 Minuten.",
};

const SCHRITTE = [
  {
    Icon: Building2,
    title: "1 · Projekt skizzieren",
    text: "Volumen, Standort, Phase und Kapitalbedarf — in drei Minuten, ohne Unterlagen-Upload.",
  },
  {
    Icon: Layers,
    title: "2 · Passenden Weg finden",
    text: "Wir ordnen Ihren Kapitalbedarf ein: bis 5 Mio. € Crowd/Mezzanine, darüber Bank & institutionell.",
  },
  {
    Icon: Coins,
    title: "3 · Mit Geldgebern sprechen",
    text: "Spezialisierte Kapitalpartner melden sich direkt bei Ihnen. Sie entscheiden, mit wem.",
  },
];

export default function BautraegerLanding() {
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
            Für Bauträger & Projektentwickler
          </p>
          <h1 className="mt-5 max-w-3xl text-balance font-serif text-5xl leading-[1.05] sm:text-6xl">
            Kapital für Ihr Projekt — ohne Klinkenputzen
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/70">
            Sie entwickeln, wir öffnen Türen: immoampel bringt Ihr Bauträger-Projekt
            mit passenden Kapitalgebern zusammen — Crowdinvesting, Mezzanine oder
            institutionell. Kostenlos und unverbindlich.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="xl" className="bg-white px-7 text-base text-[#0e1b3d] shadow-lg shadow-black/20 hover:bg-white/90">
              <Link href="/bautraeger/anfrage">
                Projekt einreichen
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-white/50">
            Kostenlos · Unverbindlich · Keine Anlage- oder Finanzierungsberatung
          </p>
        </div>
      </section>

      {/* WIE */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl">So läuft es ab</h2>
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

      {/* KAPITALSTRUKTUR */}
      <section className="border-t bg-surface">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl">Welches Kapital zu welchem Bedarf passt</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Die meisten Projekte kombinieren mehrere Kapitalquellen. Wir ordnen
            Ihren Bedarf ein und leiten ihn an die passenden Partner weiter.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border bg-background p-6 shadow-sm">
              <h3 className="font-serif text-2xl">Bis 5 Mio. €</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Crowdinvesting- & Mezzanine-Partner — schnell, flexibel,
                nachrangig zur Bank. Ideal, um die Eigenkapital-Lücke zu schließen.
              </p>
            </div>
            <div className="rounded-xl border bg-background p-6 shadow-sm">
              <h3 className="font-serif text-2xl">Ab 5 Mio. €</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Projektfinanzierungs-Banken & institutionelle Kapitalgeber —
                größere Tickets, strukturierte Prüfung, längerfristig.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <Button asChild size="xl" className="px-7 text-base">
              <Link href="/bautraeger/anfrage">
                <ShieldCheck aria-hidden />
                Jetzt Projekt einreichen
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
