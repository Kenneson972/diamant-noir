-- Table seasonal_rates pour la tarification saisonnière
CREATE TABLE IF NOT EXISTS seasonal_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_per_night INTEGER NOT NULL, -- en centimes
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_seasonal_rates_villa ON seasonal_rates(villa_id);
CREATE INDEX idx_seasonal_rates_dates ON seasonal_rates(start_date, end_date);

-- RLS
ALTER TABLE seasonal_rates ENABLE ROW LEVEL SECURITY;

-- Admin : tout
CREATE POLICY "Admins can manage seasonal rates" ON seasonal_rates
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner', 'proprio')
  ));

-- Tout le monde peut lire
CREATE POLICY "Anyone can read seasonal rates" ON seasonal_rates
  FOR SELECT
  USING (true);
