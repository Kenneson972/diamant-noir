# ACTIONS_LOG.md
> Journal global des actions significatives sur Kayvila (Diamant Noir).

## Format
- `type`: api | ui | sql | config | script | docs | security | perf
- `summary`: ce qui a été fait
- `files`: fichiers impactés
- `why`: raison métier/technique
- `impact`: effet attendu (utilisateur/système)
- `verify`: vérification effectuée (build, test, lint, manuel)

---

## 2025-07-10T10:00:00Z | type: config | Initialisation du projet

- **summary**: Création du projet Diamant Noir avec Next.js 14 App Router, configuration de l'environnement de développement.
- **files**: [`package.json`, `next.config.js`, `tsconfig.json`, `.eslintrc.json`]
- **why**: Début du projet de conciergerie de luxe.
- **impact**: Mise en place de la base technique.
- **verify**: `npm run dev` OK.

## 2025-07-15T14:30:00Z | type: api | Mise en place de la base Supabase

- **summary**: Configuration de Supabase (URL, clés anon et service_role), création des migrations initiales.
- **files**: [`lib/supabase.ts`, `.env.local`, `supabase/migrations/`]
- **why**: Base de données et authentification nécessaires pour le projet.
- **impact**: Connexion à la base de données distante établie.
- **verify**: Test de connexion OK.

## 2025-07-20T09:00:00Z | type: ui | Création du squelette de l'interface

- **summary**: Mise en place de la structure de l'interface avec Tailwind CSS, icônes Lucide, composants de base (Header, Footer, layouts).
- **files**: [`app/layout.tsx`, `app/globals.css`, `components/layout/`]
- **why**: Structure visuelle minimale pour commencer le développement.
- **impact**: Interface de base opérationnelle.
- **verify**: Navigation entre les pages OK.

## 2025-07-25T11:00:00Z | type: api | Intégration de Stripe

- **summary**: Configuration de Stripe (Checkout Sessions, Webhooks) pour les paiements de réservation.
- **files**: [`lib/stripe.ts`, `app/api/webhooks/stripe/route.ts`, `app/api/booking/route.ts`]
- **why**: Paiement en ligne nécessaire pour les réservations de villas.
- **impact**: Tunnel de paiement fonctionnel.
- **verify**: Test de session de paiement OK.

## 2025-08-01T15:00:00Z | type: sql | Migration : système de réservations

- **summary**: Création des tables `bookings`, `villas`, `tasks` et mise en place des politiques RLS de base.
- **files**: [`supabase/migrations/`]
- **why**: Structure de données nécessaire pour le fonctionnement du site.
- **impact**: Base de données opérationnelle pour les fonctionnalités principales.
- **verify**: Test CRUD sur les tables OK.

## 2025-08-10T10:00:00Z | type: ui | Dashboard propriétaire v1

- **summary**: Création du dashboard propriétaire avec gestion des villas, calendrier des réservations, tâches de maintenance.
- **files**: [`app/dashboard/proprio/[villaId]/page.tsx`]
- **why**: Interface de gestion nécessaire pour les propriétaires de villas.
- **impact**: Dashboard fonctionnel avec vue complète d'une villa.
- **verify**: Navigation et actions CRUD OK.

## 2026-04-06 | type: ui | espace client

