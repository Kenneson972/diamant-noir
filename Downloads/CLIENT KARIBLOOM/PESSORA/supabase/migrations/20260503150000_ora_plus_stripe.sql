-- 1. Ajouter stripe_customer_id sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 2. Ajouter stripe_price_id sur subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- 3. Ajouter current_period_end sur subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- 4. Contrainte CHECK : seuls 'free' et 'ora_plus' sont valides après migration
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check
    CHECK (plan IN ('free', 'ora_plus'));

-- 5. Index partiel unique sur stripe_customer_id (un client Stripe = un profil)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_key
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- 6. Index sur stripe_subscription_id (lookup clé dans les webhooks)
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx
  ON public.subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- 7. Migration one-shot : abonnés actifs starter/premium/vip → ora_plus
-- One-shot irreversible migration: consolidates legacy plan values.
-- starter/premium/vip are no longer valid after this migration.
UPDATE public.subscriptions
SET plan = 'ora_plus'
WHERE plan IN ('starter', 'premium', 'vip')
  AND status = 'active';
