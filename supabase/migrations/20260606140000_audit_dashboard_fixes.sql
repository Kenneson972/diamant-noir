-- Audit dashboard 2026-06-06 : RLS staff, assignee_id, admin_audit_log, chat admin, conciergerie INSERT

-- ── admin_audit_log ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_audit_log_service ON admin_audit_log;
CREATE POLICY admin_audit_log_service ON admin_audit_log
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── requests.assignee_id ─────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requests') THEN
    EXECUTE 'ALTER TABLE requests ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL';
  END IF;
END $$;

-- ── bookings : staff admin lecture/écriture ──────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    EXECUTE 'DROP POLICY IF EXISTS staff_admin_bookings_select ON bookings';
    EXECUTE 'DROP POLICY IF EXISTS staff_admin_bookings_mutate ON bookings';
    EXECUTE $p$
      CREATE POLICY staff_admin_bookings_select ON bookings
      FOR SELECT USING (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    $p$;
    EXECUTE $p$
      CREATE POLICY staff_admin_bookings_mutate ON bookings
      FOR ALL USING (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
      WITH CHECK (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    $p$;
  END IF;
END $$;

-- ── chat_messages : lecture admin ────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    EXECUTE 'DROP POLICY IF EXISTS chat_messages_admin_select ON chat_messages';
    EXECUTE 'DROP POLICY IF EXISTS chat_messages_admin_insert ON chat_messages';
    EXECUTE $p$
      CREATE POLICY chat_messages_admin_select ON chat_messages
      FOR SELECT USING (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    $p$;
    EXECUTE $p$
      CREATE POLICY chat_messages_admin_insert ON chat_messages
      FOR INSERT WITH CHECK (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    $p$;
  END IF;
END $$;

-- ── requests / reviews : profiles.role OU JWT metadata admin ─────────────────
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requests') THEN
    EXECUTE 'DROP POLICY IF EXISTS requests_admin_all ON requests';
    EXECUTE $p$
      CREATE POLICY requests_admin_all ON requests
      FOR ALL USING (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
      WITH CHECK (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    $p$;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    EXECUTE 'DROP POLICY IF EXISTS reviews_admin_all ON reviews';
    EXECUTE $p$
      CREATE POLICY reviews_admin_all ON reviews
      FOR ALL USING (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
      WITH CHECK (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    $p$;
  END IF;
END $$;

-- ── conciergerie_settings : INSERT admin ─────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conciergerie_settings') THEN
    EXECUTE 'DROP POLICY IF EXISTS conciergerie_settings_insert_admin ON conciergerie_settings';
    EXECUTE $p$
      CREATE POLICY conciergerie_settings_insert_admin ON conciergerie_settings
      FOR INSERT WITH CHECK (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    $p$;
  END IF;
END $$;
