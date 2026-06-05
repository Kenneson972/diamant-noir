-- Standardisation admin Supabase Kayvila
-- 1. Fonction is_staff_admin() = source unique pour les policies admin
-- 2. profiles + villas : admin via profiles.role (pas seulement JWT metadata)
-- 3. seasonal_rates : policies manquantes après migration 20260605130000

-- ── Helper admin (profiles.role OU JWT metadata OU service_role) ─────────────
CREATE OR REPLACE FUNCTION public.is_staff_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_staff_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff_admin() TO authenticated, service_role;

-- ── profiles : lecture admin ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin read all" ON profiles;
CREATE POLICY "admin read all" ON profiles
  FOR SELECT USING (public.is_staff_admin());

-- ── villas : CRUD admin + lecture proprio/public ─────────────────────────────
DROP POLICY IF EXISTS villas_select_owner_admin ON villas;
CREATE POLICY villas_select_owner_admin ON villas
  FOR SELECT USING (
    is_published = true
    OR owner_id = auth.uid()
    OR public.is_staff_admin()
  );

DROP POLICY IF EXISTS villas_insert_admin_only ON villas;
CREATE POLICY villas_insert_admin_only ON villas
  FOR INSERT WITH CHECK (public.is_staff_admin());

DROP POLICY IF EXISTS villas_update_owner_admin ON villas;
CREATE POLICY villas_update_owner_admin ON villas
  FOR UPDATE USING (
    owner_id = auth.uid() OR public.is_staff_admin()
  )
  WITH CHECK (
    owner_id = auth.uid() OR public.is_staff_admin()
  );

DROP POLICY IF EXISTS villas_delete_owner_admin ON villas;
CREATE POLICY villas_delete_owner_admin ON villas
  FOR DELETE USING (
    owner_id = auth.uid() OR public.is_staff_admin()
  );

-- ── seasonal_rates : policies perdues ────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage seasonal rates" ON seasonal_rates;
DROP POLICY IF EXISTS "Anyone can read seasonal rates" ON seasonal_rates;
DROP POLICY IF EXISTS seasonal_rates_admin_all ON seasonal_rates;
DROP POLICY IF EXISTS seasonal_rates_public_read ON seasonal_rates;

CREATE POLICY seasonal_rates_public_read ON seasonal_rates
  FOR SELECT USING (true);

CREATE POLICY seasonal_rates_admin_all ON seasonal_rates
  FOR ALL USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

CREATE POLICY seasonal_rates_owner_manage ON seasonal_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM villas v
      WHERE v.id = seasonal_rates.villa_id AND v.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM villas v
      WHERE v.id = seasonal_rates.villa_id AND v.owner_id = auth.uid()
    )
  );

-- ── Alignement policies restantes sur is_staff_admin() ───────────────────────
DO $$
DECLARE
  pol RECORD;
BEGIN
  -- villa_submissions
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'villa_submissions') THEN
    EXECUTE 'DROP POLICY IF EXISTS villa_submissions_select_admin ON villa_submissions';
    EXECUTE 'DROP POLICY IF EXISTS villa_submissions_update_admin ON villa_submissions';
    EXECUTE 'CREATE POLICY villa_submissions_select_admin ON villa_submissions FOR SELECT USING (public.is_staff_admin())';
    EXECUTE 'CREATE POLICY villa_submissions_update_admin ON villa_submissions FOR UPDATE USING (public.is_staff_admin())';
  END IF;

  -- admin_chat_logs
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_chat_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS admin_chat_logs_select_admin ON admin_chat_logs';
    EXECUTE 'CREATE POLICY admin_chat_logs_select_admin ON admin_chat_logs FOR SELECT USING (public.is_staff_admin())';
  END IF;

  -- ai_action_logs
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_action_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS ai_action_logs_insert_admin ON ai_action_logs';
    EXECUTE 'DROP POLICY IF EXISTS ai_action_logs_select_admin ON ai_action_logs';
    EXECUTE 'CREATE POLICY ai_action_logs_insert_admin ON ai_action_logs FOR INSERT WITH CHECK (public.is_staff_admin())';
    EXECUTE 'CREATE POLICY ai_action_logs_select_admin ON ai_action_logs FOR SELECT USING (public.is_staff_admin())';
  END IF;
END $$;
