-- Kontakt-Nachrichten (idempotent)
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  betreff     text not null,
  nachricht   text not null,
  ip          text,
  status      text not null default 'neu'
              check (status in ('neu','beantwortet','archiviert'))
);

create index if not exists messages_created_at_idx on messages (created_at desc);

alter table messages enable row level security;
-- keine Policies = nur service_role hat Zugriff
