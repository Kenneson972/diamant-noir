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