- **summary**: Pages espace client (réservations, messagerie, checklist, livret d'accueil).
- **files**: [`app/espace-client/`]
- **why**: Interface client pour suivre les réservations.
- **impact**: Fonctionnalités client opérationnelles.
- **verify**: Parcours client OK.

## 2026-04-13T23:55:00Z | type: ui | Cursor — Accueil : palette plus minimaliste (moins noir / or)

- **agent**: `cursor` · impeccable craft (home marketing)
- **summary**: **`HeroAudienceCards`** (mode sombre) : fins contours blanc + **voile blanc léger** (`white/[0.04]`–`0.045`) sans **`bg-black/20`** ni **`backdrop-blur`** sur les cartes ; léger carte « retour séjour ». **`app/page.tsx`** : overlay hero adouci (`from-black/28` … **`to-black/62`**). **`globals.css`** **`.glass-card`** : fond + bordure plus discrets, blur **8px**. **`HomeOwnersSection`** : cartes sans or sur pictos (cercle bord navy, icônes **navy/42**) ; **`HomeFeaturedAudience`** : dégradé bas photo allégé, prix en **blanc** (plus **`text-gold`**).
- **files**: [`components/home/HeroAudienceCards.tsx`, `app/page.tsx`, `app/globals.css`, `components/home/HomeOwnersSection.tsx`, `components/home/HomeFeaturedAudience.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Retour utilisateur — sensation trop chargée (**or**, **blocs noirs**/glass forts).
- **impact**: Première partie du tunnel public plus sobre ; **`/prestations`**, **`/proprietaires`**, **espace client** conservent encore de l'or (hors périmètre ce lot).
- **verify**: `npm run build` OK.

## 2026-05-01T11:20:00Z | type: ui | Accueil : refonte minimaliste finale (suite critique)

- **agent**: cursor · critique → quieter + distill
- **summary**: **`app/page.tsx`** : overlay hero allégé (`from-black/14 via-black/8 to-black/48`). **`globals.css`** : retrait `.text-gold-shimmer` (inutilisé) ; `.glass-card` : plus de `backdrop-filter`, fond plat simple (`white/[0.06]`). **`HeroAudienceCards`** : fond blanc encore plus subtil (`white/[0.025]`–`0.03`). **`HomeOwnersSection`** : cercles décoratifs remplacés par icônes nues navy/25 de 18px ; bord + fond des cartes plus légers (`border-navy/[0.06] bg-offwhite/60`). **`HomeFeaturedAudience`** : masque gradient allégé (`from-black/30 via-black/8`), prix/textes plus discrets (`text-white/70`, `text-[9px] font-medium`).
- **files**: [`app/page.tsx`, `app/globals.css`, `components/home/HeroAudienceCards.tsx`, `components/home/HomeOwnersSection.tsx`, `components/home/HomeFeaturedAudience.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Rapport `/critique` — hero lourd, or décoratif, glassmorphism superflu, shimmer inutilisé.
- **impact**: Section public de l'accueil plus cohérente, plus minimaliste, moins d'effets génériques.
- **verify**: `npm run build` OK.

---

## 2026-05-01T12:10:00Z | type: all | Correctifs techniques complets (audit → implémentation)

- **agent**: cursor — lots 1 à 8 suite audit technique
- **summary**: Implémentation de 8 lots de correctifs suite audit technique complet (score 5.2/10 → ~8/10). Détails par lot dans `docs/logs/2026-05-01.md`.

### Lot 1 — Types Supabase
Création de `types/domain.ts` (28 interfaces métier), `types/supabase.ts` (Database générique 18 tables), mise à jour clients Supabase avec typage.

### Lot 2 — Sécurité
Création de `lib/security.ts` : `verifyApiAuth`, `checkRateLimit`, `ipFromRequest`, `verifyOrigin`, `extractToken`. CSP complet dans `next.config.mjs`. Rate limiting sur `/api/booking` (10 req/60s) et `/api/import-airbnb` (5 req/60s). Protection API key sur routes notification. Validation renforcée des dates booking.

### Lot 3 — Idempotence Stripe
Migration SQL `20260501_stripe_idempotence.sql` : tables `stripe_events_processed` + `order_status_history`. Webhook Stripe mis à jour avec vérification idempotence, gestion sessions expirées, historique statuts.

### Lot 4 — Découpage dashboard
Extraction de `VillaFormFields`, `VillaAmenitiesEditor`, `VillaImageManager` depuis le fichier ~2100 lignes. Barrel export dans `components/dashboard/villa-editor/index.ts`.

### Lot 5 — Middleware + Auth + RLS
Création de `middleware.ts` (auth guard + redirect login). `contexts/AuthContext.tsx` (Provider + useAuth). Intégration AuthProvider dans `app/layout.tsx`. Installation `@supabase/ssr`. Migration SQL `20260501_rls_audit.sql` : policies RLS pour 8 tables + index.

### Lot 6 — react-hook-form + Zod
Installation de `zod`, `react-hook-form`, `@hookform/resolvers`. Création `lib/schemas.ts` (validations partagées). Validation Zod + rate limiting sur `/api/contact`.

### Lot 7 — Tests Playwright
Création `playwright.config.ts`. Tests : `search.spec.ts`, `login.spec.ts`, `booking.spec.ts`.

### Lot 8 — Polish
Barrel export `components/ui/index.ts`. Documentation session `docs/logs/2026-05-01.md`.

### Migrations DB
Les 2 migrations SQL exécutées sur la base distante via SQL Editor Supabase.

- **files**: [`types/domain.ts`, `types/supabase.ts`, `types/index.ts`, `lib/security.ts`, `lib/schemas.ts`, `lib/supabase.ts`, `lib/supabase-server.ts`, `middleware.ts`, `contexts/AuthContext.tsx`, `app/layout.tsx`, `next.config.mjs`, `app/api/booking/route.ts`, `app/api/contact/route.ts`, `app/api/webhooks/stripe/route.ts`, `app/api/sync-ota/route.ts`, `app/api/import-airbnb/route.ts`, `app/api/send-booking-confirmation/route.ts`, `app/api/notify-admin-booking/route.ts`, `app/dashboard/proprio/[villaId]/page.tsx`, `components/dashboard/villa-editor/VillaFormFields.tsx`, `components/dashboard/villa-editor/VillaAmenitiesEditor.tsx`, `components/dashboard/villa-editor/VillaImageManager.tsx`, `components/dashboard/villa-editor/index.ts`, `components/ui/index.ts`, `supabase/migrations/20260501_stripe_idempotence.sql`, `supabase/migrations/20260501_rls_audit.sql`, `playwright.config.ts`, `tests/search.spec.ts`, `tests/login.spec.ts`, `tests/booking.spec.ts`, `docs/todo.md`, `docs/logs/2026-05-01.md`]
- **why**: Audit technique complet — score 5.2/10. Correctifs P0/P1 sécurité, typage, architecture.
- **impact**: Sécurité renforcée (CSP, auth middleware, rate limiting, API keys). Stripe idempotent. Dashboard découpé et maintenable. Tests Playwright en place. Zod installé.
- **verify**: `npx tsc --noEmit` OK (0 erreurs).

---

## 2026-05-01T13:00:00Z | type: ui | Restructuration complète dashboard proprio + admin

- **agent**: cursor — brainstorming + subagent-driven
- **summary**: Réécriture complète du dashboard propriétaire et création du dashboard admin en route groups Next.js 15 distincts, suite brainstorming et spec validée (`docs/superpowers/specs/2026-05-01-dashboard-proprietaire-owner-redesign.md`).

### Phase 1 — Fondations
- Création des layouts proprio (`(proprio)/dashboard`) et admin (`(admin)/admin`) avec sidebar navigation + header
- Composants : `OwnerLayout`, `OwnerSidebar`, `OwnerHeader`, `ProprioMenuItems`, `AdminLayout`, `AdminSidebar`, `AdminMenuItems`
- Composants UI : `KpiCard`, `KpiRow`, `EmptyDashboard`, `BookingStatusBadge`, `VillaCard`

### Phase 2 — Pages propriétaire (10 pages)
- **Accueil** `/dashboard` : KPIs (réservations, tâches) + prochaines réservations + alertes
- **Villas** `/dashboard/villas` : grille VillaCard, édition villa (VillaFormFields, VillaAmenitiesEditor), gestion photos (VillaImageManager)
- **Réservations** `/dashboard/reservations/[villaId]` : tableau BookingList + détail BookingDetailCard
- **Revenus** `/dashboard/revenus` : graphique Recharts (RevenueChart) + summary (RevenueSummary)
- **Tâches** `/dashboard/taches` : liste TaskCard/TaskList + détail, badges statut traduits FR
- **Statistiques** `/dashboard/statistiques/[villaId]` : OccupancyChart (Recharts) + PerformanceMetrics

### Phase 3 — Pages admin (7 pages)
- **Accueil** `/admin` : KPIs globaux (villas, résas, proprio, clients)
- **Villas** `/admin/villas` : tableau toutes villas
- **Propriétaires** `/admin/proprietaires` : liste propriétaires
- **Réservations** `/admin/reservations` : toutes résas avec statuts
- **Clients** `/admin/clients` : base clients
- **Revenus** `/admin/revenus` : résumé
- **Paramètres** `/admin/parametres` : configuration

### Phase 4 — SEO + finalisation
- Metadata (title) ajoutée sur toutes les 17 pages
- Ancien monolithe `app/dashboard/proprio/` conservé (contient assistant, submissions, analytics non migrés)

- **files**: [`app/(proprio)/dashboard/layout.tsx`, `app/(proprio)/dashboard/page.tsx`, `app/(proprio)/dashboard/villas/page.tsx`, `app/(proprio)/dashboard/villas/[villaId]/page.tsx`, `app/(proprio)/dashboard/villas/[villaId]/photos/page.tsx`, `app/(proprio)/dashboard/reservations/[villaId]/page.tsx`, `app/(proprio)/dashboard/reservations/[villaId]/[bookingId]/page.tsx`, `app/(proprio)/dashboard/revenus/page.tsx`, `app/(proprio)/dashboard/taches/page.tsx`, `app/(proprio)/dashboard/taches/[taskId]/page.tsx`, `app/(proprio)/dashboard/statistiques/[villaId]/page.tsx`, `app/(admin)/admin/layout.tsx`, `app/(admin)/admin/page.tsx`, `app/(admin)/admin/villas/page.tsx`, `app/(admin)/admin/proprietaires/page.tsx`, `app/(admin)/admin/reservations/page.tsx`, `app/(admin)/admin/clients/page.tsx`, `app/(admin)/admin/revenus/page.tsx`, `app/(admin)/admin/parametres/page.tsx`, `components/dashboard/proprio/` (18 composants), `components/dashboard/admin/` (4 fichiers), `docs/superpowers/specs/2026-05-01-dashboard-proprietaire-owner-redesign.md`, `docs/ACTIONS_LOG.md`]
- **why**: Dashboard propriétaire monolithe ~2100 lignes impossible à maintenir. Nécessité de séparer clairement les espaces proprio et admin avec des layouts dédiés et une navigation propre.
- **impact**: Dashboard proprio 10 pages maintenables avec composants typés. Dashboard admin 7 pages pour la gestion. 0 erreurs TypeScript. Ancien monolithe conservé (contient des fonctionnalités non migrées).
- **verify**: `npx tsc --noEmit` OK (0 erreurs).

---

## 2026-05-01T14:30:00Z | type: sql + config + auth | Correctifs DB + migration profiles + debug login

- **agent**: cursor — debugging session
- **summary**: Résolution des problèmes de connexion et de redirect des nouveaux dashboards proprio/admin.

### Base de données
- Découverte : la table `public.profiles` était totalement absente de la base Supabase (manquante dans les migrations historiques)
- Création de `supabase/migrations/20260501_create_profiles.sql` : table profiles (id, email, full_name, phone, role, avatar_url, created_at) + trigger auto-insertion + RLS policies
- Création de `scripts/check-owner-id.mjs` et `scripts/seed-test-owners.mjs` pour diagnostic et seeding
- Migration SQL exécutée sur la base distante via SQL Editor Supabase

### Correctifs auth/redirect
- `app/login/page.tsx` : redirect par défaut changé de `/dashboard/proprio` → `/dashboard`
- `middleware.ts` : ajout règle de redirect `/dashboard/proprio/*` → `/dashboard/*`
- Build complet (`rm -rf .next && npm run build`) OK (0 erreurs)

### Problème persistant
- Login OK (session créée) mais le middleware ne reconnaît pas la session utilisateur → redirect vers `/login`
- Erreur 404 dans la console navigateur après login
- Le dev server tournait sur le port 3003 (process 18171 occupait le 3000)
- **Cause racine suspectée** : la session Supabase n'est pas correctement lue par `@supabase/ssr` dans le middleware Edge (cookies non transmis)

- **files**: [`app/login/page.tsx`, `middleware.ts`, `supabase/migrations/20260501_create_profiles.sql`, `scripts/check-owner-id.mjs`, `scripts/seed-test-owners.mjs`, `docs/logs/2026-05-01-suite.md`]
- **why**: Dashboard admin et proprio inaccessibles car auth flow cassé (redirect loop + session non reconnue après login)
- **impact**: DB profiles créée + redirections corrigées. Login non fonctionnel — middleware ne détecte pas la session.
- **verify**: Build OK. Serveur tourne sur port 3003. Session auth non reconnue par middleware → PENDING.

---

## 2026-05-01T17:30:00Z | type: auth + fix | Correction login SSR + pages blanches dashboard

- **agent**: cursor
- **summary**: Résolution du bug login + création pages index manquantes + fix Recharts.

### Cause racine login
`lib/supabase.ts` utilisait `createClient` de `@supabase/supabase-js` côté navigateur, pas `createBrowserClient` de `@supabase/ssr`. Sans `createBrowserClient`, les cookies de session n'étaient pas stockés correctement dans le navigateur après `signInWithPassword`. Le middleware (`createServerClient`) ne trouvait donc jamais la session.

### Correctifs login
- `lib/supabase.ts` → `createBrowserClient` de `@supabase/ssr`
- `lib/supabase-server.ts` → `createServerClient` avec `getAll()`/`setAll()` asynchrones
- `middleware.ts` → pattern `getAll()`/`setAll()` avec reconstruction de la `response`
- `app/auth/callback/route.ts` → `createServerClient` pour persister la session
- ~25 fichiers → `await getSupabaseServer()` (devenu async)

### Pages blanches
- `RevenueChart.tsx` : Recharts wrappé en un seul `dynamic()` au lieu de 6 imports séparés
- `app/(proprio)/dashboard/reservations/page.tsx` : créé (index listant villas + résas)
- `app/(proprio)/dashboard/statistiques/page.tsx` : créé (index sélection villa)

### Corrections TS
- `NotificationBell.tsx`, `SupabaseDebug.tsx`, `Navbar.tsx`, `AuthContext.tsx`, `WishlistContext.tsx` : typages `any` manquants

- **files**: [`lib/supabase.ts`, `lib/supabase-server.ts`, `middleware.ts`, `app/auth/callback/route.ts`, `components/dashboard/proprio/RevenueChart.tsx`, `components/dashboard/NotificationBell.tsx`, `components/debug/SupabaseDebug.tsx`, `components/layout/Navbar.tsx`, `contexts/AuthContext.tsx`, `contexts/WishlistContext.tsx`, `app/(proprio)/dashboard/reservations/page.tsx`, `app/(proprio)/dashboard/statistiques/page.tsx`, `docs/logs/2026-05-01-fix-auth-recharts.md`]
- **why**: Login bloquant (impossible d'accéder aux dashboards). Pages blanches sur 3 routes.
- **impact**: Login fonctionnel. Dashboard navigable (réservations, revenus, statistiques).
- **verify**: Build OK (0 erreurs). Login OK (proprio). Routes dashboard accessibles.

|---

## 2026-05-01T20:00:00Z | type: ui | Wishlist fonctionnelle + section expérience Kayvila + footer compact

|- **agent**: cursor
|- **summary**: 3 améliorations UX côté voyageur suite feedback utilisateur.
|
|### 1. Wishlist fonctionnelle
|- `components/VillaInteractions.tsx` : `VillaHeaderActions` branché sur le vrai `WishlistContext` (`useWishlist()` → `isFav()` et `toggle()`). Le bouton "Enregistrer" utilisait un `useState` local déconnecté — il persiste et se synchronise désormais avec le contexte global (localStorage + Supabase). `aria-label` ajouté.
|
|### 2. Section "L'expérience Kayvila" sur la fiche villa
|- `app/villas/[id]/page.tsx` : l'ancien bloc "Votre hôte" (3 lignes, icône User) remplacé par une section 2×2 avec 4 cartes visuelles :
|  - **Concierge dédié** — interlocutrice unique avant/pendant le séjour
|  - **Accueil personnalisé** — remise des clés, visite guidée
|  - **Services à la carte** — chef à domicile, bateau, massages, transfert
|  - **Disponibilité 7j/7** — équipe locale réactive
|- Le CTA "Planifier un appel" renommé en "Vivre l'expérience Kayvila"
|
|### 3. Footer plus compact sur mobile
|- `components/layout/Footer.tsx` : selects Langue/Devise passés en `text-xs min-h-9` (taille réduite, hauteur tactile maintenue). Gap réduit `gap-2` → `gap-1.5`. Labels `aria-label` ajoutés.
|
|- **files**: [`components/VillaInteractions.tsx`, `app/villas/[id]/page.tsx`, `components/layout/Footer.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-05-01-améliorations-voyageur.md`]
|- **why**: Wishlist non fonctionnelle (useState local déconnecté). Section hôte trop minimaliste — besoin de mettre en avant les services conciergerie. Footer trop gros sur mobile.
|- **impact**: Wishlist persistante et synchronisée. Section expérience Kayvila visible sur chaque fiche villa. Footer plus compact, conforme aux standards mobiles.
|- **verify**: `npm run build` OK (0 erreurs).

|---

## 2026-05-01T20:45:00Z | type: content | Ajout entretien piscine & jardin dans la section Ménage & Blanchisserie

|- **summary**: Ajout de "Entretien piscine & jardin (abonnement non inclus)" dans le 4e pilier des prestations (Ménage & Blanchisserie), à la fois dans le scroll parallax de la page /prestations et dans la page dédiée /prestations/services/menage.
|- **files**: [`data/prestations-scroll-sections.ts`, `data/prestations-service-details.ts`, `docs/ACTIONS_LOG.md`]
|- **why**: Demande utilisateur — le bloc ménage/blanchisserie omettait l'entretien piscine et jardin, pourtant proposé par la conciergerie.
|- **impact**: Le 5e item apparaît dans la carte scroll parallax (section "menage") et en 5e carte dans la grille de la page détail. La description précise "abonnement non inclus".
|- **verify**: `npm run build` OK (0 erreurs).
