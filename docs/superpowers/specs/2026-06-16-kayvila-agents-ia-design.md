# Spec — Amélioration des 3 Agents IA Kayvila

> Projet : Kayvila (diamant-noir) · Date : 2026-06-16
> Branche cible : à créer depuis `main` (commit c2b23dc)
> Auteur design : Kenneson (validé en brainstorming)
> Source : `brief-claude-agents-ia-kayvila.txt` (Élise) + extensions Agent C

---

## 1. Contexte & objectif

Les 3 agents IA (workflows n8n + routes API) sont conçus mais pas encore branchés. On veut les **muscler avant mise en prod**. Le brainstorming a recadré le périmètre après vérification du code réel : plusieurs items du brief (C1 fallback, C3 actions) sont **déjà livrés** ; le vrai chantier est l'Agent A (conversion) et la proactivité B/C.

**Périmètre validé (un lot par agent) :**
- **Agent A (Visiteur)** — bi-tunnel : A1 dispos temps réel · A2 pré-booking · A3 qualification lead · **+ tunnel acquisition propriétaire**.
- **Agent B (Propriétaire)** — B1 : 5 alertes proactives calculées live.
- **Agent C (Admin)** — copilot intelligent, socle : L1 briefing · L2 recommandations actionnables · L3 comparaison inter-villas · L4 score santé villa · L9 fenêtre maintenance · C2 proactivité · confirmation actions destructives.

**Approche : ③ Hybride phasé.**
- **Phase 1** = couche code Next.js + migrations + tests, mergeable seule (le mode démo reste fonctionnel sans n8n).
- **Phase 2** = mise à jour des 3 workflows n8n en `-v3`.

---

## 2. Contraintes (dures)

- **NE PAS TOUCHER** : `/app/api/stripe/`, `/app/api/webhooks/`, `app/api/villa-submissions/` (envoie des emails), templates `emails/`, edge functions, tests E2E, fichiers `send-*`.
- **TypeScript strict** : `npx tsc --noEmit` doit passer.
- **Sécu** : JWT via Supabase Auth API (pas de decode local), rate limiting conservé, RLS via `is_staff_admin()`.
- **Fallback** : tout appel externe (n8n) dégrade proprement (déjà en place A/B/C).
- **Mémoire** : Agent A = pas de gbrain (visiteur) ; B & C = gbrain recall+capture (inchangé).
- **Notifications : in-app uniquement** (table `notifications`, broadcast `user_id` null). Pas de dépendance Telegram/email pour les alertes.
- **Pas de cron** : tout calcul d'alerte est live au rendu / à la requête.
- **Pas de hardcode** : marque/NAP/URLs/chiffres lus depuis `CLIENT` config, `data/conciergerie-faq.ts`, ou placeholders n8n (`VOTRE-DOMAINE`).
- **Disponibilité** : pré-calcul dans le contexte, **zéro requête DB par message visiteur** (cache mémoire ~5 min).

---

## 3. État réel vérifié (avant travaux)

| Item brief | État réel (vérifié dans le code) |
|---|---|
| A1 calendrier temps réel | À faire — `canVerifyAvailability: false`, `villa-context.ts` ne renvoie aucune dispo |
| A2 pré-booking | À faire — `canCreateBooking: false`, champ `preBooking` parsé mais aucun endpoint |
| A3 qualification lead | Demi-fait — `leadTemperature`/`leadUpdate` parsés mais jamais exploités pour notifier |
| C1 fallback admin | **DÉJÀ FAIT** — `admin/chat/route.ts` lignes 340-369 (fallback gracieux + stats) |
| C3 actions admin | **DÉJÀ FAIT à 90%** — `CREATE_TASK`, `UPDATE_TASK_STATUS`, `UPDATE_SUBMISSION_STATUS`, `COMPLETE_TASK`, `BLOCK_DATE`, `UPDATE_BOOKING`. Manque : confirmation destructive |
| B1 alertes proactives | Infra prête (`owner_alerts` table + GET snapshot) mais **rien ne peuple/calcule** les 5 types |

**Faits de schéma live confirmés :**
- `bookings` : `status`, `payment_status`, `price`, `total_price_cents`, `villa_id`, `created_at`, `start_date`, `end_date`. **Pas** de `cancellation_reason` → on peut compter les annulations, pas leur motif.
- `reviews` : `rating` (int), `status`, `villa_id` → satisfaction par villa = `avg(rating)` des avis `approved`.
- `villas` : `price_per_night`, `seasonal_prices` (jsonb, existe), `owner_id`, `cancellation_policy`.
- `profiles` : **pas** de `last_sign_in`/`last_active` → churn proprio se base sur l'absence de résa, pas le login.
- `notifications.type` : **CHECK figé** = `['villa_submission','booking_new','booking_confirmed','ical_error','availability_alert','system','request_update','checkin_reminder','checkout_reminder','new_message']` → migration requise pour de nouveaux types.

