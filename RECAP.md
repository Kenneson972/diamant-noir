# KAYVILA — Récapitulatif complet du projet

## 1. Présentation

**Kayvila** est une plateforme logicielle de **conciergerie de luxe** « all-in-one » en Martinique. Elle permet de gérer un portefeuille de villas d'exception avec une expérience client immersive (recherche, réservation, livret), une synchronisation intelligente (iCal, import OTA / Airbnb), un **dashboard propriétaire** complet, un **back-office admin** et un **assistant IA**.

**Positionnement produit** : la marque est perçue comme une **maison de conciergerie privée** qui propose des villas — et non comme une plateforme de location avec de la conciergerie en option.

---

## 2. Stack technique

| Couche | Technologies |
|--------|--------------|
| **Framework** | Next.js 15.x (App Router) |
| **Langage** | TypeScript strict |
| **Styling** | Tailwind CSS 3.4 + Chakra UI 3 + Radix Themes 3.3 |
| **Icônes** | lucide-react |
| **DB / Auth / Storage** | Supabase (PostgreSQL + Auth SSR) |
| **Paiements** | Stripe 14.25 (Checkout + Webhooks) |
| **Calendrier** | FullCalendar 6.x, iCal sync |
| **Cartes** | Leaflet + react-leaflet |
| **Animations** | GSAP 3.14, Framer Motion 11.x, ScrollReveal |
| **Data viz** | Recharts 3.8 |
| **Dates** | date-fns 4.x |
| **Utilitaires** | clsx, tailwind-merge, zod, react-hook-form |
| **Déploiement** | **Vercel** (crons pour `/api/sync`) |

---

## 3. Design system

