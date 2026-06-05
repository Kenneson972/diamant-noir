-- Owner-scoped alerts + AI action audit trail (assistant propriétaire)
-- Service role (API) bypasses RLS ; policies = accès direct client Supabase futur.

create table if not exists owner_alerts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  villa_id uuid references villas (id) on delete set null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  title text not null,
  body text,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_owner_alerts_owner_created
  on owner_alerts (owner_id, created_at desc);

alter table owner_alerts enable row level security;

create policy "owner_alerts_select_own"
  on owner_alerts for select
  to authenticated
  using (owner_id = auth.uid());

create table if not exists ai_action_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin')),
  action_type text not null default 'chat_message',
  payload jsonb not null default '{}'::jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_action_logs_owner_created
  on ai_action_logs (owner_id, created_at desc)
  where owner_id is not null;

create index if not exists idx_ai_action_logs_role_created
  on ai_action_logs (role, created_at desc);

alter table ai_action_logs enable row level security;

create policy "ai_action_logs_select_own"
  on ai_action_logs for select
  to authenticated
  using (owner_id is not null and owner_id = auth.uid());