---

## 4. Agent A — Visiteur (bi-tunnel)

### 4.1 A1 — Disponibilités pré-calculées

**Nouveau module `lib/chatbot/availability.ts`**
- `computeVillaAvailability()` : pour chaque villa publiée, depuis `bookings` (status confirmé + `payment_status='paid'`/`confirmed`) + `villa_date_blocks` → produit par villa :
  - `bookedRanges: { start: string; end: string }[]`
  - `nextAvailableFrom: string | null`
  - `isAvailableNow: boolean`
- Cache mémoire TTL ~5 min (même pattern que `buildOwnerContextPackCached`). Zéro requête DB par message.

**`lib/chatbot/villa-context.ts`** — fusionne ces champs dans chaque `VillaContextItem` (types à étendre dans `types/chatbot.ts`).

**`app/api/chat/route.ts`** — `capabilities.canVerifyAvailability: true`.

### 4.2 A2 — Pré-booking

**Nouveau `app/api/chat/pre-book/route.ts` (POST)**
- Entrée (sanitizée) : `{ sessionId, villaId, startDate, endDate, email, guests, name? }`.
- Effets :
  1. Insert `pre_booking_requests` (cf. §7 migration).
  2. Insert `notifications` broadcast admin (`user_id` null, `type='pre_booking'`).
  3. Renvoie `bookingUrl` pré-rempli vers la page de réservation existante (`?villa=&start=&end=&guests=`).
- N'appelle **jamais** Stripe ni `villa-submissions`. Réutilise rate-limit + sanitize de `chat/route.ts`.
- `chat/route.ts` : `capabilities.canCreateBooking: true` (sémantique = pré-booking).

### 4.3 A3 — Qualification lead

Dans `app/api/chat/route.ts` (server-side), après parsing de la réponse n8n :
- Si `leadTemperature === 'hot'` (ou `qualificationScore ≥ seuil`) → insert `notifications` admin (`type='hot_lead'`), avec **throttle par session** (1 notif lead chaud / session, via la table ou un set mémoire).
- En mode démo (sans n8n) : heuristique simple sur `knownLeadData` (dates + budget + guests présents → chaud).

### 4.4 Tunnel acquisition propriétaire

- **Faits conciergerie** injectés dans le contexte n8n depuis `data/conciergerie-faq.ts` (commission **25 %** brut ménage inclus, **5 %** en direct, synchro Airbnb, maintenance, visibilité, pack démarrage 200 €). Pas de hardcode.
- **Détection intent** « propriétaire » : Phase 2 côté n8n (LLM) ; en démo, mots-clés (`propriétaire`, `louer ma villa`, `conciergerie`, `confier ma villa`).
- **Fin de tunnel** → **nouveau `app/api/chat/owner-lead/route.ts` (POST)** :
  - Entrée : `{ villasCount, location, email?, name?, sessionId }`.
  - Effets : insert `notifications` admin (`type='owner_lead'`) + renvoie lien `/soumettre-ma-villa` (pré-rempli via query si champs connus).
  - **N'appelle pas** `villa-submissions` (pas d'email auto). La notif est la trace (pas de nouvelle table).

---

## 5. Agent B — Propriétaire (B1 : 5 alertes live)

Calcul **live** dans `lib/owner-assistant-context.ts` → `buildOwnerContextPack`. Données bookings/tasks/villas déjà chargées ; ajouter le chargement de `villa_date_blocks` (trous) et `ota_sync_logs` scopé aux villas du proprio.

