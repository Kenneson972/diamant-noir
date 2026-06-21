-- Retour P0 Richard : traçabilité acceptation CGV au checkout
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cgv_accepted_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cgv_version text;

COMMENT ON COLUMN bookings.cgv_accepted_at IS 'Horodatage ISO de l''acceptation des CGV par le client (réservation directe).';
COMMENT ON COLUMN bookings.cgv_version IS 'Version des CGV acceptées (ex. 2026-06-21).';
