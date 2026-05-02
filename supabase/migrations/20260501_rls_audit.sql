-- Migration : Audit et complément RLS (2026-05-01)
-- Ajoute les policies manquantes et standardise les noms
-- Utilise DO $$ pour vérifier l'existence des tables

DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- 1. contact_requests
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contact_requests') THEN
    EXECUTE 'ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY contact_requests_insert_anon ON contact_requests FOR INSERT WITH CHECK (true)';
    EXECUTE 'CREATE POLICY contact_requests_select_admin ON contact_requests FOR SELECT USING (auth.role() = ''service_role'' OR auth.jwt() ->> ''role'' = ''admin'')';
  END IF;

  -- 2. villa_events
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'villa_events') THEN
    EXECUTE 'ALTER TABLE villa_events ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY villa_events_insert_anon ON villa_events FOR INSERT WITH CHECK (true)';
    EXECUTE 'CREATE POLICY villa_events_select_admin ON villa_events FOR SELECT USING (auth.role() = ''service_role'' OR auth.jwt() ->> ''role'' = ''admin'')';
  END IF;

  -- 3. availability_alerts
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'availability_alerts') THEN
    EXECUTE 'ALTER TABLE availability_alerts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY availability_alerts_insert_anon ON availability_alerts FOR INSERT WITH CHECK (true)';
    EXECUTE 'CREATE POLICY availability_alerts_select_owner ON availability_alerts FOR SELECT USING (EXISTS (SELECT 1 FROM villas v WHERE v.id = villa_id AND v.owner_id = auth.uid()))';
  END IF;

  -- 4. villa_submissions
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'villa_submissions') THEN
    EXECUTE 'ALTER TABLE villa_submissions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY villa_submissions_insert_anon ON villa_submissions FOR INSERT WITH CHECK (true)';
    EXECUTE 'CREATE POLICY villa_submissions_select_admin ON villa_submissions FOR SELECT USING (auth.role() = ''service_role'' OR auth.jwt() ->> ''role'' = ''admin'')';
    EXECUTE 'CREATE POLICY villa_submissions_update_admin ON villa_submissions FOR UPDATE USING (auth.role() = ''service_role'' OR auth.jwt() ->> ''role'' = ''admin'')';
  END IF;

  -- 5. admin_chat_logs
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_chat_logs') THEN
    EXECUTE 'ALTER TABLE admin_chat_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY admin_chat_logs_insert_admin ON admin_chat_logs FOR INSERT WITH CHECK (auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY admin_chat_logs_select_admin ON admin_chat_logs FOR SELECT USING (auth.role() = ''service_role'' OR auth.jwt() ->> ''role'' = ''admin'')';
  END IF;

  -- 6. ai_action_logs
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_action_logs') THEN
    EXECUTE 'ALTER TABLE ai_action_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY ai_action_logs_insert_admin ON ai_action_logs FOR INSERT WITH CHECK (auth.role() = ''service_role'' OR auth.jwt() ->> ''role'' = ''admin'')';
    EXECUTE 'CREATE POLICY ai_action_logs_select_admin ON ai_action_logs FOR SELECT USING (auth.role() = ''service_role'' OR auth.jwt() ->> ''role'' = ''admin'')';
  END IF;

  -- 7. owner_alerts
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'owner_alerts') THEN
    EXECUTE 'ALTER TABLE owner_alerts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY owner_alerts_select_owner ON owner_alerts FOR SELECT USING (owner_id = auth.uid())';
  END IF;

  -- 8. ota_sync_logs
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ota_sync_logs') THEN
    EXECUTE 'ALTER TABLE ota_sync_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY ota_sync_logs_select_owner ON ota_sync_logs FOR SELECT USING (EXISTS (SELECT 1 FROM villas v WHERE v.id = villa_id AND v.owner_id = auth.uid()))';
    EXECUTE 'CREATE POLICY ota_sync_logs_insert_admin ON ota_sync_logs FOR INSERT WITH CHECK (auth.role() = ''service_role'')';
  END IF;

  -- 9. booking_calendar_slots (VIEW — pas besoin de RLS, hérite de la table source)
  -- Skipped

  -- 10. wishlist — ignoré (colonne utilisateur à vérifier manuellement)

END $$;

-- Index sécurisés — vérifie colonne avant de créer
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'villas' AND column_name = 'owner_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_villas_owner_id ON villas(owner_id)';
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'villa_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_bookings_villa_id ON bookings(villa_id)';
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'villa_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_tasks_villa_id ON tasks(villa_id)';
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)';
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'villa_events' AND column_name = 'villa_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_villa_events_villa_id ON villa_events(villa_id)';
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wishlist' AND column_name = 'user_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id)';
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'owner_alerts' AND column_name = 'owner_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_owner_alerts_owner_id ON owner_alerts(owner_id)';
  END IF;
END $$;
