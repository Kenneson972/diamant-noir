-- Colonne slug manquante en prod — requêtes admin propriétaires échouaient silencieusement

ALTER TABLE public.villas
  ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE public.villas
SET slug = id::text
WHERE slug IS NULL OR slug = '';

CREATE INDEX IF NOT EXISTS idx_villas_slug ON public.villas (slug);
