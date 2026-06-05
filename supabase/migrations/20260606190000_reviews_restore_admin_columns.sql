-- Restore moderation columns on reviews (dropped by 20260522_create_reviews.sql)
-- Required by admin/avis, admin dashboard KPIs (pendingReviews, avg rating)

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Existing rows from v2 were publicly visible → treat as approved
UPDATE public.reviews
SET status = 'approved'
WHERE status IS NULL;

ALTER TABLE public.reviews
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  ALTER TABLE public.reviews
    ADD CONSTRAINT reviews_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- RLS: public reads approved only; admin moderates; guests manage own reviews
DROP POLICY IF EXISTS reviews_select ON public.reviews;
DROP POLICY IF EXISTS anyone_read_approved ON public.reviews;
DROP POLICY IF EXISTS guest_own ON public.reviews;
DROP POLICY IF EXISTS admin_all ON public.reviews;
DROP POLICY IF EXISTS reviews_insert_auth ON public.reviews;

CREATE POLICY anyone_read_approved ON public.reviews
  FOR SELECT
  USING (
    status = 'approved'
    OR auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY reviews_insert_auth ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY guest_own ON public.reviews
  FOR ALL
  TO authenticated
  USING (guest_id IS NOT NULL AND guest_id = auth.uid())
  WITH CHECK (guest_id IS NOT NULL AND guest_id = auth.uid());

CREATE POLICY admin_all ON public.reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_reviews_villa
  ON public.reviews (villa_id, status, created_at DESC);
