# Récapitulatif de travail — PessÓra

Journal de synthèse (design, stack, auth, données). Dernière mise à jour : **2026-05-03**.

---

## Référentiel des règles et sources (tout l’écosystème)

### 1. Règles Cursor — projet PessÓra (toujours actives)

Fichier : **[`.cursor/rules/pessora-project.mdc`](../.cursor/rules/pessora-project.mdc)** (`alwaysApply: true`)

| Thème | Contenu réglementaire |
|--------|------------------------|
| **Stack** | React + Vite, React Router, Tailwind v4, **HeroUI v3** (`@heroui/react`, `@heroui/styles`), Framer Motion. |
| **Skills agents** | **HeroUI** : `.agents/skills/heroui-react/SKILL.md` ou `.cursor/skills/heroui-react` — préférer composés v3, doc MDX ; install officielle [HeroUI Agent Skills](https://heroui.com/docs/react/getting-started/agent-skills). **UI/UX Pro Max** : `.cursor/skills/ui-ux-pro-max/SKILL.md` — recherche `python3 .cursor/skills/ui-ux-pro-max/scripts/search.py "…" --stack react`. |
| **Auth / données (doc historique)** | Références `src/lib/apiClient.ts`, `docs/O2SWITCH_SCHEMA.sql` — **en parallèle**, le code actuel utilise **Supabase** (`supabaseClient`, `VITE_SUPABASE_*`) ; les deux docs (`O2SWITCH_*`, `SUPABASE_SCHEMA.sql`) peuvent coexister selon évolutions. |
| **Contenu** | `src/data/` : `menuData`, `infoData`, `productsData`, etc. |
| **Chatbot** | PessoBot, webhook n8n (URL en variable d’env, pas `127.0.0.1:7244` en prod). |
| **Structure** | `src/pages/`, `src/components/` (layout, common, member), `AuthContext`, routes `/mon-espace/*`, `/admin`. |
| **Sécurité** | `docs/AUDIT_SECURITE_PESSORA.md` ; formulaires Zod + RHF quand possible ; **uniquement `VITE_*`** côté client ; pas de service role front ; admin protégé ; pas de `dangerouslySetInnerHTML` sur contenu user/bot. |
| **Conventions design** | Variables CSS / Tailwind ; direction **premium type Apple** : air, hiérarchie fine, surfaces sobres, animations courtes. |

### 2. Règle Cursor — pont vers Karibloom (toujours active)

Fichier : **[`.cursor/rules/karibloom-client-builder.mdc`](../.cursor/rules/karibloom-client-builder.mdc)**

- Renvoie vers le **skill complet** et les **règles détaillées** dans le dépôt **KARIBLOOM** (chemins ci-dessous).
- Principes rappelés : data-driven, structure `pages/` / `components/`, SEO, forms, perf, sécurité, design system, workflow création site (init → design → data → pages → backend → SEO → deploy).

### 3. Dépôt KARIBLOOM — règles Cursor détaillées (`kb-*`)

Chemin type : `~/Downloads/KARIBLOOM/.cursor/rules/` (adapter si autre clone du repo).

| Fichier | Domaine |
|---------|---------|
| `karibloom-client-builder.mdc` | Point d’entrée + **Core Web Vitals** (LCP, FCP, CLS, TBT, INP), workflow perf, checklist déploiement, cookie consent → `kb-cookie-consent`. |
| `kb-project-setup.mdc` | Init projet, deps, checklist |
| `kb-architecture.mdc` | Structure, patterns |
| `kb-routing.mdc` | React Router, lazy, ScrollToTop, breadcrumbs |
| `kb-seo.mdc` | Meta, Schema.org, sitemap |
| `kb-performance.mdc` | CRACO, lazy, images (adapter **Vite** sur PessÓra) |
| `kb-cookie-consent.mdc` | Consentement, GTM, PostHog |
| `kb-forms.mdc` | react-hook-form, Zod, CSRF, leads |
| `kb-components.mdc` | Patterns UI |
| `kb-styling.mdc` | Tailwind, variables CSS |
| `kb-animations.mdc` | Framer, GSAP, scroll |
| `kb-backend.mdc` | Express, PHP, Stripe |
| `kb-data-model.mdc` | Données métier, schémas |
| `kb-security.mdc` | CSRF, CSP, rate limit |
| `kb-deployment.mdc` | o2switch, Cloudflare |
| `typescript-utility-functions.mdc` | Utilitaires TS |

### 4. Skill Claude — Karibloom Client Builder (règles `.md`)

`~/Downloads/KARIBLOOM/.claude/skills/karibloom-client-builder/`

- **`SKILL.md`** — stack de référence, liens vers **`rules/*.md`** (project-setup, architecture, styling, animations, components, forms, seo, performance, security, backend, deployment, data-model).

### 5. Comment lire tout ça pour PessÓra

1. **Toujours** : règles **`.cursor/rules` du repo PESSORA** (PessÓra + pont Karibloom).
2. **Approfondir** : fichiers **`kb-*.mdc`** dans KARIBLOOM pour le détail (SEO, forms, perf…).
3. **Traduire** les écarts de stack : où KARIBLOOM dit CRA/CRACO, PHP, Radix → PessÓra utilise **Vite**, **HeroUI**, **Supabase** ; l’esprit (data-driven, SEO, sécurité, perf) reste le même.
4. **Core Web Vitals** : la longue section dans `karibloom-client-builder.mdc` (KARIBLOOM) s’applique comme **cible qualité** ; adapter les exemples (pas de CRACO sur ce projet).

### 6. Mapping rapide principes Karibloom → PessÓra

| Principe | Application PessÓra |
|----------|------------------------|
| Data-driven | `src/data/*`, pas de contenu métier figé dans les composants. |
| Structure | `src/pages/`, `src/components/`, `src/lib/`, `src/contexts/`. |
| Design system | `src/index.css` (`@theme`), tokens surfaces / typo. |
| SEO | `seoConfig` + meta par page. |
| Formulaires | Zod + RHF selon pages ; secrets uniquement `VITE_*`. |
| Performance | Lazy dans `App.tsx`, images à dimensionner / lazy hors above-the-fold. |
| Sécurité | `AUDIT_SECURITE_PESSORA.md`, pas de service role, admin protégé. |

---

## Contexte technique (état repo)

| Couche | Détail |
|--------|--------|
| Front | React 19 + Vite, React Router 7, Tailwind v4, HeroUI, Framer Motion, **Zustand** (panier persistant `localStorage`) |
| Auth / données live | Supabase (`AuthContext`, tables profil / events / etc.), `VITE_SUPABASE_*` |
| Règles Cursor locales | `.cursor/rules/pessora-project.mdc` + `karibloom-client-builder.mdc` |
| Règles étendues | `~/Downloads/KARIBLOOM/.cursor/rules/kb-*.mdc` + skill `karibloom-client-builder` |

---

## Journal des actions (changelog)

Convention : **ajouter une entrée datée en tête de liste** à chaque lot de travail significatif (design, auth, données, déploiement).

### Logs détaillés (2026-05-02) — Gamme produit détail + Stripe Checkout (13 tâches)

**Contexte** : les produits gamme (Sport, Skin, Wellness) étaient en DB via `gamme_products` mais sans pages dédiées. Objectif : page détail par produit (`/nos-produits/:gamme/:slug`), sélecteur quantité, intégration au panier Zustand existant, et Stripe Checkout via Supabase Edge Function + Zod. Exécuté via subagent-driven development (13 tâches, chacune avec review spec + qualité). Branche : `feat/gamme-product-detail-stripe`.

| Tâche | Livré | Fichiers clés |
|-------|-------|---------------|
| **T1 — Migration slug** | Colonne `slug TEXT UNIQUE` sur `gamme_products` + 36 UPDATE statements (slugs des produits existants) appliqués en prod | `supabase/migrations/20260502130000_add_slug_gamme_products.sql` |
| **T2 — Types + util** | `slug: string \| null` dans `GammeProduct.Row` ; utilitaire `toSlug(name)` : NFD + diacritiques + lowercase + tirets | `src/types/database.ts`, `src/lib/toSlug.ts` |
| **T3 — CartLine source** | Champ `source: 'bar' \| 'gamme'` requis dans `CartLine` ; tous les appels `addLine` existants passent `source: 'bar'` | `src/store/cartStore.ts`, `src/pages/DrinkDetail.tsx`, `src/components/home/HomeProductCarousel.tsx` |
| **T4 — Zod schemas** | `CartLineSchema` + `CheckoutRequestSchema` + types inférés `CartLinePayload` / `CheckoutRequest` | `src/lib/checkoutSchema.ts` |
| **T5 — useGammeProduct** | Hook : fetch Supabase par `gamme` + `slug` + `active=true` ; retourne `{ product, loading, notFound }` ; flag `cancelled` pour éviter setState après démontage | `src/hooks/useGammeProduct.ts` |
| **T6 — GammeProductDetail** | Page split éditorial : image gauche sticky, infos droite ; breadcrumb, prix simple / double format, sélecteur `−/+` (min 1 max 10), CTA avec prix dynamique, `justAdded` 2 s, skeleton chargement | `src/pages/GammeProductDetail.tsx` |
| **T7 — RangeDetail liens** | Bouton « Renseignements » → `<Link to="/nos-produits/:gamme/:slug">` avec fallback sur `product.id` si slug null | `src/pages/RangeDetail.tsx` |
| **T8 — AdminGammes slug** | Champ slug auto-généré via `toSlug` à la frappe du nom (si slug vide), éditable manuellement ; ajouté à `EMPTY_FORM`, `productToGammeForm`, `buildPayload` | `src/pages/admin/AdminGammes.tsx` |
| **T9 — Route App.tsx** | Lazy import + route `/nos-produits/:gamme/:slug` (3 segments, pas de conflit avec `:rangeId` 2 segments) | `src/App.tsx` |
| **T10 — Edge Function** | Deno Edge Function `create-checkout-session` : auth JWT → Zod → order DB → order_items → Stripe Session → retourne `{ url }` ; 503 si `STRIPE_SECRET_KEY` absent ; déployée en prod | `supabase/functions/create-checkout-session/index.ts` |
| **T11 — useCheckout** | Hook : si non authentifié → `/connexion` ; sinon GET session token → POST Edge Function → `window.location.href = url` ; expose `{ startCheckout, loading, error }` | `src/hooks/useCheckout.ts` |
| **T12 — CartDrawer** | Badge « Bar » / « Boutique » par ligne ; footer conditionnel : bouton « Commander — Payer en ligne » (Stripe) si `hasGammeItems`, sinon `<Link>` « Préparer ma venue » ; `checkoutError` affiché | `src/components/cart/CartDrawer.tsx` |
| **T13 — Pages commande** | `CommandeSucces` : vide panier au mount, affiche réf session, lien historique + boutique. `CommandeAnnulee` : rouvre panier. Routes `/commande/succes` et `/commande/annulee` | `src/pages/commande/CommandeSucces.tsx`, `src/pages/commande/CommandeAnnulee.tsx`, `src/App.tsx` |

**État final** : 13 commits sur `feat/gamme-product-detail-stripe`. Stripe inactive tant que `STRIPE_SECRET_KEY` n'est pas configurée en secret Supabase — la fonction retourne 503 proprement d'ici là. Docs : `docs/superpowers/specs/2026-05-02-gamme-product-detail-stripe-design.md` + `docs/superpowers/plans/2026-05-02-gamme-product-detail-stripe.md`.

---

### Logs détaillés (2026-05-03) — Refonte page Gammes + HeaderSubNav Segment HeroUI Pro

**Contexte** : redesign éditorial complet de `/nos-produits`. Passage de l'ancienne grille de produits à un layout alterné image/texte (comme Concept/Événements). Migration de la sous-nav header scrollable vers un Segment HeroUI Pro centré.

| Tâche | Livré | Fichiers clés |
|-------|-------|---------------|
| **Layout éditorial** | Sections alternées flex-row/flex-row-reverse avec badges thématiques, compteur produits, CTA hover lift, shimmer loading | `src/pages/NosProduits.tsx` |
| **HeaderSubNav → Segment** | Remplacement de la sous-nav scrollable (chevrons, overflow-x-auto) par un Segment HeroUI Pro centré | `src/components/layout/HeaderSubNav.tsx` |
| **Navigation + ancres** | Navigation vers pages collection + scroll vers section via `scrollIntoView` depuis la page d'ensemble | `HeaderSubNav.tsx` |
| **headerNav** | Labels SUBNAV_PRODUITS : "Vue d'ensemble", "Wellness", "Sport", "Skin" | `src/data/headerNav.ts` |
| **Corrections post-critique** | Retrait numéros de collection, `bg-black` → `from-noir`, section finale renforcée, shimmer, ancres | `NosProduits.tsx` |

**État final** : page Gammes cohérente avec le reste du site (Consept, Événements), navigation header unifiée via Segment HeroUI Pro. Build ✅.

### Logs détaillés (2026-05-03) — Pages détail produit gamme (GammeProductDetail)

**Contexte** : création des pages détail produit individuelles pour les gammes Wellness/Sport/Skin, accessibles via `/nos-produits/:rangeId/:slug`. Design inspiré de DrinkDetail mais simplifié.

| Tâche | Livré | Fichiers clés |
|-------|-------|---------------|
| **toSlug util** | Utilitaire de slugification (NFD, diacritiques, lowercase, tirets) | `src/lib/toSlug.ts` (nouveau) |
| **getGammeProduct** | Helper de lookup produit par rangeId + slug dans productsData.ts | `src/lib/getGammeProduct.ts` (nouveau) |
| **Page détail** | Breadcrumb, hero split image/info, sélecteur quantité, CTA add-to-cart, caractéristiques (bénéfices + ingrédients), cross-sell "Vous aimerez aussi", CTA final fond noir | `src/pages/GammeProductDetail.tsx` (nouveau) |
| **RangeDetail → lien** | Bouton "Renseignements" devient un Link vers `/nos-produits/:rangeId/:slug` (slug généré via `toSlug(product.name)`) | `src/pages/RangeDetail.tsx` |
| **Routing** | Lazy load GammeProductDetail + route `/nos-produits/:rangeId/:slug` avant `/:rangeId` | `src/App.tsx` |

**État final** : pages détail produit fonctionnelles avec panier, cross-sell, et navigation fluide. Build ✅.

---

### Logs détaillés (2026-05-03) — Refonte Gammes + correctifs + Mes bilans membre

**Contexte** : session multi-chantiers du 2026-05-03. Refonte complète de NosProduits (layout éditorial alterné image/texte), migration HeaderSubNav vers Segment HeroUI Pro, création des pages détail produit (GammeProductDetail), sélecteur tailles boissons, correctif Stripe double slash, déplacement CTA Óra+, correctif AdminOverview, et nouvelle page Mes bilans dans l'espace membre.

| Chantier | Livré | Fichiers clés |
|----------|-------|---------------|
| **Refonte Gammes** | NosProduits réécrit en layout éditorial alterné (comme Concept/Événements), badges thématiques, compteur produits, ancres collection, shimmer loading | `src/pages/NosProduits.tsx`, `src/components/layout/HeaderSubNav.tsx`, `src/pages/RangeDetail.tsx`, `src/data/headerNav.ts` |
| **Pages détail produit** | Nouvelle page GammeProductDetail avec hero split, sélecteur quantité, add-to-cart, cross-sell | `src/pages/GammeProductDetail.tsx`, `src/lib/toSlug.ts`, `src/lib/getGammeProduct.ts`, `src/App.tsx` |
| **Tailles boissons** | Sélecteur small/medium/large dans DrinkDetail avec prix dynamique | `src/pages/DrinkDetail.tsx`, `src/lib/cartLine.ts` |
| **Correctif Stripe** | Strip trailing slash dans siteUrl Edge Function + correcteur d'URLs frontend | `supabase/functions/create-checkout-session/index.ts`, `src/pages/CommandeAnnulee.tsx`, `src/pages/CommandeSucces.tsx`, `src/components/cart/CartDrawer.tsx` |
| **CTA Óra+** | Déplacement du bouton "Rejoindre" du Hero vers section Privilèges | `src/pages/OraPlus.tsx` |
| **Correctif AdminOverview** | Colonne `capacity` → `places_max` (inexistante) | `src/pages/admin/AdminOverview.tsx` |
| **Mes bilans membre** | Nouvelle page avec statistiques, historique (date tile + statut + annulation) et réservation simplifiée (calendrier + créneaux + formulaire allégé pré-rempli) | `src/pages/member/MesBilans.tsx`, `src/App.tsx`, `src/components/member/MemberLayout.tsx`, `src/pages/member/Dashboard.tsx` |

**Design doc** : `docs/superpowers/specs/2026-05-03-member-bilans-design.md`
**Plan** : `docs/superpowers/plans/2026-05-03-member-bilans.md`

**État final** : 0 erreur TS. Build ✅.

### Logs détaillés (2026-05-03) — Óra+ Stripe Cycle 1 (12 tâches)

**Contexte** : les membres Óra+ existaient uniquement en DB sans lien Stripe réel. Objectif : checkout abonnement sans auth préalable, webhooks pour synchroniser le statut Stripe → DB, gating des prix réduits (-50% boissons) sur le vrai statut actif. Exécuté via subagent-driven development (12 tâches, reviewers spec + qualité). Branche : `feat/supabase-events-bilan`.

| Tâche | Livré | Fichiers clés |
|-------|-------|---------------|
| **T1 — Migration DB** | `stripe_customer_id` sur `profiles` ; `stripe_price_id` + `current_period_end` sur `subscriptions` ; contrainte CHECK `plan IN ('free', 'ora_plus')` ; index partiel sur `stripe_subscription_id` ; migration one-shot abonnés actifs → `ora_plus` | `supabase/migrations/20260503150000_ora_plus_stripe.sql` |
| **T2 — Types + AuthContext** | `ProfilesTableRow.stripe_customer_id` ; `subscriptions.Row.plan: 'free' \| 'ora_plus'` + `stripe_price_id` + `current_period_end` ; `SubscriptionData.stripeCustomerId` + `currentPeriodEnd` ; `login()` retourne `Promise<User \| null>` (utilisé par Login.tsx pour redirection admin/membre) ; plan enum épuré (starter/premium/vip) dans AdminMembers + AdminMemberDetail | `src/types/database.ts`, `src/contexts/AuthContext.tsx`, `src/pages/admin/AdminMembers.tsx`, `src/pages/admin/AdminMemberDetail.tsx` |
| **T3 — useIsOraPlus** | Hook : `isOraPlus` (plan === 'ora_plus' && status === 'active') + `effectiveUnitPrice(pub)` → prix réduit si Óra+, sinon prix public | `src/hooks/useIsOraPlus.ts` |
| **T4 — activateOraPlus** | Deno helper partagé : email → cherche profil → invite si nouveau (`inviteUserByEmail`) → update `stripe_customer_id` → upsert subscription `plan: ora_plus, status: active` avec `stripe_price_id` + `current_period_end` | `supabase/functions/_shared/activateOraPlus.ts` |
| **T5 — create-subscription-session** | Edge Function : `mode: 'subscription'`, locale fr, phone collection, `success_url` → `/abonnement/succes?session_id=…`, `cancel_url` → `/commande/annulee` ; Zod validation body ; 503 si `STRIPE_SECRET_KEY` absente | `supabase/functions/create-subscription-session/index.ts` |
| **T6 — stripe-webhook** | Edge Function : vérifie signature `Stripe-Signature` (401 si invalide) ; 4 events : `checkout.session.completed` → `activateOraPlus` ; `invoice.paid` → status active + period_end ; `invoice.payment_failed` → status expired ; `customer.subscription.deleted` → status cancelled | `supabase/functions/stripe-webhook/index.ts` |
| **T7 — verify-subscription-session** | Edge Function : vérifie si webhook déjà traité via `stripe_subscription_id` ; sinon exécute `activateOraPlus` en fallback ; retourne `{ status: 'processed' \| 'pending' }` | `supabase/functions/verify-subscription-session/index.ts` |
| **T8 — OraPlus CTA** | 3 boutons "S'abonner" (hero + 2 final CTA) → `handleSubscribe()` via `supabase.functions.invoke('create-subscription-session')` ; `subLoading` + `subError` ; `useNavigate` conservé pour le bouton secondaire | `src/pages/OraPlus.tsx` |
| **T9 — /abonnement/succes** | Page succès : appelle `verify-subscription-session` au mount ; état `loading` → `processed` (welcome Óra+) → `pending/error` (fallback "Merci, activation en cours") | `src/pages/AbonnementSucces.tsx`, `src/App.tsx` |
| **T10 — DrinkOptionsModal** | `useIsOraPlus` + `effectiveUnitPrice(basePrice)` pour `unitPrice` ; size buttons : prix barré + prix réduit si Óra+ | `src/components/cart/DrinkOptionsModal.tsx` |
| **T11 — Menu + Carousel** | Remplacement `oraMemberUnitPrice` direct par `effectiveUnitPrice` du hook dans Menu (oraMemberHint) et HomeProductCarousel (label "Óra+ dès …") | `src/pages/Menu.tsx`, `src/components/home/HomeProductCarousel.tsx` |
| **T12 — Déploiement** | 3 Edge Functions déployées (ACTIVE) sur Supabase `tulhiipucrnyejheuitv` via MCP | Supabase Dashboard |

**État final** : code complet et déployé. Fonctionnel dès que les 3 secrets Stripe sont configurés et le webhook Stripe enregistré. `tsc --noEmit` : 0 erreurs. Docs : `docs/superpowers/specs/2026-05-03-ora-plus-stripe-cycle1-design.md` + `docs/superpowers/plans/2026-05-03-ora-plus-stripe-cycle1.md`.

---

### Logs détaillés (2026-05-03) — Óra+ Stripe Cycle 3 (6 tâches)

**Contexte** : gestion Stripe admin depuis la fiche membre — afficher les données Stripe en temps réel, annuler un abonnement à la fin de la période, ouvrir le portail Stripe du membre. Section C (Menu/DrinkDetail depuis Supabase) déjà implémentée (useMenuCatalog). Exécuté via subagent-driven development. Branche : `feat/supabase-events-bilan`.

| Tâche | Livré | Fichiers clés |
|-------|-------|---------------|
| **T1 — Migration + type** | Colonne `cancel_at_period_end boolean NOT NULL DEFAULT false` sur `subscriptions` ; type TS mis à jour | `supabase/migrations/20260503200000_subscriptions_cancel_at_period_end.sql`, `src/types/database.ts` |
| **T2 — Edge Function `get-stripe-member`** | POST `{ stripe_customer_id }` → vérifie JWT admin → `stripe.customers.retrieve(id, { expand: ['subscriptions'] })` → retourne `{ status, current_period_end, cancel_at_period_end, plan_name, amount, currency, payment_method }` ; 503 si `STRIPE_SECRET_KEY` absent ; `supabaseAdmin` à scope module | `supabase/functions/get-stripe-member/index.ts` |
| **T3 — Edge Function `cancel-stripe-subscription`** | POST `{ stripe_subscription_id }` → vérifie JWT admin → `stripe.subscriptions.update(id, { cancel_at_period_end: true })` → sync DB `subscriptions.cancel_at_period_end = true` avec log d'erreur si DB fail → retourne `{ success, cancel_at }` | `supabase/functions/cancel-stripe-subscription/index.ts` |
| **T4 — Edge Function `admin-portal-session`** | POST `{ stripe_customer_id, return_url }` → vérifie JWT admin → `stripe.billingPortal.sessions.create(...)` → retourne `{ url }` → `window.open(url, '_blank')` côté client | `supabase/functions/admin-portal-session/index.ts` |
| **T5 — AdminMemberDetail section Stripe** | Section "Abonnement Stripe" entre Abonnement et Commandes, visible si `profile.stripe_customer_id` défini ; 4 états : skeleton 3 colonnes / erreur discrète / actif (3 KPI + ID + portail + annuler) / annulation programmée (badge orange + bannière) ; `loadStripeDataForCustomer` lancé au chargement de la fiche ; `confirmCancel` double confirmation ; `openingPortal` loading state | `src/pages/admin/AdminMemberDetail.tsx` |
| **T6 — Déploiement** | 3 Edge Functions déployées sur Supabase projet `tulhiipucrnyejheuitv` (`verify_jwt: false` — auth custom via `verifyAdmin`) | Supabase cloud (ACTIVE) |

**État final** : 8 commits sur `feat/supabase-events-bilan`. `tsc --noEmit` : 0 erreurs. 3 fonctions ACTIVE sur Supabase.

---

### Logs détaillés (2026-05-03) — Óra+ Stripe Cycle 2 (4 tâches)

**Contexte** : corrections de bugs Cycle 1 + enrichissement admin (MRR réel, paiements échoués) + affichage date renouvellement membre. Pas de nouvelle Edge Function. Exécuté via subagent-driven development (4 tâches). Branche : `feat/supabase-events-bilan`.

| Tâche | Livré | Fichiers clés |
|-------|-------|---------------|
| **T1 — Bug planLabel** | Remplacement de la capitalisation naïve par un mapping explicite `{ free: 'Gratuit', ora_plus: 'Óra+' }` dans Dashboard.tsx (3 occurrences : lignes 175, 233, 300) + Subscription.tsx (1 occurrence — plan brut affiché) | `src/pages/member/Dashboard.tsx`, `src/pages/member/Subscription.tsx` |
| **T2 — MRR KPI admin** | Nouvelle carte KPI indigo dans la grille AdminOverview : `activeSubscriptions × 24,90 €` — dérivé sans requête supplémentaire (réutilise le compteur existant) | `src/pages/admin/AdminOverview.tsx` |
| **T3 — Paiements échoués admin** | Section rouge en bas d'AdminOverview : requête `subscriptions WHERE status='expired'` + join `profiles!inner(first_name, last_name, email)` ; liste compacte nom/email/ancienneté, masquée si vide, lien vers `/admin/membres/:id` par ligne | `src/pages/admin/AdminOverview.tsx` |
| **T4 — Date renouvellement membre** | Ligne discrète `"Renouvellement le [date]"` juste au-dessus du bouton "Gérer mon abonnement" dans Subscription.tsx ; masquée si `currentPeriodEnd` absent ; format `fr-FR` (ex. "3 juin 2026") | `src/pages/member/Subscription.tsx` |

**État final** : 3 commits sur `feat/supabase-events-bilan`. `tsc --noEmit` : 0 erreurs.

---

### Logs détaillés (2026-04-23 → 2026-04-25) — PessoBot S1 → S3 (production)

**Contexte** : refonte complète de l'assistant PessoBot, passage d'un prompt hardcodé de 2 800 tokens à une architecture dynamique (rate limit Postgres + tool calling + personnalisation + Óra+ éditable). Voir récap dédié : **[`docs/RECAP_PESSOBOT.md`](./RECAP_PESSOBOT.md)**.

| Sprint | Livré | Fichiers clés |
|--------|-------|---------------|
| **S1 — Base dynamique** (2026-04-23) | Table `bar_settings` + vue `v_pessobot_menu`, header `X-Pessobot-Signature`, CORS prod, `/admin/infos` pour éditer adresse/horaires/contact | `supabase/migrations/20260424120000_pessobot_bar_settings.sql`, `docs/n8n/pessobot-workflow-v1.json`, `src/components/common/Chatbot.tsx`, `src/pages/admin/AdminInfos.tsx` |
| **S2 — Personnalisation + Óra+** (2026-04-24) | RPC `fn_pessobot_profile_snapshot(uuid)` `SECURITY DEFINER`, rôle Postgres `pessobot` read-only, `bar_settings.subscription_info` (jsonb) éditable, workflow v2.1, pitch Óra+ adaptatif (visiteur / free / VIP) | `supabase/migrations/20260424140000_pessobot_s2_profile_snapshot.sql`, `docs/n8n/pessobot-workflow-v2.json`, `docs/n8n/pessobot-workflow-v2.1.json`, `src/pages/admin/AdminInfos.tsx` (bloc Óra+), `src/types/database.ts` |
| **S3 — Rate limit + Tool calling** (2026-04-24 soir) | Rate limit Postgres (30/10 min IP + 5/10 s session) via `fn_pessobot_rate_check`, 2 tools Langchain (`get_menu`, `get_upcoming_events`) en sub-workflows, persona divisée par 2 (~900 → ~400 tokens), liens cliquables dans le chatbot | `supabase/migrations/20260424220000_pessobot_s3_ratelimit_tools.sql`, `docs/n8n/pessobot-workflow-v3.json`, `docs/n8n/pessobot-tool-get-menu.json`, `docs/n8n/pessobot-tool-get-upcoming-events.json`, `src/components/common/Chatbot.tsx` (autolinker) |
| **Fixes v3 (3 itérations)** (2026-04-24 T23:50 → 2026-04-25 T00:30) | Résolution "invalid uuid: undefined" pour visiteur anonyme. 3 pièges n8n documentés : (1) template `{{undefined}}` → `queryReplacement` + `$1`, (2) `$json` change par node → référencer `$('Webhook').first().json`, (3) node à 0 item coupe le flow → `alwaysOutputData: true` | `docs/n8n/pessobot-workflow-v3.json`, `docs/ACTIONS_LOG.md` (3 entrées détaillées) |

**État final** : v3 en production, stable, 0 bug résiduel. Documentation complète dans [`RECAP_PESSOBOT.md`](./RECAP_PESSOBOT.md) (architecture, flow, DB, sécurité, monitoring, backlog S4).

### Logs détaillés (2026-04-22) — préférences UI admin côté serveur

**Contexte** : les filtres / recherche sur les listes admin (membres, événements, produits) étaient déjà persistés en `localStorage` via `usePersistentAdminState` ; demande de **synchroniser ces préférences sur le profil Supabase** pour retrouver le même état sur un autre navigateur ou post-reconnexion.

| Étape | Contenu |
|-------|---------|
| **Migration** | `supabase/migrations/20260422120000_profiles_admin_ui_prefs.sql` : colonne **`profiles.admin_ui_prefs`** (`jsonb`, défaut `{}`), une entrée par clé logique (`members_filters_v1`, `admin_events_filters_v1`, `admin_products_filters_v1`, etc.). |
| **Types** | `src/types/database.ts` : type **`ProfilesTableRow`** (évite la référence circulaire `Database → profiles.Row` qui cassait l’inférence client) + champ `admin_ui_prefs` sur le profil. |
| **Hook** | `usePersistentAdminState` : lecture **locale immédiate** ; si admin et session prête (`isLoading` false), **hydratation** depuis `admin_ui_prefs[key]` ; **écriture** locale + **debounce ~650 ms** vers Supabase (read-merge-write sur l’objet JSON). Appels via `(supabase as any)` alignés sur `useAdminMembers` (schéma TS incomplet vs `GenericSchema` postgrest-js v2). |
| **Déploiement BDD** | Appliquer la migration sur le projet Supabase (CLI `db push` ou SQL manuel) avant de compter sur la sync en prod. |

### Logs détaillés (2026-04-21) — compte header, panier v1, accueil « + »

**Contexte** : UX compte dans la navbar ; panier client **sans paiement en ligne** (spec Dal Cielo–like, DA éditoriale PessÓra) ; ajout rapide depuis l’accueil.

| Étape | Contenu |
|-------|---------|
| **Design** | Spec **`docs/superpowers/specs/2026-04-21-panier-editorial-design.md`** : v1 = tiroir + persistance locale + CTA bar/contact ; **phase B** (commande complète / backend) documentée pour présentation gérant, hors implémentation immédiate. |
| **Navbar compte** | `Header.tsx` : suppression du libellé « Mon espace » ; icône **User** conservée ; **prénom** (fallback e-mail / « Compte ») à côté ; lien **`/admin`** si `isAdmin`, sinon `/mon-espace`, invité → `/connexion`. |
| **État panier** | **`zustand` + `persist`** (`package.json`) — `src/store/cartStore.ts` : lignes `CartLine` (`productId` string, `unitPrice`, `quantity`, `optionsKey`, `optionLabels`, `image` emoji…), fusion par produit + options ; `openCart` à l’ajout ; `isOpen` **non** persisté. |
| **Helpers** | `src/lib/cartLine.ts` : `buildDrinkCartOptions` (lait + boosters → clé + prix unitaire + libellés), aligné fiche boisson. |
| **UI panier** | `src/components/cart/CartDrawer.tsx` : tiroir latéral (Framer Motion, `createPortal`, overlay, scroll lock, Échap), liste éditoriale, total `formatEurFr`, mentions règlement sur place, CTA **Préparer ma venue** → `/contact`, **Appeler le bar**, vider le panier. |
| **Intégration** | `App.tsx` : `<CartDrawer />` avec le chrome public. `Header.tsx` : clic sac → `toggleCart`, badge quantité si > 0, micro-animation si le nombre augmente (respect `prefers-reduced-motion`). `DrinkDetail.tsx` : « Ajouter au panier » branché sur le store + feedback **« Ajouté au panier »** ~2 s. |
| **Accueil — coups de cœur** | `HomeProductCarousel.tsx` : bouton **+** sur chaque vignette (HTML valide : lien overlay sur l’image + bouton au-dessus, texte en second lien) ; ajout **1×** avec **lait par défaut** (`milkOptions[0]`) et **sans boosters** ; style **discret** (fond blanc léger, flou fin, filet léger, `Plus` trait fin — pas de pastille noire pleine). |
| **Build** | `npm run build` validé après ces lots. |
| **Audit global** | **`docs/AUDIT_GLOBAL_KARIBLOOM_PESSORA.md`** — revue selon skill Karibloom (transposition Vite / HeroUI / Supabase) : synthèse + axes formulaires, SEO, déploiement, checklist actions. |

### Logs détaillés (2026-04-18) — admin membres & fiche

**Contexte** : un seul admin ; priorité édition / consultation membre ; e-mail non modifiable depuis l’app ; page dédiée (pas de drawer).

| Étape | Contenu |
|-------|---------|
| **Design** | Spec `docs/superpowers/specs/2026-04-18-admin-membre-fiche-design.md` : navigation liste → `/admin/membres/:memberId`, blocs identité / profil / abonnement, historiques **commandes** (`orders` + `order_items`), **bilans** (`bilan_bookings`), **événements** (`event_registrations` + `events`). Révisions : ajout des trois historiques en lecture seule ; hors scope : édition commandes/bilans depuis la fiche, invités sans `user_id` (v2). Commits docs associés sur la branche. |
| **UI liste** | `AdminMembers.tsx` : grille de cartes (plus tableau), filtres plan + rôle, recherche, squelette chargement ; cartes avec initiales, badges plan/statut, lien **vers la fiche** (`Link`, e-mail en texte pour éviter lien imbriqué). |
| **UI fiche** | `AdminMemberDetail.tsx` : chargement `profiles` + `subscriptions(*)`, puis `Promise.all` pour commandes, bilans, inscriptions ; e-mail + UUID copiable + aide « changement e-mail hors app » ; formulaires profil et abonnement (deux boutons enregistrer) ; `stripe_subscription_id` lecture seule ; toasts succès ; erreurs RLS **par section** pour les historiques. |
| **Routing** | `App.tsx` : route lazy `AdminMemberDetail`, `path="/admin/membres/:memberId"`, `ProtectedAdminRoute` + `AdminLayout`. |
| **Types** | `src/types/database.ts` : `Profile.Row` inclut **`email: string \| null`**. |
| **Base / RLS** | `supabase/migrations/20260421120000_admin_member_detail_rls.sql` : `CREATE OR REPLACE public.is_admin()` ; politiques **UPDATE + INSERT** sur `subscriptions` pour admin ; **SELECT** admin sur `orders`, `order_items`, `bilan_bookings`. **À appliquer** : `supabase db push` ou SQL Editor. Si une section historique affiche « indisponible », vérifier RLS côté projet (coexistence politiques membre + admin). |
| **Build** | `npm run build` validé après implémentation. |
| **Commit Git (extrait)** | `docs: spec design fiche membre admin` ; `docs: spec fiche membre — historique…` ; `feat(admin): fiche membre /admin/membres/:id avec édition et historiques` (fichiers : `AdminMemberDetail.tsx`, migration, `App.tsx`, `AdminMembers.tsx`, `database.ts`). |

**Rappel lot antérieur (même fil admin produits)** : `AdminProduits.tsx` — grille de cartes à la place du tableau, filtres gammes, formulaire création/édition, upload Storage, carte du produit retirée de la grille pendant l’édition.

| Date | Lot | Fichiers / sujets principaux |
|------|-----|------------------------------|
| **2026-05-02** | **Gamme produit détail + Stripe Checkout (13 tâches)** | Migration slug, `toSlug`, `CartLine.source`, Zod schemas, `useGammeProduct`, `GammeProductDetail`, `RangeDetail` liens, `AdminGammes` slug, route App, Edge Function Stripe, `useCheckout`, `CartDrawer` badges+Commander, pages `/commande/succes` + `/commande/annulee`. Voir **§ Logs détaillés (2026-05-02)**. |
| **2026-05-03** | **Óra+ Stripe Cycle 3 (6 tâches)** | Migration `cancel_at_period_end` ; 3 Edge Functions admin Stripe (`get-stripe-member`, `cancel-stripe-subscription`, `admin-portal-session`) ; section "Abonnement Stripe" dans `AdminMemberDetail` (4 états : chargement / erreur / actif / annulation programmée). Voir **§ Logs détaillés (2026-05-03) — Cycle 3**. |
| **2026-05-03** | **Óra+ Stripe Cycle 2 (4 tâches)** | Bug planLabel (`ora_plus` → "Óra+") dans Dashboard + Subscription ; MRR KPI réel dans AdminOverview ; section paiements échoués (expired) avec join profiles ; date renouvellement membre. Voir **§ Logs détaillés (2026-05-03) — Cycle 2**. |
| **2026-05-03** | **Refonte page Gammes + Mes bilans membre + correctifs** | Refonte NosProduits (layout éditorial alterné), HeaderSubNav Segment HeroUI Pro, pages détail produit (GammeProductDetail), sélecteur tailles DrinkDetail, correctif Stripe double slash, déplacement CTA Óra+, correctif AdminOverview, nouvelle page Mes bilans membre (historique + réservation). Voir **§ Logs détaillés (2026-05-03)**. |
| **2026-04-25** | **PessoBot v3 — fixes finaux (3 itérations n8n)** | `docs/n8n/pessobot-workflow-v3.json` + `docs/ACTIONS_LOG.md`. Voir **[`RECAP_PESSOBOT.md`](./RECAP_PESSOBOT.md)** §7 pour les 3 pièges n8n résolus (template `undefined`, scope `$json`, `alwaysOutputData`). |
| **2026-04-24** | **PessoBot S3 — Rate limit + Tool calling** | RPC `fn_pessobot_rate_check`, tools `get_menu` / `get_upcoming_events`, persona ÷2, liens cliquables. Voir **[`RECAP_PESSOBOT.md`](./RECAP_PESSOBOT.md)**. |
| **2026-04-24** | **PessoBot S2 — Personnalisation + Óra+** | RPC `fn_pessobot_profile_snapshot`, rôle `pessobot` read-only, `bar_settings.subscription_info` éditable, pitch Óra+ adaptatif. Voir **[`RECAP_PESSOBOT.md`](./RECAP_PESSOBOT.md)**. |
| **2026-04-23** | **PessoBot S1 — Base dynamique** | `bar_settings`, vue `v_pessobot_menu`, signature webhook, CORS prod, `/admin/infos`. Voir **[`RECAP_PESSOBOT.md`](./RECAP_PESSOBOT.md)**. |
| **2026-04-21** | **Panier v1 + header compte + accueil « + » + audit Karibloom** | Voir **§ Logs détaillés (2026-04-21)** : panier (`cartStore`, `CartDrawer`, etc.), spec panier, `zustand` ; **audit global** `AUDIT_GLOBAL_KARIBLOOM_PESSORA.md` (grille Client Builder). |
| **2026-04-18** | **Admin — fiche membre + RLS + spec** | Voir **§ Logs détaillés (2026-04-18)** ci-dessous : page `/admin/membres/:id`, édition profil/abonnement, historiques commandes / bilans / événements, migration SQL, spec design, liste membres en cartes cliquables. |
| **2026-04-19** | **Accueil « Nespresso » + données** | `src/data/homeDrinkShowcase.ts` (3 visuels × 4 gammes), `Home.tsx` : onglets Wellness / Énergie / Shakes / Coffee + grille 1+2 frameless, coins ~28px. Remplace l’ancienne section `ProductCard` shakes. |
| **2026-04-19** | **Spec dashboard** | `docs/superpowers/specs/2026-04-19-dashboard-real-data.md` — branchement dashboard / admin sur Supabase (événements, commandes, KPIs). |
| **2026-04-19** | **Design frameless global** | Réduction des « boîtes » : `ImageCard`, `ProductCard`, `SectionTitle`, `Menu` (grilles serrées, CTA bilan clair), `Concept`, `Contact`, `NosProduits`, `OraPlus`, `DrinkDetail`, `LuxeMockup`, auth `Login`/`Register`. |
| **2026-04-18** | **Luxe épuré (surfaces)** | Tokens `surface-page`, `surface-muted`, `surface-card`, `surface-hero` dans `index.css` ; `@import` polices en tête ; `Home` allégée (un hero sombre, cartes claires) ; `Menu` `CATEGORY_BG` sans bordures lourdes. |
| **2026-04-18** | **Auth Supabase** | `AuthContext.tsx` : `INITIAL_SESSION`, pas d’appels `supabase.from` synchrones dans `onAuthStateChange`, `setTimeout(0)`, relecture session après `SIGNED_OUT`, refs `initialSessionHandled` / `loginInProgress`. |
| **2026-04-18** | **Mockup & nav** | Route `/mockup-luxe`, `LuxeMockup.tsx`, header navigation type grandes sections, hero `clamp` aligné Home. |

### Design & contenu (mémo longue)

- DA HeroUI, breadcrumb `?gamme=` sur `DrinkDetail`, `PageShell`.
- Retrait beige / « café crème », B&W strict, `productsData` pour Nos produits.
- Audit minimalisme (Nespresso / Le Tanneur) — note hors code.
- Header : nav Nespresso-like, cellules légères, pas de `divide-x` fort.

### Fichiers souvent concernés

- Layout : `Header.tsx`, `HeaderSubNav.tsx`, `headerNav.ts`
- Panier : `store/cartStore.ts`, `lib/cartLine.ts`, `components/cart/CartDrawer.tsx`
- Global : `index.css`
- Pages : `Home.tsx`, `Menu.tsx`, `Concept.tsx`, `Contact.tsx`, `DrinkDetail.tsx`, `LuxeMockup.tsx`, `App.tsx`, `seoConfig.ts`
- Accueil : `components/home/HomeProductCarousel.tsx`, `data/homeProductCarousel.ts`
- Données : `productsData.ts`, `menuData.ts`, `infoData.ts`, `homeDrinkShowcase.ts`, `CGV.tsx`
- Auth : `contexts/AuthContext.tsx`, `lib/supabaseClient.ts`

---

## Environnement de dev

- **Vite** : port **3000** (`vite.config.ts`).
- Commande : `npm run dev` → http://localhost:3000/
- Si warning CSS `@import` : l’ordre actuel place les polices Google **avant** Tailwind dans `index.css`.

---

## Auth — espace membre (rappel technique)

- Problèmes résolus : déconnexion au reload, boucle de reconnexion.
- Approche : listener unique, travail async différé, `INITIAL_SESSION`, vérification session après `SIGNED_OUT`, repli `buildFallbackUser` si fetch profil échoue.

---

## Phases projet (checklist historique)

1. React 19 + Tailwind v4 + HeroUI — thème, build, lint  
2. Header / Footer / MemberLayout  
3. Pages publiques  
4. Auth, espace membre, admin  
5. Chatbot + a11y / perf / routes  

**Suite possible** : implémenter la spec dashboard réelles données (`2026-04-19-dashboard-real-data.md`) ; **webhook Stripe** (mise à jour statut order post-paiement, phase suivante du checkout) ; configurer `STRIPE_SECRET_KEY` en secret Supabase pour activer le paiement gamme.

---

## Pistes ouvertes

- Vidéo hero Home (placeholder commenté).
- Aligner la spec luxe éditoriale avec l’état actuel (Bodoni / Jost, frameless).
- Erreurs HMR ponctuelles sur `Home.tsx` — surveiller.
- Panier : ajout rapide depuis la **grille menu** (hors fiche seule) ; micro-feedback « Ajouté » sur l’accueil ; numéro `tel:` réel dans `infoData` quand le bar le fournit.

---

## Documentation projet (`docs/`)

| Chemin | Rôle |
|--------|------|
| `RECAP_PAGE_MENU.md` | Récap design/layout/couleurs/contenu de la page `Menu` |
| `RECAP_PAGE_ORA_PLUS.md` | Récap design/layout/couleurs/contenu de la page `Ora+` |
| **`RECAP_PESSOBOT.md`** | **Récap complet PessoBot** (S1→S3, architecture, flow, DB, sécurité, 3 fixes v3, backlog S4) |
| `PESSOBOT_BACKLOG.md` | État du backlog PessoBot (livré / en attente / S4 candidat) |
| `PESSOBOT_GUIDE.md` | Guide admin pour former un utilisateur à `/admin/infos` et au suivi bot |
| `n8n/README.md` | Déploiement des 4 workflows n8n + changelog v1→v3 |
| `n8n/pessobot-workflow-v3.json` | Workflow principal PessoBot (prod) |
| `n8n/pessobot-tool-get-menu.json` | Sub-workflow tool `get_menu` |
| `n8n/pessobot-tool-get-upcoming-events.json` | Sub-workflow tool `get_upcoming_events` |
| `AUDIT_SECURITE_PESSORA.md` | Audit sécurité — obligations dev |
| `AUDIT_GLOBAL_KARIBLOOM_PESSORA.md` | **Audit global** — grille Karibloom Client Builder (stack, archi, SEO, forms, perf, déploiement) |
| `ETAPES_APRES_BDD.md` | Étapes post-BDD |
| `SUPABASE_SCHEMA.sql` | Schéma Supabase (référence) |
| `supabase_migration_dashboard.sql` | Migration liée dashboard (si utilisée) |
| `O2SWITCH_SCHEMA.sql` / `API_BACKEND_O2SWITCH.md` | Réf. hébergement / API historique o2switch |
| `PESSOBOT_N8N_SCRIPT_IMPROVED.js` | Script / logique n8n chatbot |
| `superpowers/specs/2026-04-18-pessora-redesign-luxe-editorial.md` | Spec redesign luxe |
| `superpowers/specs/2026-04-18-supabase-run-club-espace-client-design.md` | Espace client / Run Club |
| `superpowers/specs/2026-04-19-dashboard-real-data.md` | Dashboard & admin — vraies données |
| `superpowers/specs/2026-04-18-admin-membre-fiche-design.md` | **Spec** — fiche admin membre (édition, historiques, RLS) |
| `superpowers/specs/2026-04-21-panier-editorial-design.md` | **Spec** — panier client v1 (tiroir, persistance, sans paiement) + archive phase commande (B) |
| `superpowers/specs/2026-05-02-gamme-product-detail-stripe-design.md` | **Spec** — page détail produit gamme, panier unifié bar+boutique, Stripe Checkout, Zod |
| `superpowers/plans/2026-05-02-gamme-product-detail-stripe.md` | **Plan** — 13 tâches : slug, types, CartLine, Zod, hooks, pages, Edge Function Stripe |
| `superpowers/specs/2026-05-03-member-bilans-design.md` | **Spec** — Mes bilans membre (historique + réservation simplifiée) |
| `superpowers/plans/2026-05-03-member-bilans.md` | **Plan** — Mes bilans membre (route, sidebar, page, perks) |
| `LOG_TRAVAIL_2026-04-18.md` | **Log** chronologique session 2026-04-18 (admin produits/membres, fiche, migration, commits) |
| `superpowers/plans/*.md` | Plans associés aux specs ci-dessus |

### Sources externes référencées par les règles

- [HeroUI — Agent Skills](https://heroui.com/docs/react/getting-started/agent-skills)  
- Repo **ui-ux-pro-max-skill** (install `uipro init --ai cursor`, voir `pessora-project.mdc`)

### Skill Karibloom (hors repo PessÓra)

`~/Downloads/KARIBLOOM/.claude/skills/karibloom-client-builder/` (`SKILL.md` + `rules/*.md`)

---

## Comment tenir ce récap à jour

1. **Journal des actions** : ajouter une **ligne datée en tête** à chaque lot significatif (chemins + intention).
2. **Règles** : si `.cursor/rules/*.mdc` change ou si de nouveaux `kb-*` sont ajoutés dans KARIBLOOM, mettre à jour la section **Référentiel des règles** (tableaux et chemins).
3. **Stack** : si auth ou build change (ex. bascule API), ajuster **Contexte technique** + note dans **§5 Comment lire tout ça**.
4. **Documentation** : ajouter les nouveaux fichiers dans **Documentation projet**.
5. Ne pas recopier les diffs Git entiers : intention + fichiers clés suffisent.
