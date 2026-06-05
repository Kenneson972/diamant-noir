# Actions Log — Diamant Noir (Kayvila)

## Format

```yaml
YYYY-MM-DD HH:MM — Titre concis
type: api | ui | sql | config | script | docs | security | perf | stripe | fix
summary: ce qui a été fait
files: fichiers impactés
why: raison métier/technique
impact: effet attendu
verify: vérification effectuée
```

---

### 2026-06-06 — Fix KayvilaPressableButton disabled React 19

- **type**: fix | ui
- **summary**: `KayvilaPressableButton` — `<button disabled={boolean}>` natif + `PressableFeedback.Ripple` enfant ; évite `disabled="true"` string de HeroUI `PressableFeedback` root.
- **files**: `components/ui/pro/kayvila-pressable-button.tsx`
- **why**: Warning console React 19 sur fiche villa (`BookingForm` → Réserver).
- **impact**: Ripple gold conservé ; attribut `disabled` booléen correct.
- **verify**: `npm run build` OK après pull `ebd3eb6`

### 2026-06-06 — Restauration design Airbnb villa + Phase 4 HeroUI polish

- **type**: ui
- **summary**: Phase 4 : `KayvilaNumberValue`, `KayvilaPressableButton` (ripple gold), EmptyState sur avis/demandes/messagerie/espace-client/VillaReviews, NumberValue DataGrids, CTA Réserver ripple. Prompt Élise : grille services à la carte dynamique, icônes gold équipements, fix avatar `VillaHostCard`.
- **files**: `components/ui/pro/{kayvila-number-value,kayvila-pressable-button,index}.ts`, `components/{BookingForm,booking/PriceCalculator,VillaReviews,dashboard/admin/*DataGrid,AdminReservationsKanban,villas/VillaHostCard}.tsx`, `app/{villas/[id],espace-client,(admin)/admin/{avis,demandes,messagerie}}/**`
- **why**: Clôturer `cursor-hero-ui-premium.md` phase 4 + `cursor-restore-airbnb-villa-design.md` (specs 26 mai).
- **impact**: Formatage monétaire cohérent ; CTAs booking avec feedback tactile ; listes vides premium ; fiche villa services dynamiques.
- **verify**: `npm run build` OK

### 2026-06-06 — HeroUI Pro premium Phase 3 — Kanban, Command, ActionBar, DropZone

- **type**: ui
- **summary**: Kanban réservations admin (5 colonnes pipeline + drag → PATCH statut), palette commande ⌘K (`AdminCommandPalette`), ActionBar bulk (export CSV, confirmer, annuler), sélection DataGrid ; `VillaImageManager` → HeroUI `DropZone` multi-upload ; vue liste/kanban/calendrier sur `/admin/reservations`.
- **files**: `components/dashboard/admin/{AdminReservationsKanban,AdminCommandPalette,AdminReservationsDataGrid}.tsx`, `components/ui/pro/{kayvila-action-bar,kayvila-data-grid,index}.ts`, `components/dashboard/shared/DashboardShell.tsx`, `components/dashboard/villa-editor/VillaImageManager.tsx`, `app/(admin)/admin/reservations/page.tsx`
- **why**: Prompt `cursor-hero-ui-premium.md` phase 3 — productivité admin (pipeline visuel, recherche rapide, actions groupées, upload photos).
- **impact**: Gestion réservations plus fluide ; navigation admin sans sidebar ; bulk actions sur sélection ; upload villa drag-and-drop.
- **verify**: `npm run build` OK

### 2026-06-06 — HeroUI Pro premium Phase 2 — Carousel, HoverCard, Stepper, Rating

- **type**: ui
- **summary**: `KayvilaCarousel` (galerie mobile VillaGallery), `VillaListingCard` + HoverCard Pro sur `/villas`, `KayvilaStepper` checkout, `ReviewForm` → `KayvilaRating` interactif ; pull prompt Élise Airbnb.
- **files**: `components/ui/pro/{kayvila-carousel,kayvila-stepper}.tsx`, `components/villas/VillaListingCard.tsx`, `components/{VillaGallery,VillasMapView,booking/CheckoutView,espace-client/ReviewForm}.tsx`
- **why**: Prompt `cursor-hero-ui-premium.md` phase 2 — UX client premium sans casser mosaïque desktop ni flux booking.
- **impact**: Preview villa au survol catalogue ; tunnel checkout visualisé ; avis avec étoiles gold HeroUI.
- **verify**: `npm run build` OK

### 2026-06-06 — HeroUI Pro premium : wrappers Kayvila + Data Grids Phase 1

- **type**: ui
- **summary**: Couche `components/ui/pro/` (EmptyState, DataGrid, Widget, Rating) ; migration tableaux admin/proprio vers HeroUI Pro DataGrid (clients, propriétaires, réservations, villas, booking proprio) ; KPI Card HeroUI ; widgets arrivées/départs/occupation admin ; NumberStepper booking ; EmptyState unifié.
- **files**: `components/ui/pro/*`, `components/dashboard/admin/{AdminClientsDataGrid,AdminOwnersDataGrid,AdminReservationsDataGrid,AdminVillasDataGrid}.tsx`, `components/dashboard/proprio/{KpiCard,BookingList,ProprioBookingDataGrid,EmptyDashboard}.tsx`, `app/(admin)/admin/{page,clients,proprietaires,reservations,villas}/page.tsx`, `components/{VillaReviews,BookingForm}.tsx`
- **why**: Prompt `cursor-hero-ui-premium.md` — élever dashboards avec composants Pro sans casser identité gold/navy/Playfair.
- **impact**: Listes admin triables/sélectionnables ; états vides cohérents ; moins de `<table>` custom.
- **verify**: `npm run build` OK

### 2026-06-06 — Fix build Tailwind v4 + HeroUI `@apply text-sm`

- **type**: config | fix
- **summary**: Suppression de `@config "../tailwind.config.ts"` dans `globals.css` (incompatible TW4 + `@heroui/styles`) ; migration tokens Kayvila (couleurs, fonts, animations) vers bloc `@theme`.
- **files**: `app/globals.css`
- **why**: Build/dev échouaient sur `accordion.css` — `Cannot apply unknown utility class text-sm` car le config v3 cassait la résolution des utilitaires dans les CSS HeroUI.
- **impact**: `@heroui/styles` et `@heroui-pro/react/css` compilent correctement ; classes `text-navy`, `bg-gold`, `animate-fade-up` conservées via `@theme`.
- **verify**: `npm run build` OK ; dev relancé sur `:3000`

### 2026-06-06 — Migration Hero UI Pro + nettoyage dépendances

- **type**: ui | config | perf
- **summary**: Installation `@heroui/react` + `@heroui-pro/react` (CLI `heroui-pro install`), Tailwind v4, suppression Radix/FullCalendar/dnd-kit/GSAP ; calendriers → `RangeCalendar`/`Calendar` HeroUI ; dropdown/tabs → HeroUI ; photos villa → flèches ; scroll prestations → CSS natif ; Leaflet conservé pour carte interactive `/villas`.
- **files**: `package.json`, `postcss.config.js`, `app/globals.css`, `components/booking/AvailabilityCalendar.tsx`, `components/{AdminCalendar,TeamCalendar}.tsx`, `components/dashboard/{ActionMenu,VillaImageManager,SortableImage}.tsx`, `components/ui/tabs.tsx`, `app/prestations/PrestationsPageClient.tsx`, `components/prestations/VideoScrollHero.tsx`, `lib/calendar/date-utils.ts`, `lib/scroll/use-scroll-scrub.ts`, `tsconfig.json`
- **why**: Prompt `cursor-hero-ui-migration.md` — réduire ~17 packages UI, unifier sur HeroUI Pro, préserver design gold/navy.
- **impact**: Bundle allégé ; booking/admin calendriers sur HeroUI ; animations prestations sans GSAP.
- **verify**: `npm run build` OK ; MCP HeroUI Pro utilisé pour docs Calendar/Dropdown/Tabs

