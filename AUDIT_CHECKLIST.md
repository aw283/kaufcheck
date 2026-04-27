# Go-Live Audit-Checkliste – ImmoScout Kaufcheck

Diese Checkliste muss vor dem produktiven Soft-Launch vollständig
abgehakt sein. Verantwortlich: Tech-Lead + Legal ImmobilienScout24
Österreich.

> Bei jedem Punkt: **Datum, Verantwortliche/r, Ergebnis-Link/Doc-Ref**
> ergänzen, dann Häkchen setzen.

---

## 1. Recht & Compliance

- [ ] **DSFA** (Datenschutz-Folgenabschätzung) erstellt
      gem. Art. 35 DSGVO, abgenommen durch DSB ImmoScout
      (Begründung: Verarbeitung von Finanz­dokumenten in größerem Umfang
      mit KI-Profil­fragen, Risiko­bewertung erforderlich).
- [ ] **DPA mit Anthropic** unterzeichnet (Art. 28 DSGVO inkl.
      Standard­vertragsklauseln für USA-Transfer). PDF im Vertrags­tresor
      abgelegt; Link auf der `/kaufcheck/datenschutz`-Seite zeigt auf das
      öffentliche Anthropic-DPA.
- [ ] **Auftragsverarbeitungs­verzeichnis** (AVV) im internen
      Verarbeitungs­register ergänzt (Anthropic, Resend, Vercel,
      Plausible/PostHog/GA falls aktiv).
- [ ] **Verarbeitungstätigkeit** im Verzeichnis nach Art. 30 DSGVO
      eingetragen: „Kaufcheck Document-Extraction".
- [ ] **Pre-Upload-Consent**-Wortlaut von Legal freigegeben (siehe
      `app/kaufcheck/components/UploadConsentDialog.tsx`).
- [ ] **Datenschutz-Seite** (`/kaufcheck/datenschutz`) inhaltlich
      gegen Legal abgenommen, insbesondere:
   - Welche Daten · Welcher Zweck · Welcher Partner · Wie lange
   - Hinweis auf Zero-Data-Retention
   - Schutz vor Schad-PDFs
   - DSB-Kontakt + Auskunftsersuchen-Mailto-Link
   - DPA-Link
   - Beschwerderecht bei DSB Österreich
- [ ] **Interne Freigabe Legal ImmoScout** dokumentiert
      (E-Mail-Bestätigung im Repo-Issue verlinkt).

## 2. Tech-Sicherheit

- [ ] **Penetration-Test** durch externen Anbieter durchgeführt;
      kritische Findings behoben, Bericht abgelegt.
- [ ] **Security-Header** verifiziert via `securityheaders.com` (Ziel:
      mind. **A**). Konfig: `next.config.ts` (HSTS, CSP, X-Frame-Options,
      Permissions-Policy, Referrer-Policy).
- [ ] **HTTPS erzwungen** auf der Vercel-Domain inkl.
      `Strict-Transport-Security` (siehe `next.config.ts`).
- [ ] **CORS** auf API-Routes restriktiv (`Access-Control-Allow-Origin:
      same-origin`).
- [ ] **CSP** ohne `'unsafe-eval'` außer für Next.js-Hydration; Worker-Source
      auf cdnjs.cloudflare.com beschränkt (nur PDF.js-Worker).
- [ ] **Rate-Limit** verifiziert: 10 Uploads / 5 Min und 100 / 24 h pro
      IP greifen (Last-Test mit synthetischen Requests).
- [ ] **Dependency-Audit**: `npm audit` läuft ohne **High/Critical**
      Findings. Moderate-Findings sind dokumentiert und akzeptiert.
- [ ] **Secrets-Scan** im Repo (gitleaks o. ä.) – keine Treffer.
- [ ] **Vercel-Secrets** gesetzt für Production:
      `ANTHROPIC_API_KEY`, optional `ANTHROPIC_ZDR=true`, ggf.
      `RESEND_API_KEY`, `SUPABASE_*`, `SENTRY_DSN`.

## 3. Datenfluss / "wirklich keine PII"

- [ ] **Logs-Review** durchgeführt (Server-Logs, Vercel-Logs,
      Sentry-Events): pro Stichprobe verifiziert, dass **keine** der
      folgenden Daten geloggt werden:
   - PDF-Inhalt (Text oder Base64)
   - Extrahierte Werte (Beträge, Namen, Adressen, IBAN)
   - Kompletter Lead-Payload (E-Mail, Telefon)
   - Stack-Traces mit eingebettetem Klartext
