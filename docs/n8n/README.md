# Agents Kayvila (n8n) — Import & Configuration

Trois workflows n8n autonomes, inspirés de l'architecture **Élise 13** (karibloom.net).
Chaque agent = 1 fichier JSON importable directement dans n8n.

| Agent | Fichier | Webhook (path) | Rôle |
|---|---|---|---|
| **A — Chatbot Visiteur** | `kayvila-agent-a-visiteur.json` | `POST /webhook/kayvila-visitor` | Aider les visiteurs à trouver une villa. Supabase seul, pas de gbrain. |
| **B — Copilot Propriétaire** | `kayvila-agent-b-proprietaire.json` | `POST /webhook/kayvila-owner` | Insights business d'un propriétaire. Auth JWT, gbrain, alerte Telegram. |
| **C — Copilot Admin** | `kayvila-agent-c-admin.json` | `POST /webhook/kayvila-admin` | Supervision globale plateforme. Auth JWT admin, gbrain, submissions, double alerte Telegram. |

---

## 1. Pré-requis base de données

Avant d'activer les workflows, exécuter la migration qui crée les tables de mémoire :

```
diamant-noir/supabase/migrations/20260528_agents_memory.sql
```

Elle crée `conversation_memory` (historique conversationnel), `banned_sessions` (sécurité)
et `toxicity_log` (journal qui alimente l'auto-ban de l'agent A après 3 messages toxiques en 1 h).

---

## 2. Import dans n8n

1. Dans n8n → **Workflows → Import from File**.
2. Sélectionner le fichier JSON de l'agent.
3. Le workflow est importé **inactif** (`active: false`) — on configure d'abord, on active ensuite.

---

## 3. Credentials à rattacher (après import)

Les workflows référencent des credentials par **nom** (les `id` sont des placeholders `REPLACE_*`).
À l'import, n8n signalera ces credentials manquants : ouvrir chaque nœud concerné et sélectionner/créer le credential.

| Credential (nom) | Type n8n | Utilisé par |
|---|---|---|
| `KAYVILA SUPABASE` | Postgres | Check Banned, Get/Save Memory, Postgres Chat Memory |
| `KAYVILA DEEPSEEK` | DeepSeek API | DeepSeek Chat Model |
| `KAYVILA TELEGRAM` | Telegram API | Alertes (agents B et C uniquement) |

Connexion Postgres = la base **Supabase** du projet (host `db.<ref>.supabase.co`, port `5432`, user/password de la base, SSL activé).

---

## 4. Remplacements obligatoires (find & replace)

Dans **chaque** fichier (ou après import, dans les nœuds), remplacer :

| Placeholder | Remplacer par | Où |
|---|---|---|
| `https://VOTRE-DOMAINE-KAYVILA` | URL de production du site (ex. `https://kayvila.com`) | nœuds HTTP Request + outils `kayvila-*` |
| `https://VOTRE-PROJET-SUPABASE.supabase.co` | URL du projet Supabase (`NEXT_PUBLIC_SUPABASE_URL`) | `Code - Auth JWT` (B et C) |
| `VOTRE_SUPABASE_ANON_KEY` | clé anon publique Supabase (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) | `Code - Auth JWT` (B et C) |
| `http://gbrain-kayvila:8080` | URL réelle du container gbrain (host:port) | `gbrain Recall`, `gbrain Capture` (B et C) |
| `REMPLACER_CHAT_ID` | chat ID Telegram (ou définir les variables n8n) | nœuds Telegram |

> **Auth interne (B et C)** : aucune clé statique à remplacer côté routes. Le nœud `Code - Auth JWT`
> **vérifie le token côté serveur** en appelant `GET /auth/v1/user` de Supabase (signature validée par
> Supabase, pas un simple décodage du payload). Si le token est invalide → accès refusé silencieusement.
> Le rôle accepté est `owner`/`proprietaire`/`proprio` (agent B) ou `admin` (agent C) — `authenticated`
> seul ne suffit pas. Chaque appel aux routes protégées re-forwarde ensuite ce **JWT** en en-tête
> `Authorization: Bearer <token>` ; le serveur dérive lui-même le périmètre — on ne fait jamais
> confiance à un paramètre d'URL.

Pour les chat IDs Telegram, les workflows lisent d'abord les **variables n8n** si elles existent :
`TELEGRAM_OWNER_CHAT_ID` (agent B) et `TELEGRAM_ADMIN_CHAT_ID` (agent C).
Définir ces variables dans n8n évite de toucher au JSON.