---

### 2026-06-06 — Retrait magic link sur `/login`

- **type**: ui
- **summary**: Suppression du bouton « Recevoir un lien magique (espace client) » et du handler `signInWithOtp` sur la page login.
- **files**: `app/login/page.tsx`
- **why**: Demande client — connexion uniquement par email + mot de passe sur `/login` (magic link conservé post-paiement sur `/success`).
- **impact**: Plus d'option OTP sur l'écran de connexion ; flux mot de passe / inscription / mot de passe oublié inchangés.
- **verify**: lint OK sur `app/login/page.tsx`

---

### 2026-06-06 — Correctifs audit dashboard (Cursor + Élise)

- **type**: fix | security | api | ui | sql
- **summary**: Implémentation des P0/P1 audit espaces admin/proprio/tenant : revenus admin via `calculateTransferAmounts`, API bookings admin (POST/PATCH + conflit dates), filtrage payload n8n, RLS staff bookings/requests/reviews/chat, messagerie admin alignée schéma DB, calendrier connecté au formulaire, magic link `/login`, wishlist fix, copilot proprio branché, IDOR booking proprio, revenus net proprio/copilot.
- **files**: `lib/revenue/booking-revenue.ts`, `app/api/admin/{revenue,bookings,messages}/route.ts`, `supabase/migrations/20260606140000_audit_dashboard_fixes.sql`, pages admin/proprio/tenant, `components/villas/VillaBookingWrapper.tsx`, `lib/auth/server.ts`, `middleware.ts`
- **why**: Audit consolidé 2026-06-06 — données bloquées RLS, chiffres finance faux, fuites n8n, conversion booking cassée.
- **impact**: Admin voit réservations/revenus ; création résa sans double-booking ; tenant peut réserver depuis le calendrier ; proprio voit revenus nets cohérents.
- **verify**: `npm run build` compile diamant-noir (erreur externe MAISON PVL hors repo) ; migration `audit_dashboard_fixes` appliquée Supabase prod.

---

### 2026-05-28 — Routes API pour les agents n8n + auth Bearer

- **type**: api | security
- **summary**: Création des routes consommées par les agents n8n (le vrai blocage : elles n'existaient pas). Public : `/api/villas/public` (villas publiées, champs non sensibles, `?search=`). Owner (Bearer `requireAuth`, scope owner_id dérivé serveur) : `/api/dashboard/{villas,bookings,tasks,ota-status}`. Admin (Bearer `requireAdmin`) : `/api/admin/{villas,bookings,global-stats,ota-status}`. Alignement des agents B/C sur l'auth **Bearer** (forward du JWT utilisateur en `Authorization: Bearer`), suppression du `x-api-key` + param `owner`.
- **files**: `app/api/villas/public/route.ts`, `app/api/dashboard/{villas,bookings,tasks,ota-status}/route.ts`, `app/api/admin/{villas,bookings,global-stats,ota-status}/route.ts`, `docs/n8n/kayvila-agent-b-proprietaire.json`, `docs/n8n/kayvila-agent-c-admin.json`, `docs/n8n/README.md`
- **why**: Sans ces routes, les outils des agents échouaient silencieusement. Le contrat Bearer (cohérent avec `/api/admin/owners`, `/api/villa-submissions`) est plus sûr que `x-api-key` : le serveur valide le token et dérive le périmètre, sans faire confiance à un param d'URL.
- **impact**: Les 3 agents disposent désormais d'endpoints réels et sécurisés ; il ne reste que la config n8n (credentials + placeholders domaine/gbrain/chat IDs).
- **verify**: `npx tsc --noEmit` OK ; les 3 workflows JSON re-validés (parse + cohérence connexions). Tests runtime des endpoints à faire avec un vrai token.

### 2026-05-28 — 3 agents n8n Kayvila (inspirés Élise 13)

- **type**: script | sql | docs
- **summary**: Création de 3 workflows n8n importables (Agent A Chatbot Visiteur, Agent B Copilot Propriétaire, Agent C Copilot Admin) reprenant l'architecture Élise 13 : sécurité (banned/JWT), mémoire courte Supabase + mémoire sémantique gbrain (B/C), cœur DeepSeek + AI Agent à outils, post-traitement (FORMAT RESPONSE, analyse mots-clés) et alertes Telegram. Ajout de la migration des tables de mémoire et d'un README d'import.
- **files**: `docs/n8n/kayvila-agent-a-visiteur.json`, `docs/n8n/kayvila-agent-b-proprietaire.json`, `docs/n8n/kayvila-agent-c-admin.json`, `docs/n8n/README.md`, `supabase/migrations/20260528_agents_memory.sql`
- **why**: Doter Kayvila d'assistants IA par rôle (visiteur, propriétaire, admin) sur la base éprouvée du workflow Élise déjà en production.
- **impact**: Workflows prêts à importer dans n8n (cloud `kenneson.app.n8n.cloud`) ; restent à câbler credentials (Supabase/DeepSeek/Telegram) + remplacer les placeholders domaine/gbrain/API key avant activation.
- **verify**: `node` JSON.parse OK sur les 3 fichiers ; cohérence sources/cibles de connexions vérifiée (toutes valides). SQL et docs relus manuellement. Activation/test runtime à faire côté n8n par l'utilisateur.

### 2026-05-10 — Refonte page login avec vidéo + panneau 60/40

- **type**: ui
- **summary**: Remplacement du fond d'écran fixe par un layout 60/40 (vidéo / panneau blanc) sur la page de login, avec indicateur Martinique, espacement et typographie luxe.
- **files**: `app/login/page.tsx`
- **why**: Moderniser la page de connexion pour un rendu plus premium, cohérent avec le positionnement Kayvila.
- **impact**: UX améliorée, image de marque renforcée.
- **verify**: `npx tsc --noEmit` OK.

### 2026-05-10 — Page espace client fonctionnelle

- **type**: ui | api
- **summary**: Implémentation complète de l'espace locataire : réservations avec statuts (confirmée, en attente, annulée), navigation, états vides, redirection RBAC.
- **files**: `app/(espace-client)/**`, `components/dashboard/client/**`, `lib/auth/admin-access.ts`, `middleware.ts`
- **why**: Les clients doivent pouvoir voir leurs réservations après paiement.
- **impact**: Les locataires voient leurs séjours et leur statut ; les propriétaires sont redirigés vers leur dashboard.
- **verify**: `npx tsc --noEmit` OK, build OK.

### 2026-05-10 — Page admin refonte design

- **type**: ui 
- **summary**: Refonte complète du layout admin avec sidebar, menu réduit, header discret, et palette Kayvila (navy/gold).
- **files**: `app/admin/**`, `components/dashboard/admin/**`
- **why**: L'interface admin était brute, sans cohérence visuelle avec le reste du site.
- **impact**: Navigation admin plus claire, image professionnelle.
- **verify**: build OK.

### 2026-05-10 — Fix compilation + images + middleware

- **type**: fix
- **summary**: Correction des erreurs `'use client'` et compilation sur les pages admin, replacement de bg images, correction format webm, nettoyage middleware (suppression double vérification getUser).
- **files**: `app/admin/**`, `middleware.ts`, `app/login/page.tsx`
- **why**: Le site ne compilait pas après les modifications.
- **impact**: Compilation OK, pages admin fonctionnelles.
- **verify**: `npx next build` OK.

### 2026-05-10 — Fix erreurs TypeScript et imports

- **type**: fix
- **summary**: Correction des types manquants (type `VillaId`, `uploadedImage`, `villa_id` optionnel), erreurs de compilation sur les fichiers .ts, import de `supabaseAdmin` et `supabaseAdminTS`.
- **files**: `app/admin/reservations/page.tsx`, `app/admin/proprietaires/page.tsx`, `lib/stripe/actions/payout.ts`, `app/api/upload-villa-photo/route.ts`, `lib/supabase.ts`
- **why**: La compilation TypeScript échouait après les modifications.
- **impact**: Compilation OK.
- **verify**: `npx tsc --noEmit` OK.

### 2026-05-11 — Système global réservations + profile + avis + notifications

- **type**: api | ui | sql
- **summary**: Réservations avec statuts (pending, confirmed, cancelled), profile utilisateur éditable, page détail réservation, avis, et notifications.
- **files**: `app/(espace-client)/**`, `app/api/webhooks/stripe/route.ts`, `lib/supabase-server.ts`, `components/dashboard/client/**`, `components/layout/Header.tsx`, `app/layout.tsx`
- **why**: Réservations, avis et notifications étaient absents de l'espace client.
- **impact**: Les clients peuvent voir leurs réservations, modifier leur profil, laisser des avis et recevoir des notifications.
- **verify**: `npx tsc --noEmit` OK, build OK.

### 2026-05-12 — Correction erreurs réservations espace client

- **type**: fix
- **summary**: Correction des erreurs TypeScript : types manquants, import incorrects, fonctions inexistantes dans les pages espace client.
- **files**: `app/(espace-client)/reservations/[id]/page.tsx`, `app/(espace-client)/reservations/page.tsx`, `app/(espace-client)/profil/page.tsx`, `app/(espace-client)/avis/page.tsx`, `app/(espace-client)/notifications/page.tsx`
- **why**: Les pages espace client ne compilaient pas après l'implémentation.
- **impact**: Espace client fonctionnel.
- **verify**: `npx tsc --noEmit` OK, build OK.

### 2026-05-12 — Correction page détail réservation : RBAC + données réelles

- **type**: fix
- **summary**: Correction du layout espace-client, ajout `force-dynamic`, remplacement du layout parent. Correction page détail réservation : import du bon client Supabase, suppression données mockées, récupération des vraies données booking+villa+profil propriétaire.
- **files**: `app/(espace-client)/layout.tsx`, `app/(espace-client)/reservations/[id]/page.tsx`, `lib/supabase-server.ts`
- **why**: La page de détail réservation utilisait des données mockées et des imports depuis un dossier `admin`/`proprio` non accessible.
- **impact**: Détail réservation avec vraies données (dates, villa, prix, propriétaire).
- **verify**: `npx tsc --noEmit` OK.

### 2026-05-13 — Correction erreurs TypeScript résiduelles

- **type**: fix
- **summary**: Correction de 5 erreurs TypeScript : `StripeAccountStatus`, `CleaningFeeSettings`, `PricingSettings`, date-fns `startOfMonth`, type villas en lecture seule.
- **files**: `app/admin/proprietaires/page.tsx`, `app/(espace-client)/reservations/[id]/page.tsx`, `app/(proprio)/dashboard/statistiques/[villaId]/page.tsx`
- **why**: Compilation TypeScript échouait.
- **impact**: `npx tsc --noEmit` OK + build OK.
- **verify**: `npx tsc --noEmit` OK, `npx next build` OK.

### 2026-05-14 10:30 — Stripe Connect + auto-création compte client

- **type**: stripe | api | sql
- **summary**: 
  - Colonnes `stripe_connect_account_id`, `stripe_connect_onboarding_completed` sur `profiles`
  - Helpers Stripe Connect : `createConnectAccount`, `createOnboardingLink`, `getConnectAccount`, `calculateTransferAmounts`
  - Route d'onboarding Stripe Connect (génère lien Express)
  - Route `api/booking/route.ts` : récupère le compte Connect du propriétaire, ajoute `transfer_data` + `application_fee_amount` (20%)
  - Webhook Stripe : création automatique de compte client (Supabase Auth) via `admin.createUser` + `admin.inviteUserByEmail` après paiement
  - Composant `StripeConnectButton` : onbording + statut
  - Dashboard propriétaire : intègre StripeConnectButton
- **files**: 
  - `supabase/migrations/20260514_stripe_connect.sql`
  - `lib/stripe/connect.ts`
  - `app/api/stripe/connect-onboarding/route.ts`
  - `app/api/booking/route.ts`
  - `app/api/webhooks/stripe/route.ts`
  - `components/dashboard/proprio/StripeConnectButton.tsx`
  - `app/(proprio)/dashboard/page.tsx`
- **why**: Les paiements n'étaient pas liés aux comptes propriétaires (pas de reversement) ni aux comptes clients (pas d'espace client après réservation). Commission Kayvila (20%) non appliquée.
- **impact**: 
  - Propriétaires : reçoivent 80% du montant du séjour
  - Kayvila : 20% de commission + 100% frais de ménage
  - Clients : compte créé automatiquement après paiement
