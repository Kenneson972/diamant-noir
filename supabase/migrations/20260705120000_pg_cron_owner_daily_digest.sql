-- Migration: 20260705120000_pg_cron_owner_daily_digest
-- Description: Ajoute le job pg_cron pour le digest quotidien propriétaire (remplace le workflow n8n mort depuis le 20/06)
-- Target: Supabase project wsdawdxucyuyopkpgjij

SELECT cron.schedule(
  'owner-daily-digest',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url:='https://kayvila.com/api/cron/owner-daily-digest',
    headers:='{"Authorization":"Bearer C2D39E6E-2C64-429A-809B-BE29E0839500","Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
