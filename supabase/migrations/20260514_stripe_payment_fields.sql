-- Ajout des colonnes de suivi des frais et paiement Stripe
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cleaning_fee DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
