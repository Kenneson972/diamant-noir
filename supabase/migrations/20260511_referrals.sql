-- ═══════════════════════════════════════════════════════════════════
-- Migration : table referrals — Parrainage
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.referrals (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid references auth.users(id) on delete cascade not null,
  friend_email  text not null,
  friend_name   text,
  code          text not null unique,
  status        text not null default 'invited' check (status in ('invited', 'registered', 'booked')),
  created_at    timestamptz not null default now()
);

alter table public.referrals enable row level security;

create policy "referrer_own"
  on public.referrals for all
  to authenticated
  using (referrer_id = auth.uid());

create index if not exists idx_referrals_referrer
  on public.referrals(referrer_id, status, created_at desc);
