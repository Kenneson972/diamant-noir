-- Diamant Noir V1 — migrations à exécuter dans Supabase (SQL Editor)
-- Tables et colonnes pour soumissions villa, contact, et extensions villas/bookings.

-- 1. Table des soumissions de villas (propriétaires)
CREATE TABLE IF NOT EXISTS villa_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  villa_name TEXT,
  villa_location TEXT,
  villa_description TEXT,
  airbnb_url TEXT,
  no_photos BOOLEAN DEFAULT false,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'info_requested')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table des demandes de contact (formulaire contact)
CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Colonne guest_email sur bookings (pour envoi mail confirmation)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- 4. Colonne owner_id pour espace client propriétaire (lié à auth.users)
ALTER TABLE villas ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- 5. Colonnes fiche villa : conditions annulation, règlement, sécurité, carte
ALTER TABLE villas ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE villas ADD COLUMN IF NOT EXISTS house_rules TEXT;
ALTER TABLE villas ADD COLUMN IF NOT EXISTS safety_info TEXT;
ALTER TABLE villas ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE villas ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE villas ADD COLUMN IF NOT EXISTS map_embed_url TEXT;

-- 6. (Optionnel) Table analytics par villa pour Phase 3
CREATE TABLE IF NOT EXISTS villa_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID REFERENCES villas(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'booking')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_villa_events_villa_id ON villa_events(villa_id);
CREATE INDEX IF NOT EXISTS idx_villa_events_created_at ON villa_events(created_at);

-- RLS : insertion publique (formulaires), lecture/modification via service role uniquement
ALTER TABLE villa_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert villa_submissions" ON villa_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert contact_requests" ON contact_requests FOR INSERT WITH CHECK (true);