- [ ] **`safeLog`-Audit**: alle Aufrufe in
      `app/api/kaufcheck/extract/route.ts` und
      `app/api/leads/route.ts` listen ausschließlich Metadaten.
- [ ] **Sentry-`beforeSend`** verifiziert (siehe `instrumentation.ts`):
      base64-Strings, E-Mails, IBAN, Telefonnummern werden geredet.
- [ ] **Disk-Schreiben ausgeschlossen** – statisch verifiziert (kein
      `fs.writeFile`/`createWriteStream` in der Extract-Pipeline).
- [ ] **Buffer-Lifetime**: PDF-Bytes werden nach Pipeline-Abschluss
      explizit auf `null` gesetzt (siehe Route-Code, `finally`-Block).

## 4. KI-Partner-Konfiguration

- [ ] **Zero-Data-Retention (ZDR)** auf Anthropic-Seite vertraglich
      aktiviert; `ANTHROPIC_ZDR=true` in Production-ENV.
- [ ] **Claude-Modelle gepinnt**: `claude-haiku-4-5` (Stufe 1) und
      `claude-opus-4-7` (Stufe 2). Modell-Wechsel erfordert neue Freigabe.
- [ ] **Kosten-Monitoring**: Alarm in Anthropic Console bei
      Tagesschwelle (Vorschlag: $50 / Tag).
- [ ] **Anthropic Status-Page** wird in Status-Dashboard von ImmoScout
      eingebunden.

## 5. Ausfall-Pfad / Resilienz

- [ ] **Fallback "Claude API down"**: User sieht klare Fehlermeldung
      (deutsch) und kann Werte manuell eingeben. Verifiziert durch
      simulierten 503-Response. Der Wizard funktioniert ohne Document-
      Upload-Pfad weiterhin vollständig.
- [ ] **Ratenbegrenzung-Erreicht-Pfad** (429): User-Message ist
      verständlich, retry-after wird respektiert.
- [ ] **Browser ohne JavaScript**: Landing-Page lädt server-seitig,
      Kaufcheck-CTA verlinkt direkt auf `/kaufcheck/wizard` (manuelle
      Eingabe weiterhin möglich; Upload braucht JS).

## 6. Content-Review

- [ ] **Mikro-Copy** durchgeprüft – keine Formulierung ersetzt
      Finanzberatung, jedes Ergebnis hat einen Disclaimer.
- [ ] **Datenschutz-Hinweise** an allen Touchpoints:
      Pre-Upload-Modal, Upload-Zone (Schloss-Hinweis), Datenschutz-Seite,
      Lead-Formular-Checkbox.
- [ ] **DPA-Link, DSB-Kontakt, Auskunfts­formular-Link** in der
      Datenschutz-Seite funktionieren.
- [ ] **Footer-Link** auf `/kaufcheck/datenschutz` von der Landing-Page
      und vom Lead-Modal aus erreichbar.

## 7. Operatives

- [ ] **Sentry** (oder Vercel-Error-Logs) eingebunden + Alert-Routing
      auf #kaufcheck-eng-Slack.
- [ ] **Vercel Analytics + Speed Insights** aktiviert für Production.
- [ ] **Incident-Runbook** existiert für die Pfade:
      Anthropic-Outage, Quota-Exhaust, falscher PDF-Inhalt geleakt,
      DSGVO-Auskunftsersuchen eines Users.
- [ ] **Backup-Strategie** für Lead-CRM (Supabase): tägliches Snapshot,
      Retention 30 Tage.

---

## Bekannte Restrisiken (akzeptiert)

- **In-Memory Rate-Limit** ist pro Vercel-Function-Instanz lokal.
  Bei mehreren Instanzen ist das tatsächliche Limit pro IP höher als
  die deklarierten 10/5min. Vor dem skalierten Launch (>1k DAU) auf
  Upstash Ratelimit umstellen.
- **Heuristische Bundesland-Aus-PLZ**-Erkennung im Smart-Fill kann an
  PLZ-Grenzen falsch zuordnen (z. B. Tirol/Vorarlberg). User kann
  korrigieren – die Auto-Fill-Quelle wird auf `manual` umgestellt.
- **Postcss moderate vulnerability** (Next-Transitive). Akzeptiert,
  weil ein Next-Downgrade die Side-Chain breakt; Fix kommt mit dem
  nächsten Next-Patch-Release.

---

_Letzter Stand: vor Soft-Launch._
