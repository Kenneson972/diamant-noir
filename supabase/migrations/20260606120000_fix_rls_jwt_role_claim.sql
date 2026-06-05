-- Migration : correction claim JWT RLS (RBAC critique)
-- auth.jwt() ->> 'role' = rôle DB ('authenticated') — FAUX pour le RBAC métier
-- auth.jwt() -> 'user_metadata' ->> 'role' = rôle métier ('admin', 'owner', …)

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_requests') THEN
    EXECUTE 'DROP POLICY IF EXISTS contact_requests_select_admin ON contact_requests';
    EXECUTE $p$
      CREATE POLICY contact_requests_select_admin ON contact_requests
      FOR SELECT USING (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
      )
    $p$;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'villa_events') THEN
    EXECUTE 'DROP POLICY IF EXISTS villa_events_select_admin ON villa_events';
    EXECUTE $p$
      CREATE POLICY villa_events_select_admin ON villa_events
      FOR SELECT USING (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
      )
    $p$;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'villa_submissions') THEN
    EXECUTE 'DROP POLICY IF EXISTS villa_submissions_select_admin ON villa_submissions';
    EXECUTE 'DROP POLICY IF EXISTS villa_submissions_update_admin ON villa_submissions';
    EXECUTE $p$
      CREATE POLICY villa_submissions_select_admin ON villa_submissions
      FOR SELECT USING (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
      )
    $p$;
    EXECUTE $p$
      CREATE POLICY villa_submissions_update_admin ON villa_submissions
      FOR UPDATE USING (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
      )
    $p$;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_chat_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS admin_chat_logs_select_admin ON admin_chat_logs';
    EXECUTE $p$
      CREATE POLICY admin_chat_logs_select_admin ON admin_chat_logs
      FOR SELECT USING (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
      )
    $p$;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_action_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS ai_action_logs_insert_admin ON ai_action_logs';
    EXECUTE 'DROP POLICY IF EXISTS ai_action_logs_select_admin ON ai_action_logs';
    EXECUTE $p$
      CREATE POLICY ai_action_logs_insert_admin ON ai_action_logs
      FOR INSERT WITH CHECK (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
      )
    $p$;
    EXECUTE $p$
      CREATE POLICY ai_action_logs_select_admin ON ai_action_logs
      FOR SELECT USING (
        auth.role() = 'service_role'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
      )
    $p$;
  END IF;
END $$;
