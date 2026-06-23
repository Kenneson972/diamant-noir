-- Ajouter external_id pour la synchro
alter table public.bookings add column if not exists external_id text;

-- Mettre à jour la contrainte d'unicité pour la synchro intelligente
alter table public.bookings drop constraint if exists bookings_start_date_end_date_source_villa_id_key;
alter table public.bookings drop constraint if exists bookings_villa_id_external_id_key;
alter table public.bookings add constraint bookings_villa_id_external_id_key unique (villa_id, external_id);
