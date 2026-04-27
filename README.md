# ImmoScout Kaufcheck

Leistbarkeits-Check für Immobilien in Österreich. In 3 Minuten
klärt der Nutzer, welchen Kaufpreis er sich basierend auf Haushalt,
Einkommen, Eigenkapital und den österreichischen KIM-V-Richtlinien
leisten kann — inkl. Szenarien, Lead-Flow und Miet-Alternative.

- **Stack:** Next.js App Router, TypeScript, Tailwind v4, shadcn/ui,
  React Hook Form + Zod, Zustand, Recharts, Vitest.
- **Datenschutz:** Kein Login, keine Cookies für den Funnel, keine
  Persistierung der Eingaben vor Lead-Submit. Kaufpreis wird in
  Analytics nur als grober Bucket übertragen.

## Schnellstart

```bash
npm install
cp .env.example .env.local    # optional für Lead-/Analytics-Integration
npm run dev
```

Seiten:

- `/kaufcheck` – Landing-Page
- `/kaufcheck/wizard` – 4-Schritt-Funnel
- `/kaufcheck/datenschutz` – DSGVO-Kurzinfo
- `POST /api/leads` – Lead-Entgegennahme (Zod-validiert)
- `/robots.txt`, `/sitemap.xml`, `/kaufcheck/opengraph-image` – SEO

## Scripts

```bash
npm run dev          # Dev-Server (Turbopack)
npm run build        # Produktions-Build
npm run start        # Produktions-Server
npm test             # Vitest (affordability + edge cases)
npm run test:watch   # Vitest im Watch-Mode
npm run lint         # ESLint
```

## Architektur-Überblick

```
app/
├── layout.tsx                       Root-Layout, Vercel Analytics + Speed Insights
├── page.tsx                         → redirect("/kaufcheck")
├── robots.ts, sitemap.ts            SEO
├── api/leads/route.ts               Lead-Endpunkt (Zod + Supabase + Resend-Stub)
└── kaufcheck/
    ├── layout.tsx                   SEO-Metadaten für die Route
    ├── page.tsx                     Landing (Hero, Trust-Elemente, CTA)
    ├── error.tsx                    Error Boundary
    ├── datenschutz/page.tsx         DSGVO-Kurzinfo
    ├── opengraph-image.tsx          Dynamisches OG-Bild (1200×630)
    ├── wizard/page.tsx              Mount-Punkt für den Wizard
    ├── components/
    │   ├── Wizard.tsx               Shell: Progress, Navigation, Focus, Unload-Guard
    │   ├── WizardProgress.tsx
    │   ├── HaushaltStep.tsx         Schritt 1 (RHF + Zod)
    │   ├── FinanzenStep.tsx         Schritt 2
    │   ├── VorstellungStep.tsx      Schritt 3
    │   ├── ErgebnisStep.tsx         Schritt 4 – Variant-Dispatcher
    │   ├── InfoTooltip.tsx
    │   ├── DevSeedButton.tsx        Nur NODE_ENV!=production
    │   └── ergebnis/
    │       ├── LeistbarView.tsx       grüne Variante, Donut (lazy), 4 KPIs
    │       ├── GrenzfallView.tsx      gelbe Variante, 3 Optimierungs-Szenarien
    │       ├── NichtLeistbarView.tsx  graue Variante, Miet-Umlenkung
    │       ├── KaufpreisRange.tsx     Gradient-Balken
    │       ├── FinanzierungsDonut.tsx Recharts-Donut
    │       ├── KennzahlCard.tsx
    │       ├── ShareActions.tsx       Teilen (Web Share + Copy), Drucken, Reset
    │       └── LeadFormDialog.tsx     RHF-Lead-Formular im Modal
    ├── lib/
    │   ├── affordability.ts         berechneLeistbarkeit + CONFIG-Konstanten
    │   ├── affordability.test.ts    Basis-Szenarien
    │   ├── affordability.edge.test.ts  NaN/Infinity/Boundaries
    │   ├── constants.ts             Default-Zinssatz, Default-Laufzeit
    │   ├── schemas.ts               Step-Schemas (RHF-Resolver)
    │   ├── lead-schema.ts           Lead-Payload-Schema (Client + API)
    │   ├── immoscout.ts             Such-URL + Mietrichtwert pro Bundesland
    │   ├── store.ts                 Zustand-Store (step, data, result, actions)
    │   └── validation.ts            isStepValid(step, data) für Weiter-Gate
    └── types/index.ts               KaufcheckInput/Result, Enums, Konstanten
components/ui/                       shadcn-Primitives (button, card, dialog, …)
lib/
├── utils.ts                         cn-Helper
├── analytics.ts                     Cookie-freie Event-API (austauschbare Backends)
└── utm.ts                           UTM-Parameter in sessionStorage
```

## Berechnungs-Konstanten anpassen

Alle Werte für die Leistbarkeits-Berechnung liegen zentral in
**`app/kaufcheck/lib/affordability.ts`** im exportierten `CONFIG`-Objekt:

