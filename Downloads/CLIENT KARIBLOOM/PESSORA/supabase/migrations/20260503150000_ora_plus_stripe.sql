-- 1. Ajouter stripe_customer_id sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 2. Ajouter stripe_price_id + current_period_end sur subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- 3. Migration one-shot : abonnés actifs starter/premium/vip → ora_plus
UPDATE public.subscriptions
SET plan = 'ora_plus'
WHERE plan IN ('starter', 'premium', 'vip')
  AND status = 'active';
