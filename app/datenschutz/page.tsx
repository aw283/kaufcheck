import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Datenschutz",
  description:
    "Wie wir mit Ihren Daten im Wohnkredit-Check umgehen – DSGVO-konform.",
};

const KONTAKT_EMAIL = "datenschutz@wohnkredit-check.at";

export default function DatenschutzPage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          prefetch={false}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Zurück
        </Link>

        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Datenschutz
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Was passiert mit Ihren Daten?
          </h1>
          <p className="text-sm text-muted-foreground">
            Kurz und ehrlich. Stand:{" "}
            {new Date().toLocaleDateString("de-AT", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </header>

        <Section title="Während des Checks">
          <p>
            Ihre Eingaben (Einkommen, Eigenkapital, Wunsch-Kaufpreis, Alter,
            Haushaltsgröße) bleiben ausschließlich in Ihrem Browser. Wir
            speichern sie <strong>nicht</strong> auf einem Server, solange Sie
            kein Lead-Formular absenden.
          </p>
        </Section>

        <Section title="Wenn Sie das Lead-Formular absenden">
          <p>
            Erst beim Absenden übermitteln Sie folgende Daten an uns:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Kontaktdaten:</strong> Vor-, Nachname, E-Mail,
              Telefonnummer, bevorzugte Kontaktzeit
            </li>
            <li>
              <strong>Check-Ergebnis:</strong> errechneter Kaufpreis-Rahmen,
              Monatsrate, EK-Quote – damit der Partner Ihre Situation sofort
              versteht
            </li>
            <li>
              <strong>Technisches:</strong> IP-Adresse und Zeitstempel (für
              Missbrauchs-Schutz und Tippgeber-Audit)
            </li>
          </ul>
        </Section>

        <Section title="An wen wir die Daten weitergeben">
          <p>
            Je nachdem, welche Anfrage Sie gesendet haben:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Finanzierungs-Anfrage:</strong> ein unabhängiger
              Bank-Partner aus unserem Netzwerk (z. B. ING, BAWAG, Raiffeisen,
              Erste Bank, Hello Bank, Hypo)
            </li>
            <li>
              <strong>Immobilien-Anfrage:</strong> ein regionaler Immobilien-
              Makler, der in Ihrem Wunsch-Bundesland aktiv ist
            </li>
          </ul>
          <p>
            Wir geben die Daten ausschließlich an den passenden Partner weiter
            und niemals an Dritte zu Werbezwecken.
          </p>
        </Section>

        <Section title="Wie lange wir Ihre Daten behalten">
          <p>
            Nach Übergabe an den Partner werden Ihre Lead-Daten in unserem
            System binnen 30 Tagen gelöscht. Den Partner kontaktieren Sie
            danach direkt – seine Datenschutz-Hinweise gelten dann separat.
          </p>
        </Section>

        <Section title="Rechtsgrundlage">
          <p>
            Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die Sie aktiv per
            Pflicht-Checkbox im Lead-Formular erteilen. Sie können diese
            jederzeit widerrufen – formlos per E-Mail an die Adresse unten.
          </p>
        </Section>

        <Section title="Ihre Rechte">
          <p>
            Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und
            Datenübertragbarkeit (Art. 15–21 DSGVO). Beschwerde bei der
            österreichischen Datenschutzbehörde:{" "}
            <a
              href="https://www.dsb.gv.at"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              dsb.gv.at
            </a>
            .
          </p>
        </Section>

        <Section title="Kontakt">
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
            <a
              href={`mailto:${KONTAKT_EMAIL}`}
              className="font-medium text-primary hover:underline"
            >
              {KONTAKT_EMAIL}
            </a>
          </p>
        </Section>
      </div>

      <SiteFooter />
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-2 space-y-2 text-sm text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
