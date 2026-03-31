-- ============================================================
-- Migration : Hub OTA multi-sources — Diamant Noir
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Étendre la contrainte source pour accepter tous les OTAs
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_source_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_source_check
  CHECK (source IN ('airbnb', 'expedia', 'trivago', 'vrbo', 'booking', 'direct'));


-- 2. Ajouter external_id s'il n'existe pas
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS external_id text;


-- 3. Contrainte unicité villa_id + external_id (remplace l'ancienne)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_villa_external_id_unique;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_start_date_end_date_source_villa_id_key;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_villa_external_id_unique
  UNIQUE (villa_id, external_id);


-- 4. Colonne ota_channels dans villas
-- Format JSON : [{"source":"airbnb","ical_url":"...","label":"Airbnb"}]
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.villas
  ADD COLUMN IF NOT EXISTS ota_channels jsonb DEFAULT '[]'::jsonb;


-- 5. Migration automatique : ical_url → ota_channels (sans écraser)
-- ─────────────────────────────────────────────────────────────
UPDATE public.villas
SET ota_channels = jsonb_build_array(
  jsonb_build_object(
    'source', 'airbnb',
    'ical_url', ical_url,
    'label', 'Airbnb'
  )
)
WHERE ical_url IS NOT NULL
  AND (ota_channels IS NULL OR ota_channels = '[]'::jsonb);


-- 6. Index pour les performances de sync
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_source
  ON public.bookings(source);

CREATE INDEX IF NOT EXISTS idx_bookings_villa_source
  ON public.bookings(villa_id, source);

CREATE INDEX IF NOT EXISTS idx_bookings_external_id
  ON public.bookings(external_id);


-- 7. Corriger le RLS manquant sur les 3 tables sensibles
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- chat_logs : lecture/écriture uniquement par authentifiés
DROP POLICY IF EXISTS "chat_logs_auth_all" ON public.chat_logs;
CREATE POLICY "chat_logs_auth_all"
  ON public.chat_logs FOR ALL
  USING (auth.role() = 'authenticated');

-- admin_chat_logs : idem
DROP POLICY IF EXISTS "admin_chat_logs_auth_all" ON public.admin_chat_logs;
CREATE POLICY "admin_chat_logs_auth_all"
  ON public.admin_chat_logs FOR ALL
  USING (auth.role() = 'authenticated');

-- support_tickets : lecture/écriture pour authentifiés, insert public
DROP POLICY IF EXISTS "support_tickets_auth_all" ON public.support_tickets;
CREATE POLICY "support_tickets_auth_all"
  ON public.support_tickets FOR ALL
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "support_tickets_public_insert" ON public.support_tickets;
CREATE POLICY "support_tickets_public_insert"
  ON public.support_tickets FOR INSERT
  WITH CHECK (true);


-- ✅ Migration terminée
-- Vérification rapide :
SELECT
  column_name, data_type
FROM information_schema.columns
WHERE table_name = 'villas'
  AND column_name = 'ota_channels';

SELECT
  con.conname, con.consrc
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'bookings'
  AND con.contype = 'c';