- **Couleurs** : `gold` (#D4AF37), `navy` (#0A0A0A), `offwhite` (#FAFAFA), `cream` (#F5F0E8), `champagne` (#F0E6CE), `sand` (#DDD5C4)
- **Typographie** : Sora (display), Instrument Sans (body)
- **Images** : `next/image`, AVIF/WebP, domaines autorisés (Supabase, Airbnb, Cloudinary, Unsplash)
- **Ambiance** : prestige, minimalisme, animations subtiles au scroll, responsive mobile-first
- **10+ keyframes custom** : fade-up, stagger-fade, shimmer, gold-shimmer, scale-in, slide-in, blur-fade, line-draw

---

## 4. Structure du projet (vue synthétique)

```
kayvila/
├── app/
│   ├── (admin)/admin/        # Back-office staff (villas, clients, résas, revenus, sync, membres, submissions, assistant)
│   ├── (proprio)/dashboard/  # Espace propriétaire (villas, réservations, stats, revenus, tâches)
│   ├── api/                  # 23 routes REST (booking, chat, dashboard CRUD, sync, webhooks…)
│   ├── book/, success/       # Tunnel réservation
│   ├── villas/, villas/[id]  # Catalogue + fiche villa
│   ├── prestations/          # Page conciergerie (hero vidéo scroll + hub éditorial 5 piliers)
│   ├── espace-client/        # Locataire (dashboard, réservations, livret, messagerie, conciergerie, documents)
│   ├── login/, register/     # Auth Supabase
│   ├── contact/, faq/, cookies/, terms/, confidentialite/
│   ├── qui-sommes-nous/, experience/, tarifs/
│   ├── soumettre-ma-villa/   # Wizard soumission propriétaire
│   ├── dashboard/proprio/    # Complément espace proprio (submissions, assistant, analytics, team)
│   ├── layout.tsx            # Layout racine (fonts, providers, SiteFrame, Chatbot, CompareBar)
│   ├── globals.css            # Styles globaux + keyframes
│   └── sitemap.ts, robots.ts
├── components/
│   ├── home/                 # 12 sections (Hero, ValueProps, Services, Inspirations, Trust, CTA, Owners…)
│   ├── layout/               # Navbar, Footer, BrandLogo, SiteFrame
│   ├── marketing/            # PageHero, ScrollReveal, editorial-blocks, landing-sections
│   ├── book/                 # BookLandingMarketing
│   ├── booking/              # PriceCalculator, CheckoutView, SearchResults, AvailabilityAlert
│   ├── prestations/          # VideoScrollHero, FinanceCopilotSection
│   ├── villas/               # CompareButton/Bar, WishlistButton
│   ├── auth/                 # TenantMagicLinkFlow, PasswordLoginForm
│   ├── chatbot/              # Chatbot + ChatbotDynamic (lazy)
│   ├── conciergerie/         # ConciergerieFaq
│   ├── dashboard/
│   │   ├── admin/            # Sidebar, Header, Layout, VillaForm, SyncOta, PageIntro
│   │   └── proprio/          # ~20 composants (KpiRow, RevenueChart, OccupancyChart, CopilotPanel, TaskList…)
│   ├── espace-client/        # Shell, BookingCard, ProfileForm, WelcomeBook, messaging
│   ├── search/               # HeroDatePicker, HeroGuestPicker
│   ├── ui/                   # Primitives réutilisables (index.ts contrôlé)
│   ├── VillaFilterBar, VillaLeafletMap, VillaGallery, VillaQuickView, HeroSearchWidget…
│   └── ScrollReveal          # Composant d'animation au scroll réutilisable
├── lib/                      # Supabase clients, price-engine, iCal, OTA hub, i18n, schemas, security
├── contexts/                 # Auth, Compare, HomeAudience, Locale, Wishlist
├── hooks/                    # useCopilot
├── types/                    # domain.ts, supabase.ts (types générés), chatbot, copilot
├── data/                     # seasons.ts, conciergerie-faq.ts, prestations-service-details.ts
├── supabase/migrations/      # SQL versionné (RLS, colonnes villa, seasons)
├── public/                   # Images piliers, hero, brand
├── docs/
│   ├── ACTIONS_LOG.md        # Journal global append-only
│   ├── logs/YYYY-MM-DD.md    # Journaux de session
│   ├── RECAP_COPILOT_PROPRIETAIRE.md
│   ├── OWNER_ASSISTANT_COPILOT.md
│   ├── n8n/OWNER_COPILOT_AUTOMATION.md
│   ├── audits/               # Ex. audit-complet-2026-04-07.md
│   └── superpowers/          # Specs, plans, prompts
├── middleware.ts             # Auth guard + RBAC (admin/proprio/tenant)
├── next.config.mjs           # CSP, images, cache, webpack
├── tailwind.config.ts        # Tokens custom, keyframes, fonts
├── vercel.json               # Crons
└── RECAP.md                  # Ce fichier
```

---

## 5. Routes & pages

### Marketing & acquisition

| Route | Description |
|-------|-------------|
| `/` | Accueil — hero vidéo, audience cards, villas mises en avant, 5 piliers, confiance, lifestyle, propriétaires |
| `/prestations` | Conciergerie — hero vidéo scroll parallaxe (6 sections), hub éditorial 5 piliers, FAQ, CTA confier |
| `/prestations/services/[slug]` | Détail d'un pilier (marketing, terrain, relation, ménage, finance) |
| `/prestations/nos-formules` | Formules |
| `/villas` | Catalogue — carte + liste Leaflet, filtres, wishlist, comparateur |
| `/villas/[id]` | Fiche villa — galerie, booking, détails, équipements, carte |
| `/qui-sommes-nous` | À propos |
| `/contact` | Contact |
| `/faq` | FAQ complète (conciergerie, villa, admin) |
| `/experience` | Expérience |
| `/tarifs` | Tarifs |
| `/soumettre-ma-villa` | Wizard propriétaire (4 étapes : villa, coordonnées, plateformes, finalisation) |

### Réservation & légal

| Route | Description |
|-------|-------------|
| `/book` | Checkout Stripe |
| `/success` | Confirmation réservation |
| `/terms`, `/confidentialite`, `/cookies` | Légal / cookies |

### Espace client (locataire)

| Route | Description |
|-------|-------------|
| `/espace-client` | Tableau de bord séjour |
| `/espace-client/reservations/[id]` | Détail réservation |
| `/espace-client/livret` | Livret d'accueil |
| `/espace-client/livret/print` | Version imprimable |
| `/espace-client/messagerie` | Messagerie avec l'équipe |
| `/espace-client/profil` | Profil |
| `/espace-client/checklist` | Checklist séjour |
| `/espace-client/conciergerie` | Demandes conciergerie |
| `/espace-client/documents` | Documents |

### Dashboard propriétaire

| Route | Description |
|-------|-------------|
| `/dashboard` | Vue d'ensemble (KPIs, réservations à venir, tâches, revenus, calendrier) |
| `/dashboard/villas` | Liste des villas du propriétaire |
| `/dashboard/villas/[villaId]` | Éditeur villa (planning, contenu, réglages, réservations, sync iCal) |
| `/dashboard/villas/[villaId]/photos` | Gestion photos |
| `/dashboard/reservations` | Toutes les réservations |
| `/dashboard/reservations/[villaId]` | Résas par villa |
| `/dashboard/reservations/[villaId]/[bookingId]` | Détail réservation |
| `/dashboard/statistiques` | Stats multi-villas |
| `/dashboard/statistiques/[villaId]` | Stats détaillées (occupancy chart avec saisons, revenue chart) |
| `/dashboard/revenus` | Revenus |
| `/dashboard/taches` | Liste des tâches ménage/régie |
| `/dashboard/taches/[taskId]` | Détail tâche |
| `/dashboard/proprio/assistant` | Copilot IA propriétaire |
| `/dashboard/proprio/analytics` | Analytics avancées |
| `/dashboard/proprio/submissions` | Soumissions villa |
| `/dashboard/team/[secret]` | Accès équipe par lien secret |

### Admin back-office

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard KPIs |
| `/admin/villas` | Liste villas (CRUD) |
| `/admin/villas/ajouter` | Ajouter une villa |
| `/admin/villas/[id]` | Fiche villa (synthèse + liens éditeur/hub/sync) |
| `/admin/clients` | Gestion clients |
| `/admin/proprietaires` | Gestion propriétaires |
| `/admin/reservations` | Réservations |
| `/admin/revenus` | Revenus |
| `/admin/parametres` | Paramètres (saisons Martinique, etc.) |
| `/admin/sync-ota` | Hub synchronisation OTA |
| `/admin/membres/[id]` | Détail membre |
| `/admin/submissions` | Soumissions villa |
| `/admin/assistant` | Assistant IA admin |
| `/admin/hub-classique` | Hub classique |

### API Routes (23)

Booking, Stripe webhooks, analytics, contact, notifications, photos, villa submissions, iCal sync, chatbot, dashboard CRUD (create/update/delete villa, delete booking), admin chat, owner assistant context

---

## 6. Fonctionnalités majeures (état actuel)

### Marketing & marque

- **Conciergerie first** : hero accueil avec cartes audience, TrustBand, HomeConciergeHighlight, 5 piliers sur l'index, CTA prioritaire vers confier
- **Page /prestations** : hero vidéo scroll (canvas WebP, 6 sections avec popups contextuels, timeout 3s fallback), hub éditorial alterné avec images réelles des 5 piliers, FAQ dédiée
- **5 piliers** : marketing digital, terrain & relation, relation voyageurs, ménage & linge, finance & compta — avec pages dédiées, images réelles
- **Page services** : hub éditorial prestations + FAQ + CTA
- **Animations** : ScrollReveal sur toutes les sections marketing (home, prestations, footer), stagger-fade sur les grilles, blur-fade sur les héros

### Produit & données

- **Supabase** : villas, bookings, tâches, logs assistant, soumissions, seasons (saisonnalité), RLS multi-tenant
- **Import Airbnb** : parsing HTML, prix, équipements, normalisation labels
- **Sync iCal** : cron Vercel
- **Saisons Martinique** : table `seasons` en DB, fallback sur `data/seasons.ts` (haute/moyenne/basse), bandeau couleur sur OccupancyChart

### Dashboard propriétaire

- **KPIs** : réservations à venir, revenus du mois, taux d'occupation, nouvelles réservations — zéro-états explicites
- **RevenueChart** : barres mensuelles, mois en cours distingué ("Mai · en cours"), guard 3 mois d'activité
- **OccupancyChart** : courbe avec saisons (bandeau couleur sous l'axe X), guard 3 mois, mois sans résa = pas de point
- **Tâches** : liste, détails, statuts, badges
- **Copilot** : assistant IA contextuel (snapshot du jour, alertes, chat)
- **Navbar/Footer public** : masqués sur les pages dashboard

### Admin back-office

- **Shell admin** : AdminLayout, Sidebar, Header, PageIntro — cohérent sur toutes les pages
- **CRUD villas** : liste, ajout (formulaire complet), édition, fiche synthèse
- **Sync OTA** : gestion des synchronisations Airbnb/Booking
- **Gestion** : clients, propriétaires, réservations, revenus, membres, paramètres
- **Navbar/Footer public** : masqués

### Espace client & réservation

- Checkout Stripe multi-étapes, calendrier disponibilités
- Livret d'accueil, checklist, messagerie, demandes conciergerie, documents
- Chatbot locataire

### Auth & RBAC

- **3 rôles** : admin (staff), proprio (propriétaire), tenant (voyageur/client)
- **Middleware** : guard par route groups — `/admin` → admin only, `/dashboard` → proprio only (staff redirigé vers admin), `/espace-client` → tenant only
- **Login** : dual-tab (password pour proprio/admin, magic link pour tenants)
- **Fallback STAFF_ADMIN_EMAILS** : variable d'environnement pour secours admin

### Animations & micro-interactions

- `ScrollReveal` : wrapper réutilisable pour apparitions au scroll (fade-in, slide-up)
- `stagger-item` : animation séquentielle des listes/grilles (villas, services)
- `blur-fade-in` : hero PageHero (eyebrow → titre → ligne → subtitle)
- Keyframes custom : shimmer doré, scale-in, slide-in, line-draw

---

## 7. Variables d'environnement

Modèle : `.env.local.example` → copier en `.env.local`.

| Variable | Usage |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client public |
| `SUPABASE_SERVICE_ROLE_KEY` | API serveur / admin |
| `STRIPE_*` | Paiements |
| `N8N_WEBHOOK_URL` | Webhook chat admin |
| `N8N_OWNER_WEBHOOK_URL` | Webhook copilot propriétaire |
| `ADMIN_CHAT_ALLOWED_EMAILS` | Emails autorisés admin chat |
| `ADMIN_CHAT_ALLOWED_USER_IDS` | UUID autorisés admin chat |
| `STAFF_ADMIN_EMAILS` | Fallback admin pour middleware |
| `NEXT_PUBLIC_BASE_URL` | URLs absolues (OG, emails) |

---

## 8. Déploiement

- **Vercel** : projet lié au repo GitHub
- **`vercel.json`** : cron sur `/api/sync`
- **Build** : `npm run build` avant livraison
- **Dev** : `npm run dev` (port 3003)
- Attention sandbox Cursor : utiliser `full_network` si DNS Supabase ne résout pas en local

---

## 9. Pistes & dette connue

- Stripe production + webhooks à valider de bout en bout
- CSP / rate limit ciblés sur `/api/contact` et `/api/chat`
- Warning ESLint : `Chatbot.tsx` — useEffect dépendance `messages.length`
- Pas de `not-found.tsx` global (page 404)
- `error.tsx` et `loading.tsx` seulement présents dans `(admin)/admin/`
- Tests Playwright à implémenter pour flows critiques (login, booking, checkout)
- ScrollRevealWrapper.tsx créé mais pas encore utilisé partout (certains ScrollReveal sont encore des Client Components inline)

---

## 10. État d'avancement

| Domaine | État |
|---------|------|
| Marketing public & conciergerie | Très avancé |
| Page /prestations (vidéo scroll + hub éditorial) | Très avancé |
| Catalogue & fiche villa | Très avancé |
| Dashboard propriétaire (KPIs, graphiques, saisons, tâches) | Très avancé |
| Dashboard admin (CRUD, sync, gestion) | Avancé |
| Espace client & paiement | Avancé |
| Animations & micro-interactions | Avancé |
| Auth & RBAC | Avancé |
| Perf / sécurité durcie prod | À cadrer |

---

## 11. Audit & conformité Karibloom

- **Stack** : Next.js 15 App Router + Supabase + Stripe + Tailwind/Chakra/Radix ✓
- **TypeScript strict** ✓
- **SEO** : metadata, sitemap.ts, robots.ts, JSON-LD
- **Responsive** : mobile-first, 44px touch targets, safe areas, dvh
- **Sécurité** : CSP headers, webhook signatures, RLS, middleware auth
- **Documentation** : ACTIONS_LOG.md, logs de session, RECAP.md

---

## 12. Traçabilité

| Emplacement | Rôle |
|-------------|------|
| `docs/ACTIONS_LOG.md` | Journal global append-only |
| `docs/logs/YYYY-MM-DD.md` | Détail des sessions par jour |
| `docs/superpowers/specs/`, `plans/`, `prompts/` | Specs et prompts |

---

## 13. Chronologie récente

| Période | Thèmes |
|---------|--------|
| **2026-04** | Conciergerie-first, hero /prestations, fix logo, éditeur villa (onglets TOC), import prix/équipements, audit complet |
| **2026-05-01** | Correction routage admin (RBAC + middleware), fallback STAFF_ADMIN_EMAILS |
| **2026-05-07** | Gold tokens unifiés, migration total_price_cents, auth guards dupliqués supprimés |
| **2026-05-08 (matin)** | Dashboard admin shell (layout, sidebar, page intro), villa admin CRUD, sync OTA, navbar/footer masqués |
| **2026-05-08 (après-midi)** | Dashboard proprio (KPIs, RevenueChart, OccupancyChart + saisons), FAQ commission, auth defense-in-depth |
| **2026-05-09** | Animations P1 (ScrollReveal, stagger-fade), page /prestations redesign (mobile hero + hub éditorial), critique design P1 fixes, Copilot Finance redesign, bug villas DNS sandbox, page proprios supprimée, images 5 piliers, Navbar centrage, rename labels |
| **2026-05-21 (matin)** | Refonte formulaire Confier ma villa (wizard 4 étapes enrichi : chambres, SdB, parking, gardien, délai, adresse postale ; retrait revenus ; email Resend), commission 20 % → 25 % (10 fichiers UI + Stripe), frais de ménage personnalisés par villa (migration, admin form, dashboard proprio, Stripe), fix lien "Tous les piliers" (/#piliers → /prestations#piliers) |

---

## 14. Session 2026-05-21 — Détail

### Refonte formulaire Confier ma villa (`/soumettre-ma-villa`)
- **Spéc** : `docs/superpowers/specs/2026-05-21-confier-ma-villa-form-design.md`
- **Plan** : `docs/superpowers/plans/2026-05-21-confier-ma-villa-form.md`
- **Étape 1 — Le bien** : surface terrain, chambres, SdB, étages, parking (places + sécurisé), équipements élargis (WiFi, BBQ, salle de sport, borne EV)
- **Étape 2 — Situation** : retrait des revenus locatifs
- **Étape 3 — Infos** : gardien existant, délai souhaité
- **Étape 4 — Contact** : adresse postale (contrat), wording photos "Recommandé"
- **Backend** : migration 9 colonnes sur `villa_submissions`, API POST/GET enrichie
- **Email** : confirmation Resend au propriétaire (fire-and-forget)

### Commission 20 % → 25 %
- Logique Stripe : `lib/stripe/connect.ts` (défaut 25 %), `app/api/booking/route.ts` (split 75/25)
- UI : 10 fichiers texte (homepage, prestations, FAQ, SEO, VideoScrollHero, qui-sommes-nous)

### Frais de ménage par villa
- **Spéc** : `docs/superpowers/specs/2026-05-21-cleaning-fee-per-villa-design.md`
- Migration `cleaning_fee_cents` sur `villas`
- AdminVillaForm : champ "Frais de ménage (€)"
- Dashboard proprio : affichage lecture seule
- Booking API : `villa.cleaning_fee_cents` utilisé dans la Session Stripe

### Correctif navigation
- Lien "Tous les piliers" (`/prestations/services/[slug]/page.tsx`) : `/#piliers` → `/prestations#piliers`

---

| **2026-05-21 (soir)** | Audit taste-skill (72/100), corrections P0-P2 : framer-motion installe, MagneticButton spring physics, HomeTrustBand retire, scroll listener rAF-throttle, squelettes shape-matched (SkeletonText/Card/Image), Button isLoading, copywriting HomeBottomCta |
| **2026-05-22** | Refonte page villa style Airbnb (675→537 lignes, 10 sections), audit technique (12/20), correctifs P1-P3 (reviews réels, section concierge, grille expérience distinctive, font 11px min), fix flèches piliers homepage, installation taste-skill |

---

## 15. Session 2026-05-22 — Détail

### Refonte page villa Airbnb (`/villas/[id]`)
- **Spéc** : `docs/superpowers/specs/2026-05-22-villa-page-airbnb-redesign.md`
- **Plan** : `docs/superpowers/plans/2026-05-22-villa-page-airbnb-redesign.md`
- Expérience Kayvila : 4 blocs lourds → 1 grille compacte
- Suppression : carte mobile en double, conditions redondantes, citations décoratives
- Réorganisation en 10 sections ordre Airbnb

### Audit + Correctifs
- Score 12/20 → corrigé : reviews table + API + composant dynamique, section concierge, grille expérience 2-colonnes numérotée, text-[10px]→[11px], polish spacing + ancres id

### Autres
- Flèches piliers homepage : 36px→44px, bordure visible, couleur explicite
- taste-skill ajouté dans settings.json (Leonxlnx/taste-skill)

---

## 16. Session 2026-05-21 (soir) — Audit taste-skill + Correctifs

### Audit complet
- Score global : **72/100** (Typographie 85, Couleur 90, Layout 55, Motion 50, Etats UI 65, Performance 80, Anti-Slop 78)
- Baseline : Variance 8, Motion 6, Density 4

### Correctifs (7 fichiers)
1. **HomeTrustBand retire** — section + import supprimes
2. **framer-motion installe** — npm install framer-motion
3. **Scroll listener rAF-throttle** — Navbar, plus de jank
4. **MagneticButton** — nouveau composant, spring physics + aimantation
5. **4 CTAs upgrades** — HomeBottomCta + HomeOwnersSection
6. **Squelettes shape-matched** — SkeletonText/Card/Image
7. **Button isLoading** — spinner inline + active:scale-[0.98]
8. **Copywriting** — HomeBottomCta phrase concrete

### Points conserves
min-h-[50dvh], off-black, Playfair+Instrument Sans, gold seul accent, backdrop-filter mobile off, prefers-reduced-motion, touch targets 44px, content-visibility auto

---

---

## Session 2026-05-25 — Réservations Passées + Minimum de Nuits

### Contexte
Le gérant demande (1) un accès à l'historique des réservations passées par villa et (2) la possibilité de définir un nombre minimum de nuits par villa.

### Spécification & Plan
- **Spec :** `docs/superpowers/specs/2026-05-25-reservations-passees-min-nuits-design.md`
- **Plan :** `docs/superpowers/plans/2026-05-25-reservations-passees-min-nuits.md`

### Implémentation (7 commits)

| Commit | Description |
|--------|-------------|
| `1ce5acc` | Migration SQL `min_nights` (colonne `villas.min_nights INTEGER DEFAULT 1`) |
| `0d369c4` | Label `past: "Passées"` dans `BOOKING_STATUS_LABELS` |
| `a34e886` | Filtre « Passées » dans `/admin/reservations` + support param `?villa=VillaID` |
| `f0c6925` | `VillaPastBookingsDrawer` + `VillaTableRow` — drawer historique par villa, colonne Résa cliquable |
| `a63d1ad` | Champ `min_nights` éditable dans le formulaire villa (VillaFormFields + VillaEditorForm) |
| `32a32d2` | Blocage checkout si séjour < `min_nights` (CheckoutView) |

### Fichiers modifiés (9)
- **Créés :** `components/dashboard/VillaPastBookingsDrawer.tsx`, `components/dashboard/VillaTableRow.tsx`, `supabase/migrations/20260525_add_min_nights.sql`
- **Modifiés :** `reservations/page.tsx`, `villas/page.tsx`, `CheckoutView.tsx`, `VillaEditorForm.tsx`, `VillaFormFields.tsx`, `constants.ts`

### Design
- **Filtre « Passées »** = réservations `confirmed` avec `end_date < today` (pas un nouveau statut DB)
- **Drawer** 480px glissant depuis la droite, overlay backdrop-blur
- **min_nights** : règle dure, bloquée au checkout avant Stripe

### Correctif
- **Bug `useRef` conditionnel** dans `VillaEditorForm.tsx:21` — corrigé (violait rules-of-hooks, bloquait le dev server)
- **Dev server Next.js 15.5.14** — le mode TTY compact masque les détails d'erreur, workaround via script Node sans TTY

### Migration Supabase
- Projet : DIAMANT NOIR (`wsdawdxucyuyopkpgjij`)
- Colonne `min_nights` appliquée et vérifiée

---

**Derniere mise a jour du recap :** 2026-05-28

---

## 2026-05-28 — Security Hardening (15 commits)

### Contexte

Audit de sécurité complet : 12 vulnérabilités critiques et élevées corrigées sur la couche RLS Supabase et les routes API Next.js.

### Phase 1 — Auth partagé (`lib/auth/server.ts`)

- `getUserFromRequest(request)` — extrait le Bearer token, valide le JWT via Supabase
- `requireAuth(request)` — throw `AuthError(401)` si non authentifié
- `requireAdmin(request)` — throw `AuthError(403)` si non admin (vérifie profil + JWT metadata + email staff)
- `verifyApiKey(request)` — compare le Bearer token à `CRON_API_KEY`
- `AuthError` — classe Error avec propriété `status`

### Phase 2 — RLS SQL

Migration `supabase/migrations/20260528_security_hardening.sql` :

| Table | Correctif |
|-------|-----------|
| `profiles` | Récursion infinie fixée : `auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'` (au lieu de sous-requête `profiles`) |
| `villas` | 3 policies : `select_public` (is_published=true), `select_owner_admin`, `manage_owner_admin` |
| `storage.villa-images` | Bloqué anon, authenticated only (insert/update/delete) + public read |
| `storage.villa-submissions` | Bloqué anon, authenticated only (insert/select) |

### Phase 3 — API Routes (10 routes protégées)

| Route | Garde | Note |
|-------|-------|------|
| `admin/owners` GET | `requireAdmin` | — |
| `stripe/connect-verify` POST | `requireAuth` | `ownerId` de la session, plus du body |
| `stripe/connect-onboarding` POST | `requireAuth` | `ownerId` de la session, plus du body |
| `reviews` POST | `requireAuth` | Vérifie que le booking appartient au posteur |
| `villa-photo-upload` POST | `requireAuth` | Vérifie owner de la villa |
| `sync` GET | Admin ou `CRON_API_KEY` | — |
| `sync-ota` POST | `requireAuth` | Vérifie owner de la villa |
| `analytics/villa` POST | `requireAuth` ou `CRON_API_KEY` | — |
| `villa-submissions/confirm` POST | `requireAdmin` | — |
| `villa-submissions` GET/PATCH | `requireAdmin` | POST reste public (formulaire) |

### Règles invariantes

- **Jamais** de `owner_id` ou `prix` depuis le body client — toujours depuis `auth.uid()`
- `supabaseAdmin()` reste pour les opérations DB, l'auth est vérifiée avant
- JWT role path correct : `auth.jwt() -> 'user_metadata' ->> 'role'` (pas `auth.jwt() ->> 'role'`)

### Commits (15)

```
6d82ca0 fix: make RLS migration idempotent
477bf47 feat: secure villa-submissions GET/PATCH
0e42a49 feat: secure villa-submissions confirm
db12f3f feat: secure analytics villa
b919fe8 feat: secure sync-ota
b9debbb feat: secure sync
2dc10c9 feat: secure villa-photo-upload
388064f feat: secure reviews POST
ea27422 feat: secure stripe connect-onboarding
234c1a6 feat: secure stripe connect-verify
b47187f feat: secure admin owners
e122357 fix(rls): security hardening migration
b2c8d7b feat(auth): shared auth helpers
8247069 docs: implementation plan
40c7bbb docs: security hardening spec
```

### À faire manuellement

- [ ] Appliquer la migration `20260528_security_hardening.sql` dans le SQL Editor Supabase
- [ ] Tester les RLS avec `curl` + anon key
- [ ] Ajouter `CRON_API_KEY` dans les env vars Vercel (pour les routes sync/analytics)

---

**Derniere mise a jour du recap :** 2026-05-28
