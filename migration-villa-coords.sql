-- ============================================================
-- Migration : coordonnées géographiques pour la carte interactive
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================

-- Ajouter latitude / longitude sur les villas
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Exemples de mise à jour manuelle (à adapter selon vos villas réelles)
-- UPDATE public.villas SET latitude = 43.2677, longitude = 6.6406 WHERE name ILIKE '%saint-tropez%';
-- UPDATE public.villas SET latitude = 43.5528, longitude = 7.0174 WHERE name ILIKE '%cannes%';
