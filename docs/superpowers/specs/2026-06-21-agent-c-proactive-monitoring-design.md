# Design — Agent C / Monitoring Proactif Admin (Kayvila)

> Date : 2026-06-21
> Statut : approuvé (brainstorming)
> Périmètre : détecteurs proactifs admin **100% app-side** (Vercel Cron + Resend templaté). Zéro n8n, zéro DeepSeek.

## Contexte et constat

Le prompt source (`~/Downloads/prompt-claude-agents-b-c-proactifs.md`) demande de rendre les Agents B & C proactifs (récaps email via Resend) + 5 détecteurs cron (args).

**Exploration — déjà fait (ne pas refaire) :**
- **Agent B proactif = 100% livré et déployé** (2026-06-20) : `app/api/agent/owners-digest-context`, `app/api/dashboard/proactive-notifications` (GET+PATCH), `components/dashboard/ProactiveNotification.tsx`, `hooks/useProactiveNotification.ts`, exclusion `NotificationBell`, migration `owner_daily_digest`, branche cron n8n B (Schedule 8h MQ → Split → DeepSeek → Insert digest → Resend proprio). **→ toute la « priorité 1 » du prompt est faite.**
- **Nouvelle soumission villa emaile déjà l'admin** (`app/api/villa-submissions/route.ts` → `ADMIN_NOTIFICATION_EMAIL`).
- **Vercel Cron est déjà la convention de planification** (`vercel.json` : `/api/sync` 3h, `/api/send-checkin-reminders` 8h, `/api/send-review-requests` 10h).

**Briques réutilisées :**
- `verifyApiKey(request)` (`lib/auth/server.ts`) — accepte `CRON_API_KEY` **et** `CRON_SECRET` (Vercel Cron).
- `lib/resend.ts` — `getResend()`, `RESEND_FROM`, `ADMIN_NOTIFICATION_EMAIL` (`equipe@kayvila.com`), `isResendConfigured()`.
- `lib/emails/send.ts` — senders admin typés existants (`sendAdminDisputeAlertEmail`, etc.).
- `lib/admin-assistant-context.ts` — fonctions pures `computeOccupancyByVilla`, `computeHealthScores`, `computeAdminAlerts`, `DailyBriefing`.

## Décisions de brainstorming

