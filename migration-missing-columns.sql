-- ============================================================
-- Migration : colonnes manquantes pour les pages publiques
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================

-- Villas : galerie multi-photos
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Villas : publication (true = visible sur le site public)
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Villas : équipements (liste)
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

-- Villas : détail des chambres (JSON)
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS rooms_details JSONB DEFAULT '[]';

-- Villas : URL Airbnb d'origine (import)
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS airbnb_url TEXT;

-- Bookings : email invité (confirmation mail)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Bookings : numéro de téléphone invité
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- Bookings : nombre de voyageurs
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guests INTEGER DEFAULT 1;

-- Bookings : ID Stripe payment intent
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Bookings : statut paiement
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Bookings : ID externe (sync iCal/Airbnb)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Contrainte unicité pour sync iCal (si pas déjà existante)
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_start_date_end_date_source_villa_id_key;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_villa_id_external_id_key;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_villa_id_external_id_key UNIQUE (villa_id, external_id);

-- Publier toutes les villas existantes qui n'ont pas encore is_published défini
UPDATE public.villas SET is_published = true WHERE is_published IS NULL;
