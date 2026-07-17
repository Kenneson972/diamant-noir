ok # Migration Cron Vercel → pg_cron Supabase

**Date** : 2026-06-21
**Statut** : ✅ Design approuvé
**Motivation** : Vercel Hobby limite les crons à 1/jour ; `0 */4 * * *` bloqué au déploiement.

## Architecture

```
AVANT : Vercel Cron (vercel.json) → GET /api/cron/* (Next.js)
APRÈS : pg_cron (Supabase) → pg_net.http_post → GET /api/cron/* (Vercel)
```

- **Zéro changement** dans les routes API, la logique `lib/proactive/*.ts`, ou les tests vitest.
- Les endpoints Next.js restent hébergés sur Vercel (Hobby OK — seule la fonctionnalité Cron est limitée, pas les requêtes HTTP entrantes).
- pg_cron déclenche, pg_net appelle l'URL avec `Authorization: Bearer <CRON_API_KEY>`.

## Sécurité

1. **`CRON_API_KEY` stockée dans Supabase Vault** (`vault.secrets`) — pas en clair.
2. Au démarrage de pg_cron, chargement dans `current_setting('app.cron_api_key')`.
3. Les endpoints vérifient le Bearer via `verifyApiKey()` (existant, inchangé).
4. Communication pg_net → Vercel en HTTPS.

## Les 7 jobs

| Nom pg_cron | Schedule (UTC) | Endpoint | MQ |
|---|---|---|---|
| `sync-ical` | `0 3 * * *` | `/api/sync` | 23h |
| `send-checkin-reminders` | `0 8 * * *` | `/api/send-checkin-reminders` | 4h |
| `send-review-requests` | `0 10 * * *` | `/api/send-review-requests` | 6h |
| `pending-submissions` | `0 */4 * * *` | `/api/cron/pending-submissions` | Toutes les 4h |
| `admin-daily-recap` | `0 13 * * *` | `/api/cron/admin-daily-recap` | 9h |
| `admin-weekly-recap` | `0 13 * * 1` | `/api/cron/admin-weekly-recap` | 9h lundi |
| `ghost-villas` | `0 13 * * 5` | `/api/cron/ghost-villas` | 9h vendredi |

## Fichiers modifiés

| Fichier | Action |
|---|---|
| `vercel.json` | Supprimer entièrement le bloc `crons` |
| Supabase | Migration SQL : activer `pg_cron` + `pg_net`, créer les 7 jobs, stocker `CRON_API_KEY` dans Vault |
| `.env.local` / Vercel env | Aucun changement requis côté code |

## Plan d'implémentation

1. Générer une `CRON_API_KEY` (ex: `uuidgen`)
2. Migration Supabase : `CREATE EXTENSION IF NOT EXISTS pg_cron`, `CREATE EXTENSION IF NOT EXISTS pg_net`
3. Stocker la clé dans Vault : `SELECT vault.create_secret('CRON_API_KEY', '<clé>')`
4. Configurer `pg_cron` pour lire la clé au démarrage
5. Créer les 7 jobs `cron.schedule(...)` avec `net.http_post`
6. Ajouter `CRON_API_KEY` dans les env vars Vercel (pour `verifyApiKey`)
7. Supprimer le bloc `crons` de `vercel.json`
8. Déployer et vérifier les logs pg_cron
