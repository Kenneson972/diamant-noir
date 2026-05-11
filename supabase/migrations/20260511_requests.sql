CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  message TEXT,
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_booking ON requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_requests_guest ON requests(guest_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allergies TEXT,
  ADD COLUMN IF NOT EXISTS special_occasion TEXT,
  ADD COLUMN IF NOT EXISTS special_occasion_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_arrival TEXT,
  ADD COLUMN IF NOT EXISTS needs_baby_bed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS needs_high_chair BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS id_document_url TEXT;

ALTER TABLE villas
  ADD COLUMN IF NOT EXISTS house_manual JSONB;
