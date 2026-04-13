# Copilot propriétaire — récapitulatif technique

Document de référence pour la fonctionnalité **assistant / copilot** de l’espace **propriétaire** (`/dashboard/proprio/assistant`).  
Mis à jour pour refléter l’implémentation **owner-scoped** (pas de partage de contexte avec l’admin).

> **Vue d’ensemble (récap court)** : [`RECAP_COPILOT_PROPRIETAIRE.md`](RECAP_COPILOT_PROPRIETAIRE.md) — document séparé du `RECAP.md` projet.  
> **n8n + LLM (automatisation)** : [`n8n/OWNER_COPILOT_AUTOMATION.md`](n8n/OWNER_COPILOT_AUTOMATION.md)

---

## 1. Objectif produit

- Offrir aux propriétaires un **copilot** branché **uniquement sur leurs données** (villas dont ils sont `owner_id`, réservations et tâches associées).
- Afficher en un coup d’œil : **portfolio**, **« Aujourd’hui »** (arrivées, séjours, départs), **alertes**, puis un **chat** contextualisé.
- **Ne pas** réutiliser la route **`/api/admin/chat`** (contexte global type gérant / démo admin).

---

## 2. Problème résolu (avant)

| Avant | Après |
|--------|--------|
| La page propriétaire appelait `/api/admin/chat` sans Bearer cohérent | Appels **`/api/dashboard/owner-assistant`** avec **JWT Supabase** (`Authorization: Bearer`) |
| Contexte IA = chargement large (toutes villas / bookings / tasks) | Contexte construit côté serveur avec **filtres explicites** sur `owner_id` et `villa_id` |

---

## 3. Architecture (vue d’ensemble)

```
┌─────────────────────────────────────────────────────────────┐
│  Navigateur — /dashboard/proprio/assistant                  │
│  • GET  /api/dashboard/owner-assistant  (snapshot)         │
│  • POST /api/dashboard/owner-assistant  (message chat)      │
│  Header : Authorization: Bearer <access_token>             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Route API (Next.js App Router)                             │
│  app/api/dashboard/owner-assistant/route.ts                 │
│  • Vérifie l’utilisateur via supabaseAdmin().auth.getUser  │
│  • buildOwnerContextPack(ownerId)                           │
│  • Optionnel : POST vers n8n (N8N_OWNER_WEBHOOK_URL)       │
│  • Insert ai_action_logs (traçabilité)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  lib/owner-assistant-context.ts                             │
│  • villas  .eq("owner_id", ownerId)                         │
│  • bookings / tasks sur villa_id ∈ villas du proprio       │
│  • owner_alerts .eq("owner_id", ownerId)                    │
└─────────────────────────────────────────────────────────────┘
```

**Séparation des rôles**

- **Propriétaire** : uniquement `owner-assistant` + données filtrées.
- **Gérant / admin** : la route **`/api/admin/chat`** reste le canal dédié (usage interne / démo) ; elle ne doit **pas** être consommée par l’UI propriétaire.

---

## 4. Fichiers principaux

| Fichier | Rôle |
|---------|------|
| [`app/api/dashboard/owner-assistant/route.ts`](../app/api/dashboard/owner-assistant/route.ts) | **GET** : JSON snapshot (portfolio, today, alerts, stats). **POST** : message + réponse (`success`, `response`, `action`, `action_data`). Auth Bearer obligatoire. |
| [`lib/owner-assistant-context.ts`](../lib/owner-assistant-context.ts) | `buildOwnerContextPack` : agrégation SQL filtrée ; `ownerContextToStatsPayload` pour les vues type `StatsView`. |
| [`app/dashboard/proprio/assistant/page.tsx`](../app/dashboard/proprio/assistant/page.tsx) | UI : chargement snapshot, chat, panneaux Portfolio / Aujourd’hui / Alertes, vues dynamiques (stats, villas, bookings, maintenance). |
| [`supabase/migrations/20260408180000_owner_alerts_ai_action_logs.sql`](../supabase/migrations/20260408180000_owner_alerts_ai_action_logs.sql) | Tables `owner_alerts` et `ai_action_logs` + RLS. |

**Documentation projet (traçabilité)**

- [`docs/ACTIONS_LOG.md`](ACTIONS_LOG.md) — entrée append-only sur la livraison.
- [`docs/logs/2026-04-08.md`](logs/2026-04-08.md) — détail de session (si présent).

---

## 5. Base de données

### 5.1 `owner_alerts`