1. **Sous-système unique « Agent C / Monitoring Proactif »** (un spec + un plan). Agent B = hors périmètre (déjà fait).
2. **Architecture 100% app-side** : Vercel Cron → endpoint `GET /api/cron/<detector>` (gaté `verifyApiKey`) → helper pur (requête + décision, testable vitest) → email templaté admin via `lib/emails/send.ts`. **Pas de n8n, pas de DeepSeek** (emails admin factuels = templates précis/scannables > prose IA).
3. **Consolidation des signaux du lundi** en UN récap hebdo (évite 3-4 emails le lundi) : CA semaine + anomalie CA>30% + proprios inactifs 14j + top villas + leads convertis + tendances.
4. **Proprios inactifs** : source = `auth.users.last_sign_in_at` via `supabaseAdmin().auth.admin.listUsers()` croisé `profiles.role='owner'` (profiles n'a aucune date de connexion).
5. **Alertes temps réel** : soumission villa déjà couverte ; on ajoute seulement l'email admin manquant pour `hot_lead` et `ical_error`, greffé sur les chemins d'événement existants (pas de cron).

**Contraintes (du prompt) :** zéro redesign ; `client.config.ts`/`lib/resend.ts` = source de vérité (jamais hardcoder marque/email/URL) ; double quotes pour apostrophes FR ; `npx tsc --noEmit` avant commit.

## Architecture

```
Vercel Cron (vercel.json)
   → GET /api/cron/<detector>            (coquille : verifyApiKey → helper → email)
        → lib/proactive/<detector>.ts    (fonction pure : requête Supabase + décision)
        → lib/emails/send.ts             (sender templaté → ADMIN_NOTIFICATION_EMAIL)
        → table proactive_alerts_sent    (dédup par item pour les détecteurs récurrents)
```

Principe : endpoints minces, logique en helpers purs testables, envoi via la couche email typée existante.

## Unités de travail

### Unité 0 — Socle partagé
- **Migration** `proactive_alerts_sent (id, detector text, ref_id text, sent_at timestamptz default now(), unique(detector, ref_id))` — dédup par item (soumissions>48h, villas fantômes). RLS service-role only.
- **`lib/proactive/dedup.ts`** : `filterAlreadyAlerted(detector, ids[]) → ids[] nouveaux` + `markAlerted(detector, ids[])`.
- **`lib/proactive/martinique-time.ts`** : helper « est-ce le 1er run de la journée MQ ? » si besoin (sinon dédup par item suffit).
- **`lib/emails/admin-proactive.ts`** (ou extension de `lib/emails/send.ts`) : senders templatés admin — `sendAdminDailyRecapEmail`, `sendAdminPendingSubmissionsEmail`, `sendAdminWeeklyRecapEmail`, `sendAdminGhostVillasEmail`, `sendAdminHotLeadEmail`, `sendAdminIcalErrorEmail`. HTML sobre (or `#d4af37`/navy, pas de redesign), `from: RESEND_FROM`, `to: [ADMIN_NOTIFICATION_EMAIL]`.

### Unité 1 — Récap quotidien admin (`0 13 * * *`, 9h MQ)
- `GET /api/cron/admin-daily-recap` → `lib/proactive/daily-recap.ts` : agrège le jour (nouvelles soumissions, nouveaux leads `notifications` type hot_lead/owner_lead, résas créées, villas modifiées si dispo, erreurs iCal du jour) → email templaté. Réutilise les computes de `lib/admin-assistant-context.ts` si pertinent.
- Pas de dédup (1 run/jour, période bornée). Email seulement si au moins un signal non nul.

### Unité 2 — Soumissions en attente >48h (`0 */4 * * *`)
- `GET /api/cron/pending-submissions` → `lib/proactive/pending-submissions.ts` : `villa_submissions` `status='pending'` ET `created_at < now()-48h`. Dédup par `ref_id = submission.id` via `proactive_alerts_sent` (detector `pending_submission`) → n'emaile que les NOUVELLES soumissions ayant franchi 48h depuis le dernier run. Email listant ces nouvelles ; marque-les alertées.

### Unité 3 — Récap hebdomadaire (`0 13 * * 1`, lundi 9h MQ)
- `GET /api/cron/admin-weekly-recap` → `lib/proactive/weekly-recap.ts` agrège :
  - **CA semaine** vs semaine précédente (`bookings.total_price_cents`, statut payé/confirmé, fenêtre par `created_at` ou `start_date` — à figer dans le plan) + **flag anomalie si baisse >30%**.
  - **Proprios inactifs 14j** : `auth.admin.listUsers()` × `profiles.role='owner'`, `last_sign_in_at < now()-14j`.
  - **Top villas** (occupation/résas), **leads convertis** (résas issues de leads), **tendances vs mois précédent**.
  - Un seul email récap. Pas de dédup (1 run/semaine).

### Unité 4 — Villas fantômes (`0 13 * * 5`, vendredi 9h MQ)
- `GET /api/cron/ghost-villas` → `lib/proactive/ghost-villas.ts` : villas `is_published=false` OU `ical_url IS NULL`, `created_at < now()-30j`. Dédup par `ref_id = villa.id` (detector `ghost_villa`) → n'emaile que les nouvelles détectées. Email = suggestion nettoyage/relance.

### Unité 5 — Alertes temps réel (événementiel, pas cron)
- **hot_lead** : dans `app/api/chat/route.ts` `notifyHotLeadOnce`, ajouter l'envoi `sendAdminHotLeadEmail` (en plus de la notif in-app). Respecter le throttle existant.
- **ical_error** : sur le chemin qui crée les notifs `ical_error` (`/api/sync`), ajouter `sendAdminIcalErrorEmail`. Dédup par erreur si nécessaire.
- **soumission villa** : DÉJÀ fait → ne pas dupliquer.

### Unité 6 — Enregistrement des crons
- Ajouter les 4 entrées dans `vercel.json` `crons` (UTC) : `admin-daily-recap` `0 13 * * *`, `pending-submissions` `0 */4 * * *`, `admin-weekly-recap` `0 13 * * 1`, `ghost-villas` `0 13 * * 5`. (Vercel Pro requis pour fréquence sous-quotidienne / >2 crons — déjà le cas, 3 crons existants.)

## Gestion d'erreurs & idempotence
- Endpoint : 401 si `verifyApiKey` échoue ; si `!isResendConfigured()` → 200 no-op loggé.
- try/catch par détecteur → log + 200 (un échec n'interrompt pas les futurs runs).
- **Anti-spam** : email uniquement si signal non vide ; détecteurs récurrents (soumissions, villas fantômes) dédupliqués par item via `proactive_alerts_sent` ; récaps bornés par période.

## Tests
- **vitest** sur chaque helper pur (`lib/proactive/*.ts`) : fenêtres de dates, seuil anomalie CA (>30% et limite), listes vides → pas d'email, dédup (item déjà alerté exclu).
- **Pas de test E2E cron** (déclenchement Vercel) → vérif manuelle `curl -H "Authorization: Bearer $CRON_API_KEY"`.

## Hors périmètre
- Agent B proactif (déjà livré).
- Récap email Agent B (déjà dans le workflow B).
- Toute branche n8n (architecture choisie = app-side).
- Redesign UI.

## Fichiers touchés (prévision)
| Fichier | Nature |
|---|---|
| `supabase/migrations/*_proactive_alerts_sent.sql` | table dédup |
| `lib/proactive/dedup.ts`, `daily-recap.ts`, `pending-submissions.ts`, `weekly-recap.ts`, `ghost-villas.ts` | helpers purs |
| `lib/emails/admin-proactive.ts` | senders templatés |
| `app/api/cron/admin-daily-recap/route.ts`, `pending-submissions/route.ts`, `admin-weekly-recap/route.ts`, `ghost-villas/route.ts` | endpoints |
| `app/api/chat/route.ts`, chemin iCal (`/api/sync`) | alertes temps réel hot_lead + ical_error |
| `vercel.json` | 4 crons |
| `tests/*` (vitest) | helpers purs |
