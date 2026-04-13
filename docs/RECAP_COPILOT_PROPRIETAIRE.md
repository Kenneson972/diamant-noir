# Récap — Copilot propriétaire

Document **séparé** du [`RECAP.md`](../RECAP.md) général du projet. Il résume uniquement la fonctionnalité **assistant / copilot** de l’espace propriétaire.

---

## En deux phrases

Le propriétaire a une page **`/dashboard/proprio/assistant`** qui affiche **son** portefeuille (villas, jour, alertes) et un **chat** alimenté par une **API dédiée**, avec des données **filtrées par compte** — pas le même canal que l’assistant **gérant** (`/api/admin/chat`).

---

## Ce qu’on a livré

| Élément | Description |
|--------|-------------|
| **API** | `GET` + `POST` **`/api/dashboard/owner-assistant`** — authentification **Bearer** (session Supabase). |
| **Données** | Contexte serveur : villas où `owner_id` = utilisateur connecté ; réservations et tâches **uniquement** pour ces villas. |
| **Écran** | Cartes portfolio / aujourd’hui / tâches ; liste du jour ; alertes ; terminal de chat. |
| **Base** | Migration **`owner_alerts`** + **`ai_action_logs`** (traçabilité et alertes métier). |
| **n8n** | Optionnel via **`N8N_OWNER_WEBHOOK_URL`** (sinon réponse locale à partir du contexte). |

---

## Fichiers à connaître

| Chemin | Rôle |
|--------|------|
| `app/dashboard/proprio/assistant/page.tsx` | Page React du copilot |
| `app/api/dashboard/owner-assistant/route.ts` | Route API (snapshot + chat) |
| `lib/owner-assistant-context.ts` | Construction du contexte filtré |
| `supabase/migrations/20260408180000_owner_alerts_ai_action_logs.sql` | Tables + RLS |

---

## À ne pas confondre

| Route | Qui |
|--------|-----|
| **`/api/dashboard/owner-assistant`** | **Propriétaires** (dashboard `/dashboard/proprio/…`) |
| **`/api/admin/chat`** | **Gérant / équipe** — Bearer + liste autorisée (`ADMIN_CHAT_*` dans `.env`) — ne pas appeler depuis l’UI propriétaire |

---

## Ce qu’il reste à faire côté infra

1. **Appliquer la migration** Supabase sur l’environnement cible (prod / staging).  
2. Optionnel : définir **`N8N_OWNER_WEBHOOK_URL`** quand le workflow n8n sera prêt.

---

## Comment le chat « répond » (sans vs avec n8n)

- **Sans `N8N_OWNER_WEBHOOK_URL`** : l’API construit quand même une réponse **texte** à partir des **vraies données** (portefeuille, jour, tâches) — pas d’IA générative, mais **pas de panne**.
- **Avec n8n** : le même contexte est envoyé au **webhook** ; n8n appelle un **LLM** qui rédige la réponse. Voir le guide **[`n8n/OWNER_COPILOT_AUTOMATION.md`](n8n/OWNER_COPILOT_AUTOMATION.md)** (flux, payload, prompt, réponse JSON).

## Documentation associée

| Document | Contenu |
|----------|---------|
| **Ce fichier** | Récap lisible, vue d’ensemble |
| [`OWNER_ASSISTANT_COPILOT.md`](OWNER_ASSISTANT_COPILOT.md) | Spec technique complète (contrats API, schéma DB, robustesse) |
| [`n8n/OWNER_COPILOT_AUTOMATION.md`](n8n/OWNER_COPILOT_AUTOMATION.md) | Automatisation n8n + LLM (copilot « réel ») |
| [`ACTIONS_LOG.md`](ACTIONS_LOG.md) | Journal des changements (traçabilité projet) |

---

*Dernière mise à jour : alignée sur l’implémentation owner-scoped (API `owner-assistant`, pas de dépendance propriétaire → `admin/chat`).*
