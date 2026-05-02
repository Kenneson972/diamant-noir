-- PESSORA — Prix multi-tailles pour les boissons bar
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_small  numeric,
  ADD COLUMN IF NOT EXISTS price_medium numeric,
  ADD COLUMN IF NOT EXISTS price_large  numeric;

COMMENT ON COLUMN public.products.price_small  IS 'Prix format Petit (ex: 8€ énergie, 10€ shakes)';
COMMENT ON COLUMN public.products.price_medium IS 'Prix format Moyen — prix de référence affiché par défaut';
COMMENT ON COLUMN public.products.price_large  IS 'Prix format Grand (ex: 12€ énergie, 16€ shakes)';
