-- Migration: Missing villa columns (2026-05-28)
-- Ajoute 5 colonnes manquantes sur la table villas

ALTER TABLE public.villas
  ADD COLUMN IF NOT EXISTS wifi_name TEXT,
  ADD COLUMN IF NOT EXISTS wifi_password TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS checkout_instructions TEXT,
  ADD COLUMN IF NOT EXISTS local_recommendations JSONB DEFAULT '[]';
