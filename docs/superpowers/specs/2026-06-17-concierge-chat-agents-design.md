# Spec — Concierge Chat Agents (17 Juin 2026)

## Contexte

Chat proprio → Agent B (n8n) et admin → Agent C (n8n). Les pages messagerie existantes servent à superviser les voyageurs — aucun chat ne connecte directement aux agents IA.

## Architecture

**API (2 routes légères) :**

- `POST /api/concierge/owner` — Auth proprio (Bearer token). Forward `{ message, userId }` vers `N8N_OWNER_WEBHOOK_URL`. Timeout 20s. Fallback démo si N8N injoignable. Retourne `{ response, request_id }`.
- `POST /api/concierge/admin` — Auth admin (`requireAdmin`). Forward `{ message, userId }` vers `N8N_ADMIN_WEBHOOK_URL`. Même pattern.

**Composant partagé (1) :**

- `components/dashboard/shared/AgentChat.tsx` — Client component. Props: `{ endpoint, title, placeholder, suggestedPrompts? }`. Bulles chat, input, loader, état erreur. Palette gold/navy.

**Pages (2) :**

- `app/(proprio)/dashboard/concierge/page.tsx` — Server, check auth, rend AgentChat → `/api/concierge/owner`
- `app/(admin)/admin/concierge/page.tsx` — Server, check admin, rend AgentChat → `/api/concierge/admin`

**Menu (2) :**

- AdminMenuItems : `{ label: "Concierge IA", href: "/admin/concierge", icon: "Sparkles" }`
- ProprioMenuItems : `{ label: "Mon concierge", href: "/dashboard/concierge", icon: "Sparkles" }`

## Fichiers

| Fichier | Action |
|---------|--------|
| `app/api/concierge/owner/route.ts` | Créer |
| `app/api/concierge/admin/route.ts` | Créer |
| `components/dashboard/shared/AgentChat.tsx` | Créer |
| `app/(proprio)/dashboard/concierge/page.tsx` | Créer |
| `app/(admin)/admin/concierge/page.tsx` | Créer |
| `AdminMenuItems.ts` | Modifier |
| `ProprioMenuItems.ts` | Modifier |
| `middleware.ts` | Modifier (+ `/api/concierge`) |
