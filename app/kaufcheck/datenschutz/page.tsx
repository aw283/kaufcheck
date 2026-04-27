import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Database,
  ExternalLink,
  FileSignature,
  FileText,
  Mail,
  Scale,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Datenschutz im ImmoScout Kaufcheck",
  description:
    "Kurz-Info zur Datenverarbeitung im Kaufcheck: welche Daten, wofür, wie lange – mit Verweis auf die vollständige ImmoScout-Datenschutz­erklärung.",
};

const EXTERN_DATENSCHUTZ_URL = "https://www.immobilienscout24.at/Ueberuns/Datenschutz";

export default function DatenschutzPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-8 sm:px-6 sm:py-12">
      <div>
        <Link
          href="/kaufcheck"
          prefetch={false}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Zurück zum Kaufcheck
        </Link>
      </div>

      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Datenschutz
        </div>
        <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Was passiert mit Ihren Daten im Kaufcheck?
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Kurz und verständlich: welche Daten wir verarbeiten, wofür, wie lange
          – und was Sie selbst in der Hand haben.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <UserRound className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-base font-semibold">
            Eingaben im Kaufcheck-Funnel
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Während Sie Schritt 1 bis 3 ausfüllen (Haushalt, Finanzen,
          Vorstellung), bleiben Ihre Angaben ausschließlich in Ihrem Browser.
          Wir speichern sie <strong>nicht</strong> auf einem Server. Sobald Sie
          die Seite schließen oder neu laden, sind die Daten weg.
        </p>
        <ul className="mt-3 grid gap-2 text-sm">
          <li className="flex gap-2">
            <span aria-hidden>•</span>
            <span>Keine Registrierung, kein Konto, kein Cookie für die Berechnung.</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden>•</span>
            <span>
              Eingaben werden rein im Browser-Speicher gehalten, nicht
              persistent.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden>•</span>
            <span>
              Bei Neuladen startet der Kaufcheck leer – DSGVO-sauber „by
              default“.
            </span>
          </li>
        </ul>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-base font-semibold">
            Wenn Sie eine Beratung anfragen
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Erst wenn Sie das Lead-Formular im Ergebnis-Schritt absenden,
          übermitteln Sie folgende Daten an uns:
        </p>
        <ul className="mt-3 grid gap-2 text-sm">
          <li className="flex gap-2">
            <span aria-hidden>•</span>
            <span>
              <strong>Kontaktdaten:</strong> Vor- und Nachname, E-Mail,
              Telefon­nummer, bevorzugte Kontaktzeit.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden>•</span>
            <span>
              <strong>Kaufcheck-Eingaben &amp; Ergebnis:</strong> Damit die
              Beratung sofort passt – z. B. Einkommen, Eigenkapital,
              Wunsch­region, errechneter Rahmen.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden>•</span>
            <span>
              <strong>Technische Kontextdaten:</strong> IP-Adresse, Zeitpunkt,
              UTM-Parameter (nur wenn vorhanden), User-Agent – zur Missbrauchs-
              und Quellenanalyse.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden>•</span>
            <span>
              <strong>Newsletter:</strong> Nur wenn Sie die optionale Checkbox
              aktiv setzen.
            </span>
          </li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Wir geben diese Daten ausschließlich an unabhängige Finanzierungs­-
          partner weiter, damit sich eine:r davon innerhalb von 24 Stunden bei
          Ihnen meldet. Rechtsgrundlage: Ihre Einwilligung (Art. 6 Abs. 1 lit. a
          DSGVO), die Sie über die Pflicht-Checkbox im Formular erteilen.
        </p>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-base font-semibold">
            Analyse &amp; Reichweiten­messung
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Für das MVP des Kaufchecks setzen wir auf cookie-freie, aggregierte
          Messung. Konkret erfassen wir lediglich Events wie „Schritt 2
          abgeschlossen“ oder „Ergebnis berechnet“ – <strong>ohne</strong>
          persistente User-ID und <strong>ohne</strong> Geräte­fingerprint.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Errechnete Kaufpreis­rahmen werden nur als Grobkategorie übertragen
          (z. B. „200-300k“), nicht als exakter Euro­betrag – damit kein
          indirekter Rückschluss auf eine einzelne Person möglich ist.
        </p>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-base font-semibold">Ihre Rechte</h2>
        </div>
        <ul className="grid gap-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span aria-hidden>•</span>
            <span>
              Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch,
              Datenübertragbarkeit (Art. 15–21 DSGVO).
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden>•</span>
            <span>
              Widerruf Ihrer Einwilligung jederzeit mit Wirkung für die
              Zukunft – z. B. per E-Mail an{" "}
              <a
                href="mailto:datenschutz@immobilienscout.at"
                className="font-medium text-primary hover:underline"
              >
                datenschutz@immobilienscout.at
              </a>
              .
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden>•</span>
            <span>
              Beschwerde bei der österreichischen Datenschutzbehörde (dsb.gv.at).
            </span>
          </li>
        </ul>
      </section>

      <section
        id="dokumente-upload"
        className="rounded-lg border bg-card p-5 shadow-sm"
      >
        <div className="mb-2 flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-base font-semibold">
            Hochgeladene Dokumente (PDF)
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Wenn Sie im Funnel Gehaltszettel, Kontoauszüge oder Exposés zur
          automatischen Wertübernahme hochladen, gilt zusätzlich:
        </p>

        <ul className="mt-3 grid gap-3 text-sm">
          <li>
            <strong>Welche Daten:</strong> der Inhalt des PDFs (z. B. Netto­einkommen,
            Bank-Bewegungen, Kaufpreise) plus technische Metadaten (Datei­größe,
            Dokument­typ, Zeitstempel).
          </li>
          <li>
            <strong>Welcher Zweck:</strong> automatische Extraktion von Werten
            für die Leistbarkeits­berechnung. Keine Profilbildung, keine
            Werbung.
          </li>
          <li>
            <strong>Welcher Partner:</strong>{" "}
            <span className="font-medium">Anthropic, PBC</span> (San Francisco,
            USA) als Auftrags­verarbeiter im Sinne der DSGVO. Übertragung
            verschlüsselt via TLS 1.3. Wir betreiben den{" "}
            <em>Zero-Data-Retention</em>-Modus, sofern verfügbar – Anthropic
            speichert die Anfrage dann nicht über die unmittelbare
            Bearbeitung hinaus.
          </li>
          <li>
            <strong>Wie lange:</strong> Das PDF wird ausschließlich im
            Arbeits­speicher unseres Servers verarbeitet, niemals auf Disk
            geschrieben, niemals in Backups aufgenommen. Nach der
            HTTP-Antwort wird der Buffer freigegeben (typische Lebenszeit:
            wenige Sekunden).
          </li>
          <li>
            <strong>Was wir behalten:</strong> Nur die extrahierten Werte –
            und auch die nur in Ihrem Browser, bis Sie das Tab schließen
            oder die Seite neu laden. Erst beim Absenden eines Lead-Formulars
            werden ausgewählte Werte an unser CRM übertragen.
          </li>
          <li>
            <strong>Schutz vor Schad-PDFs:</strong> Eingebettete Skripte oder
            ausführbare Aktionen werden vor der Verarbeitung erkannt und
            abgelehnt. Es findet keine Ausführung von PDF-Inhalten statt.
          </li>
        </ul>

        <p className="mt-3 text-xs text-muted-foreground">
          Rechtsgrundlage: Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO),
          die Sie aktiv per Bestätigungs­dialog vor dem ersten Upload erteilen.
        </p>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <UserRound className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-base font-semibold">
            Datenschutzbeauftragte:r &amp; Auskunfts­recht
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Für alle Fragen rund um Ihre Daten – insbesondere für Auskunft,
          Berichtigung, Löschung, Einschränkung, Widerspruch und
          Datenübertragbarkeit – erreichen Sie unsere/n DSB:
        </p>
        <ul className="mt-3 grid gap-1.5 text-sm">
          <li className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <a
              href="mailto:datenschutz@immobilienscout.at"
              className="font-medium text-primary hover:underline"
            >
              datenschutz@immobilienscout.at
            </a>
          </li>
          <li className="flex items-center gap-2">
            <FileText
              className="h-3.5 w-3.5 text-muted-foreground"
              aria-hidden
            />
            <a
              href="mailto:datenschutz@immobilienscout.at?subject=Auskunftsersuchen%20gem.%20Art.%2015%20DSGVO%20%E2%80%93%20Kaufcheck"
              className="font-medium text-primary hover:underline"
            >
              Auskunftsersuchen stellen (&bdquo;Welche Daten haben Sie über mich?&ldquo;)
            </a>
          </li>
        </ul>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-base font-semibold">
            Auftragsverarbeitungs­vertrag (DPA) mit Anthropic
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Wir haben mit Anthropic einen Auftragsverarbeitungs­vertrag im
          Sinne von Art. 28 DSGVO inklusive Standardvertrags­klauseln
          geschlossen, der die Übertragung in die USA absichert.
        </p>
        <a
          href="https://www.anthropic.com/legal/dpa"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Anthropic Data Processing Agreement öffnen
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
        <p className="mt-3 text-xs text-muted-foreground">
          Eine Kopie der konkret zwischen ImmobilienScout24 Österreich und
          Anthropic geschlossenen Vereinbarung stellen wir auf Anfrage
          (siehe DSB-Kontakt oben) bereit.
        </p>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-base font-semibold">Beschwerderecht</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Sie haben das Recht, sich bei der österreichischen Datenschutz­behörde
          zu beschweren, wenn Sie der Ansicht sind, dass die Verarbeitung
          gegen die DSGVO verstößt:
        </p>
        <a
          href="https://www.dsb.gv.at"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          dsb.gv.at <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </section>

      <section className="rounded-lg border border-primary/30 bg-primary/5 p-5">
        <h2 className="text-base font-semibold">Vollständige Datenschutz­erklärung</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Diese Seite ist nur ein Kurz-Überblick für den Kaufcheck. Die
          verbindliche, vollständige Datenschutz­erklärung von
          ImmobilienScout24 finden Sie hier:
        </p>
        <a
          href={EXTERN_DATENSCHUTZ_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Zur ImmoScout-Datenschutz­erklärung
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </section>

      <footer className="pt-2 text-xs text-muted-foreground">
        Stand: {new Date().toLocaleDateString("de-AT", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </footer>
    </main>
  );
}
