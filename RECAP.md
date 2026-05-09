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
| **Animations** | GSAP 3.14, Framer Motion, ScrollReveal |
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

---

**Dernière mise à jour du récap :** 2026-05-09
