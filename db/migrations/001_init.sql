-- Wohnkredit-Check — Initial Database Schema
-- Idempotent: kann mehrfach ausgeführt werden ohne Fehler.
--
-- Setup-Anweisung:
--   1. Supabase-Projekt anlegen: https://supabase.com/dashboard
--   2. SQL Editor öffnen
--   3. Diesen kompletten Inhalt einfügen und ausführen
--   4. Project Settings → API:
--        - SUPABASE_URL (Project URL)        in Vercel-Env eintragen
--        - SUPABASE_SERVICE_ROLE_KEY (service_role) in Vercel-Env
--          ⚠️  NICHT der anon-Key. service_role bypassed RLS für API.

create extension if not exists "pgcrypto";

-- ============================================================
-- leads — eingegangene Anfragen
-- ============================================================
create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  typ           text not null check (typ in ('finanzierung','immobilie')),
  vorname       text not null,
  nachname      text not null,
  email         text not null,
  telefon       text not null,
  kontaktzeit   text not null check (kontaktzeit in ('vormittag','nachmittag','abend')),
  einwilligung  boolean not null,
  newsletter    boolean not null default false,
  status        text not null default 'neu'
                check (status in ('neu','kontaktiert','qualifiziert','verkauft','verloren')),
  notes         text,
  ip            text,
  user_agent    text
);

-- ============================================================
-- calculations — Berechnungs-Snapshot pro Lead (1:1)
--   input  = vollständiger CheckInput (jsonb)
--   result = vollständiger CheckResult (jsonb)
--   audit  = Zwischenwerte je Berechnungsschritt (jsonb)
-- ============================================================
create table if not exists calculations (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references leads(id) on delete cascade,
  created_at    timestamptz not null default now(),
  input         jsonb not null,
  result        jsonb not null,
  audit         jsonb not null
);

create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists leads_status_idx on leads (status);
create index if not exists calculations_lead_id_idx on calculations (lead_id);

-- ============================================================
-- Row-Level-Security — Schutz für den Fall dass jemand mit
-- dem anon-Key auf die Tabellen zugreift. Die API nutzt
-- service_role und umgeht RLS automatisch.
-- KEINE Policies definiert = anon kann nichts.
-- ============================================================
alter table leads enable row level security;
alter table calculations enable row level security;