- **verify**: `npx tsc --noEmit` OK, `npx next build` OK

### 2026-05-14 11:47 — Fix Stripe Connect URL + session + vérification serveur

- **type**: stripe | fix
- **summary**: 
  1. Correction URL retour Stripe : `/proprio/dashboard` → `/dashboard`
  2. Réécriture middleware : `getSession()` prioritaire, fallback `getUser()`, cookies avec `maxAge: 7 jours`, preservation cookies pendant redirections
  3. Vérification Stripe Connect côté serveur : `?connect=success` détecté dans `searchParams`, appel `getConnectAccount()`, update direct du flag
  4. Composant StripeConnectButton : log debug, nettoyage URL, message d'erreur si `charges_enabled` pas encore true
- **files**: [`middleware.ts`, `lib/stripe/connect.ts`, `components/dashboard/proprio/StripeConnectButton.tsx`, `app/(proprio)/dashboard/page.tsx`, `app/auth/callback/route.ts`]
- **why**: Retour Stripe redirigeait sur 404, session ne persistait pas, flag jamais mis à jour
- **impact**: Stripe Connect opérationnel
- **verify**: `npx next build` OK

### 2026-05-14 12:18 — Fix session persistence : middleware + force-dynamic + Link prefetch

- **type**: fix
- **summary**: 
  1. **Middleware réécrit** (pattern Supabase SSR officiel) :
     - `getAll()` lit les cookies de la requête (`request.cookies.getAll()`)
     - `setAll()` recrée la réponse UNE SEULE fois (pas par cookie), évite la perte de cookies
     - Toutes les redirections (`NextResponse.redirect`) copient les cookies rafraîchis depuis `supabaseResponse`
     - Suppression de `getUser()` en fallback (cause de désynchronisation)
     - Utilisation unique de `getSession()` qui rafraîchit le JWT via le refresh token
  2. **force-dynamic** ajouté sur :
     - `app/(proprio)/dashboard/layout.tsx` — le layout utilisait `redirect()` mais pouvait être pré-rendu statiquement (car `metadata` exporté)
     - `app/(proprio)/dashboard/page.tsx` — confirme le rendu dynamique avec `searchParams`
  3. **StripeConnectButton** :
     - `useEffect` simplifié : plus de `shouldVerifyFromUrl` complexe, vérifie directement si `connected` ou `connectDone`
- **files**: [`middleware.ts`, `app/(proprio)/dashboard/page.tsx`, `app/(propo)/dashboard/layout.tsx`, `components/dashboard/proprio/StripeConnectButton.tsx`]
- **why**: Le layout du dashboard pouvait être pré-rendu statiquement → `redirect()` jamais exécuté côté serveur → session jamais validée sur navigation. Le middleware recréait `NextResponse.next()` par cookie → perte des cookies précédents.
- **impact**: Session persistée correctement après login, Stripe Connect status maintenu entre les navigations
- **verify**: `npx tsc --noEmit` OK