---

## 5. Endpoints API (créés dans ce repo)

Toutes les routes consommées par les agents existent désormais sous `app/api/`. Auth par route :

| Route | Méthode | Auth | Agent / outil |
|---|---|---|---|
| `/api/villas/public` | GET | publique (villas publiées, champs non sensibles) | A — catalogue + `kayvila-search` |
| `/api/dashboard/villas` | GET | Bearer (owner) | B — `kayvila-my-villas` |
| `/api/dashboard/bookings` | GET | Bearer (owner) | B — `kayvila-my-bookings` |
| `/api/dashboard/tasks` | GET | Bearer (owner) | B — `kayvila-my-tasks` |
| `/api/dashboard/ota-status` | GET | Bearer (owner) | B — `kayvila-ota-status` |
| `/api/dashboard/analytics-villas` | GET | Bearer (owner) | B — `kayvila-my-stats` + contexte (existait déjà) |
| `/api/admin/villas` | GET | Bearer (admin) | C — contexte + `kayvila-all-villas` |
| `/api/admin/bookings` | GET | Bearer (admin) | C — `kayvila-all-bookings` |
| `/api/admin/global-stats` | GET | Bearer (admin) | C — `kayvila-global-stats` |
| `/api/admin/ota-status` | GET | Bearer (admin) | C — `kayvila-ota-all` |
| `/api/admin/owners` | GET | Bearer (admin) | C — `kayvila-users` (existait déjà) |
| `/api/villa-submissions` | GET | Bearer (admin) | C — contexte + `kayvila-submissions` (existait déjà) |

Les routes owner dérivent `owner_id` du token (`requireAuth`) ; les routes admin exigent un rôle admin
(`requireAdmin`). Les outils dégradent proprement si une route renvoie une erreur (`continueOnFail`).

---

## 6. Contrat d'appel (payload Webhook)

**Agent A** (public) :
```json
{ "sessionid": "abc-123", "message": "Une villa pour 6 en juillet ?", "page": "/villas" }
```

**Agents B & C** (authentifiés) — le JWT Supabase de l'utilisateur est passé dans `body.token`
(ou l'en-tête `Authorization` du webhook). Les agents le re-forwardent ensuite aux routes internes :
```json
{ "sessionid": "owner-xyz", "message": "Combien j'ai gagné ce mois-ci ?", "token": "eyJ..." }
```

Réponse (tous) :
```json
{ "response": "…texte…", "success": true }
```

---

## 7. Architecture reprise d'Élise 13

- **Sécurité** : `Check Banned Session` (Postgres) → `IF Session Bannie` (agent A) ; `Auth JWT` (vérif serveur Supabase) → `IF Auth Valide` (B/C).
- **Anti-abus (agent A)** : `IF Toxique ?` répond + journalise (`toxicity_log`) ; après **3 messages toxiques / heure** la session est **auto-bannie** (`banned_sessions`).
- **Résilience (agent A)** : `Code - Vérifier Catalogue` après l'appel `/api/villas/public` ; si l'API est indisponible, un message de repli est injecté dans le prompt au lieu d'un catalogue vide.
- **Mémoire courte** : `Get Long-Term Memory` (20/30/50 msg) + `Save Memory` (Supabase, `continueOnFail`) + `Postgres Chat Memory` (agent).
- **Mémoire longue sémantique** : `gbrain Recall` (avant LLM) + `gbrain Capture` (slug horodaté, après LLM) — **B et C uniquement**.
- **Données B/C** : pas d'injection de contexte pré-LLM ; l'agent récupère tout via ses **outils** (`kayvila-*`), source de vérité unique.
- **Cœur IA** : `DeepSeek Chat Model` (temp 0.7 / 0.3 / 0.2) + `AI Agent` avec outils.
- **Post-traitement** : `FORMAT RESPONSE` (nettoyage markdown) + `PREPARE SUMMARY PROMPT` (analyse) + alertes Telegram conditionnelles.

> L'analyse `PREPARE SUMMARY PROMPT` est ici une détection par mots-clés (urgence / criticité / soumission),
> sans second appel LLM, pour rester légère et sans dépendance supplémentaire. Elle peut être remplacée
> par un nœud `Message a model` (json_object) si une catégorisation plus fine est requise.
