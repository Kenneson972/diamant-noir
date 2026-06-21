create table if not exists public.proactive_alerts_sent (
  id uuid primary key default gen_random_uuid(),
  detector text not null,
  ref_id text not null,
  sent_at timestamptz not null default now(),
  unique (detector, ref_id)
);
alter table public.proactive_alerts_sent enable row level security;
-- service-role only : aucune policy (accès via supabaseAdmin qui bypass RLS)
