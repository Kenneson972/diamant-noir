-- Migration: 20260621230000_pg_cron_migration
-- Description: Activer pg_cron + pg_net, stocker CRON_API_KEY dans Vault, créer 7 jobs cron
-- Target: Supabase project wsdawdxucyuyopkpgjij

-- ============================================================
-- Step 1: Activer les extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA pg_catalog;

-- ============================================================
-- Step 2: Stocker la CRON_API_KEY dans Vault
-- ============================================================
SELECT vault.create_secret(
  'C2D39E6E-2C64-429A-809B-BE29E0839500',
  'CRON_API_KEY',
  'Clé d''authentification pour les appels cron pg_net → API Vercel'
);

-- ============================================================
-- Step 3: Créer les 7 jobs pg_cron
-- ============================================================

-- Job 1: Synchronisation iCal (tous les jours à 3h00)
SELECT cron.schedule(
  'sync-ical',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://kayvila.com/api/sync',
    headers:='{"Authorization":"Bearer C2D39E6E-2C64-429A-809B-BE29E0839500","Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

-- Job 2: Rappels check-in (tous les jours à 8h00)
SELECT cron.schedule(
  'send-checkin-reminders',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://kayvila.com/api/send-checkin-reminders',
    headers:='{"Authorization":"Bearer C2D39E6E-2C64-429A-809B-BE29E0839500","Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

-- Job 3: Demandes d'avis (tous les jours à 10h00)
SELECT cron.schedule(
  'send-review-requests',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url:='https://kayvila.com/api/send-review-requests',
    headers:='{"Authorization":"Bearer C2D39E6E-2C64-429A-809B-BE29E0839500","Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

-- Job 4: Soumissions en attente (toutes les 4 heures)
SELECT cron.schedule(
  'pending-submissions',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url:='https://kayvila.com/api/cron/pending-submissions',
    headers:='{"Authorization":"Bearer C2D39E6E-2C64-429A-809B-BE29E0839500","Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

-- Job 5: Récapitulatif admin quotidien (tous les jours à 13h00)
SELECT cron.schedule(
  'admin-daily-recap',
  '0 13 * * *',
  $$
  SELECT net.http_post(
    url:='https://kayvila.com/api/cron/admin-daily-recap',
    headers:='{"Authorization":"Bearer C2D39E6E-2C64-429A-809B-BE29E0839500","Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

-- Job 6: Récapitulatif admin hebdomadaire (tous les lundis à 13h00)
SELECT cron.schedule(
  'admin-weekly-recap',
  '0 13 * * 1',
  $$
  SELECT net.http_post(
    url:='https://kayvila.com/api/cron/admin-weekly-recap',
    headers:='{"Authorization":"Bearer C2D39E6E-2C64-429A-809B-BE29E0839500","Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

-- Job 7: Villas fantômes (tous les vendredis à 13h00)
SELECT cron.schedule(
  'ghost-villas',
  '0 13 * * 5',
  $$
  SELECT net.http_post(
    url:='https://kayvila.com/api/cron/ghost-villas',
    headers:='{"Authorization":"Bearer C2D39E6E-2C64-429A-809B-BE29E0839500","Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
