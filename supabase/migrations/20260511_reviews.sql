-- ═══════════════════════════════════════════════════════════════════
-- Migration : table reviews — Avis post-séjour
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid references public.bookings(id) on delete cascade not null,
  guest_id    uuid references auth.users(id) on delete cascade not null,
  villa_id    uuid references public.villas(id) on delete cascade not null,

  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  photos      jsonb default '[]'::jsonb,

  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique(booking_id)
);

alter table public.reviews enable row level security;

-- Tout le monde peut lire les avis approuvés
create policy "anyone_read_approved"
  on public.reviews for select
  using (status = 'approved');

-- Le guest peut créer/lire/modifier ses propres avis
create policy "guest_own"
  on public.reviews for all
  to authenticated
  using (guest_id = auth.uid());

-- L'admin peut tout faire
create policy "admin_all"
  on public.reviews for all
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

create index if not exists idx_reviews_villa
  on public.reviews(villa_id, status, created_at desc);
