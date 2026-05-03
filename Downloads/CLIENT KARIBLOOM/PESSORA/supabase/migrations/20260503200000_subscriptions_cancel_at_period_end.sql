-- Add cancel_at_period_end column to subscriptions table
-- Persists Stripe's cancel_at_period_end flag for admin Stripe management

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;
