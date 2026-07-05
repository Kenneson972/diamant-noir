# Alertes proactives → notifications in-app (admin + proprio)

**Date** : 2026-07-05
**Statut** : En cours d'implémentation (Claude Code)
**Périmètre** : dashboard admin + dashboard propriétaire

→ Design complet dans le fichier source ou gbrain `kayvila/design/alertes-proactives-notifications`

## Résumé

5 détecteurs pg_cron écrivent dans `notifications` en plus des emails Resend existants :

| Détecteur | Type | Destination |
|---|---|---|
| pending-submissions | `pending_submission` | Admin (1/soumission) |
| ghost-villas | `ghost_villa` | Admin (1/villa) |
| admin-daily-recap | `admin_daily_recap` | Admin (1/run si signal) |
| admin-weekly-recap | `admin_weekly_recap` | Admin (1/run si signal) |
| owner-daily-digest (NEW) | `owner_daily_digest` | Proprio (1/jour/si signal) |

**Changement front** : ajouter les 4 nouveaux types à `TYPE_CONFIG` dans NotificationBell.tsx
**Nettoyage** : supprimer `app/api/agent/owners-digest-context/route.ts` (ancien endpoint n8n)
