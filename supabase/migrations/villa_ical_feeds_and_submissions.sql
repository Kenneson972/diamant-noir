-- ═══════════════════════════════════════════════════════════════════
-- Migration : iCal sync architecture — Diamant Noir
-- ───────────────────────────────────────────────────────────────────
-- 1. Colonne `platforms` (JSONB) sur villa_submissions
--    → stocke les infos plateformes saisies dans le formulaire
--
-- 2. Table `villa_ical_feeds`
--    → feeds actifs par villa (créés quand une soumission est acceptée)
--    → utilisés par le workflow n8n pour la sync horaire
-- ═══════════════════════════════════════════════════════════════════


-- ── 1. villa_submissions : ajout de la colonne platforms ────────────
--
-- Structure JSON attendue :
-- [
--   { "platform": "airbnb", "ical_url": "https://...", "label": "Airbnb" },
--   { "platform": "booking", "ical_url": "https://...", "label": "Booking.com" }
-- ]

alter table public.villa_submissions
  add column if not exists platforms jsonb default null;

-- Index GIN pour requêtes sur le JSONB (ex: "toutes les soumissions avec Airbnb")
create index if not exists idx_villa_submissions_platforms
  on public.villa_submissions using gin(platforms);


-- ── 2. Table villa_ical_feeds ─────────────────────────────────────────
--
-- Créée/alimentée quand une villa_submission est acceptée et que la
-- villa est activée dans l'espace propriétaire.
-- n8n lit cette table pour savoir quels feeds synchroniser.

create table if not exists public.villa_ical_feeds (
  id              uuid primary key default gen_random_uuid(),
  villa_id        uuid not null references public.villas(id) on delete cascade,

  -- Identifiant de plateforme normalisé : airbnb | booking | vrbo | gites | other
  platform        text not null,

  -- Nom affiché (ex. "Airbnb", "Booking.com", "Mon Holidu")
  label           text not null default '',

  -- L'URL iCal fournie par le proprio
  ical_url        text not null,

  -- Actif / désactivé (on ne supprime pas, on désactive)
  is_active       boolean not null default true,

  -- Métadonnées de sync (remplies par n8n)
  last_synced_at  timestamptz default null,
  last_error      text default null,         -- Message d'erreur si URL inaccessible
  sync_count      integer not null default 0, -- Nombre total de syncs réussies

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index pour la requête n8n principale :
-- "tous les feeds actifs à synchroniser"
create index if not exists idx_villa_ical_feeds_active
  on public.villa_ical_feeds(villa_id, is_active)
  where is_active = true;

-- Index pour retrouver les feeds en erreur (monitoring)
create index if not exists idx_villa_ical_feeds_errors
  on public.villa_ical_feeds(last_error)
  where last_error is not null;

-- Contrainte : une villa ne peut pas avoir deux fois le même feed Airbnb
-- (mais peut avoir plusieurs "other")
create unique index if not exists idx_villa_ical_feeds_unique_platform
  on public.villa_ical_feeds(villa_id, platform)
  where platform != 'other';


-- ── 3. RLS sur villa_ical_feeds ────────────────────────────────────
alter table public.villa_ical_feeds enable row level security;

-- Le propriétaire de la villa peut lire ses propres feeds
create policy "owner_read_own_feeds"
  on public.villa_ical_feeds for select
  to authenticated
  using (
    exists (
      select 1 from public.villas
      where villas.id = villa_ical_feeds.villa_id
        and villas.owner_id = auth.uid()
    )
  );

-- Le propriétaire peut insérer/modifier ses propres feeds
create policy "owner_manage_own_feeds"
  on public.villa_ical_feeds for all
  to authenticated
  using (
    exists (
      select 1 from public.villas
      where villas.id = villa_ical_feeds.villa_id
        and villas.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.villas
      where villas.id = villa_ical_feeds.villa_id
        and villas.owner_id = auth.uid()
    )
  );

-- Le service role (n8n) peut tout faire
create policy "service_role_all"
  on public.villa_ical_feeds for all
  to service_role
  using (true)
  with check (true);


-- ── 4. Fonction helper : activer les feeds d'une soumission acceptée ─
--
-- Appelée quand le statut d'une villa_submission passe à "accepted".
-- Crée automatiquement les villa_ical_feeds à partir du JSONB platforms.
-- Usage : select activate_villa_feeds('villa_uuid', '[{"platform":"airbnb","ical_url":"...","label":"Airbnb"}]');

create or replace function public.activate_villa_feeds(
  p_villa_id   uuid,
  p_platforms  jsonb
)
returns void
language plpgsql
security definer
as $$
declare
  feed jsonb;
begin
  if p_platforms is null or jsonb_array_length(p_platforms) = 0 then
    return;
  end if;

  for feed in select * from jsonb_array_elements(p_platforms)
  loop
    insert into public.villa_ical_feeds (
      villa_id,
      platform,
      label,
      ical_url,
      is_active
    ) values (
      p_villa_id,
      feed->>'platform',
      coalesce(feed->>'label', feed->>'platform'),
      feed->>'ical_url',
      true
    )
    on conflict (villa_id, platform)
    where platform != 'other'
    do update set
      ical_url   = excluded.ical_url,
      label      = excluded.label,
      is_active  = true,
      updated_at = now();
  end loop;
end;
$$;


-- ── 5. Trigger : updated_at auto ──────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists villa_ical_feeds_updated_at on public.villa_ical_feeds;
create trigger villa_ical_feeds_updated_at
  before update on public.villa_ical_feeds
  for each row execute function public.set_updated_at();
