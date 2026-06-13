-- 20260613_proprio_fixes.sql
-- Kayvila Espace Propriétaire — Fixes & Améliorations (2026-06-13)

-- ─── 1. Nouvelles colonnes sur villas ──────────────────────────────────────
ALTER TABLE villas
  ADD COLUMN IF NOT EXISTS bedrooms int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS welcome_booklet_url text,
  ADD COLUMN IF NOT EXISTS cancellation_template text DEFAULT 'moderate'
    CHECK (cancellation_template IN ('flexible','moderate','strict')),
  ADD COLUMN IF NOT EXISTS cancellation_notes text,
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2) NOT NULL DEFAULT 25.00;

-- ─── 2. Colonne tracking envoi livret sur reservations ────────────────────
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS welcome_booklet_sent_at timestamptz;

-- ─── 3. Table blocages de dates propriétaire ──────────────────────────────
CREATE TABLE IF NOT EXISTS villa_date_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id uuid NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_villa_date_blocks_range
  ON villa_date_blocks (villa_id, start_date, end_date);

ALTER TABLE villa_date_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manage_date_blocks" ON villa_date_blocks
  USING (
    villa_id IN (SELECT id FROM villas WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    villa_id IN (SELECT id FROM villas WHERE owner_id = auth.uid())
  );

-- ─── 4. Table messages contact propriétaire ───────────────────────────────
CREATE TABLE IF NOT EXISTS owner_contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  villa_id uuid REFERENCES villas(id),
  subject text NOT NULL CHECK (subject IN ('reversement','disponibilites','contrat','autre')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE owner_contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_own_messages" ON owner_contact_messages
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─── 5. Config saisons ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seasons_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  season_type text NOT NULL CHECK (season_type IN ('high','mid','low','school_holidays')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  occupancy_threshold int NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE seasons_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_seasons" ON seasons_config FOR SELECT USING (true);
CREATE POLICY "admin_manage_seasons" ON seasons_config
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Données Martinique 2026 par défaut
INSERT INTO seasons_config (year, season_type, start_date, end_date, occupancy_threshold) VALUES
  (2026, 'high', '2026-07-01', '2026-08-31', 75),
  (2026, 'high', '2026-12-20', '2027-01-05', 75),
  (2026, 'school_holidays', '2026-02-14', '2026-03-02', 75),
  (2026, 'school_holidays', '2026-04-18', '2026-05-04', 75),
  (2026, 'mid', '2026-06-01', '2026-06-30', 50),
  (2026, 'mid', '2026-09-01', '2026-10-31', 50),
  (2026, 'low', '2026-11-01', '2026-11-30', 25),
  (2026, 'low', '2026-01-06', '2026-02-13', 25),
  (2026, 'low', '2026-03-03', '2026-04-17', 25)
ON CONFLICT DO NOTHING;

-- ─── 6. Cache stats saisonnières ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owner_stats_snapshots (
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  year int NOT NULL,
  villa_id uuid REFERENCES villas(id),
  seasonal jsonb NOT NULL DEFAULT '[]',
  monthly jsonb NOT NULL DEFAULT '[]',
  threshold_line jsonb NOT NULL DEFAULT '[]',
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, year, villa_id)
);
ALTER TABLE owner_stats_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_own_stats" ON owner_stats_snapshots
  USING (owner_id = auth.uid());

-- ─── 7. Trigger invalidation cache stats après changement réservation ─────
CREATE OR REPLACE FUNCTION invalidate_owner_stats_snapshot()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE owner_stats_snapshots
  SET computed_at = NULL
  WHERE villa_id = COALESCE(NEW.villa_id, OLD.villa_id)
    AND year = EXTRACT(year FROM COALESCE(NEW.start_date, OLD.start_date))::int;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_invalidate_owner_stats ON reservations;
CREATE TRIGGER trg_invalidate_owner_stats
  AFTER INSERT OR UPDATE OR DELETE ON reservations
  FOR EACH ROW EXECUTE FUNCTION invalidate_owner_stats_snapshot();

-- ─── 8. RPC conflict guard pour blocages de dates ─────────────────────────
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_villa_id uuid,
  p_start date,
  p_end date
) RETURNS int LANGUAGE sql STABLE AS $$
  SELECT COUNT(*)::int
  FROM reservations
  WHERE villa_id = p_villa_id
    AND status IN ('confirmed', 'paid')
    AND daterange(start_date::date, end_date::date, '[)') &&
        daterange(p_start, p_end, '[)');
$$;

-- ─── 9. Storage bucket pour livrets d'accueil (privé) ────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'welcome-booklets',
  'welcome-booklets',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Owners can upload booklets to their villas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'welcome-booklets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM villas WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can read their villa booklets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'welcome-booklets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM villas WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Service role can read all booklets"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'welcome-booklets');
