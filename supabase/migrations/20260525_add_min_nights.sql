-- Migration: ajout min_nights aux villas
-- Date: 2026-05-25

ALTER TABLE villas ADD COLUMN IF NOT EXISTS min_nights INTEGER NOT NULL DEFAULT 1;
