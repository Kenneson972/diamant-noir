# Alertes proactives → notifications in-app (admin + proprio)

**Date** : 2026-07-05
**Périmètre** : dashboard admin + dashboard propriétaire

## Contexte / diagnostic

Deux causes distinctes font que rien n'apparaît dans les notifications des dashboards :

1. **Admin** : les 4 détecteurs proactifs (`lib/proactive/pending-submissions.ts`,
   `ghost-villas.ts`, `daily-recap.ts`, `weekly-recap.ts`) tournent bien via pg_cron
   (7 jobs actifs, exécutions "succeeded" chaque jour, vérifié en base sur le projet
   Supabase `wsdawdxucyuyopkpgjij`). Mais chacun **envoie uniquement un email Resend**
   (`lib/emails/admin-proactive.ts`) — aucun n'écrit dans la table `notifications`.
   `NotificationBell.tsx` (la cloche admin) ne lit que cette table : les signaux ne
   peuvent donc jamais y apparaître, indépendamment du bon fonctionnement des crons/emails.

2. **Propriétaire** : la carte "Point du jour" (`ProactiveNotification.tsx` /
   `useProactiveNotification.ts`) lit les notifications `type=owner_daily_digest`.
   Vérifié en base : **une seule ligne de ce type a jamais existé** (2026-06-20), aucune
   depuis. Le digest devait être inséré par un workflow n8n externe (le endpoint
   `/api/agent/owners-digest-context` ne fait que fournir le contexte ; c'est n8n qui
   devait écrire la notif). Ce workflow est mort/jamais réimporté depuis son lancement —
   cohérent avec le pattern déjà rencontré sur ce projet (workflows n8n non maintenus).

## Décision

Étendre le pattern existant plutôt que créer un nouveau modèle de données :

- Les 4 détecteurs admin gardent leur comportement email actuel **et** gagnent une
  écriture dans `notifications` (aucune régression, un canal ajouté).
- Le digest propriétaire n8n est remplacé par un 5ᵉ détecteur interne (pg_cron +
  TypeScript), cohérent avec le choix déjà fait pour l'Agent C admin ("zéro n8n").
  Aucun LLM nécessaire : `buildOwnerContextPack` (`lib/owner-assistant-context.ts`)
  fournit déjà des données 100% déterministes (check-in/out du jour, tâches ouvertes,
  alertes calculées, CA mois courant vs précédent).

## Architecture

```
pg_cron (jobs existants, schedules inchangés)
   │
   ├─► /api/cron/pending-submissions   ──┐
   ├─► /api/cron/ghost-villas           ──┤
   ├─► /api/cron/admin-daily-recap      ──┼─► lib/proactive/*.ts
   ├─► /api/cron/admin-weekly-recap     ──┤     │
   └─► /api/cron/owner-daily-digest (NEW)─┘     ├─► email Resend (existant, inchangé)
                                                 └─► INSERT notifications (NOUVEAU)
                                                         │
                                                         ▼
                                     NotificationBell (admin) / ProactiveNotification (proprio)
                                     — Realtime déjà câblé, aucun changement front nécessaire
                                     côté abonnement, seulement TYPE_CONFIG à étendre
```