- Alertes métier **par propriétaire** (`owner_id` → `auth.users`).
- Champs typiques : `severity` (low / medium / high), `title`, `body`, `villa_id` optionnel, `read_at`, `metadata`, `created_at`.
- **RLS** : un utilisateur authentifié ne lit que les lignes où `owner_id = auth.uid()`.
- Les insertions depuis l’API passent par le **service role** (contourne RLS) ; le code applicatif **filtre toujours** par `owner_id` issu du JWT.

### 5.2 `ai_action_logs`

- Journal d’audit des actions IA / assistant : `owner_id`, `role` (`owner` | `admin`), `action_type`, `payload` (JSON), `request_id`, `created_at`.
- **RLS** : l’utilisateur ne voit que ses entrées (`owner_id = auth.uid()`), pas les logs admin globaux.

**À faire côté ops** : appliquer la migration sur l’instance Supabase (`supabase db push`, migration SQL manuelle, ou pipeline CI habituel).

---

## 6. Contrat API (résumé)

### GET `/api/dashboard/owner-assistant`

- **Headers** : `Authorization: Bearer <access_token>`
- **Réponse 200** (extrait) :

```json
{
  "success": true,
  "snapshot": {
    "current_date_iso": "...",
    "portfolio": {
      "total_villas": 0,
      "published_villas": 0,
      "total_revenue_paid": 0,
      "upcoming_bookings_count": 0,
      "pending_tasks_count": 0
    },
    "today": [ /* arrivées / séjours / départs du jour */ ],
    "alerts": [ /* owner_alerts */ ],
    "stats": { /* charge utile pour StatsView */ }
  }
}
```

### POST `/api/dashboard/owner-assistant`

- **Headers** : `Authorization: Bearer`, `Content-Type: application/json`
- **Body** : `{ "message": "...", "sessionid": "optionnel" }`
- **Réponse** : alignée sur l’ancien flux admin pour limiter le refactor UI — `success`, `response`, `action` (ex. `SHOW_STATS`), `action_data` (ex. `context`, `strategic_alert`).

---

## 7. Intégration n8n (optionnelle)

| Variable | Usage |
|----------|--------|
| `N8N_OWNER_WEBHOOK_URL` | Webhook dédié copilot propriétaire (prioritaire si défini). |
| `N8N_WEBHOOK_URL` | Repli si la variable ci-dessus est absente. |

Si aucune URL n’est configurée, l’API renvoie une **réponse locale déterministe** à partir du `OwnerContextPack` (mode démo / hors ligne automation).

---

## 8. Logique « Aujourd’hui »

- Basée sur les **réservations** des villas du propriétaire (`start_date`, `end_date`).
- Classification par jour courant (UTC côté serveur au moment de la requête) :
  - **check_in** : `start_date` = jour J
  - **check_out** : `end_date` = jour J
  - **in_stay** : séjour qui chevauche J sans être uniquement arrivée/départ ce jour-là

À affiner plus tard : fuseau horaire explicite (Martinique / UTC) si les propriétaires sont multi-régions.

---

## 9. Robustesse

- Si la table **`owner_alerts`** n’existe pas encore (migration non appliquée), le contexte log un **warning** et renvoie une liste d’alertes **vide** plutôt que de faire échouer tout le flux.
- Les insertions dans **`ai_action_logs`** loggent un warning en cas d’échec sans bloquer la réponse chat.

---

## 10. Ce qui est volontairement hors périmètre (MVP)

- Pas de **threads partagés** entre propriétaires et équipe admin.
- Pas d’**automations n8n** complexes tant que les agrégats SQL et le contrat API sont stables.
- **`/api/admin/chat`** : Bearer obligatoire + allowlist (`ADMIN_CHAT_ALLOWED_EMAILS` / `ADMIN_CHAT_ALLOWED_USER_IDS`) — voir [`lib/admin-chat-allowlist.ts`](../lib/admin-chat-allowlist.ts).

---

## 11. Vérifications recommandées

1. Migration SQL appliquée sur Supabase.
2. Connexion propriétaire → `/dashboard/proprio/assistant` : snapshot chargé, pas d’erreur 401.
3. Onglet réseau : uniquement des appels vers **`/api/dashboard/owner-assistant`**, pas vers **`/api/admin/chat`**.
4. `npm run build` sans erreur après modification.

---

## 12. Référence rapide des chemins

```
diamant-noir/
├── app/api/dashboard/owner-assistant/route.ts
├── app/dashboard/proprio/assistant/page.tsx
├── lib/owner-assistant-context.ts
└── supabase/migrations/20260408180000_owner_alerts_ai_action_logs.sql
```

Pour l’historique des changements : **`docs/ACTIONS_LOG.md`** (append-only).
