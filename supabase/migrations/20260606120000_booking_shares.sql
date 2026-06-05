-- Tokens de partage séjour (UUID, expiration 7j)
CREATE TABLE IF NOT EXISTS public.booking_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_shares_token ON public.booking_shares(token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_shares_booking_unique ON public.booking_shares(booking_id);

ALTER TABLE public.booking_shares ENABLE ROW LEVEL SECURITY;

-- Lecture publique via token gérée côté serveur (service_role / route API)
-- Pas de policy anon directe sur bookings