Un seul nouveau job pg_cron (`owner-daily-digest`, `0 12 * * *` = 8h Martinique — même
créneau visé par l'ancien n8n). Les 6 jobs existants ne changent pas de schedule.

## Détecteurs admin — granularité des notifications

| Détecteur | Granularité | `type` | `action_url` | Dédup |
|---|---|---|---|---|
| `pending-submissions` | 1 notif **par soumission** en attente +24h | `pending_submission` | `/admin/soumissions` | déjà géré par `proactive_alerts_sent` (`ref_id` = submission id) |
| `ghost-villas` | 1 notif **par villa** détectée | `ghost_villa` | `/admin/villas` | idem, `ref_id` = villa id |
| `admin-daily-recap` | 1 notif **agrégée** par run (si `hasSignal`) | `admin_daily_recap` | `/admin/hub-classique` | pas de dédup par item — un run = une notif, ou rien |
| `admin-weekly-recap` | 1 notif agrégée par run | `admin_weekly_recap` | `/admin/revenus` | idem |

Justification : `pending-submissions`/`ghost-villas` ont déjà une dédup **par item**
(`proactive_alerts_sent`), donc une notif par item colle à l'existant et permet un clic
direct vers l'élément concerné. Les recaps quotidien/hebdo sont déjà pensés comme un
digest global (pas de dédup par item dans le code actuel) → une notif unique par run,
avec le corps texte reprenant les mêmes sections que l'email correspondant.

Toutes ces notifications utilisent `user_id: null` (broadcast à tous les admins),
cohérent avec la requête déjà présente dans `NotificationBell.tsx`
(`role === "admin" → user_id is null OR = userId`).

**Changement front requis** : ajouter les 4 nouveaux `type` (`pending_submission`,
`ghost_villa`, `admin_daily_recap`, `admin_weekly_recap`) à `TYPE_CONFIG` dans
`components/dashboard/NotificationBell.tsx` (icône + couleur), sinon ils tombent sur le
fallback visuel `system`.

## Digest propriétaire — remplacement de n8n

Nouveau fichier `lib/proactive/owner-daily-digest.ts`, même forme que `daily-recap.ts` :

1. Récupère tous les `profiles.role = 'owner'`.
2. Pour chacun, appelle `buildOwnerContextPack(admin, ownerId)` — déjà déterministe
   (check-ins/check-outs du jour via `today`, tâches ouvertes via `tasks_open`, alertes
   via `computeOwnerAlerts` déjà présent dans le pack, CA mois courant vs précédent via
   `portfolio`).
3. Si rien de notable pour ce propriétaire aujourd'hui (pas de check-in/out, pas
   d'alerte, pas de tâche ouverte) → **aucune notification** créée (même logique
   `hasSignal` que l'admin recap — pas de bruit inutile).
4. Sinon, construit le texte (sections : "Aujourd'hui", "Alertes", "Tâches en attente")
   et insère une ligne `notifications` : `type: "owner_daily_digest"`,
   `user_id: owner.id`, `action_url: "/dashboard/proprio"`.
5. Dédup "un digest par jour et par propriétaire" : vérifier via une requête sur
   `notifications` où `type=owner_daily_digest AND created_at >= début du jour Martinique`
   (logique déjà présente dans l'ancien `owners-digest-context/route.ts`, à réutiliser
   telle quelle).

Nouvelle route `app/api/cron/owner-daily-digest/route.ts`, même pattern `verifyApiKey`
que les 4 routes cron existantes.

**Nettoyage** : suppression de `app/api/agent/owners-digest-context/route.ts` (ancien
point d'entrée n8n, devient mort code — plus rien n'a besoin de l'appeler).
`ProactiveNotification.tsx` et `useProactiveNotification.ts` ne changent pas : ils
lisent déjà `owner_daily_digest` depuis `notifications`, seule la source d'écriture
change.

## Erreurs, migration DB, tests

**Gestion d'erreur** : l'écriture `notifications` est un ajout, pas un remplacement —
si l'insert échoue (RLS, réseau), on logue (`console.error`) mais on **ne bloque pas**
l'envoi d'email déjà fonctionnel (best-effort, cohérent avec le reste du système
proactif). Chaque fonction `run*` continue de retourner son compteur actuel, inchangé.

**Migration DB** : aucune nouvelle colonne — `notifications.type` est déjà un texte
libre (pas d'enum en base), donc les 4 nouveaux types + `owner_daily_digest` (déjà
existant) n'exigent pas de migration de schéma. Seule migration nécessaire : ajouter
le job pg_cron `owner-daily-digest` (migration SQL du même type que
`20260621230000_pg_cron_migration.sql`, appliquée via Supabase MCP).

**Tests** : chaque `lib/proactive/*.ts` a déjà des `*.test.ts` (Vitest) couvrant les
fonctions pures (`decideXxx`, `buildXxx`). À ajouter :

- Cas de test pour la nouvelle écriture `notifications` sur les 4 détecteurs admin
  (vérifier `type`/`user_id`/`action_url` corrects).
- Tests pour `owner-daily-digest.ts` : dédup par jour, `hasSignal` false → pas de
  notification créée, contenu correct si signal présent.
- Vérifier si `tests/e2e/proactive-notification.spec.ts` couvre un comportement modifié
  par ce changement et l'ajuster si besoin.

Pas de nouveau test Playwright pour la cloche elle-même (déjà testée) — juste vérifier
visuellement que les 4 nouveaux types s'affichent correctement (icône/couleur définies)
sans tomber sur le fallback `system`.

## Hors périmètre

- Pas de nouvelle table ni de UI dédiée "centre d'alertes" (option B écartée par
  l'utilisateur) — on reste sur la cloche `NotificationBell` existante.
- Pas de vérification de la délivrabilité Resend elle-même (les emails admin
  fonctionnaient déjà, aucun changement sur ce point).
