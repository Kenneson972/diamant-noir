# Récapitulatif de travail — PessÓra

Journal de synthèse (design, stack, auth, données). Dernière mise à jour : **2026-04-18**.

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
| Front | React 19 + Vite, React Router 7, Tailwind v4, HeroUI, Framer Motion |
| Auth / données live | Supabase (`AuthContext`, tables profil / events / etc.), `VITE_SUPABASE_*` |
| Règles Cursor locales | `.cursor/rules/pessora-project.mdc` + `karibloom-client-builder.mdc` |
| Règles étendues | `~/Downloads/KARIBLOOM/.cursor/rules/kb-*.mdc` + skill `karibloom-client-builder` |

---

## Journal des actions (changelog)

Convention : **ajouter une entrée datée en tête de liste** à chaque lot de travail significatif (design, auth, données, déploiement).

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
- Global : `index.css`
- Pages : `Home.tsx`, `Menu.tsx`, `Concept.tsx`, `Contact.tsx`, `DrinkDetail.tsx`, `LuxeMockup.tsx`, `App.tsx`, `seoConfig.ts`
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

**Suite possible** : implémenter la spec dashboard réelles données (`2026-04-19-dashboard-real-data.md`).

---

## Pistes ouvertes

- Vidéo hero Home (placeholder commenté).
- Aligner la spec luxe éditoriale avec l’état actuel (Bodoni / Jost, frameless).
- Erreurs HMR ponctuelles sur `Home.tsx` — surveiller.

---

## Documentation projet (`docs/`)

| Chemin | Rôle |
|--------|------|
| `AUDIT_SECURITE_PESSORA.md` | Audit sécurité — obligations dev |
| `ETAPES_APRES_BDD.md` | Étapes post-BDD |
| `SUPABASE_SCHEMA.sql` | Schéma Supabase (référence) |
| `supabase_migration_dashboard.sql` | Migration liée dashboard (si utilisée) |
| `O2SWITCH_SCHEMA.sql` / `API_BACKEND_O2SWITCH.md` | Réf. hébergement / API historique o2switch |
| `PESSOBOT_N8N_SCRIPT_IMPROVED.js` | Script / logique n8n chatbot |
| `superpowers/specs/2026-04-18-pessora-redesign-luxe-editorial.md` | Spec redesign luxe |
| `superpowers/specs/2026-04-18-supabase-run-club-espace-client-design.md` | Espace client / Run Club |
| `superpowers/specs/2026-04-19-dashboard-real-data.md` | Dashboard & admin — vraies données |
| `superpowers/specs/2026-04-18-admin-membre-fiche-design.md` | **Spec** — fiche admin membre (édition, historiques, RLS) |
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
