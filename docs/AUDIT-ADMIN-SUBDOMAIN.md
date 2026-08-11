# Audit — Séparation admin Kayvila (kayvila.com → admin.kayvila.com)

**Date** : 11/08/2026 — **Étape 0 du playbook admin-subdomain-migration**

## Périmètre (validé par Ken)

- ✅ **Migrer** : `app/(admin)/admin/` (22 pages) + layout `(admin)` + APIs admin (`/api/admin/*`,
  `/api/concierge/admin`, `/api/stripe/admin-refund`, `/api/agent/admin-context`)
- ❌ **Reste sur le public** : `app/(proprio)/dashboard/` (15 pages — dashboard propriétaire),
  pages marketing, booking, toutes les APIs publiques
- 👤 **Visiteurs** : aucun changement (le public ne voit rien bouger)

## Constat

| Élément | État |
|---|---|
| Pages admin | **22** (`app/(admin)/admin/` : villas, reservations, proprietaires, clients, membres, soumissions, concierge, sync-ota, hub-classique, documents, avis, tarification, revenus, parametres, messages) |
| Dashboard proprio | 15 pages (`app/(proprio)/dashboard/`) — **RESTE sur kayvila.com** |
| API admin | `/api/admin/*` + `/api/concierge/admin` + `/api/stripe/admin-refund` + `/api/agent/admin-context` + `/api/notify-admin-booking` |
| Auth | **Supabase SSR 3 couches** : middleware `createServerClient` (getUser + refresh) + layouts server (roles) + RLS. Rôles : `isStaffAdmin`, `isOwnerRole` |
| Middleware | `middleware.ts` : publicPaths (marketing + auth + API publiques), i18n `/en` `/es`, optimisation (visiteur anonyme sans cookie → pas d'appel Supabase) |
| Cookies session | **Supabase `sb-*`** — host-only par défaut → point chaud cross-subdomain (Étape 3 : `cookieOptions.domain = ".kayvila.com"`) |
| URLs en dur | **Zéro lien fonctionnel** ✅ — uniquement des canonicals SEO `https://kayvila.com/...` (RESTENT sur le public, à ne pas toucher) |
| n8n | **AUCUN workflow n8n n'appelle `/api/admin`** ✅ (le seul avec URLs = Agent B v3 INACTIF, URLs `/api/dashboard/*` vers kayvila.vercel.app — obsolète, non critique) |
| Crons | `/api/cron/admin-weekly-recap` + `/api/cron/admin-daily-recap` (Vercel Cron) — sous `/api/cron/*`, PAS `/api/admin` → **restent sur le public** |
| Domaine | `kayvila.com` (live) |

## Implications vs Shiine/Dalcielo

- ✅ **/api/admin peut être bloqué sur le domaine public** (404) — aucun appelant externe.
  Contrairement à Dalcielo (n8n) : ici pas de compromis, isolation totale.
- ⚠️ **Point chaud : cookies Supabase** — le refresh token `sb-*` doit survivre entre
  kayvila.com et admin.kayvila.com. Configurer `cookieOptions.domain = ".kayvila.com"`
  (normaliser le point en tête) dans les 2-3 endroits où Supabase crée les cookies
  (middleware `setAll`, `lib/supabase/server`...). Vérifier la doc Supabase Auth pour le
  paramètre exact selon la version du SDK.
- ⚠️ **Le middleware fait BEAUCOUP** (i18n, optimisation, refresh token) : ajouter le routage
  hostname SANS casser ces couches. Le routage admin/public doit être évalué AVANT la logique
  Supabase (un visiteur sur /admin public → 404 direct, pas d'appel Supabase).
- ⚠️ **Layouts server `(admin)`** : le DashboardShell a peut-être des liens "voir le site" en
  relatif — les passer en URL absolue publique (Étape 4).
- ⚠️ **Les pages admin utilisent-elles des fetch relatifs ?** (à vérifier : `grep fetch("` dans
  `app/(admin)`) — si relatifs, ils suivent le même domaine → OK automatiquement.
- ⚠️ **Le dashboard proprio reste sur public** : les routes `(proprio)` ne doivent PAS être
  touchées par le routage (elles restent accessibles sur kayvila.com). Ne PAS inclure
  `/dashboard` dans le 404 public.
- ⚠️ **RLS** : la sécurité reste en base (service_role côté serveur, RLS côté client) —
  aucun changement nécessaire, le sous-domaine n'affaiblit pas la sécurité.

## Étapes

- **Phase A (Ken)** : Vercel → Domains → Add `admin.kayvila.com` + DNS CNAME `admin` →
  valeur exacte Vercel (attention : sous-domaine O2switch ? vérifier le registrar — piège
  "CNAME and other data" si le domaine passe par cPanel/O2switch : supprimer le sous-domaine
  fantôme AVANT d'ajouter le CNAME)
- **Phase B (code)** :
  1. Middleware : routage hostname (admin. → `/admin` + `/api/admin` OK, racine → `/admin` ;
     public → `/admin` + `/api/admin` = 404 direct ; `(proprio)` + publicPaths intacts)
  2. Cookies Supabase : `cookieOptions.domain = ".kayvila.com"` (tous les `setAll`)
  3. Layouts admin : liens "voir le site" en URL absolue publique
  4. Vérifier les fetch relatifs des pages admin
- **Phase C** : build complet, login admin sur `admin.kayvila.com` (session), session persiste
  entre les 2 domaines, `/admin` + `/api/admin` → 404 public, dashboard proprio toujours OK,
  crons `/api/cron/admin-*` OK, booking OK
