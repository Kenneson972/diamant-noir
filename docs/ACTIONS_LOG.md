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
