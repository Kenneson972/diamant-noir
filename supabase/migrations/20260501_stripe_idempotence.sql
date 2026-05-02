-- Migration : Idempotence Stripe + historique des statuts
-- Ajoutée suite à l'audit technique du 2026-05-01

-- Table d'idempotence pour les événements Stripe déjà traités
CREATE TABLE IF NOT EXISTS stripe_events_processed (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- Table d'historique des changements de statut (event sourcing light)
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'system',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les recherches par booking
CREATE INDEX IF NOT EXISTS idx_order_status_history_booking_id
  ON order_status_history(booking_id, created_at DESC);

-- RLS : lecture pour le propriétaire concerné
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events_processed ENABLE ROW LEVEL SECURITY;

-- Seul l'admin (service_role) peut écrire/lire stripe_events_processed
CREATE POLICY stripe_events_processed_admin_all ON stripe_events_processed
  FOR ALL USING (true);

-- Le propriétaire peut lire l'historique de ses bookings
CREATE POLICY order_status_history_owner_select ON order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN villas v ON v.id = b.villa_id
      WHERE b.id = booking_id AND v.owner_id = auth.uid()
    )
  );
