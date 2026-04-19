-- docs/supabase_migration_dashboard.sql
-- À exécuter dans Supabase > SQL Editor

-- ── 1. Helper admin (security definer évite la récursion RLS) ──────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── 2. profiles: colonne préférences ──────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferences jsonb
  DEFAULT '{"notifications": true, "newsletter": true}'::jsonb;

-- ── 3. Politique RLS profiles: membres lisent le leur, admins lisent tout ─
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- ── 4. subscriptions: admins lisent tout ──────────────────────────────────
DROP POLICY IF EXISTS "Users can read own subscription" ON public.subscriptions;
CREATE POLICY "Users can read own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- ── 5. events: nouvelles colonnes ─────────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS meeting_point text,
  ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS registration_open boolean DEFAULT true;

-- Étendre le type CHECK pour inclure 'bilan'
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_type_check
  CHECK (type IN ('run_club', 'popup', 'atelier', 'event', 'partenariat', 'bilan'));

-- ── 6. orders: colonnes Stripe (future intégration) ───────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- ── 7. event_registrations: admins gèrent tout ────────────────────────────
DROP POLICY IF EXISTS "Admins manage all registrations" ON public.event_registrations;
CREATE POLICY "Admins manage all registrations"
  ON public.event_registrations FOR ALL
  USING (public.is_admin());

-- ── 8. products: admins gèrent ────────────────────────────────────────────
DROP POLICY IF EXISTS "Only admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Only admins can update products" ON public.products;
DROP POLICY IF EXISTS "Only admins can delete products" ON public.products;
CREATE POLICY "Admins manage products"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
