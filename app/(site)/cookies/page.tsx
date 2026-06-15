import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookies",
  description:
    "Welche Cookies immoampel setzt — Kurzfassung: praktisch keine.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
      <h1 className="text-4xl sm:text-5xl">Cookies</h1>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p className="text-base text-foreground">
          Die Kurzfassung: <strong>Wir setzen keine Marketing- oder
          Tracking-Cookies.</strong> Deshalb sehen Sie bei uns auch keinen
          Cookie-Banner.
        </p>

        <section>
          <h2 className="font-serif text-2xl text-foreground">
            Was wir verwenden
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Technisch notwendige Cookies:</strong>{" "}
              ausschließlich im passwortgeschützten Admin-Bereich
              (Session-Cookie für den Login). Besucher:innen der öffentlichen
              Seiten erhalten keine Cookies.
            </li>
            <li>
              <strong className="text-foreground">Cookie-lose Reichweitenmessung:</strong>{" "}
              Wir nutzen Vercel Analytics — aggregierte Seitenaufruf-Statistik
              ohne Cookies, ohne geräteübergreifendes Tracking, ohne
              Nutzerprofile.
            </li>
            <li>
              <strong className="text-foreground">Browser-Speicher:</strong>{" "}
              Ihre Check-Eingaben leben temporär im Speicher Ihres Browsers
              und werden nicht an uns übertragen, solange Sie keine Anfrage
              absenden.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-foreground">
            Was wir nicht verwenden
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Keine Werbe-Cookies, keine Remarketing-Pixel</li>
            <li>Kein Google Analytics, kein Facebook-Pixel</li>
            <li>Kein Fingerprinting</li>
          </ul>
        </section>

        <p>
          Mehr zur Datenverarbeitung insgesamt finden Sie im{" "}
          <Link href="/datenschutz" className="text-primary underline">
            Datenschutzhinweis
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
