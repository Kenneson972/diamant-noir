CREATE TABLE IF NOT EXISTS stripe_disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id TEXT NOT NULL UNIQUE,
  charge_id TEXT,
  amount_cents INTEGER,
  reason TEXT,
  status TEXT DEFAULT 'needs_response',
  evidence_due_by TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE stripe_disputes ENABLE ROW LEVEL SECURITY;