**Nouvelle fonction `computeOwnerAlerts(data)`** retourne des alertes typées, **fusionnées** avec les `owner_alerts` lues en table (calculées d'abord, dédoublonnées). Contrat API GET inchangé (renvoie déjà `pack.alerts`) ⇒ le push au chargement dashboard (B3) est gratuit (frontend affiche déjà `snapshot.alerts`).

| # | Type | Détection | Sévérité |
|---|------|-----------|----------|
| 1 | Trou calendrier | Fenêtre libre ≥ `GAP_MIN_NIGHTS` (déf. 3) dans les 30 j, entre 2 résas, hors blocs | medium |
| 2 | Tâche en retard | `tasks` non `done` : check-out aujourd'hui sans ménage assigné, ou `due_date < today` | high |
| 3 | Conflit booking | 2 bookings non annulés se chevauchant sur une même villa | high |
| 4 | Δ revenu vs M-1 | `revenue_current_month` vs `revenue_last_month` → ±X% | low/medium |
| 5 | OTA désync | Dernière `ota_sync_logs` de la villa > `OTA_STALE_HOURS` (déf. 48 h) ou erreur récente | medium |

Format alerte : `{ type, severity, title, body, villa_id?, cta? }`. Seuils en constantes configurables. Helper de détection de trous **partagé** avec l'Agent C (cf. §6.5) → `lib/availability-gaps.ts`.

---

## 6. Agent C — Admin (copilot intelligent, socle)

Le route `admin/chat/route.ts` (481 lignes) dépasserait 500 lignes → **extraction dans `lib/admin-assistant-context.ts`** (`buildAdminContextPack()`) qui reprend le `contextData` actuel + ajoute les blocs ci-dessous. Le route consomme ce pack.

### 6.1 L1 — Briefing proactif au chargement
Objet `daily_briefing` structuré : check-ins/outs du jour, soumissions en attente, anomalie à signaler. Exposé via **GET `admin/chat`** (la route n'a qu'un POST aujourd'hui) → le panneau copilot l'affiche au chargement, sans question.

### 6.2 L2 — Recommandations actionnables
Chaque alerte porte `{ entity, label, suggested_action }`.
Ex. : `"Soumission #42 (Jean, 3 villas, Trois-Îlets) en attente 5 j"` + action proposée `UPDATE_SUBMISSION_STATUS` (qui passe par la confirmation §6.6).

### 6.3 L3 — Comparaison inter-villas
`occupancy_by_villa` = taux d'occupation 30 j par villa, depuis `bookings`.

### 6.4 L4 — Score santé villa (0-100)
`health_score_by_villa`, pondéré :
- Occupation (30/90 j) → **40**
- Tendance revenu M/M → **20**
- Tâches (pénalité retard) → **20**
- Satisfaction (`avg(reviews.rating)` approuvés, /5 → /20) → **20**

Flag si `score < 50` ou en baisse vs période précédente.

### 6.5 L9 — Fenêtre maintenance
Réutilise le helper partagé `lib/availability-gaps.ts` (même logique trou calendrier que B1), exprimé côté admin : « Rien sur Corail du 3 au 6 juillet, parfait pour entretien ».

### 6.6 C2 — Proactivité + confirmation
**Alertes admin** (`buildAdminContextPack`) :
| # | Alerte | Règle |
|---|--------|-------|
| 1 | Soumissions en attente | `villa_submissions` `received` & `created_at` > 5 j |
| 2 | Conflit booking non résolu | chevauchement (réutilise logique B1, scope global) |

Alertes critiques (conflit) → insert `notifications` admin (`type='admin_alert'`), **throttlé** pour ne pas dupliquer à chaque chargement.

**Confirmation explicite** sur actions destructives — `BLOCK_DATE`, `UPDATE_BOOKING`, `UPDATE_SUBMISSION_STATUS` (admin) et `BLOCK_DATE` (proprio) :
- L'action ne s'exécute que si `action_data.confirm === true`.
- Sinon la route renvoie `{ requires_confirmation: true, confirmation_prompt: "Confirmer : bloquer Corail du 15 au 20 juillet ?" }` **sans toucher la DB**.
- `CREATE_TASK` / `COMPLETE_TASK` restent sans confirmation (non destructifs).

Le mode démo (`buildAdminDemoReply`) est étendu pour répondre sur santé / comparaison / briefing avec ces vraies données.

### 6.7 Roadmap Agent C (documentée, NON implémentée cette itération)
- **L5** Détection anomalies — comptage annulations OK ; **motif indisponible** (pas de `cancellation_reason`). Nécessite ajout colonne.
- **L7** Prédiction revenu — projection « pace » sur résas futures (heuristique, à labelliser *estimation*).
- **L8** Risque churn proprio — basé sur « aucune résa depuis 3 semaines » (pas de `last_sign_in`).
- **L10** Optimisation multi-villa — villa pleine + villa vide mêmes dates → suggestion redirection.
- **L6** Rapport hebdo — version « rapport semaine à la demande » d'abord ; **auto le lundi** nécessite un cron (hors contrainte actuelle).
- **L11** Saisonnalité — `villas.seasonal_prices` (jsonb) existe ; nécessite d'inspecter sa forme + définir un calendrier de saisons.
- **L12** Événements locaux — **bloqué** : aucune source de données (festival/carnaval) ; nécessite une table d'événements curée.

---

## 7. Migrations SQL (2)

### 7.1 `pre_booking_requests` (nouvelle table)
```
id uuid pk default gen_random_uuid()
session_id text
villa_id uuid references villas(id)
start_date date
end_date date
email text
guests int
name text
status text default 'new'
created_at timestamptz default now()
```
RLS : insert via service-role (API) ; select réservé staff via `is_staff_admin()`.

### 7.2 Étendre `notifications_type_check`
Drop + recreate la contrainte CHECK en ajoutant : `pre_booking`, `hot_lead`, `owner_lead`, `admin_alert`. Sinon les inserts de notif échouent.
+ Entrées correspondantes dans `NOTIF_TYPE_CONFIG` (`lib/constants.ts`), version string-icône **et** composant (Server→Client).

> Règle : régénérer/vérifier le schéma live avant d'appliquer (types/supabase.ts périmé).

---

## 8. Phase 2 — Workflows n8n (`-v3`)

Mettre à jour les 3 JSON dans `docs/n8n/` (nouveau suffixe `-v3`) :
- **Agent A** : consommer dispos + faits conciergerie ; détecter intent « propriétaire » → owner-lead ; émettre `preBooking` + `leadTemperature` ; passer les `capabilities` à `true`.
- **Agent B** : pousser les alertes fusionnées en 1er message (pas de B2/urgence-LLM cette itération).
- **Agent C** : consommer `daily_briefing` / `health_score_by_villa` / `occupancy_by_villa` ; proposer actions avec `confirm`.
- Placeholders conservés (`VOTRE-DOMAINE`, `VOTRE_SUPABASE_ANON_KEY`), **zéro URL en dur**.

---

## 9. Tests & vérification

- `npx tsc --noEmit` (TS strict) — bloquant.
- Tests unitaires **Vitest** (déjà installé) :
  - `availability.ts` (plages occupées, prochaine dispo)
  - `availability-gaps.ts` (détection trous, seuil nuits)
  - `computeOwnerAlerts` (5 règles)
  - `health_score_by_villa` (pondération, flag baisse)
  - `computeAdminContextPack` alerts (soumissions, conflit)
  - gating confirmation (`confirm` absent → `requires_confirmation`, pas d'écriture DB)
  - scoring lead démo
- **Interdits** : aucun fichier `send-*`, Stripe, edge, email, ni test E2E modifié.
- Mise à jour `docs/n8n/RECAP.md` + `docs/auto-learn/LEARNINGS.md` en fin de lot.

---

## 10. Livrables

1. Couche code Phase 1 (modules `lib/`, routes `app/api/chat/pre-book`, `app/api/chat/owner-lead`, GET `admin/chat`, enrichissements B/C).
2. 2 migrations SQL appliquées + vérifiées.
3. Tests unitaires verts + `tsc` clean.
4. 3 workflows n8n `-v3` (Phase 2).
5. `RECAP.md` + `LEARNINGS.md` à jour.
6. Aucune régression sur l'existant (batch 15 juin).

---

## 11. Fichiers touchés (estimation)

**Nouveaux**
- `lib/chatbot/availability.ts`
- `lib/availability-gaps.ts`
- `lib/admin-assistant-context.ts`
- `app/api/chat/pre-book/route.ts`
- `app/api/chat/owner-lead/route.ts`
- `supabase/migrations/2026xxxx_pre_booking_requests.sql`
- `supabase/migrations/2026xxxx_notifications_types_agents.sql`
- tests `tests/unit/*` (availability, gaps, alerts, health, confirmation)

**Modifiés**
- `types/chatbot.ts` (champs dispo + capabilities)
- `lib/chatbot/villa-context.ts`
- `app/api/chat/route.ts` (capabilities + notif lead chaud)
- `lib/owner-assistant-context.ts` (computeOwnerAlerts + chargements)
- `app/api/admin/chat/route.ts` (GET briefing, confirmation, conso pack)
- `lib/constants.ts` (NOTIF_TYPE_CONFIG)
- `docs/n8n/*-v3.json` (Phase 2)
- `docs/n8n/RECAP.md`, `docs/auto-learn/LEARNINGS.md`
</content>
</invoke>
