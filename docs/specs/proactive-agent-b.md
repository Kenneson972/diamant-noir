# Spec — Couche proactive Agent B (Kayvibot Propriétaire)

**Date** : 2026-06-20
**Statut** : Design validé — implémentation à venir
**Projet** : Kayvila (Supabase `DIAMANT NOIR` = `wsdawdxucyuyopkpgjij`, prod `kayvila.vercel.app`)

## Objectif

Rendre l'agent B (Kayvibot Propriétaire) **proactif** : au lieu de ne répondre que sur sollicitation, il envoie chaque matin (8h Martinique) un **digest chaleureux et utile** à chaque propriétaire actif, affiché en haut de son dashboard. Résume check-ins/outs du jour, tâches urgentes/en retard, revenus du mois, alertes.

Exemple de ton attendu :
> « Bonjour ! Aujourd'hui, 2 arrivées à prévoir : Villa Azur (M. Dupont) à 15h et Villa Corail (Mme Martin) à 17h. Vous avez 1 tâche en retard : "Réparer climatisation Villa Azur". Côté revenus, 4 200 € ce mois-ci. Bonne journée ! »

Message **chaleureux**, pas un rapport froid.

## Contexte vérifié (live)

- Rôle propriétaire en base = **`owner`** (table `profiles`, 3 owners). Pas de table `users`.
- Table **`notifications` existante et réutilisée** : `id uuid, type text (check), title text, body text, metadata jsonb, action_url text default '/dashboard/proprio', is_read boolean, read_at timestamptz, created_at timestamptz, user_id uuid`. RLS = service-role uniquement (`service_insert`, `service_all`) ; pas de policy SELECT authentifié → la lecture UI passe par un endpoint service-role.
- `buildOwnerContextPackCached(admin, ownerId)` dans `lib/owner-assistant-context.ts` → logique de contexte éprouvée (today, alerts, revenus, tâches, villas, bookings).
- Pattern cron existant : `verifyApiKey(request)` (`lib/auth/server.ts`, lit Bearer = `CRON_API_KEY` ou `CRON_SECRET`), utilisé par `app/api/send-checkin-reminders`, `send-review-requests`, `sync`.
- Agent B = workflow n8n `q4DAjw1uG19fDfr8` (`docs/n8n/kayvibot-agent-b-proprietaire-fusion.json`), credentials `DIAMANT NOIR` (Postgres) + `KARIBLOOM DEEPSEEK`.

## Décisions de design

1. **Réutiliser `notifications`** (validé) — pas de nouvelle table. Nouvelle valeur de type `owner_daily_digest`.
2. **Cron ≠ token utilisateur** : `/api/agent/owner-context` est token-gated (anti-IDOR) → inutilisable par un cron. Le cron passe par un **endpoint interne protégé par secret** (`CRON_API_KEY`) qui réutilise `buildOwnerContextPackCached`.
3. **Dédup** : un digest max par owner par jour, géré **côté endpoint de contexte** (exclut les owners ayant déjà un digest du jour en timezone Martinique). Cron idempotent, pas d'index dédié.
4. **Insert** : n8n insère directement dans `notifications` via sa credential Postgres (pattern existant « n8n insère ici »).

## Architecture

### Migration SQL
Ajouter `owner_daily_digest` au `check` constraint de `notifications.type` (ALTER, même forme que `20260616000002_notifications_types_agents.sql`). Fichier : `supabase/migrations/<date>_notifications_owner_daily_digest.sql`. Appliquer via Supabase MCP `apply_migration` sur `wsdawdxucyuyopkpgjij`.

### Endpoints (Next.js App Router, `runtime = "nodejs"`)

**`GET /api/agent/owners-digest-context`** (nouveau)
- Auth : `verifyApiKey(request)` → 401 sinon.
- Logique : sélectionne les `profiles` `role='owner'` n'ayant **pas** de notif `type='owner_daily_digest'` créée aujourd'hui (date Martinique). Pour chacun, `context = buildOwnerContextPackCached(admin, owner.id)` (ou sa forme compacte `ownerContextToStatsPayload`).
- Réponse : `{ owners: [{ owner_id, context }] }`.

