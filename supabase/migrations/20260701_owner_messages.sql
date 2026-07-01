-- Migration : table owner_messages — fil de discussion propriétaire ↔ admin Kayvila
-- Remplace (fonctionnellement) owner_contact_messages (sens unique, voir Task 5)
-- et le code mort messages/OwnerMessaging (table `messages` jamais créée en prod).

create table if not exists public.owner_messages (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id),
  villa_id     uuid references public.villas(id),
  subject      text not null check (subject in ('reversement', 'disponibilites', 'contrat', 'autre')),
  content      text not null,
  sender_role  text not null check (sender_role in ('owner', 'admin')),
  sender_id    uuid not null references auth.users(id),
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_owner_messages_owner_created
  on public.owner_messages(owner_id, created_at desc);

alter table public.owner_messages enable row level security;

create policy owner_messages_select_owner
  on public.owner_messages for select
  using (owner_id = auth.uid());

create policy owner_messages_select_admin
  on public.owner_messages for select
  using (
    auth.role() = 'service_role'
    or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

create policy owner_messages_insert_owner
  on public.owner_messages for insert
  with check (
    owner_id = auth.uid()
    and sender_id = auth.uid()
    and sender_role = 'owner'
  );

create policy owner_messages_insert_admin
  on public.owner_messages for insert
  with check (
    (auth.role() = 'service_role' or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    and sender_id = auth.uid()
    and sender_role = 'admin'
  );

create policy owner_messages_update_owner
  on public.owner_messages for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy owner_messages_update_admin
  on public.owner_messages for update
  using (auth.role() = 'service_role' or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  with check (auth.role() = 'service_role' or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

alter publication supabase_realtime add table public.owner_messages;
