-- Migration : table tenant_messages — fil de discussion locataire <-> admin Kayvila
-- Miroir de owner_messages (supabase/migrations/20260701100000_owner_messages.sql)
-- mais strictement locataire <-> admin : AUCUNE relation directe locataire <-> propriétaire.
-- Le trigger de restriction UPDATE est inclus dès cette migration initiale (contrairement
-- à owner_messages où il a fallu un correctif après-coup en review finale).

create table if not exists public.tenant_messages (
  id           uuid primary key default gen_random_uuid(),
  guest_id     uuid not null references auth.users(id),
  booking_id   uuid references public.bookings(id),
  subject      text not null check (subject in ('probleme', 'sejour', 'reservation', 'autre')),
  content      text not null,
  sender_role  text not null check (sender_role in ('guest', 'admin')),
  sender_id    uuid not null references auth.users(id),
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_tenant_messages_guest_created
  on public.tenant_messages(guest_id, created_at desc);

alter table public.tenant_messages enable row level security;

create policy tenant_messages_select_guest
  on public.tenant_messages for select
  using (guest_id = auth.uid());

create policy tenant_messages_select_admin
  on public.tenant_messages for select
  using (public.is_staff_admin());

create policy tenant_messages_insert_guest
  on public.tenant_messages for insert
  with check (
    guest_id = auth.uid()
    and sender_id = auth.uid()
    and sender_role = 'guest'
  );

create policy tenant_messages_insert_admin
  on public.tenant_messages for insert
  with check (
    public.is_staff_admin()
    and sender_id = auth.uid()
    and sender_role = 'admin'
  );

create policy tenant_messages_update_guest
  on public.tenant_messages for update
  using (guest_id = auth.uid())
  with check (guest_id = auth.uid());

create policy tenant_messages_update_admin
  on public.tenant_messages for update
  using (public.is_staff_admin())
  with check (public.is_staff_admin());

-- Restriction : un locataire ne peut modifier que read_at sur ses propres lignes
-- (jamais réécrire le contenu d'un message admin). Inclus dès le départ, pas en
-- correctif après-coup (leçon tirée du projet owner_messages).
create or replace function public.tenant_messages_restrict_guest_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_staff_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.guest_id is distinct from old.guest_id
    or new.booking_id is distinct from old.booking_id
    or new.subject is distinct from old.subject
    or new.content is distinct from old.content
    or new.sender_role is distinct from old.sender_role
    or new.sender_id is distinct from old.sender_id
    or new.created_at is distinct from old.created_at
  then
    raise exception 'tenant_messages: un locataire ne peut modifier que read_at';
  end if;

  return new;
end;
$$;

drop trigger if exists tenant_messages_restrict_guest_update on public.tenant_messages;
create trigger tenant_messages_restrict_guest_update
  before update on public.tenant_messages
  for each row
  execute function public.tenant_messages_restrict_guest_update();

alter publication supabase_realtime add table public.tenant_messages;
