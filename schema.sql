-- Diamant Noir schema (multi-villas & ownership)

create table if not exists public.villas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade, -- Lien vers le concierge/propriétaire
  name text not null,
  description text,
  price_per_night integer not null default 1000,
  capacity integer not null default 8,
  image_url text,
  location text,
  ical_url text,
  access_token text,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  villa_id uuid references public.villas(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null check (status in ('pending', 'confirmed')),
  source text not null check (source in ('airbnb', 'direct')),
  guest_name text,
  price integer not null default 0,
  created_at timestamptz not null default now(),
  unique (start_date, end_date, source, villa_id)
);

alter table public.villas enable row level security;
alter table public.bookings enable row level security;

-- POLITIQUES POUR LES VILLAS
-- Tout le monde peut voir les villas (pour le site public)
create policy "villas_public_read"
  on public.villas for select
  using (true);

-- Seul le propriétaire peut modifier sa villa
create policy "villas_owner_all"
  on public.villas for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Seul un utilisateur authentifié peut créer une villa (il devient le owner_id par défaut via l'app)
create policy "villas_auth_insert"
  on public.villas for insert
  with check (auth.role() = 'authenticated');


-- POLITIQUES POUR LES BOOKINGS
-- Tout le monde peut voir les bookings (pour griser les dates sur le calendrier public)
create policy "bookings_public_read"
  on public.bookings for select
  using (true);

-- Le propriétaire de la villa peut tout faire sur les bookings de SA villa
create policy "bookings_owner_all"
  on public.bookings for all
  using (
    exists (
      select 1 from public.villas
      where villas.id = bookings.villa_id
      and villas.owner_id = auth.uid()
    )
  );

-- Les clients peuvent créer un booking (statut pending par défaut via l'app)
create policy "bookings_public_insert"
  on public.bookings for insert
  with check (true);
