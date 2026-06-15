-- Table des demandes de pré-réservation issues du chatbot visiteur (Agent A / A2)
create table if not exists public.pre_booking_requests (
  id          uuid primary key default gen_random_uuid(),
  session_id  text,
  villa_id    uuid references public.villas(id) on delete set null,
  start_date  date,
  end_date    date,
  email       text,
  guests      integer,
  name        text,
  status      text not null default 'new',
  created_at  timestamptz not null default now()
);

alter table public.pre_booking_requests enable row level security;

-- Lecture réservée au staff/admin (service_role bypass automatiquement la RLS)
create policy "staff_read_pre_booking_requests"
  on public.pre_booking_requests
  for select
  using (public.is_staff_admin());

create index if not exists idx_pre_booking_requests_created_at
  on public.pre_booking_requests (created_at desc);