```ts
export const CONFIG = {
  DSTI_MAX: 0.4,                  // Schuldendienstquote max
  EK_QUOTE_MIN: 0.2,              // Min Eigenkapitalquote
  LAUFZEIT_JAHRE_DEFAULT: 30,     // Standard-Laufzeit-Ceiling
  ENDALTER_MAX: 80,               // Max Alter bei Kreditende
  ZINSSATZ_DEFAULT: 0.035,        // 3,5 % p.a. fix
  NEBENKOSTEN_QUOTE: 0.1,         // 10 % des Kaufpreises
  PUFFER_HAUSHALT_PRO_PERSON: 350,
  PUFFER_PRO_KIND: 250,
};
```

**Zinssatz regelmäßig nachführen:** Bei Leitzins-Änderung hier
`ZINSSATZ_DEFAULT` anpassen — die Tests in `affordability.test.ts`
beschreiben das erwartete Verhalten (Familie mit 4.500 € netto bleibt
"leistbar"). Tests nach der Änderung ausführen:

```bash
npm test
```

Die Status-Schwellen (leistbar ≥ 150k, nicht_leistbar < 100k etc.)
stehen ebenfalls oben in `affordability.ts` als `const` am Modul-Kopf
und können bei Markt-Änderungen angepasst werden.

## Lead-Flow

- Formular: `app/kaufcheck/components/ergebnis/LeadFormDialog.tsx`
- Schema (client + server): `app/kaufcheck/lib/lead-schema.ts`
- Endpoint: `app/api/leads/route.ts`
  - In-Memory Rate-Limit (5 pro Minute pro IP) – für Produktion auf
    Upstash/Vercel KV umstellen.
  - Persistierung (alle optional, parallel ausgeführt):
    - Supabase REST (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`)
    - Generischer Webhook (`LEAD_WEBHOOK_URL`)
  - E-Mail-Benachrichtigung via Resend (`RESEND_API_KEY` →
    `LEAD_EMAIL_TO`), sonst Dev-Stub im Log.

### Supabase-Tabelle

```sql
create table kaufcheck_leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  source      text,
  lead        jsonb not null,
  kaufcheck   jsonb not null,
  context     jsonb not null,
  ip          text
);
-- empfohlene Indexe
create index on kaufcheck_leads (created_at desc);
```

## Tracking

Alle Events laufen durch `lib/analytics.ts` (cookie-frei). Events:

| Event                         | Wo                          |
|-------------------------------|-----------------------------|
| `kaufcheck_started`           | Wizard-Mount                |
| `kaufcheck_step_completed`    | pro Weiter-Click            |
| `kaufcheck_calculated`        | Nach `berechneLeistbarkeit` |
| `kaufcheck_lead_submitted`    | Nach erfolgreicher API      |
| `kaufcheck_mietobjekte_clicked` | Miet-CTA-Klicks          |
| `kaufcheck_immoscout_clicked` | Immobiliensuche-Klicks      |

Backends werden per Env aktiviert (Plausible / GA4 / PostHog).
Kaufpreise fließen ausschließlich als Bucket (`"200-300k"`) ein.

## Monitoring

- **Vercel Analytics + Speed Insights** sind eingebaut
  (`@vercel/analytics/next`, `@vercel/speed-insights/next` in
  `app/layout.tsx`). Kein Env-Var nötig — nach dem Deployment in den
  Vercel Project-Settings aktivieren.
- **Sentry** ist nicht verdrahtet. Für Fehler-Tracking reicht es, das
  offizielle `@sentry/nextjs`-SDK zu installieren und `sentry.init()`
  in `instrumentation.ts` aufzurufen — die Error-Boundary in
  `app/kaufcheck/error.tsx` loggt den Fehler bereits via
  `console.error`, Sentry fängt das automatisch ab.

## Deployment (Vercel)

1. Repo auf Vercel verbinden.
2. Env-Variablen aus `.env.example` eintragen
   (nur gesetzte Provider werden aktiviert).
3. Build-Command: `next build` (Standard).
4. Output: Next.js App Router. Die Route `/api/leads` läuft im
   Node-Runtime, OG-Image in Edge.
5. Nach dem ersten Deploy: Analytics + Speed Insights in den
   Project-Settings aktivieren.

## Test-Strategie

- Unit-Tests der Berechnung in `affordability.test.ts` (Szenario-
  Abdeckung) und `affordability.edge.test.ts` (NaN/Infinity, extreme
  Inputs, Override-Edge-Cases).
- Die Berechnungs-Konstanten gelten als fixiert — jede Änderung
  erfordert neue/angepasste Tests.
- Visual/E2E-Tests sind für einen Folge-Sprint vorgesehen
  (Playwright).

## Entwicklungs-Hilfen

- **Dev-Seed-Button** (nur Dev-Build): Unten rechts im Wizard – füllt
  mit einem Klick drei Preset-Szenarien (leistbar / grenzfall /
  nicht_leistbar).
- **Auto-Focus:** erster fokussierbarer Input jedes Steps wird nach
  dem Step-Wechsel automatisch fokussiert (Keyboard-First).
- **beforeunload-Schutz:** warnt auf Schritt 2+3, wenn bereits Daten
  eingegeben wurden.
- **Print-Stylesheet:** druckt nur das Ergebnis, blendet Navigation,
  Progress und Buttons aus.
