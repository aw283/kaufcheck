import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Check,
  FileSearch,
  Handshake,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BlogCard } from "@/components/blog-card";
import { getAllPosts } from "@/lib/blog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://immoampel.at";

const EK_TABELLE: { asset: string; faktor: string }[] = [
  { asset: "Spar- & Bausparguthaben", faktor: "100 %" },
  { asset: "Wertpapiere, ETFs, Aktien", faktor: "≈ 70 %" },
  { asset: "Gold & Edelmetalle", faktor: "≈ 70 %" },
  { asset: "Krypto (Bitcoin, ETH …)", faktor: "≈ 50 %" },
  { asset: "Lebensversicherung (Rückkaufswert)", faktor: "100 %" },
  { asset: "Schenkung / Erbe (zugesagt)", faktor: "100 %" },
  { asset: "Bestehende Immobilie", faktor: "≈ 70 % − Restschuld" },
];

const ZITATE = [
  {
    text: "Wir dachten, ohne 100.000 am Sparbuch brauchen wir gar nicht anfangen. Der Check hat unser ETF-Depot und die Schenkung der Eltern mitgerechnet — plötzlich war's machbar.",
    who: "Familie aus Linz, 4.500 € netto, 80 k Eigenkapital",
  },
  {
    text: "Endlich sagt mal jemand klar, woran es scheitert: 3 Prozentpunkte Eigenkapitalquote. Das konnten wir gezielt lösen, statt blind Banktermine zu sammeln.",
    who: "Paar aus Graz, Grenzfall → finanziert",
  },
  {
    text: "Dass meine abbezahlte Garçonnière als Sicherheit für die größere Wohnung zählt, hat mir vorher keine Bank aktiv gesagt.",
    who: "Käuferin aus Wien, Zweitkauf",
  },
];

const FAQ_SNIPPET = [
  {
    q: "Was kostet der Check?",
    a: "Nichts. Keine Registrierung, keine versteckten Kosten. Wir finanzieren uns über Vermittlungsprovisionen unserer Partner — nur wenn Sie aktiv eine Beratung anfragen.",
  },
  {
    q: "Wie genau ist die Berechnung?",
    a: "Wir rechnen mit denselben Leitplanken wie Ihre Bank: 40 % Schuldendienstquote, 20 % Eigenkapitalquote, KIM-V-Laufzeitgrenzen. Das Ergebnis ist ein belastbarer Orientierungswert, keine Kreditzusage.",
  },
  {
    q: "Was passiert mit meinen Daten?",
    a: "Ihre Eingaben bleiben im Browser, bis Sie aktiv eine Anfrage absenden. Kein Tracking, keine Weitergabe ohne Ihre ausdrückliche Einwilligung.",
  },
];

