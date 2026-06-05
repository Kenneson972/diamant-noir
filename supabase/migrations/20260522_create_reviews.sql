-- ═══════════════════════════════════════════════════════════════════
-- Migration : table reviews v2 — Avis publics avec guest_name
-- ═══════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS public.reviews CASCADE;

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id uuid REFERENCES public.villas(id) ON DELETE CASCADE,
  booking_id uuid,
  guest_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_auth" ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
