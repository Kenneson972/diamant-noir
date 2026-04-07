-- Libellés d'équipements marqués comme issus d'un import OTA (sous-ensemble de amenities).
ALTER TABLE public.villas
  ADD COLUMN IF NOT EXISTS amenities_import_labels TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.villas.amenities_import_labels IS
  'Sous-ensemble de amenities dont la présence a été suggérée par un import (Airbnb, etc.). Mise à jour côté dashboard.';
