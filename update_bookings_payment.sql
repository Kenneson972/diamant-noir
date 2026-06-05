-- Ajouter le statut de paiement
alter table public.bookings add column if not exists payment_status text default 'unpaid'; -- unpaid, paid, refunded
alter table public.bookings add column if not exists stripe_session_id text;
