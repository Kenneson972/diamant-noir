-- Migration : colonne guests sur bookings (nombre de voyageurs)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guests INTEGER NOT NULL DEFAULT 1;
