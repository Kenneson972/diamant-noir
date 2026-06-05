-- Migration : créer stripe_disputes (si pas déjà fait) + ajouter booking_id
-- La migration 20260526_stripe_disputes.sql n'a jamais été appliquée en prod

CREATE TABLE IF NOT EXISTS stripe_disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id TEXT NOT NULL UNIQUE,
  charge_id TEXT,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount_cents INTEGER,
  reason TEXT,
  status TEXT DEFAULT 'needs_response',
  evidence_due_by TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE stripe_disputes ENABLE ROW LEVEL SECURITY;

-- Index pour lookup par booking
CREATE INDEX IF NOT EXISTS idx_stripe_disputes_booking_id ON stripe_disputes(booking_id);
