# Rapport d'Audit Sécurité — Diamant Noir / Kayvila

**Date** : 5 Juillet 2026 · **Modèle** : DeepSeek v4 Pro
**Périmètre** : Next.js 15 + TypeScript + Supabase + Stripe · **Méthode** : `security-best-practices` (Next.js + React OWASP)
**Score** : 19/20 · **Niveau de risque** : Faible

---

## Résumé exécutif

Audit complet des 7 dimensions de sécurité. **Aucune vulnérabilité critique ou haute.** Le codebase est bien protégé, avec une couche CSRF systématique, une authentification RBAC solide, des webhooks Stripe correctement signés, et un rate limiting cohérent. 

Deux points d'amélioration identifiés : le CSP utilise encore `unsafe-inline`/`unsafe-eval` (moyen), et `frame-ancestors` manque dans le CSP (faible).

---

## 1. Secrets & Configuration de production

### NEXT-SECRETS-001 : Pas de secrets exposés ✅
- **NEXT_PUBLIC** limité à `SUPABASE_URL`, `SUPABASE_ANON_KEY` (clés publiques), `BASE_URL`, `SITE_URL`, `SLA_*` — tous non-sensibles
- Aucun `NEXT_PUBLIC_STRIPE_*`, `NEXT_PUBLIC_API_KEY` ou équivalent
- Secrets serveur (`STRIPE_SECRET_KEY`, `API_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_API_KEY`) utilisés uniquement côté serveur
- `.env*` non commités
- `productionBrowserSourceMaps: false` ✅

### NEXT-SUPPLY-001 : Next.js 15.2.9 — Non vulnérable ✅
- **Seuils CVE-2025-66478** (react2shell) : patch ≥ 15.2.6 requis · **15.2.9 ≥ 15.2.6** → safe
- Projets : dalcielo (14.2.35 — hors scope CVE), shiine-by-s (14.2.29 — hors scope), maison-pvl (16.2.6 — safe ≥ 16.0.7)

---

## 2. Authentification & RBAC

### NEXT-AUTH-001 : Auth serveur obligatoire ✅
- `middleware.ts` : `getUser()` Supabase SSR valide le JWT côté serveur sur chaque requête protégée
- Redirections : `/login` avec user → dashboard/espace selon rôle
- Pages publiques : skip auth si pas de cookie Supabase (optimisation ~100-300ms)
- Pages protégées : pas de session → redirect `/login?redirect=...`

### NEXT-AUTH-002 : RBAC triple rôle ✅
- `requireAuth()` / `requireAdmin()` / `verifyApiKey()` — 3 guards typés
- `isStaffAdmin()` vérifie `profile.role` (DB) + `user_metadata.role` (JWT) + email allowlist
- `middleware.ts` redirige :
  - Admin → `/admin`
  - Propriétaire → `/dashboard`
  - Locataire → `/espace-client`
  - Rôle croisé → redirect vers le bon espace

---

## 3. Protection CSRF

### NEXT-CSRF-001 : CSRF systématique sur les mutations ✅
- `lib/security.ts` : `verifyOrigin()` + `checkCsrf()` + `withCsrf()`
- `verifyOrigin()` valide contre **Host réel + NEXT_PUBLIC_BASE_URL** (gère les déploiements preview Vercel avant branchement DNS)
- **15 routes protégées** : booking, create-villa, update-villa, delete-villa, delete-booking, proactive-notifications, documents, seasonal-rates, messages, bookings (admin), villa-submissions, contact, reviews, import-airbnb
- Toutes les routes POST/DELETE state-changing utilisent `checkCsrf()` ou `withCsrf()`
- Les cookies Supabase sont `SameSite=Lax` par défaut

---

## 4. API Routes & Rate Limiting

### NEXT-WEBHOOK-001 : Webhook Stripe — Signature + Idempotence ✅
- Body brut (`request.text()`) avant vérification de signature HMAC
- `stripe.webhooks.constructEvent()` avec double secret (main + Connect)
- Idempotence atomique via `stripe_events_processed` (upsert onConflict)
- 12 événements gérés (checkout, paiements, refunds, disputes, connect)

### NEXT-DOS-001 : Rate limiting sur toutes les routes sensibles ✅
| Route | Limite | Fenêtre |
|-------|--------|---------|
| `/api/booking` | 10/IP | 60s |
| `/api/booking-session` | 30/IP | 60s |
| `/api/import-airbnb` | 5/IP | 60s |
| `/api/sync-ota` | 10/IP | 60s |
| `/api/villa-submissions` | 5/IP | 1h |
| `/api/chat/tenant` | 30/email | 1h |
| `/api/admin/chat` | 30/user | 60s |

