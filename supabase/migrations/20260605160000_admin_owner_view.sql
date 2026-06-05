-- Migration : vue agrégée propriétaires pour dashboard admin
-- + colonne suspended sur profiles

-- 1. Ajouter la colonne suspended si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false;

-- 2. Vue agrégée pour la liste admin (lite — sans métriques lourdes)
CREATE OR REPLACE VIEW admin_owner_summary AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.avatar_url,
  p.role,
  p.created_at,
  p.suspended,
  p.stripe_connect_account_id,
  p.stripe_connect_onboarding_completed,
  COUNT(v.id) AS villa_count,
  COUNT(v.id) FILTER (WHERE v.is_published) AS published_count,
  COALESCE(AVG(v.commission_rate), 0.25) AS avg_commission
FROM profiles p
LEFT JOIN villas v ON v.owner_id = p.id
WHERE p.role = 'owner'
GROUP BY p.id;

GRANT SELECT ON admin_owner_summary TO authenticated;
GRANT SELECT ON admin_owner_summary TO service_role;
