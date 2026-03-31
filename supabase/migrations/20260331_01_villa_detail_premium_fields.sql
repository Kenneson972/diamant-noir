-- Villa detail premium fields (data-driven public villa page)
-- Safe additive migration: nullable + defaults to avoid regressions.

ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS bathrooms_count INTEGER;
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS surface_m2 INTEGER;
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS check_in_time TEXT;
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS check_out_time TEXT;
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS environment TEXT;

ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS nearby_points TEXT[] DEFAULT '{}';
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS equipment_interior TEXT[] DEFAULT '{}';
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS equipment_exterior TEXT[] DEFAULT '{}';

ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS included_services_home TEXT[] DEFAULT '{}';
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS included_services_collection TEXT[] DEFAULT '{}';
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS a_la_carte_services TEXT[] DEFAULT '{}';

ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS collection_tier TEXT DEFAULT 'signature';
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS booking_terms JSONB DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'villas_collection_tier_check'
  ) THEN
    ALTER TABLE public.villas
      ADD CONSTRAINT villas_collection_tier_check
      CHECK (collection_tier IN ('signature', 'iconic'));
  END IF;
END $$;
