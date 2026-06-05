-- Runs after espace_client_tenant.sql (lexicographic "t" > "e"):
-- 0) Ensure columns required by tenant RLS (may be missing if only partial SQL was applied)
-- 1) Safe view for public availability (no guest PII)
-- 2) Remove permissive SELECT on full bookings for anon/authenticated
-- 3) Allow tenant to UPDATE own row (checklist_state, etc.)
-- 4) Tighten support_tickets RLS (drop ota-migration permissive policies)
--
-- IMPORTANT: exécuter le script ENTIER depuis la ligne 1 (pas seulement les CREATE POLICY).

-- ─── 0a. public.bookings : colonnes espace client / checklist ───────────────
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS checklist_state JSONB DEFAULT '{}'::jsonb;

-- ─── 0b. public.support_tickets : guest_email si table créée sans cette colonne
-- (CREATE TABLE IF NOT EXISTS ne rajoute pas les colonnes sur une table existante.)
DO $$
BEGIN
  IF to_regclass('public.support_tickets') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS guest_email TEXT';
  END IF;
END $$;

-- ─── 1. Calendar view: only non-sensitive columns ───────────────────────────
CREATE OR REPLACE VIEW public.booking_calendar_slots
WITH (security_invoker = false)
AS
SELECT
  villa_id,
  start_date,
  end_date
FROM public.bookings
WHERE status IN ('pending', 'confirmed');

COMMENT ON VIEW public.booking_calendar_slots IS
  'Availability only (villa_id + date range). Exposed to anon for calendar UI; no guest PII.';

GRANT SELECT ON public.booking_calendar_slots TO anon, authenticated, service_role;

-- ─── 2. Stop leaking full booking rows to the public API ────────────────────
DROP POLICY IF EXISTS "bookings_public_read" ON public.bookings;

-- ─── 3. Tenant (authenticated, magic link / email match) can update own booking
DROP POLICY IF EXISTS "tenant_own_bookings_update" ON public.bookings;
CREATE POLICY "tenant_own_bookings_update" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    guest_email IS NOT NULL
    AND guest_email = (auth.jwt() ->> 'email')
  )
  WITH CHECK (
    guest_email = (auth.jwt() ->> 'email')
  );

-- ─── 4. support_tickets: remove overly broad policies from legacy ota script ──
DROP POLICY IF EXISTS "support_tickets_auth_all" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_public_insert" ON public.support_tickets;
DROP POLICY IF EXISTS "tenant_own_tickets" ON public.support_tickets;

CREATE POLICY "tenant_own_tickets" ON public.support_tickets
  FOR ALL
  TO authenticated
  USING (guest_email = (auth.jwt() ->> 'email'))
  WITH CHECK (guest_email = (auth.jwt() ->> 'email'));
