-- Supprime la FK dupliquée (PGRST201) — conserver bookings_villa_id_fkey uniquement

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS fk_bookings_villa;
