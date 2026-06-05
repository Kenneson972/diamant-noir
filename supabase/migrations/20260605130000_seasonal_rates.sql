-- Migration : tarifs saisonniers par villa (remplace progressivement villas.seasonal_prices JSON)
CREATE TABLE IF NOT EXISTS seasonal_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID REFERENCES villas(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_per_night INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seasonal_rates_villa
  ON seasonal_rates (villa_id, start_date, end_date);

ALTER TABLE seasonal_rates ENABLE ROW LEVEL SECURITY;
