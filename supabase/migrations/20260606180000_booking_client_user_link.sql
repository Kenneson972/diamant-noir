-- Lier les réservations au compte auth (espace client) + RLS case-insensitive

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_client_user_id ON public.bookings(client_user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_email_lower ON public.bookings(lower(guest_email));

DROP POLICY IF EXISTS "tenant_own_bookings" ON public.bookings;
CREATE POLICY "tenant_own_bookings" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    (
      guest_email IS NOT NULL
      AND lower(guest_email) = lower((auth.jwt() ->> 'email'))
    )
    OR (client_user_id IS NOT NULL AND client_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tenant_own_bookings_update" ON public.bookings;
CREATE POLICY "tenant_own_bookings_update" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    (
      guest_email IS NOT NULL
      AND lower(guest_email) = lower((auth.jwt() ->> 'email'))
    )
    OR (client_user_id IS NOT NULL AND client_user_id = auth.uid())
  )
  WITH CHECK (
    (
      guest_email IS NOT NULL
      AND lower(guest_email) = lower((auth.jwt() ->> 'email'))
    )
    OR (client_user_id IS NOT NULL AND client_user_id = auth.uid())
  );

-- Backfill : lier les réservations existantes aux comptes par email
UPDATE public.bookings b
SET guest_email = lower(trim(b.guest_email))
WHERE b.guest_email IS NOT NULL
  AND b.guest_email <> lower(trim(b.guest_email));

UPDATE public.bookings b
SET client_user_id = p.id
FROM public.profiles p
WHERE b.client_user_id IS NULL
  AND b.guest_email IS NOT NULL
  AND p.email IS NOT NULL
  AND lower(b.guest_email) = lower(p.email);