---

### 2026-05-14 — Fix auth : session persistante + Stripe Connect + redirect login ✅

- **type**: fix | security
- **summary**:
  - **Bug 1 (déjà fixé session précédente)** : `publicPaths` contenait `"/"` → `pathname.startsWith("/")` matche TOUT → le bloc RBAC ne s'exécutait jamais → owners redirigés vers /login même avec session valide. Fix : `pathname.startsWith(p + "/")` au lieu de `pathname.startsWith(p)`.
  - **Bug 2 — Stripe Connect** : `ownerProfile` fetchait avec le client anon → RLS bloque `auth.uid()` → retourne null → bannière "non connecté" même quand `stripe_connect_onboarding_completed = true`. Fix : utiliser `supabaseAdmin()` pour cette query (bypass RLS).
  - **Bug 3 — profileRole null** : Le client SSR a `skipAutoInitialize: true` → `_getAccessToken()` appelle `getSession()` → lit les cookies → session OK. Fix complémentaire : `await supabase.auth.getSession()` avant les queries DB dans le middleware + `await client.auth.getSession()` dans `getSupabaseServer()` pour pré-charger la session en mémoire.
  - **Bug 4 (vrai problème login)** : La page `/login` est en `publicPaths` → le middleware la laissait toujours passer → aucun check "déjà connecté" → un utilisateur authentifié voyait le formulaire de login et devait se reconnecter. Fix : dans le middleware, si `user && pathname === "/login"` → rediriger vers `/admin`, `/dashboard`, ou `/espace-client` selon le rôle.
- **files**: [`middleware.ts`, `lib/supabase-server.ts`, `app/(proprio)/dashboard/page.tsx`, `app/espace-client/layout.tsx`, `app/espace-client/EspaceClientShell.tsx`]
- **why**: 4 bugs indépendants qui semblaient liés. Le vrai bug "login" = 12 lignes de redirect manquant. 2h perdues à analyser les refresh tokens Supabase.
- **impact**: Session persistante ✓, Stripe Connect status correct ✓, redirect auto si déjà connecté ✓
- **verify**: Tests manuels OK
- **leçon**: Avant d'analyser les internals d'un framework, vérifier d'abord le comportement attendu côté UX. Le bug "login" n'était pas un bug de session — c'était une feature manquante.

---

### 2026-05-14 — Flux réservation guest sans inscription

- **type**: ui | api
- **summary**:
  - **CheckoutView** : ajout des champs `Nom complet` + `Email` pour les visiteurs non connectés (cachés si déjà connecté)
  - Validation frontale : email requis, format valide, nom requis avant soumission
  - **Page /success améliorée** : design premium, affiche les détails de la réservation (villa, dates, montant), détecte si l'utilisateur est connecté ou pas
  - **Section "Créez votre espace client"** pour les non-connectés : affiche l'email du guest, bouton "Recevoir mon lien magique" qui envoie un OTP Supabase, état de succès avec instructions
  - **API booking** : passe l'email du guest dans le `success_url` (`&email=...`) pour que la page success puisse l'afficher sans requête supplémentaire
  - **Flux complet** : visiteur sans compte → réserve → paye Stripe → page success → reçoit un magic link → clique → redirigé vers `/espace-client` → voit sa réservation
  - L'espace client existant charge déjà les réservations par `guest_email`, aucune modif nécessaire côté DB
- **files**: [`components/booking/CheckoutView.tsx`, `app/success/page.tsx`, `app/api/booking/route.ts`]
- **why**: Permettre la réservation sans inscription obligatoire (taux de conversion), mais offrir une onboarding fluide vers l'espace client après paiement
- **impact**: Les visiteurs peuvent réserver sans compte. Après paiement, ils reçoivent un magic link pour accéder à leur espace et voir leurs réservations.
- **verify**: Build OK (`npx tsc --noEmit`), lint OK

---

### 2026-05-14 — Fix dashboard proprio : réservations invisibles + lien booking 404

- **type**: fix
- **summary**:
  - **Bug 1 — Lien 404** : `UpcomingBookings.tsx` et `QuickReservationsList.tsx` construisaient les URLs comme `/dashboard/reservations/{bookingId}` mais la route attend `/dashboard/reservations/{villaId}/{bookingId}` → 404.
    - Fix : ajout de `villa_id` dans le select de la query dashboard (`page.tsx` ligne 99) et correction du href dans `UpcomingBookings.tsx` pour inclure `villaId`.
  - **Bug 2 — Réservations non visibles** : La page `reservations/page.tsx` utilisait `bookings(id, guest_name, check_in, check_out, ...)` mais les colonnes `check_in`/`check_out` n'existent pas sur la table `bookings` (elles sont sur `villas`). Les colonnes réelles sont `start_date`/`end_date`.
    - Fix : remplacement par `bookings(id, guest_name, start_date, end_date, status, total_price_cents)`.
- **files**: [`components/dashboard/proprio/UpcomingBookings.tsx`, `app/(proprio)/dashboard/reservations/page.tsx`, `app/(proprio)/dashboard/page.tsx`]
- **why**: Le proprio doit voir ses réservations et pouvoir cliquer sur le détail
- **impact**: Les réservations apparaissent dans le dashboard et le lien vers le détail fonctionne
- **verify**: `npx tsc --noEmit` OK, lint OK

---

### 2026-05-14 — Fix réservations proprio vides (select imbriqué sans FK)

- **type**: fix | sql
- **summary**:
  - **Cause racine** : Le select imbriqué `villas(id, name, bookings(id, guest_name, ...))` fonctionne uniquement si Supabase détecte une **foreign key** déclarée entre `bookings.villa_id` et `villas.id`. Sans FK, la relation n'est pas résolue → `bookings` est toujours `[]`.
  - **Migration** : `20260514_add_booking_villa_fk.sql` — ajoute `FOREIGN KEY (villa_id) REFERENCES villas(id) ON DELETE CASCADE` + index `idx_bookings_villa_id`
  - **Fix code** : La page `reservations/page.tsx` refacto en 2 requêtes séparées pour fonctionner même sans FK (résilience) : 
    1. `villas.select("id, name").eq("owner_id", ...)` 
    2. `bookings.select("...").in("villa_id", ...)` 
    3. Fusion en mémoire dans `villasWithBookings`
- **files**: [`app/(proprio)/dashboard/reservations/page.tsx`, `supabase/migrations/20260514_add_booking_villa_fk.sql`]
- **why**: Le proprio ne voyait aucune réservation malgré des bookings en base, à cause d'une FK manquante empêchant le join Supabase
- **impact**: Les réservations s'affichent correctement par villa
- **verify**: `npx tsc --noEmit` OK, migration SQL prête à exécuter

---

### 2026-05-14 — Détail réservation proprio enrichi

- **type**: ui
- **summary**:
  - **BookingDetailCard** réécrit : affiche désormais un tableau de bord complet avec Villa, Client, Email, Arrivée, Départ, Durée (nombre de nuits), Prix total, Prix par nuit, Source (Airbnb/Direct), Paiement, Session Stripe, Date de création
  - Ajout d'icônes lucide-react pour chaque champ (Building2, CalendarDays, User, Mail, Clock, Receipt, Banknote, Globe, CreditCard, Hash)
  - Récupération du nom de la villa dans la page de détail pour l'afficher dans la carte
  - Requêtes parallélisées (Promise.all) booking + villa pour la page de détail
  - Nettoyage : suppression de l'import inutilisé `getSupabaseServer`
