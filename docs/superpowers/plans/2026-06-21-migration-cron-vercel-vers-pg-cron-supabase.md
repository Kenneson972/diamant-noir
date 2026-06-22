# Migration Cron Vercel → pg_cron Supabase — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer les 7 crons de vercel.json vers pg_cron Supabase (pg_net → API routes Vercel)

**Architecture:** pg_cron (Supabase) → pg_net.http_post → GET /api/cron/* (Vercel). Zéro changement dans les routes API ou la logique métier. Auth via Bearer CRON_API_KEY stockée dans Supabase Vault.

**Tech Stack:** Supabase pg_cron 1.6.4, pg_net 0.19.5, Supabase Vault, Next.js 15

## Global Constraints

- CRON_API_KEY: `C2D39E6E-2C64-429A-809B-BE29E0839500`
- Base URL production: `https://kayvila.com`
- Ne pas modifier les routes API existantes ni `lib/proactive/*.ts`
- Ne pas toucher aux tests vitest
- Vercel Hobby : plus aucun cron dans vercel.json après migration

---

### Task 1: Migration Supabase — extensions + Vault + 7 jobs pg_cron

**Files:**
- Create: `supabase/migrations/20260621230000_pg_cron_migration.sql`

**Interfaces:**
- Produces: 7 cron jobs actifs dans pg_cron, clé stockée dans Vault

- [ ] **Step 1: Écrire la migration SQL**

```sql
-- 1. Activer les extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA pg_catalog;

-- 2. Stocker la CRON_API_KEY dans Vault
SELECT vault.create_secret(
  'CRON_API_KEY',
  'C2D39E6E-2C64-429A-809B-BE29E0839500',
  'Clé d''authentification pour les appels cron pg_net → API Vercel'
);

-- 3. Configurer pg_cron pour charger la clé au démarrage
-- (pg_cron lit les custom_variable_classes depuis postgresql.conf,
--  mais on peut utiliser current_setting avec un SET LOCAL dans chaque job)
--  Alternative : passer la clé directement dans le header de chaque job.

-- 4. Créer les 7 jobs
-- Note: pg_net.http_post retourne un id de requête, pas la réponse HTTP.
-- Les headers doivent être en JSON.

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
```

- [ ] **Step 2: Appliquer la migration sur Supabase**

Utiliser l'outil `apply_migration` Supabase MCP avec le nom `20260621230000_pg_cron_migration` et le SQL ci-dessus.

- [ ] **Step 3: Vérifier que les extensions sont actives**

```sql
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```
Expected: pg_cron 1.6.4, pg_net 0.19.5

- [ ] **Step 4: Vérifier que les 7 jobs sont enregistrés**

```sql
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
```
Expected: 7 rows, tous `active: true`

- [ ] **Step 5: Vérifier que le secret est dans Vault**

```sql
SELECT name, description FROM vault.secrets WHERE name = 'CRON_API_KEY';
```
Expected: 1 row

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260621230000_pg_cron_migration.sql
git commit -m "feat(cron): migration pg_cron — 7 jobs + Vault CRON_API_KEY"
```

---

### Task 2: Nettoyer vercel.json

**Files:**
- Modify: `vercel.json`

**Interfaces:**
- Consumes: Task 1 (pg_cron jobs actifs)
- Produces: vercel.json sans bloc crons

- [ ] **Step 1: Supprimer le bloc crons de vercel.json**

Avant :
```json
{
  "installCommand": "npm ci --legacy-peer-deps",
  "crons": [
    { "path": "/api/sync", "schedule": "0 3 * * *" },
    ...7 entrées...
  ]
}
```

Après :
```json
{
  "installCommand": "npm ci --legacy-peer-deps"
}
```

- [ ] **Step 2: Commit et push**

```bash
git add vercel.json
git commit -m "fix(cron): retirer crons Vercel → migrés vers pg_cron Supabase"
git push origin main
```

- [ ] **Step 3: Vérifier que Vercel déploie sans erreur**

```bash
vercel --prod --yes
```
Expected: déploiement Ready, plus d'erreur "Hobby accounts are limited to daily cron jobs"

---

### Task 3: Ajouter CRON_API_KEY dans Vercel (manuel)

**Action manuelle** — à faire dans le dashboard Vercel :

1. Aller sur https://vercel.com → kayvila → Settings → Environment Variables
2. Ajouter :
   - **Key:** `CRON_API_KEY`
   - **Value:** `C2D39E6E-2C64-429A-809B-BE29E0839500`
   - **Environment:** Production
3. Redéployer pour appliquer (le push de Task 2 déclenchera un déploiement automatique)

---

### Task 4: Vérification end-to-end

- [ ] **Step 1: Vérifier les logs pg_cron**

```sql
SELECT jobname, start_time, status, return_message 
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```
Expected: jobs avec status 'succeeded' (peut prendre quelques heures selon les schedules)

- [ ] **Step 2: Vérifier que les jobs sont correctement programmés**

```sql
SELECT jobname, schedule, active, last_run_time FROM cron.job ORDER BY jobname;
```
Expected: 7 jobs, tous `active: true`

- [ ] **Step 3: Test manuel — déclencher un job immédiatement**

```sql
-- Déclencher le daily-recap manuellement pour tester
SELECT cron.schedule('test-daily-recap', '*/1 * * * *', 
$$
  SELECT net.http_post(
    url:='https://kayvila.com/api/cron/admin-daily-recap',
    headers:='{"Authorization":"Bearer C2D39E6E-2C64-429A-809B-BE29E0839500","Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
$$
);

-- Attendre 1-2 minutes puis vérifier les logs
SELECT jobname, start_time, status, return_message 
FROM cron.job_run_details 
WHERE jobname = 'test-daily-recap' 
ORDER BY start_time DESC LIMIT 5;

-- Nettoyer le job de test
SELECT cron.unschedule('test-daily-recap');
```

---

### Task 5: Nettoyage final

- [ ] **Step 1: Commit final si nécessaire**

```bash
git status
git push origin main
```

- [ ] **Step 2: Mettre à jour la mémoire**

Mettre à jour `project_kayvila_21juin2026_agent_c_proactive.md` avec le statut de la migration pg_cron.