**`/api/dashboard/proactive-notifications`** (nouveau)
- `GET` : auth Bearer (`getUserFromRequest`, comme owner-assistant). Renvoie le dernier digest **non lu** de l'utilisateur : `select ... from notifications where user_id=<token user> and type='owner_daily_digest' and is_read=false order by created_at desc limit 1`. Service-role (`supabaseAdmin`). `{ notification: {...} | null }`.
- `PATCH` : auth Bearer. Body `{ id }`. Vérifie que la notif appartient à l'utilisateur, puis `update ... set is_read=true, read_at=now()`. `{ success }`.
- `export const runtime = "nodejs"`.

### n8n — branche cron (ajout au workflow B, branche webhook intacte)
Nœuds ajoutés (déconnectés de la branche webhook) :
1. **Schedule Trigger** — cron `0 8 * * *`, `settings.timezone='America/Martinique'` sur le workflow.
2. **HTTP GET** `https://kayvila.vercel.app/api/agent/owners-digest-context`, header `Authorization: Bearer {{ $env... }}` → en pratique mettre la valeur `CRON_API_KEY` en dur dans le nœud (n8n ne lit pas `$env` sur Cloud — cf. LEARNINGS). **Le header, jamais le query param** (cf. bug owner-context).
3. **Split Out** sur `owners` → un item par owner.
4. **LLM Chain (DeepSeek)** — `@n8n/n8n-nodes-langchain.chainLlm` + sous-nœud `lmChatDeepSeek` (credential `KARIBLOOM DEEPSEEK`, model `deepseek-v4-pro`). Prompt : générer un message chaleureux (texte brut, zéro markdown/emoji excessif) à partir de `{{ $json.context }}`, en français, ton de l'exemple ci-dessus.
5. **Postgres INSERT** dans `public.notifications` : `user_id={{ owner_id }}`, `type='owner_daily_digest'`, `title='Votre point du jour'`, `body={{ message }}`, `action_url='/dashboard'`, `metadata={{ counts }}`.

Pas de Respond node (déclencheur cron, pas webhook).

### Frontend
- **`hooks/useProactiveNotification.ts`** : `getAuthHeader()` (réutilise le pattern de `useCopilot` : `getSupabaseBrowser().auth.getSession()` → Bearer). `GET` au montage ; expose `{ notification, loading, markAsRead(id) }` (PATCH).
- **`components/dashboard/ProactiveNotification.tsx`** : carte en haut du dashboard, charte or/navy (pas de redesign), titre + message + bouton « Marquer comme lu ». `null` si pas de notif ou après lecture.
- Injection dans `app/(proprio)/dashboard/page.tsx`, en tête du contenu principal.
- **`components/dashboard/NotificationBell.tsx`** : exclure `type='owner_daily_digest'` de sa requête (éviter le doublon avec la carte).

## Tests
1. **API** (Playwright API ou script authentifié) : login proprio → `GET /api/dashboard/proactive-notifications` renvoie le digest ; `PATCH` → `is_read=true`.
2. **n8n** : exécuter le cron manuellement via l'API n8n (ou bouton « Execute ») → vérifier qu'une ligne `notifications` `owner_daily_digest` est créée pour un owner sans digest du jour, et qu'un 2e run ne duplique pas (dédup).
3. **E2E Playwright** : dashboard proprio (compte `proprio1@test.com`) affiche la carte `ProactiveNotification` → clic « Marquer comme lu » → la carte disparaît, et un reload ne la réaffiche pas.

## Dépendances / à fournir
- Valeur de **`CRON_API_KEY`** (Vercel) pour configurer le header du nœud HTTP n8n — ou en générer une et l'ajouter aux env Vercel.

## Règles dures respectées
- Zéro redesign (or `#d4af37` / navy, Instrument Sans / Playfair / Sora, radius anguleux).
- `client.config.ts` source de vérité (aucune donnée marque/NAP en dur).
- Double quotes pour apostrophes FR dans les strings JS.
- Branche webhook B intacte ; RLS service-role inchangée ; pas de fonctions Server→Client.
- `npx tsc --noEmit` avant push ; vérifier `vercel ls --prod` Ready (pas juste l'exit code).
- n8n : auth par **header** (pas query), pas de `$env`/`process.env` (bloqués sur Cloud).

## Point de reprise
Implémentation non démarrée. Prochaine étape : `writing-plans` → plan d'implémentation détaillé, puis exécution dans l'ordre : migration → endpoints → n8n → frontend → tests.
