-- Migration: contact_messages (2026-05-28)
-- Table de messagerie entre owners/clients et l'admin Kayvilla

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  villa_id uuid references public.villas(id) on delete set null,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index pour les requêtes fréquentes
create index if not exists idx_contact_messages_sender on public.contact_messages(sender_id, created_at desc);
create index if not exists idx_contact_messages_villa on public.contact_messages(villa_id);

-- RLS
alter table public.contact_messages enable row level security;

-- SELECT : l'expéditeur voit ses messages + l'admin voit tout
create policy "contact_messages_select_owner_admin" on public.contact_messages
  for select
  using (
    sender_id = auth.uid()
    or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

-- INSERT : tout utilisateur authentifié peut envoyer
create policy "contact_messages_insert_auth" on public.contact_messages
  for insert
  with check (
    auth.role() = 'authenticated'
    and sender_id = auth.uid()
  );

-- UPDATE : seul l'admin peut modifier (marquer comme lu, répondre)
create policy "contact_messages_update_admin" on public.contact_messages
  for update
  using (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- DELETE : admin uniquement
create policy "contact_messages_delete_admin" on public.contact_messages
  for delete
  using (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
