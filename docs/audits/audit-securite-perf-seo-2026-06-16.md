# Kayvila — Audit Sécurité, Performance, SEO

**Date** : 16 Juin 2026
**Source** : 3 sous-agents Élise (asynchrones — Hermes v2)
**Total nouveaux problèmes** : 66

---

## 🔐 SÉCURITÉ — 18 problèmes

### 🔴 HAUTE (8)

| # | Fichier | Problème | Fix |
|---|---------|----------|-----|
| 1 | `api/chat/route.ts:237`, `api/agent/*.ts` | **CORS `*` avec Authorization acceptée** (5 routes) — un site malveillant peut voler le token JWT | `Access-Control-Allow-Origin` → domaine explicite |
| 2 | `api/villa-submissions/route.ts:120-132` | **Injection HTML dans templates email** — `<script>` passera dans l'email admin | `escapeHtml()` ou React Email |
| 3 | `package.json:37` | **Next.js `^15.2.4`** — 16 vulns dont 10 HIGH (middleware bypass, SSRF) | `npm update next` → `^15.5.18` |
| 4 | `package.json` (node-ical) | **Axios via node-ical** — 25+ vulns (SSRF 8.6, credential leak 7.5) | `npm update node-ical` |
| 5 | `api/villa-submissions/route.ts:22` | **Pas de rate limiting** sur POST soumission | `checkRateLimit` + `checkCsrf` |
| 6 | `api/villa-submissions/route.ts` | **Pas de validation Zod** — payload brut → Supabase | `z.object({...}).safeParse(body)` |
| 7 | `api/dashboard/create-villa/route.ts:48` | **Payload non validé** — `{ ...payload }` injecté tel quel dans Supabase | Schéma Zod |
| 8 | `.env.local` | **Clés critiques** (STRIPE, SUPABASE, RESEND) — seul `.gitignore` protège | Pre-commit hook `git-secrets` |

### 🟡 MODÉRÉE (7)

- `dangerouslySetInnerHTML` pour JSON-LD (2 occurrences)
- Routes dashboard sans rate limiting sur GET
- `@heroui-pro/react` dépend de `tar` vulnérable
- **48 vulnérabilités npm** au total
- Pas de CSP (Content Security Policy)
- `http://` dans `NEXT_PUBLIC_BASE_URL` par défaut
- Rate limiter en mémoire (volatil)

### 🟢 FAIBLE (3)

- `supabaseAdmin()` dans route publique au lieu de `supabaseAnon`
- Mot de passe WiFi affiché en clair dans l'espace client
- Pas de validation Zod sur `create-villa`

---

## ⚡ PERFORMANCE — 11 problèmes

### 🔴 CRITIQUE (3)

| # | Problème | Impact |
|---|----------|--------|
| 1 | **Pagination absente sur 6 pages** : `/villas`, `/admin/soumissions`, `/admin/villas`, `/admin/proprietaires`, `/admin/clients` | Les pages deviendront inutilisables avec 50+ entrées |
| 2 | **Zéro cache HTTP** : toutes les routes API `force-dynamic` + `Cache-Control: no-store`, page `/villas/[id]` avec `noStore()` | Chaque visiteur = requêtes DB fraîches |
| 3 | **Pas de skeleton/loading sur pages admin et espace-client** | Blanc complet au chargement |

### 🟠 IMPORTANT (6)

- `@react-pdf/renderer` jamais lazy-loadé (~500KB)
- Pas de lazy loading pour les composants lourds du dashboard admin
- Queries N+1 sur fiche villa, page admin villas
- Pas de bundle analyzer configuré
- Page `/villas/[id]` : `force-dynamic` + `noStore()` → recalcule tout chaque requête
- `optimizePackageImports` manque `recharts`, `leaflet`, `shiki`

### 🟡 BACKLOG (2)

- Ajouter `sizes` et `priority` sur les images `next/image`
- Mettre en place `unstable_cache` pour wrapper les appels Supabase

---

## 🔎 SEO — 30 problèmes

### 🔴 BLOQUANT (7)

| # | Problème |
|---|----------|
| 1 | **Pas de sitemap.xml** — le `<link>` dans layout pointe vers un 404 |
| 2 | **Pas de robots.txt** — Google explore `/admin`, `/dashboard`, `/api` |
| 3 | **og-default.jpg 404** — cartes de partage cassées sur TOUTES les pages |
| 4 | **Page login sans métadonnées** — indexable sans titre |
| 5 | **Page update-password sans métadonnées** |
| 6 | **Page comparateur sans métadonnées** |
| 7 | **Espace client entier sans métadonnées** |

### 🟠 MAJEUR (10)

- Canonical URLs manquantes sur 6 pages publiques
- Open Graph absent sur 7 pages publiques
- Pas de JSON-LD `WebSite` + `SearchAction`
- Pas de JSON-LD `BreadcrumbList`
- Pas de JSON-LD `FAQPage`
- Pas de JSON-LD `LocalBusiness` (Kayvila = conciergerie physique)
- Images décoratives avec `alt` non significatif
- Hiérarchie headings incorrecte (`h1→h2→h4`)
- Meta keywords obsolètes (Google les ignore depuis 2009)
- Pas de `twitter:card`

### 🟡 MODÉRÉ (8)

- Titre homepage dupliqué
- `hreflang` alternates sans routes `/en`/`/es`
- Pages admin indexables (pas de `robots: { index: false }`)
- `hero.webm` 11 Mo — pénalise LCP
- 561 frames webp dans `public/` (~10 Mo)
- Pas de normalisation trailing slash
- JSON-LD `Product` incorrect sémantiquement pour une villa

### 🟢 MINEUR (5)

- `metadata` sans typage sur 6 pages
- Pas de favicon configuré
- Page success sans métadonnées
- JSON-LD non validés
- Page register sans `robots: { index: false }`

---

## 📊 Score Lighthouse Estimé

**~55-65/100** :
- Performance : ~45 (hero.webm 11 Mo)
- SEO : ~70 (sitemap/robots manquants)
- Accessibility : ~85 (hiérarchie H cassée)
- Best Practices : ~90

---

## 🎯 Top 5 actions immédiates (P0)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | `npm update next` + `npm audit fix` | 15 min | 48 vulns + Next.js |
| 2 | Fix CORS `*` → domaine explicite | 15 min | Sécurité critique |
| 3 | Créer `app/sitemap.ts` + `app/robots.ts` | 30 min | SEO bloquant |
| 4 | Ajouter `.limit(20)` + pagination sur 6 pages | 2h | Performance critique |
| 5 | Générer `og-default.jpg` 1200×630px | 5 min | SEO critique |
