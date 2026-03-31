-- Migration: Espace Client Locataire
-- Table support_tickets + RLS policies

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  guest_email TEXT NOT NULL,
  villa_id UUID REFERENCES villas(id),
  issue_type TEXT CHECK (issue_type IN ('technical', 'cleaning', 'appliance', 'other')),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- RLS : locataire voit seulement ses tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_own_tickets" ON support_tickets
  FOR ALL USING (guest_email = auth.jwt() ->> 'email');

-- RLS sur bookings : locataire voit seulement ses réservations
-- (vérifier si la policy n'existe pas déjà avant de créer)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings' AND policyname = 'tenant_own_bookings'
  ) THEN
    EXECUTE 'CREATE POLICY "tenant_own_bookings" ON bookings
      FOR SELECT USING (guest_email = auth.jwt() ->> ''email'')';
  END IF;
END $$;