- **files**: [`components/dashboard/proprio/BookingDetailCard.tsx`, `app/(proprio)/dashboard/reservations/[villaId]/[bookingId]/page.tsx`]
- **why**: Le proprio avait besoin de voir le détail complet d'une réservation
- **impact**: Interface plus riche et informative pour le propriétaire
- **verify**: Build OK

---

### 2026-05-14 — Session validée par le client

- **type**: docs
- **summary**:
  - Réservations proprio : dashboard + liste + détail fonctionnels
  - Détail réservation enrichi (client, séjour, prix, source, paiement)
  - Build OK, serveur local relancé sur port 3000
  - Client confirme que tout est bon
- **files**: [`components/dashboard/proprio/BookingDetailCard.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Clôture session corrections réservations proprio
- **impact**: Fonctionnalité réservations proprio livrée et validée
- **verify**: Build OK, validation client

## 2026-05-14 : Admin — Liaison Proprio → Villa

- **type**: ui
- **summary**: Trois améliorations dans l'espace admin pour lier propriétaires et villas :
  - **Liste villas** : le nom du propriétaire remplace l'ID brut, avec lien cliquable vers sa fiche membre
  - **Formulaire ajout villa** : dropdown de sélection du propriétaire au lieu d'une assignation automatique à l'admin
  - **Fiche villa détaillée** : nouveau bloc Propriétaire (nom, email, téléphone, statut Stripe Connect) + bloc Réservations récentes (10 dernières)
- **files**: [`app/(admin)/admin/villas/page.tsx`, `app/(admin)/admin/villas/[id]/page.tsx`, `components/dashboard/admin/AdminVillaForm.tsx`, `app/api/admin/owners/route.ts`, `app/api/dashboard/create-villa/route.ts`]
- **why**: L'admin doit pouvoir gérer la relation propriétaire → villa, visualiser les infos du propriétaire et les réservations associées depuis la fiche villa
- **impact**: Visibilité complète admin : nom du propriétaire partout, assignation possible à la création, infos détaillées et réservations récentes sur la fiche
- **verify**: Build OK

## 2026-05-14 : Fix split paiement Stripe Connect (FAQ Kayvila)

- **type**: api
- **summary**: Correction du calcul `calculateTransferAmounts` : le propriétaire ne recevait plus par erreur les frais de ménage et de service. Conforme FAQ (`data/conciergerie-faq.ts`) — proprio = 80 % des nuitées ; Kayvila = 20 % du séjour + 100 % ménage + 100 % frais de service.
- **files**: [`lib/stripe/connect.ts`, `app/api/booking/route.ts`, `docs/POINT_AVANCEMENT_KAYVILA_MAI2026.md`]
- **why**: Le split précédent (`total - 20% séjour`) reversait ménage/service au propriétaire, contraire au modèle commercial Kayvila
- **impact**: Réservations directes site : reversement Stripe Connect aligné sur la FAQ
- **verify**: Build OK

## 2026-05-28 : Agents n8n Kayvila — corrections critiques (revue sécurité/robustesse)

- **type**: security
- **summary**: Durcissement des 3 workflows n8n suite à revue.
  - **JWT (B & C)** : `Code - Auth JWT` vérifie désormais le token côté serveur via `GET /auth/v1/user` Supabase (signature validée) au lieu d'un décodage local du payload ; token invalide → refus.
  - **Rôles (B)** : `authenticated` retiré des rôles valides (`owner`/`proprietaire`/`proprio` uniquement).
  - **Auto-ban toxicité (A)** : nouveaux nœuds `Log Toxicité` → `Compter Toxicité` → `IF Seuil ?` → `Bannir Session` ; 3 messages toxiques / heure ⇒ bannissement (`ON CONFLICT DO NOTHING`).
  - **`continueOnFail` (C)** : ajouté sur `Save Memory Supabase`.
  - **Fallback catalogue (A)** : `Code - Vérifier Catalogue` injecte un message de repli si `/api/villas/public` est down/vide.
  - **Slug gbrain horodaté (B & C)**, **`Init Session` garantissant un `sessionId` (A)**, **suppression des contextes redondants** (`Get Owner/Admin Context`, `Get Villa Submissions`) — l'agent passe par ses outils.
- **files**: [`docs/n8n/kayvila-agent-a-visiteur.json`, `docs/n8n/kayvila-agent-b-proprietaire.json`, `docs/n8n/kayvila-agent-c-admin.json`, `supabase/migrations/20260528_agents_memory.sql`, `docs/n8n/README.md`, `docs/n8n/RECAP.md`]
- **why**: Le décodage JWT non vérifié et l'absence d'anti-abus / de fallback étaient des failles bloquantes (P0)
- **impact**: Auth réellement vérifiée, abus auto-bloqués, dégradation propre si API down ; workflows plus simples (moins de nœuds redondants)
- **verify**: `JSON.parse` OK sur les 3 fichiers + script de cohérence des connexions (aucune référence orpheline)

## 2026-06-05 : Mega-fix Kayvila (P0 + P1)

- **type**: security
- **summary**: Lot correctif sécurité, booking, webhooks Stripe, dashboards revenus, résilience emails et tarifs saisonniers.
  - SQL injection OTA : `.not("external_id", "in", externalIds)` (array Supabase) dans `ota-hub.ts` ; suppression `ical-sync.ts` mort.
  - CSRF sur `POST /api/booking` ; guards `is_published`, `min_nights`, `guests` + migration `bookings.guests`.
  - Webhook Stripe : claim idempotent en début de handler + handlers `charge.refunded`, `async_payment_failed`, disputes.
  - Booking : rollback si échec session Stripe ; emails fire-and-forget à la création ; fetch `seasonal_rates` pour `calculatePrice`.
  - Dashboards : admin split CA / commission Kayvila / reversement proprios ; proprio reversement net via `calculateTransferAmounts`.
- **files**: [`lib/ota-hub.ts`, `app/api/booking/route.ts`, `app/api/webhooks/stripe/route.ts`, `app/(admin)/admin/revenus/page.tsx`, `app/(proprio)/dashboard/revenus/page.tsx`, `components/dashboard/proprio/RevenueSummary.tsx`, `components/dashboard/proprio/RevenueChart.tsx`, `supabase/migrations/20260605120000_bookings_guests.sql`, `supabase/migrations/20260605130000_seasonal_rates.sql`, `.env.local.example`]
- **why**: Fermer les failles P0/P1 du prompt `cursor-mega-fix-2026-06-05.md` avant mise en prod
- **impact**: Booking plus sûr et fiable ; revenus admin/proprio alignés sur le modèle commission FAQ ; tarifs saisonniers prêts côté table
- **verify**: `tsc --noEmit`, `npm run build`, `npm run dev`

## 2026-06-06 : RBAC JWT critique (phase-rbac-jwt-critical)

- **type**: security
- **summary**: Correction claim JWT RLS + routes create/delete-villa pour proprios.
  - Migration `20260606120000_fix_rls_jwt_role_claim.sql` : 7 policies `auth.jwt() ->> 'role'` → `user_metadata.role` (5 tables en prod).
  - `create-villa` : auth cookie/Bearer, proprio forcé `owner_id = user.id`, admin peut assigner.
  - `delete-villa` : pattern `isAdmin || isOwner` aligné sur `update-villa`.
  - Helper `getSessionUser()` dans `lib/auth/server.ts`.
- **files**: [`supabase/migrations/20260606120000_fix_rls_jwt_role_claim.sql`, `supabase/migrations/20260501_rls_audit.sql`, `app/api/dashboard/create-villa/route.ts`, `app/api/dashboard/delete-villa/route.ts`, `lib/auth/server.ts`]
- **why**: `auth.jwt() ->> 'role'` = `authenticated` pour tous — faille RBAC ; proprios bloqués sur create/delete villa
- **impact**: Seuls les vrais admins passent les policies RLS ; proprios peuvent créer/supprimer leurs villas via API
- **verify**: migration Supabase MCP OK, grep policies prod 0 résultat mauvais claim, lint routes OK

## 2026-06-06 : Audit espaces dashboard (admin / proprio / tenant)

- **type**: docs
- **summary**: Rapport d’audit parallèle des 3 espaces dashboard — P0 admin (revenus 20 %, RLS bookings, messagerie, assignee_id), proprio (IDOR, revenus incohérents), tenant (magic link, guest_email).
- **files**: [`docs/AUDIT_ESPACES_DASHBOARD_2026-06-06.md`]
- **why**: Tour qualité post mega-fix pour prioriser la roadmap Semaine 1 admin
- **impact**: Backlog structuré P0/P1/quick wins par page et par espace
- **verify**: 3 sous-agents explore + vérification manuelle revenus admin et AdminMenuItems

## 2026-06-06 : 10 finitions client Kayvila — prompt Élise

- **type**: ui
- **summary**: Implémentation `cursor-client-finishing-touches.md` — HoverCard/Sheet mobile, filtres minGuests, calculateur remboursement, AddToCalendar, carte OSM iframe, page comparer, LocalGuide, ré-réservation « Envie de revenir ? », partage UUID `booking_shares`.
- **files**: [`components/villas/VillaListingCard.tsx`, `components/VillasMapView.tsx`, `components/VillasMapEmbed.tsx`, `components/VillaFilterBar.tsx`, `hooks/use-media-query.ts`, `lib/refund-policy.ts`, `components/booking/AddToCalendar.tsx`, `components/espace-client/LocalGuide.tsx`, `app/villas/comparer/page.tsx`, `app/espace-client/page.tsx`, `app/espace-client/reservations/[id]/page.tsx`, `app/share/[token]/page.tsx`, `app/api/booking/share/route.ts`, `supabase/migrations/20260606120000_booking_shares.sql`]
- **why**: Finitions UX client demandées par Élise — conversion, rétention, partage séjour sécurisé
- **impact**: Liste villas plus légère (sans Leaflet) ; espace client enrichi ; liens partage expirables 7j
- **verify**: `npm run build` OK ; migration `booking_shares` à pousser en prod

## 2026-06-06 : Refonte checkout Kayvila + perf navigation dev

- **type**: ui | perf | config
- **summary**: Refonte `/book` (hero éditorial navy, prefetch villa RSC, `CheckoutPriceSummary`, CTA sticky mobile, politique remboursement Kayvila) ; perf dev (middleware skip auth anonyme, Turbopack, `NavigationProgress`, skeletons) ; CSP `frame-src` OpenStreetMap.
- **files**: [`components/booking/CheckoutView.tsx`, `components/booking/CheckoutPriceSummary.tsx`, `components/booking/checkout-types.ts`, `app/book/page.tsx`, `app/book/loading.tsx`, `middleware.ts`, `components/layout/NavigationProgress.tsx`, `components/layout/SiteFrame.tsx`, `app/loading.tsx`, `app/globals.css`, `package.json`, `next.config.mjs`]
- **why**: Checkout hors charte Kayvila (clone Airbnb) ; lenteur navigation dev ; carte OSM bloquée par CSP
- **impact**: Tunnel réservation aligné marque ; navigation perçue plus fluide en local ; iframe carte villas fonctionnelle
- **verify**: `npm run build` OK

## 2026-06-06 : Retour Leaflet + fallback images villa 404

- **type**: ui | fix
- **summary**: Restauration `VillaLeafletMap` (Carto dark, markers, hover sync) à la place de l'iframe OSM ; `VillaCoverImage` + `pickVillaImageUrl` pour repli `/villa-hero.jpg` si URL Supabase 404.
- **files**: [`components/VillasMapView.tsx`, `components/VillaLeafletMap.tsx`, `components/ui/villa-cover-image.tsx`, `lib/villa-image.ts`, `components/villas/VillaListingCard.tsx`, `components/booking/CheckoutView.tsx`, `components/booking/CheckoutPriceSummary.tsx`] — suppression `VillasMapEmbed.tsx`
- **why**: Préférence client carte interactive ; `image_url` Supabase manquant en storage
- **impact**: Carte premium réactive ; plus d'erreur console bloquante sur checkout/liste
- **verify**: `npm run build` OK

## 2026-06-06 : Retrait parrainage espace client

- **type**: ui
- **summary**: Parrainage retiré du menu tenant ; `/espace-client/parrainage` redirige vers `/espace-client` ; `CLIENT.features.referral = false`.
- **files**: [`components/espace-client/TenantMenuItems.ts`, `app/espace-client/parrainage/page.tsx`, `template/client.config.ts`]
- **why**: Demande client — feature non souhaitée dans l'espace client
- **impact**: Plus d'entrée sidebar ; anciens liens redirigés ; table Supabase `referrals` inchangée
- **verify**: `npm run build` OK

## 2026-06-06 : Refonte design home espace client (HeroUI Pro)

- **type**: ui
- **summary**: Home `/espace-client` — `KayvilaTenantWidget`, hero séjour image+Chip HeroUI, suppression stats héros, `TenantQuickLinks`/`TenantShareBar`, `BookingCard` Chip Pro + `VillaCoverImage`, header unifié `TenantPageHeader`.
- **files**: [`app/espace-client/page.tsx`, `components/ui/pro/kayvila-tenant-widget.tsx`, `components/espace-client/TenantPageHeader.tsx`, `UpcomingStayHero.tsx`, `TenantQuickLinks.tsx`, `TenantShareBar.tsx`, `BookingCard.tsx`, `EspaceClientShell.tsx`]
- **why**: Audit espace client — trop basique, peu HeroUI Pro
- **impact**: Rendu plus premium éditorial ; toast partage (plus d'alert) ; widgets Pro cohérents admin
- **verify**: `npm run build` OK

## 2026-06-06 : Fix images + clic catalogue /villas (HoverCard trigger)

- **type**: ui | fix
- **summary**: `VillaListingCard` — `HoverCard.Trigger` forcé en `w-full` (le `inline-flex` HeroUI Pro collapsait le bloc image) ; `pickVillaImageUrl` sur la carte.
- **files**: [`components/villas/VillaListingCard.tsx`]
- **why**: Images invisibles et cartes non cliquables sur `/villas` (footer visible, image hauteur 0)
- **impact**: Vignettes et liens villa restaurés sur desktop
- **verify**: `npm run build` OK

## 2026-06-06 : Lien réservation ↔ espace client (client_user_id + email)

- **type**: api | sql | fix
- **summary**: Colonne `client_user_id` sur `bookings`, RLS case-insensitive, liaison à la création si connecté, préservation `guest_email` au webhook/sync Stripe, requêtes espace client par `or(client_user_id, guest_email)`.
- **files**: [`lib/booking-tenant.ts`, `app/api/booking/route.ts`, `app/api/webhooks/stripe/route.ts`, `app/api/booking-session/route.ts`, `app/espace-client/**`, `supabase/migrations/20260606180000_booking_client_user_link.sql`]
- **why**: Réservations payées invisibles dans `/espace-client` (email Stripe ≠ email compte, pas de `user_id`, RLS strict)
- **impact**: Réservations visibles si même compte ou même email ; backfill réservations existantes
- **verify**: `npm run build` OK — **appliquer migration Supabase** (`db push` ou SQL dashboard)

## 2026-06-06 : Fix 404 confirmation réservation (booking-session + success polling)

- **type**: api | fix
- **summary**: `GET /api/booking-session` — sync Stripe si webhook retardé (local), réponse `202 pending` au lieu de `404` ; `/success` poll jusqu'à confirmation.
- **files**: [`app/api/booking-session/route.ts`, `app/success/page.tsx`]
- **why**: Après paiement Stripe, la page succès appelait booking-session avant le webhook → 404 « Réservation introuvable »
- **impact**: Confirmation affichée même sans `stripe listen` en local ; message clair si finalisation lente
- **verify**: `npm run build` OK

## 2026-06-06 : Restauration colonnes modération `reviews` (P0 Élise)

- **type**: sql | fix
- **summary**: Migration `20260606190000_reviews_restore_admin_columns.sql` — réintroduit `status`, `photos`, `guest_id`, `updated_at` + RLS admin/guest ; backfill `approved` sur avis existants ; types `supabase.ts` alignés ; checklist prompt Élise synchronisée.
- **files**: [`supabase/migrations/20260606190000_reviews_restore_admin_columns.sql`, `types/supabase.ts`, `docs/prompts/cursor-fix-conciergerie.md`]
- **why**: `20260522_create_reviews.sql` avait DROP/recréé la table sans colonnes modération → `/admin/avis` et KPI `pendingReviews` cassés
- **impact**: Modération avis et compteurs admin dashboard fonctionnels après application migration
- **verify**: `npm run build` OK ; migration appliquée prod via MCP Supabase (`reviews_restore_admin_columns` — `wsdawdxucyuyopkpgjij`)

## 2026-06-06 : Fix contraste texte KayvilaPressableButton (Réserver / booking)

- **type**: ui | fix
- **summary**: `KayvilaPressableButton` — retrait `backgroundColor: gold` sur `PressableFeedback.Ripple` (calque opaque masquait le label) ; label en `z-10` ; `!text-navy` / `!text-white`.
- **files**: [`components/ui/pro/kayvila-pressable-button.tsx`]
- **why**: Boutons « Réserver » gold et CTAs checkout illisibles (texte sous le ripple)
- **impact**: Labels visibles sur fiche villa, `/book`, sticky mobile « Payer »
- **verify**: `npm run build` OK

## 2026-06-06 : Fix PGRST201 bookings↔villas + table wishlist prod

- **type**: sql | api | fix
- **summary**: Embed explicite `villas!bookings_villa_id_fkey(name)` (`lib/supabase/embeds.ts`) — corrige 500 `/api/admin/bookings` ; migration `wishlist` appliquée prod ; `WishlistContext` ignore erreur sync.
- **files**: [`lib/supabase/embeds.ts`, `app/api/admin/bookings/route.ts`, `app/(admin)/admin/page.tsx`, `reservations/page.tsx`, `reservations/[bookingId]/page.tsx`, `clients/[id]/page.tsx`, `demandes/page.tsx`, `AdminCommandPalette.tsx`, `contexts/WishlistContext.tsx`, `supabase/migrations/20260606210000_wishlist_table.sql`]
- **why**: Double FK `bookings_villa_id_fkey` + `fk_bookings_villa` → PostgREST PGRST201 ; table `wishlist` absente → 404 REST
- **impact**: `/admin/reservations` affiche les 6 séjours prod ; favoris sync OK
- **verify**: Logs dev OK ; `npm run build` OK ; migration wishlist MCP prod

## 2026-06-06 : Fix réservations admin vides — API service_role

- **type**: api | fix
- **summary**: `/admin/reservations` basculé sur `GET /api/admin/bookings` (supabaseAdmin) ; filtres paginés/kanban/calendrier ; message d'erreur visible ; fix filtre `?villa=` (plus forcé en « passées »).
- **files**: [`app/(admin)/admin/reservations/page.tsx`, `app/api/admin/bookings/route.ts`]
- **why**: 6 réservations en prod mais liste vide — fetch browser + RLS silencieux
- **impact**: Admin voit toutes les réservations via API sécurisée
- **verify**: `npm run build` OK ; 6 rows confirmées en prod SQL

## 2026-06-06 : Standardisation lien Supabase admin Kayvila

- **type**: sql | api | config | docs
- **summary**: Migration `is_staff_admin()` + RLS profiles/villas/seasonal_rates ; pages admin RSC → `getAdminDb()` ; fix fiche client bookings (`client_user_id` + email) ; script `check:schema` ; règle `.cursor/rules/kb-admin-supabase-diamantnoir.mdc`.
- **files**: [`supabase/migrations/20260606200000_admin_supabase_standardize.sql`, `lib/admin/db.ts`, `app/(admin)/admin/parametres/page.tsx`, `sync-ota/page.tsx`, `membres/[id]/page.tsx`, `clients/[id]/page.tsx`, `scripts/check-supabase-schema.mjs`, `types/supabase.ts`, `.cursor/rules/kb-admin-supabase-diamantnoir.mdc`]
- **why**: Éviter corrections au cas par cas (slug manquant, villas vides, RLS JWT vs profiles.role, seasonal_rates sans policy)
- **impact**: Admin fiable via service_role ; composants client couverts par RLS `is_staff_admin()` ; garde-fou drift schema
- **verify**: Migration appliquée prod MCP ; `npm run build` OK ; `npm run check:schema` signale types incomplets (regen `supabase gen types` recommandé)

## 2026-06-06 : Refonte design espace client — phases 2 & 3

- **type**: ui
- **summary**: Profil, Favoris, Messagerie (phase 2) + Notifications, Documents, Demandes, Conciergerie, Checklist (phase 3) — `KayvilaTenantWidget`, `KayvilaEmptyState`, `TenantSectionHeader`, Button/Chip HeroUI ; layout `max-w-2xl` unifié.
- **files**: [`app/espace-client/profil/page.tsx`, `favoris/page.tsx`, `messagerie/page.tsx`, `notifications/page.tsx`, `documents/page.tsx`, `demandes/page.tsx`, `conciergerie/page.tsx`, `checklist/page.tsx`, `components/espace-client/TenantSectionHeader.tsx`]
- **why**: Poursuite audit espace client — aligner toutes les sous-pages sur le design Kayvila / HeroUI Pro
- **impact**: Cohérence visuelle sur 8 pages tenant ; empty states Pro ; widgets éditoriaux ; plus de spinners/alertes bricolées
- **verify**: `npm run build` OK

## 2026-06-06T22:00:00Z : Fix contrainte `bookings_status_check` (annulation admin)

- **type**: sql | api
- **summary**: Migration élargit `bookings_status_check` (`cancelled`, `paid`, `refunded`) et `bookings_source_check` (`manual`, `ical`, `admin`) ; PATCH admin renvoie erreur 400 lisible sur violation CHECK.
- **files**: [`supabase/migrations/20260606220000_bookings_status_source_check.sql`, `app/api/admin/bookings/route.ts`]
- **why**: Annuler/confirmer en admin échouait — DB n'autorisait que `pending`/`confirmed`
- **impact**: Actions admin réservations (annuler, confirmer, bulk) fonctionnent ; création manuelle `source: manual` OK
- **verify**: Migration appliquée prod MCP ; test SQL `status=cancelled` OK ; `npm run build` OK

## 2026-06-06T23:00:00Z : Fin session — handoff reprise

- **type**: docs
- **summary**: Dev server arrêté (port 3000) ; récap handoff dans `docs/logs/2026-06-05.md`, `docs/todo.md`, `docs/lessons.md` (bookings_status_check).
- **files**: [`docs/logs/2026-06-05.md`, `docs/todo.md`, `docs/lessons.md`]
- **why**: Reprise propre sans relancer au hasard ni perdre le contexte Supabase/admin
- **impact**: Prochaine session : `git pull` + `npm run dev` + checklist validation admin
- **verify**: `lsof -ti tcp:3000` vide ; `main` = `origin/main` @ `61425af`

## 2026-06-06T23:30:00Z : Fix build Vercel — HeroUI Pro CI token

- **type**: config | docs
- **summary**: Vercel `installCommand` + `transpilePackages` HeroUI Pro ; doc `HEROUI_AUTH_TOKEN` (token CI/CD heroui.pro) dans `.env.local.example`, `docs/todo.md`, `docs/lessons.md`.
- **files**: [`vercel.json`, `next.config.mjs`, `.env.local.example`, `docs/todo.md`, `docs/lessons.md`, `docs/logs/2026-06-05.md`]
- **why**: Build Vercel échoue `Can't resolve '@heroui-pro/react'` — postinstall licence sans token CI
- **impact**: Après ajout env var Vercel + redeploy cache clear, build prod OK
- **verify**: action manuelle Vercel requise (HEROUI_AUTH_TOKEN) ; build local déjà OK

## 2026-06-06T23:45:00Z : Récap handoff Elise

- **type**: docs
- **summary**: `docs/RECAP_ELISE_2026-06-06.md` — synthèse session (admin, Supabase, Vercel) pour reprise équipe.
- **files**: [`docs/RECAP_ELISE_2026-06-06.md`, `docs/logs/2026-06-05.md`]
- **why**: Handoff lisible pour Elise (QA / suivi) sans lire tout le journal technique
- **impact**: Checklist test + commits + migrations en un seul fichier
- **verify**: fichier commité et poussé sur `main`

## 2026-06-06T24:00:00Z : Retour Elise — commission dynamique + FK cleanup

- **type**: ui | sql
- **summary**: `lib/commission.ts` + `OwnerRevenueTab` lit `villas.commission_rate` ; migration drop `fk_bookings_villa` (prod) ; récap Elise mis à jour (réponse volume QA).
- **files**: [`lib/commission.ts`, `components/dashboard/admin/OwnerRevenueTab.tsx`, `OwnerTabs.tsx`, `OwnerVillasTab.tsx`, `supabase/migrations/20260606230000_drop_duplicate_bookings_villa_fk.sql`, `docs/RECAP_ELISE_2026-06-06.md`]
- **why**: Quick wins signalés par Elise (25 % hardcodé, FK dupliquée PGRST201)
- **impact**: Revenus admin proprio alignés DB ; un seul embed FK villas sur bookings
- **verify**: migration prod MCP ; `npm run build` ; QA `/admin/proprietaires/[id]` onglet Revenus

## 2026-06-06T24:30:00Z : Audit responsive mobile — fixes Elise + P1/P2

- **type**: ui | perf
- **summary**: Chatbot header sticky + z-index 1050/1060 ; hero vidéo fallback autoplay ; CompareBar/CreateBookingModal z-index ; touch targets admin ; prestations canvas désactivé mobile ; messagerie flex ; focus-visible demandes/OwnerInfoTab.
- **files**: [`components/chatbot/Chatbot.tsx`, `components/home/HeroBackgroundMedia.tsx`, `components/villas/CompareBar.tsx`, `components/dashboard/CreateBookingModal.tsx`, `components/dashboard/admin/AdminReservationsDataGrid.tsx`, `app/(admin)/admin/reservations/page.tsx`, `app/(admin)/admin/demandes/page.tsx`, `components/dashboard/admin/AdminReservationsKanban.tsx`, `components/prestations/VideoScrollHero.tsx`, `components/espace-client/tenant-ui.tsx`, `app/espace-client/messagerie/page.tsx`, `components/dashboard/admin/OwnerInfoTab.tsx`, `components/dashboard/shared/DashboardSidebar.tsx`, `docs/FIX_RESPONSIVE_MOBILE.md`]
- **why**: « ok go pour tout » — implémentation complète audit responsive 390px (Elise + rapport /audit)
- **impact**: Chat fermable sur mobile, overlays au bon niveau, cibles tactiles 44px, perf prestations mobile
- **verify**: `npm run build` ; checklist `docs/FIX_RESPONSIVE_MOBILE.md`

## 2026-06-06T25:00:00Z : Correctifs pré-livraison J-10 (audit Elise)

- **type**: api | security | ui | sql
- **summary**: Cron auth CRON_SECRET+Vercel ; blocage booking si proprio non onboardé Connect ; route `POST /api/stripe/admin-refund` ; UI iCal proprio (`VillaIcalPanel`) ; migration `agents_memory` appliquée prod.
- **files**: [`lib/auth/server.ts`, `app/api/booking/route.ts`, `app/api/stripe/admin-refund/route.ts`, `components/dashboard/proprio/VillaIcalPanel.tsx`, `app/(proprio)/dashboard/villas/[villaId]/VillaEditClient.tsx`, `.env.local.example`, `supabase/migrations/20260528_agents_memory.sql`]
- **why**: Audit `cursor-verification-pre-livraison.md` — gaps P0/P1 avant livraison 16 juin
- **impact**: Cron OTA fonctionnel avec CRON_SECRET Vercel ; pas de résa sans split Connect ; remboursement admin ; proprio configure iCal ; agents n8n ont mémoire DB
- **verify**: `npm run build` ; tables prod `conversation_memory` / `banned_sessions` / `toxicity_log` créées via `supabase db query --linked`

## 2026-06-06T30:00:00Z : Resend validé en envoi réel (domaine kayvila.com)

- **type**: config
- **summary**: `.env.local` — `RESEND_FROM_EMAIL=Kayvila <conciergerie@kayvila.com>`, `ADMIN_NOTIFICATION_EMAIL=equipe@kayvila.com` ; tests manuels OK vers equipe@kayvila.com et kenne972@hotmail.fr.
- **files**: [`.env.local` (local only, gitignored), `docs/logs/2026-06-06.md`, `docs/RECAP_ELISE_2026-06-06.md`, `docs/ACTIONS_LOG.md`]
- **why**: Valider DNS/domaine Resend avant J-10 et avant copie vars sur Vercel prod
- **impact**: Chaîne email transactionnelle utilisable ; reste test flux booking Stripe end-to-end
- **verify**: Resend Logs — ids `8b63ff66…`, `affd4ec5…` ; réception confirmée par Kenneson (Hotmail OK)

## 2026-06-06T28:00:00Z : Intégration Resend — emails transactionnels Kayvila

- **type**: api
- **summary**: `lib/resend.ts` + 6 templates React Email + `lib/emails/send.ts` ; confirmation résa/admin/proprio ; webhook Stripe (Connect, litige) ; crons check-in J-3 et avis J+3.
- **files**: [`lib/resend.ts`, `lib/emails/`, `emails/`, `app/api/send-booking-confirmation/route.ts`, `app/api/notify-admin-booking/route.ts`, `app/api/send-checkin-reminders/route.ts`, `app/api/send-review-requests/route.ts`, `app/api/webhooks/stripe/route.ts`, `vercel.json`, `.env.local.example`, `package.json`]
- **why**: Prompt Elise `cursor-resend-integration.md` — 27 événements sans email, n8n non configuré
- **impact**: Emails Resend directs (n8n fallback silencieux) ; rappels automatiques Vercel cron
- **verify**: `npm run build` OK

## 2026-06-06T26:00:00Z : Docs récap session — pré-livraison + CRON_SECRET

- **type**: docs
- **summary**: Journal `docs/logs/2026-06-06.md` ; mise à jour `RECAP_ELISE_2026-06-06.md` (commits a41a0d4/37f4891, audit J-10, CRON_SECRET déjà sur Vercel).
- **files**: [`docs/logs/2026-06-06.md`, `docs/logs/2026-06-05.md`, `docs/RECAP_ELISE_2026-06-06.md`, `docs/ACTIONS_LOG.md`]
- **why**: Traçabilité handoff Elise — clarifier que CRON_SECRET longue existait, bug était code pre-37f4891
- **impact**: Équipe / QA ont une source unique pour J-10 sans re-auditer
- **verify**: fichiers commités sur main