export default function LandingPage() {
  const latestPosts = getAllPosts().slice(0, 3);

  const ldOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "immoampel",
    url: SITE_URL,
    slogan: "Klare Ansage statt Bank-Geblubber.",
    areaServed: "AT",
  };

  return (
    <main className="flex flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldOrg) }}
      />

      {/* HERO */}
      <section className="border-b bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div className="animate-in fade-in-0 duration-500">
            <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="flex gap-0.5" aria-hidden>
                <span className="h-2 w-2 rounded-full bg-error" />
                <span className="h-2 w-2 rounded-full bg-warning" />
                <span className="h-2 w-2 rounded-full bg-success" />
              </span>
              Leistbarkeits-Check für Österreich
            </p>
            <h1 className="mt-5 text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Welche Immobilie können Sie sich leisten?
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Klare Ansage statt Bank-Geblubber: In zwei Minuten wissen Sie,
              was geht — grün, gelb oder rot. Mit denselben Regeln, die Ihre
              Bank anwendet.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="xl" className="px-7 text-base">
                <Link href="/check">
                  Leistbarkeit prüfen
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="px-7 text-base">
                <Link href="#wie">Wie es funktioniert</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Kostenlos · Ohne Registrierung · KIM-V-konform
            </p>
          </div>

          {/* Ampel-Visual */}
          <div className="hidden lg:block" aria-hidden>
            <div className="mx-auto w-fit space-y-4 rounded-2xl border bg-background p-8 shadow-sm">
              {[
                { c: "bg-error/15 text-error", label: "Noch nicht", value: "rot" },
                { c: "bg-warning/15 text-warning", label: "Mit Anpassungen", value: "gelb" },
                { c: "bg-success/15 text-success", label: "Leistbar", value: "grün" },
              ].map((r) => (
                <div
                  key={r.label}
                  className={`flex w-64 items-center justify-between rounded-xl px-5 py-4 ${r.c}`}
                >
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="font-serif text-xl">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WIE ES FUNKTIONIERT */}
      <section id="wie" className="scroll-mt-20">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl">Drei Schritte zur klaren Ansage</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                Icon: FileSearch,
                title: "1 · Eingeben",
                text: "Einkommen, Vermögen, Wunschregion. Zwei Minuten, keine Unterlagen, kein Konto.",
              },
              {
                Icon: Calculator,
                title: "2 · Berechnen",
                text: "Wir rechnen mit den KIM-V-Leitplanken: 40 % Schuldendienstquote, 20 % Eigenkapital, reale Nebenkosten.",
              },
              {
                Icon: Handshake,
                title: "3 · Handeln",
                text: "Grün? Wir verbinden Sie auf Wunsch mit unabhängigen Partnern. Gelb oder rot? Sie bekommen konkrete Hebel statt Vertröstung.",
              },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="rounded-xl border bg-surface p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-serif text-2xl">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EIGENKAPITAL-TABELLE */}
      <section className="border-y bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl">
              Sie haben mehr Eigenkapital, als Sie denken
            </h2>
            <p className="mt-4 text-muted-foreground">
              Die meisten Rechner fragen nach dem Sparbuch — und unterschlagen,
              was Banken sonst noch anerkennen. Wir rechnen alle sechs
              Kategorien mit realistischen Beleihungsfaktoren.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "ETF-Depot beleihen statt verkaufen",
                "Bestehende Immobilie als Sicherheit aktivieren",
                "Schriftliche Schenkungszusagen zählen mit",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Vermögenswert</th>
                  <th className="px-4 py-3 text-right">Zählt als EK</th>
                </tr>
              </thead>
              <tbody className="bg-surface">
                {EK_TABELLE.map((r) => (
                  <tr key={r.asset} className="border-t">
                    <td className="px-4 py-3">{r.asset}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {r.faktor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section>
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl">Was der Check verändert</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {ZITATE.map((z) => (
              <figure
                key={z.who}
                className="flex flex-col rounded-xl border bg-surface p-6 shadow-sm"
              >
                <blockquote className="flex-1 text-sm leading-relaxed">
                  &bdquo;{z.text}&ldquo;
                </blockquote>
                <figcaption className="mt-4 text-xs font-medium text-muted-foreground">
                  {z.who}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Beispielhafte, anonymisierte Szenarien aus typischen Check-Verläufen.
          </p>
        </div>
      </section>

      {/* RATGEBER-TEASER */}
      {latestPosts.length > 0 ? (
        <section className="border-y bg-surface">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-3xl sm:text-4xl">Aus dem Ratgeber</h2>
              <Link
                href="/blog"
                className="text-sm font-medium text-primary hover:underline"
              >
                Alle Artikel →
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* FAQ-SNIPPET */}
      <section>
        <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl">Häufige Fragen</h2>
          <div className="mt-8 space-y-3">
            {FAQ_SNIPPET.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border bg-surface p-5"
              >
                <summary className="cursor-pointer list-none font-medium">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
          <Link
            href="/faq"
            className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
          >
            Alle Fragen &amp; Antworten →
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 text-center sm:py-20">
          <h2 className="font-serif text-4xl text-primary-foreground sm:text-5xl">
            Grün, gelb oder rot?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm opacity-90">
            Zwei Minuten. Keine Registrierung. Eine klare Antwort.
          </p>
          <Button
            asChild
            size="xl"
            className="mt-7 bg-white px-8 text-base text-primary hover:bg-white/90"
          >
            <Link href="/check">
              Jetzt Leistbarkeit prüfen
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
