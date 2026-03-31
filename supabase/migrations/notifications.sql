-- ═══════════════════════════════════════════════════════════════════
-- Migration : table notifications — Diamant Noir
-- ───────────────────────────────────────────────────────────────────
-- Centralize toutes les notifs du dashboard gérant.
-- n8n insère ici après chaque traitement IA.
-- Le frontend s'abonne via Supabase Realtime (postgres_changes).
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),

  -- Type de notification
  type         text not null check (type in (
    'villa_submission',   -- nouvelle soumission villa analysée par IA
    'booking_new',        -- nouvelle réservation
    'booking_confirmed',  -- réservation confirmée
    'ical_error',         -- erreur de sync iCal
    'availability_alert', -- alerte dispo déclenchée
    'system'              -- message système
  )),

  -- Contenu
  title        text not null,
  body         text not null,

  -- Données contextuelles (score IA, tier, lien, etc.)
  metadata     jsonb default '{}',

  -- Lien de destination dans le dashboard
  action_url   text default '/dashboard/proprio',

  -- Statut lecture
  is_read      boolean not null default false,
  read_at      timestamptz default null,

  created_at   timestamptz not null default now()
);

-- Index pour la requête principale : notifs non lues, plus récentes en premier
create index if not exists idx_notifications_unread
  on public.notifications(is_read, created_at desc)
  where is_read = false;

-- RLS : seul le service role (n8n) peut insérer
-- Le dashboard lit via service role ou avec un token admin
alter table public.notifications enable row level security;

create policy "service_insert"
  on public.notifications for insert
  to service_role
  with check (true);

create policy "service_all"
  on public.notifications for all
  to service_role
  using (true);

-- Pour que le dashboard (anon/authenticated) puisse lire et marquer comme lu
-- (à restreindre à l'admin si besoin via un check sur un rôle custom)
-- ⚠️ Sécurité: ne pas exposer les notifications admin à tous les users authentifiés.
-- Si besoin d'un accès UI, implémenter un rôle/claim admin et une policy dédiée.

-- Activer Supabase Realtime sur cette table
-- (à faire aussi dans le dashboard Supabase → Database → Replication)
alter publication supabase_realtime add table public.notifications;

-- Auto-nettoyage : supprimer les notifs lues de plus de 30 jours
-- (optionnel, à activer via pg_cron si disponible)
-- select cron.schedule('clean-old-notifications', '0 3 * * *',
--   $$ delete from notifications where is_read = true and read_at < now() - interval '30 days' $$
-- );