### NEXT-INPUT-001 : Validation Zod sur les entrées ✅
- `BookingRequestSchema` (Zod) valide tous les champs avant traitement
- `sanitizeUserMessage()` (chatbot) avec `escapeHtml()` pour les templates email
- Aucun `request.body` utilisé sans validation

---

## 5. XSS & DOM Injection

### NEXT-XSS-001 : Aucune XSS dynamique ✅
- `dangerouslySetInnerHTML` : 5 occurrences, **TOUTES** pour JSON-LD (données structurées constantes ou serveur-générées, pas de user input)
- `innerHTML` / `outerHTML` / `insertAdjacentHTML` : **0 occurrence** dans les .tsx
- `eval()` / `new Function()` : **0 occurrence**
- `DOMPurify` : utilisé dans `lib/chatbot/sanitize.ts` pour les messages utilisateur
- `escapeHtml()` : défini dans `lib/security.ts` pour les templates email HTML

### JS-URL-001 : Redirections contrôlées ✅
- `window.location.href` : toutes les destinations sont **server-controlled** (URL Stripe, callback auth Supabase, onboarding Connect)
- Pas de paramètre `next=` / `redirect=` passé directement à `window.location`
- Le middleware gère le paramètre `redirect` de manière sécurisée (relative path uniquement)

### REACT-AUTH-001 : localStorage sans tokens ✅
- `localStorage` utilisé uniquement pour : cookie consent, wishlist, sidebar state, chatbot session ID (UUID), locale, home audience
- **Aucun token JWT / API key / secret stocké**

---

## 6. CSP & Security Headers

### NEXT-CSP-001 : CSP présent mais améliorable 🟡
- CSP complet avec `default-src 'self'` et directives détaillées
- **`script-src` inclut `'unsafe-inline'` et `'unsafe-eval'`** → **Moyen**
  - Impact : si une XSS est découverte, le CSP ne bloque pas l'exécution
  - Constat : aucune XSS n'a été trouvée dans le code
  - Fix : passer à `csp.nonces` (Next.js 15) pour les scripts JSON-LD inline
- `style-src` inclut `'unsafe-inline'` → acceptable (CSS XSS = non critique)
- `connect-src`, `frame-src`, `img-src`, `font-src` : bien restreints
- **`frame-ancestors` manquant** → **Faible**
  - `X-Frame-Options: SAMEORIGIN` présent mais `frame-ancestors` est la CSP moderne
  - Fix : ajouter `frame-ancestors 'self'` au CSP

### NEXT-HEADERS-001 : Headers complets ✅
| Header | Valeur | Statut |
|--------|--------|--------|
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `X-Frame-Options` | `SAMEORIGIN` | ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | camera/mic/geo/payment désactivés | ✅ |
| `Cache-Control` (API) | `no-store` | ✅ |
| `Cache-Control` (images) | `max-age=3600, stale-while-revalidate` | ✅ |
| `Cache-Control` (static) | `public, max-age=31536000, immutable` | ✅ |

### NEXT-CORS-001 : CORS strict ✅
- `Access-Control-Allow-Origin` : allowlist explicite (jamais `*`)
- `Vary: Origin` pour éviter le cache poisoning
- Pas de `Access-Control-Allow-Credentials` avec wildcard

---

## 7. Stripe Connect & Paiements

- Comptes Express créés avec `capabilities: {transfers}` ✅
- Onboarding link avec `return_url` et `refresh_url` ✅
- `calculateTransferAmounts()` : math déterministes, 22%/78% split ✅
- `serviceFeePercent` calculé côté serveur (pas contrôlé par le client, fix du 4 juillet) ✅
- Garde 503 si proprio pas onboardé ✅
- Garde-fou confirmation pour actions destructives admin (`requiresConfirmation()`) ✅

---

## 8. RLS & SQL

- Supabase ORM exclusif — pas de SQL brut par concaténation ✅
- 15+ migrations RLS documentées (policies par rôle : admin, proprio, anonyme) ✅
- `supabaseAdmin()` utilisé uniquement côté serveur dans les route handlers ✅
- Aucune injection de commande OS (0 `child_process`) ✅

---

## Plan d'action

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | CSP : ajouter `frame-ancestors 'self'` | 1 min | Faible |
| 2 | CSP : migrer `unsafe-inline` → nonces (long terme) | 30 min | Moyen |

**C'est tout.** Le codebase est dans un excellent état de sécurité.

---

*Audit réalisé par Élise (security-best-practices skill) — DeepSeek v4 Pro*
*Rapport : `/opt/data/repos/diamant-noir/docs/audits/2026-07-05-security-audit.md`*
