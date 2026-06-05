-- Migration : table wishlist
-- Persister les favoris des utilisateurs connectés

create table if not exists wishlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  villa_id   uuid not null references villas(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, villa_id)
);

alter table wishlist enable row level security;

-- Un utilisateur ne peut voir/modifier que ses propres favoris
create policy "user_own_wishlist_select"
  on wishlist for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_own_wishlist_insert"
  on wishlist for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_own_wishlist_delete"
  on wishlist for delete
  to authenticated
  using (auth.uid() = user_id);
