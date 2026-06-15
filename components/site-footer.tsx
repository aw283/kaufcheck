import Link from "next/link";

import { AmpelMark } from "@/components/brand";
import { NewsletterForm } from "@/components/newsletter-form";

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Produkt",
    links: [
      { href: "/check", label: "Leistbarkeits-Check" },
      { href: "/foerderungen", label: "Förderungen" },
      { href: "/zinsen", label: "Bauzinsen" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Ratgeber",
    links: [
      { href: "/blog", label: "Alle Artikel" },
      { href: "/blog/kategorie/erklaerung", label: "Erklärungen" },
      { href: "/blog/kategorie/foerderung", label: "Förderung" },
      { href: "/newsletter", label: "Newsletter" },
    ],
  },
  {
    title: "Unternehmen",
    links: [
      { href: "/ueber-uns", label: "Über uns" },
      { href: "/partner", label: "Partner" },
      { href: "/kontakt", label: "Kontakt" },
    ],
  },
  {
    title: "Rechtliches",
    links: [
      { href: "/datenschutz", label: "Datenschutz" },
      { href: "/impressum", label: "Impressum" },
      { href: "/agb", label: "AGB" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AmpelMark />
              <span className="font-serif text-xl">immoampel</span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Klare Ansage statt Bank-Geblubber. Leistbarkeits-Check für
              Immobilien in Österreich.
            </p>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Markt-Updates per Mail
              </p>
              <NewsletterForm compact />
            </div>
          </div>

          <nav
            className="grid grid-cols-2 gap-8 sm:grid-cols-4"
            aria-label="Footer"
          >
            {COLS.map((col) => (
              <div key={col.title}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {col.title}
                </p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        prefetch={false}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} immoampel</p>
          <p>
            Alle Berechnungen sind Orientierungswerte – keine verbindliche
            Kreditzusage, keine Anlageberatung.
          </p>
        </div>
      </div>
    </footer>
  );
}
