-- Migration : table availability_alerts
-- Stocker les alertes de disponibilité des visiteurs

create table if not exists availability_alerts (
  id            uuid primary key default gen_random_uuid(),
  villa_id      uuid references villas(id) on delete cascade,
  email         text not null,
  checkin_date  date not null,
  checkout_date date not null,
  notified      boolean not null default false,
  notified_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- Index pour la requête n8n : "alertes non notifiées pour cette villa"
create index if not exists idx_avail_alerts_villa_notified
  on availability_alerts(villa_id, notified);

-- RLS : seul le service role peut lire/écrire (n8n utilise la service key)
alter table availability_alerts enable row level security;

-- Les visiteurs peuvent insérer leurs alertes (sans être connectés)
create policy "insert_alert_public"
  on availability_alerts for insert
  to anon, authenticated
  with check (true);

-- Seul le service role peut lire et mettre à jour
create policy "service_only_select"
  on availability_alerts for select
  to service_role
  using (true);

create policy "service_only_update"
  on availability_alerts for update
  to service_role
  using (true);
