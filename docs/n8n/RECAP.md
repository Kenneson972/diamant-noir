# Récap — Agents n8n Kayvila

> Synthèse de tout ce qui a été produit pour les 3 agents IA Kayvila (inspirés d'Élise 13).
> Détails d'import et de config : voir `README.md`.

---

## 1. Ce qui a été livré

### Workflows n8n (importables)
| Fichier | Nœuds | Webhook | Rôle |
|---|---|---|---|
| `kayvila-agent-a-visiteur.json` | 24 | `POST /webhook/kayvila-visitor` | Chatbot visiteur public (catalogue, recherche villa, anti-abus). |
| `kayvila-agent-b-proprietaire.json` | 23 | `POST /webhook/kayvila-owner` | Copilot propriétaire (revenus, résas, tâches, OTA, alertes). |
| `kayvila-agent-c-admin.json` | 26 | `POST /webhook/kayvila-admin` | Copilot admin (vue globale, soumissions, alertes critiques). |

### Base de données
- `supabase/migrations/20260528_agents_memory.sql` → tables `conversation_memory` + `banned_sessions` + `toxicity_log` (RLS activé, aucun accès public).

### Routes API (créées dans le repo)
Le **vrai blocage** : les routes appelées par les agents n'existaient pas. Toutes créées sous `app/api/` :

| Route | Auth | Agent |
|---|---|---|
| `/api/villas/public` | publique | A |
| `/api/dashboard/villas` · `bookings` · `tasks` · `ota-status` | Bearer (owner) | B |
| `/api/admin/villas` · `bookings` · `global-stats` · `ota-status` | Bearer (admin) | C |

Réutilisé tel quel : `/api/dashboard/analytics-villas`, `/api/admin/owners`, `/api/villa-submissions`.

### Documentation
- `README.md` → guide d'import, credentials, placeholders, contrat d'appel, tableau des routes.
- `RECAP.md` (ce fichier).
- Entrées dans `docs/ACTIONS_LOG.md`.

---

## 2. Architecture (reprise d'Élise 13)

```
Webhook → Sécurité (banned / JWT) → Mémoire courte (Supabase)
        → [gbrain Recall — B&C] → DeepSeek + AI Agent (outils)
        → FORMAT RESPONSE → Save Memory → [gbrain Capture — B&C] → Réponse
                          ↘ PREPARE SUMMARY → IF urgent/critique → Telegram
```

- **Sécurité** : Agent A = `Check Banned Session` ; Agents B/C = `Auth JWT` + `IF Auth/Admin`.
- **Mémoire courte** : `conversation_memory` Supabase (20 / 30 / 50 derniers messages).
- **Mémoire longue sémantique (gbrain)** : Recall avant LLM + Capture après — **B et C uniquement**.
- **Cœur IA** : DeepSeek (temp 0.7 visiteur / 0.3 proprio / 0.2 admin) + AI Agent à outils.
- **Alertes** : Telegram conditionnel (urgence proprio, problème critique / soumission admin).

---

## 3. Décisions notables

- **Auth Bearer** (et non `x-api-key`) : chaque appel forwarde le JWT Supabase de l'utilisateur en `Authorization: Bearer`. Le serveur valide et dérive le périmètre (owner/admin) — jamais de confiance à un paramètre d'URL. Cohérent avec les routes existantes.
- **gbrain seulement pour B et C** : le visiteur n'a pas besoin de mémoire sémantique, Supabase suffit.
- **Analyse par mots-clés** (urgence / criticité / soumission) plutôt qu'un 2ᵉ appel LLM : plus léger, zéro dépendance en plus. Upgradable vers un nœud LLM si besoin.
- **`continueOnFail`** sur tous les appels externes : l'agent dégrade proprement si une route ou gbrain est indisponible.

---

## 4. Reste à faire (config n8n, côté utilisateur)

1. Exécuter la migration SQL `20260528_agents_memory.sql`.
2. Importer les 3 JSON dans n8n (importés **inactifs**).
3. Rattacher les credentials : `KAYVILA SUPABASE` (Postgres), `KAYVILA DEEPSEEK`, `KAYVILA TELEGRAM`.
4. Remplacer les placeholders : `https://VOTRE-DOMAINE-KAYVILA`, `https://VOTRE-PROJET-SUPABASE.supabase.co` + `VOTRE_SUPABASE_ANON_KEY` (Auth JWT B/C), `http://gbrain-kayvila:8080`, chat IDs Telegram.
5. Tester chaque webhook avec un vrai token, puis activer.

---

## 5. Vérifications faites

- `npx tsc --noEmit` : 0 erreur sur les routes créées (erreurs restantes = pré-existantes, dans `tests/a11y.spec.ts`).
- Les 3 workflows JSON : parse OK + cohérence des connexions vérifiée (aucune référence orpheline).

---

## 6. Corrections critiques (revue post-livraison)

Suite à la revue de sécurité / robustesse, les workflows ont été durcis :

**P0 — bloquant**
- **Vérif signature JWT (B & C)** : `Code - Auth JWT` ne décode plus localement le payload ; il appelle `GET /auth/v1/user` Supabase (signature validée côté serveur). Token invalide → refus silencieux.
- **Rôles stricts (B)** : `authenticated` retiré ; seuls `owner` / `proprietaire` / `proprio` passent.
- **Auto-ban toxicité (A)** : chaque message toxique est journalisé (`toxicity_log`) ; au-delà de **3 / heure**, la session est insérée dans `banned_sessions` (`ON CONFLICT DO NOTHING`).
- **`continueOnFail` sur Save Memory (C)** : un échec d'écriture mémoire ne casse plus la réponse.
- **Fallback catalogue (A)** : `Code - Vérifier Catalogue` détecte une API indisponible / vide et injecte un message de repli dans le prompt.

**P1 — important**
- **Slug gbrain horodaté (B & C)** : `…/<ISO complet>` (`replace(/[:.]/g,'-')`) au lieu de la date seule → plus d'écrasement intra-journée.
- **`sessionId` garanti (A)** : nœud `Init Session` génère `visitor-<ts>-<rand>` si absent ; toutes les références pointent dessus.
- **Suppression des contextes redondants (B & C)** : `Get Owner Context`, `Get Admin Context`, `Get Villa Submissions` supprimés. L'agent récupère tout via ses outils (source de vérité unique).

> Nouveaux placeholders à remplacer : `https://VOTRE-PROJET-SUPABASE.supabase.co` et `VOTRE_SUPABASE_ANON_KEY` (dans `Code - Auth JWT` des agents B et C).

---

## 7. Phase 1 (code) — Agents IA V3 (2026-06-16)

> Implémentation code pur (Next.js / TypeScript) — sans n8n, sans cron, sans edge functions.
> Phase 2 (orchestration n8n-v3) suit.

### Agent A — Bi-tunnel visiteur + propriétaire

**Tunnel visiteur (A1 → A2 → A3)**

- **A1 — Dispos pré-calculées** : `lib/chatbot/availability.ts` + flag `canVerifyAvailability: true` injecté dans `lib/chatbot/villa-context.ts`. Le chatbot peut désormais répondre "disponible / indisponible" sans appel réseau supplémentaire.
- **A2 — Pré-booking** : `POST /api/chat/pre-book` → insert dans table `pre_booking_requests` → notif in-app (type `pre_booking`) + lien `/book?villaId=…&checkin=…&checkout=…&guests=…` pré-rempli renvoyé dans la réponse.
- **A3 — Lead chaud** : si score de lead ≥ seuil, notif in-app throttlée (type `hot_lead`, dédoublonnée sur `session_id + villa_id`).

**Tunnel propriétaire**

- `POST /api/chat/owner-lead` → notif in-app (type `owner_lead`) avec lien `/soumettre-ma-villa`. Les faits conciergerie Kayvila (commission, services, avantages) sont injectés dans le contexte système via `lib/chatbot/villa-context.ts`.

### Agent B — Alertes propriétaire live

- `lib/owner-alerts.ts` : 5 alertes calculées live (revenus faibles, taux d'occupation, résas sans paiement, avis négatifs, tâches en retard).
- Fusionnées dans `buildOwnerContextPack` (contexte copilot proprio) — aucun cron, calcul à la demande.

### Agent C — Socle admin

- `lib/admin-assistant-context.ts` : construit le pack contexte admin (taux d'occupation global, score de santé 0-100, alertes actionnables, briefing textuel).
- `GET /api/admin/chat` : renvoie `{ briefing, occupation, sante, alertes }` — prêt pour le copilot admin.
- `lib/admin-confirm.ts` : confirmation explicite exigée pour les actions destructives (annuler réservation, bloquer villa, modifier tarifs).
- `POST /api/admin/chat` : endpoint chat admin complet avec contexte injecté.

### Migrations appliquées

| Migration | Contenu |
|---|---|
| `pre_booking_requests` | Table de suivi des demandes de pré-réservation (villa_id, session_id, dates, statut) |
| Extension `notifications_type_check` | DROP + RECREATE contrainte CHECK pour ajouter `pre_booking`, `hot_lead`, `owner_lead`, `admin_alert` |

### Notifs in-app — règles

- Table `notifications` uniquement (pas d'email, pas de Telegram, pas de push).
- Colonnes obligatoires : `title` (NOT NULL), `body` (NOT NULL), `user_id` (null = broadcast admin).
- `user_id = null` → visible par les admins uniquement (filtrage côté `NotificationBell`).
- Aucun cron. Stripe, emails Resend, edge functions : non touchés.

### Vérifications Phase 1

- `npx vitest run` : 40 tests passent, 0 échec (availability-gaps ×4, chatbot/availability ×3, pre-book validate ×4, lead-scoring ×4, owner-lead ×4, owner-alerts ×6, admin-assistant-context ×5, admin-confirm ×4, lib/sla.test.ts ×6).
- `npx tsc --noEmit` : 4 erreurs pré-existantes uniquement (`tests/a11y.spec.ts`), zéro erreur nouvelle.
- `npm run build` : succès. Routes `/api/chat/pre-book`, `/api/chat/owner-lead`, `/api/admin/chat` (GET + POST) présentes.

### Phase 2 — À suivre

Orchestration n8n-v3 : brancher les webhooks, créer les workflows Phase 2, configurer les credentials.

---

## 8. Correctifs post-revue + Phase 2 n8n + Clôture (2026-06-15)

### 3 correctifs appliqués (commit `e54fb0b`)

| # | Correctif | Fichiers | Détail |
|---|---|---|---|
| 1 | Rate limiting endpoints publics | `lib/chatbot/rate-limit.ts` (nouveau) + `pre-book/route.ts` + `owner-lead/route.ts` | Helper partagé `checkRateLimit`/`getClientIP`, 10 req/h/IP + cap 50 notifs/h |
| 2 | UUID villaId + vérif villa | `lib/chatbot/pre-book.ts` + `pre-book/route.ts` | Regex UUID dans `validatePreBook`, vérif villa existante/publiée AVANT insert (400 au lieu de 500) |
| 3 | Timezone UTC `gatherAdminContext` | `app/api/admin/chat/route.ts` | `addDays()` string UTC, `startOfMonthStr`/`endOfLastMonthStr`, comparaisons `.slice(0,10)` pour `created_at` |

### Phase 2 n8n v3

3 workflows créés (commits `1e7ca68`, `4b52810`, `c9b373f`) :

| Workflow | Nouveautés v3 |
|---|---|
| `kayvila-agent-a-visiteur-v3.json` | Bi-tunnel (voyageur + proprio), exploite `context.villas[].availability`, émet `preBooking`/`ownerLead`, faits conciergerie injectés |
| `kayvila-agent-b-proprietaire-v3.json` | Push proactif des 5 alertes (`calendar_gap`, `overdue_task`, `booking_conflict`, `revenue_delta`, `ota_desync`) en ouverture |
| `kayvila-agent-c-admin-v3.json` | Briefing quotidien en ouverture, scores santé + occupation par villa, actions destructives en 2 temps (proposition → confirmation avec `confirm: true`) |

> **⚠️ Revertés sur `main`** — à ré-importer dans n8n après remplissage des placeholders (`VOTRE-DOMAINE`, `VOTRE_SUPABASE_ANON_KEY`, `REPLACE_*`).

### Clôture

- **18 commits** sur `feat/agents-ia-v3` → merge fast-forward dans `main` → branche supprimée
- **35 tests** Vitest verts · tsc propre (4 erreurs pré-existantes a11y.spec.ts) · build OK
- **Push origin main** sans les n8n v3
