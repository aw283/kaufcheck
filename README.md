# immoampel

Klare Ansage statt Bank-Geblubber: SEO-getriebene Lead-Gen-Website für
österreichische Immobilien-Käufer. KIM-V-konformer Leistbarkeits-Check mit
Asset-Beleihung, Lead-Capture an Bank-/Makler-Partner, MDX-Blog, Förderungs-
Pages je Bundesland und Admin-Backend mit Berechnungs-Audit.

## Blog-Workflow

Artikel sind MDX-Dateien in `content/blog/*.mdx`. Neuer Artikel:

1. Datei `content/blog/mein-slug.mdx` anlegen
2. Frontmatter setzen (Zod-validiert beim Build):
   ```yaml
   ---
   title: "…"
   description: "…"            # min. 20 Zeichen
   category: "ratgeber"        # ratgeber|erklaerung|foerderung|vergleich|marktdaten
   publishedAt: "2026-05-01"   # YYYY-MM-DD
   author: "immoampel Redaktion"
   draft: false                # true = nicht im Index
   ---
   ```
3. Markdown schreiben. H2/H3 landen automatisch in der Inhalts-Navigation,
   bekommen Anchor-Links (rehype-slug + autolink-headings).
4. `npm run build` — der Slug ist sofort unter `/blog/mein-slug` live,
   in Sitemap und RSS-Feed (`/blog/rss.xml`) automatisch enthalten.

Förderungs-Inhalte sind datengetrieben in `lib/foerderungen.ts` — neue
Bundesland-Felder dort ergänzen, kein neuer Page-Code nötig.

## Tech-Stack
- Next.js 16 App Router + TypeScript + Tailwind v4
- shadcn/ui + react-hook-form + zod
- Zustand (Client-Wizard-State)
- Resend (Lead-Mail)
- Supabase (Lead-Persistierung + Berechnungs-Audit)
- Vercel-Deploy

## Lokale Entwicklung
```bash
cp .env.example .env.local
# Werte eintragen (Resend-Key + optional Supabase)
npm install
npm run dev
```

## Setup: Supabase (für Admin-Backend)

1. **Projekt anlegen**: https://supabase.com/dashboard → New Project, Region z. B. Frankfurt
2. **SQL-Migration ausführen**:
   - Im Supabase-Dashboard: SQL Editor öffnen
   - Inhalt von `db/migrations/001_init.sql` einfügen und „Run"
3. **API-Keys kopieren**:
   - Settings → API
   - `Project URL` → `SUPABASE_URL`
   - `service_role` Key → `SUPABASE_SERVICE_ROLE_KEY` (**nicht** der anon-Key)
4. **Vercel-Envs setzen**: alle in `.env.example` gelisteten Variablen
5. **Redeploy** auf Vercel

## Setup: Admin-Login

Zwei Env-Vars erzeugen:

```bash
# Passwort frei wählen, min. 16 Zeichen
ADMIN_PASSWORD=dein-sehr-langes-passwort

# Session-Secret generieren:
openssl rand -hex 32
# → in ADMIN_SESSION_SECRET einfügen
```

Beide in Vercel als Env-Vars eintragen, Redeploy. Login dann auf `/admin/login`.

## Routen-Übersicht

### Public
- `/` Landing
- `/check` 3-Step-Wizard (Einkommen → Vermögen → Wunschimmobilie)
- `/check/ergebnis`
- `/lead?typ=finanzierung|immobilie` Lead-Formular
- `/lead/danke`
- `/datenschutz`, `/impressum`

### API
- `POST /api/lead` – Lead empfangen, optional in DB persistieren, Mail via Resend
- `POST /api/admin/login`
- `POST /api/admin/logout`

### Admin (geschützt via `proxy.ts`)
- `/admin/login`
- `/admin` Lead-Liste mit Filter/Suche/Pagination
- `/admin/leads/[id]` Detail mit vollständigem Berechnungs-Audit

## Architektur-Highlights

### Berechnung mit Audit (`lib/calc.ts`)
- `berechne(input)` – reine Funktion, gibt `CheckResult`
- `berechneMitAudit(input)` – zusätzlich `CalcAudit` mit Formeln + Zwischen­werten pro Schritt
- Audit wird pro Lead in `calculations.audit` (jsonb) persistiert
- Im Admin-Detail vollständig dargestellt (Formel + Werte + Ergebnis)

### Beleihungsfaktoren (`lib/calc.ts` → `BELEIHUNG`)
| Asset | Faktor |
|---|---|
| Spar-/Bauspar | 100 % |
| Wertpapiere/ETFs | 70 % |
| Edelmetalle | 70 % |
| Lebensvers. Rückkaufswert | 100 % |
| Schenkung/Erbe | 100 % |
| Bestehende Immobilie | 70 % × Wert − Restschuld |

Standardwerte gängiger AT-Banken (Erste, Raiffeisen, BAWAG, ING).

### Auth-Modell
- Kein NextAuth/Clerk-Overhead
- HMAC-SHA256-signiertes Token in httpOnly-Cookie (24 h)
- Verifikation Edge-tauglich via Web Crypto (`lib/admin-auth.ts`)
- Timing-safe Passwort-Vergleich
- Rate-Limit 5/Min + 30/24h pro IP gegen Brute-Force

### DSGVO
- Public-Funnel ohne Cookies (kein Tracking)
- Lead-Daten erst NACH Consent-Checkbox in DB
- IP + User-Agent für Tippgeber-Audit, keine Profile
- Beim Lead-DB-Fail: Mail wird trotzdem versendet (Resilienz)

## Vercel Env-Vars Checkliste

| Var | Pflicht? | Beschreibung |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ja | Canonical-URL für OG-Tags |
| `RESEND_API_KEY` | ja | Lead-Mail-Versand |
| `LEAD_NOTIFICATION_EMAIL` | ja | Wohin Leads geschickt werden |
| `LEAD_NOTIFICATION_FROM` | nein | Default `onboarding@resend.dev` |
| `SUPABASE_URL` | nein | Ohne: Lead landet nur per Mail, kein Admin |
| `SUPABASE_SERVICE_ROLE_KEY` | nein | s. o. |
| `ADMIN_PASSWORD` | nur Admin | Admin-Login |
| `ADMIN_SESSION_SECRET` | nur Admin | HMAC-Secret, 64 Hex |

## Scripts
```bash
npm run dev      # Dev-Server
npm run build    # Production-Build
npm run start    # Production-Server
npm run lint     # ESLint
```
