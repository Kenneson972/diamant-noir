# DIAMANT NOIR — Récapitulatif complet du projet

## 1. Présentation

**Diamant Noir** est une plateforme logicielle de **conciergerie de luxe** « all-in-one » en Martinique. Elle permet de gérer un portefeuille de villas d’exception avec une expérience client immersive (recherche, réservation, livret), une synchronisation intelligente (iCal, import OTA / Airbnb), un **dashboard propriétaire** complet et un **assistant IA** côté admin.

**Positionnement produit (2026-04)** : la marque est volontairement perçue comme une **maison de conciergerie privée** qui propose des villas — et non comme une plateforme de location avec de la conciergerie en option. La home, la navbar (CTA principal vers `/prestations`) et l’ordre des sections marketing reflètent cette hiérarchie.

---

## 2. Stack technique

| Couche | Technologies |
|--------|---------------|
| **Framework** | Next.js 15.x (App Router) |
| **Langage** | TypeScript |
| **UI / styling** | Tailwind CSS 3.4, **Radix UI** (Dropdown, Tabs, Popover, Themes), **Lucide React**, composants `components/ui` (pattern type shadcn) |
| **Autres libs UI** | Chakra / HeroUI / `@dnd-kit` présents au `package.json` pour écrans ou modules spécifiques ; **doctrine marketing** : privilégier Radix + Tailwind sur les pages publiques |
| **Base de données & auth** | Supabase (PostgreSQL + Auth) — `@supabase/supabase-js` |
| **Paiements** | Stripe (`stripe`) |
| **Calendrier** | FullCalendar 6.x (React, DayGrid, Interaction), `node-ical` |
| **Cartes** | Leaflet + `react-leaflet` (catalogue `/villas`) |
| **Utilitaires** | `clsx`, `tailwind-merge`, `date-fns` |
| **Déploiement** | **Vercel** (crons pour `/api/sync`) — prod typique : `https://diamant-noir.vercel.app` |

### Scripts

- **Dev** : `npm run dev` (port **3000** par défaut ; libérer le port si occupé)
- **Build** : `npm run build` — à lancer avant livraison / après changements structurants
- **Lint** : `npm run lint`

---

## 3. Design system

- **Couleurs** : `gold` (#D4AF37), `navy` (#0A0A0A), `offwhite` (#FAFAFA) + neutres
- **Typographie** : Inter + Playfair Display + Cormorant Garamond (voir `app/layout.tsx`)
- **Images** : Next.js `Image` — domaines autorisés dans `next.config.mjs` (Supabase, Airbnb/muscache, etc.)
- **Ambiance** : prestige, minimalisme, lisibilité mobile (breakpoints, safe area, `dvh` sur écrans critiques — passes 2026-04)
- **Fichier CSS global** : `public/heroui.min.css` chargé dans `layout.tsx` — à garder ou retirer selon audit produit (charge globale)

---

## 4. Structure du projet (vue synthétique)

```
diamant-noir/
├── app/                      # App Router — pages + API
│   ├── api/                  # Routes REST (booking, chat, dashboard CRUD, sync, webhooks…)
│   ├── book/                 # Tunnel réservation
│   ├── contact/, cookies/, terms/, confidentialite/
│   ├── dashboard/proprio/    # Espace propriétaire (liste, [villaId], analytics, assistant…)
│   ├── espace-client/        # Locataire (séjour, livret, messagerie, profil…)
│   ├── login/, register/
│   ├── prestations/          # Page conciergerie (hero immersif + contenu éditorial)
│   ├── proprietaires/        # Landing programme propriétaires
│   ├── qui-sommes-nous/, tarifs/, experience/
│   ├── soumettre-ma-villa/
│   ├── villas/               # Catalogue + fiche [id]
│   ├── layout.tsx, globals.css
├── components/
│   ├── booking/, chatbot/, dashboard/, espace-client/, layout/ (Navbar, Footer, BrandLogo)
│   ├── home/                 # Blocs home : HeroAudienceCards, HomeConciergeHighlight, TrustBand…
│   ├── marketing/            # HeroWordmarkBaseline, landing-sections, editorial-blocks
│   ├── villas/, VillaLeafletMap, VillasMapView, VillaGallery…
│   └── ui/                   # Primitives réutilisables
├── lib/                      # Supabase clients, import Airbnb/listing, iCal, prix, i18n…
├── supabase/migrations/      # SQL versionné (RLS, colonnes villa, etc.)
├── public/                   # Assets statiques (brand, hero, prestations-hero.png…)
├── docs/
│   ├── ACTIONS_LOG.md        # Journal global append-only (cursor / claude)
│   ├── RECAP_COPILOT_PROPRIETAIRE.md  # Récap séparé — copilot propriétaire (vue d’ensemble)
│   ├── OWNER_ASSISTANT_COPILOT.md     # Spec technique (API, DB, flux)
│   ├── n8n/OWNER_COPILOT_AUTOMATION.md # n8n + LLM : webhook, payload, prompt, réponse JSON
│   ├── audits/               # Ex. audit-complet-2026-04-07.md
│   ├── logs/YYYY-MM-DD.md    # Journaux de session
│   └── superpowers/          # Specs, plans, prompts Claude Code
├── vercel.json               # Crons
├── RECAP.md                  # Ce fichier
└── README.md
```

---

## 5. Routes & pages

### Marketing & acquisition

| Route | Description |
|-------|-------------|
| `/` | Accueil — hero vidéo, cartes audience (conciergerie / voyageur), confiance, **HomeConciergeHighlight**, lifestyle, propriétaires, villas mises en avant, CTA fin de page |
| `/prestations` | **Conciergerie** — hero immersif (image `public/prestations-hero.png`), bandeau CTA noir compact et centré, stats, services, inclusions par catégories, FAQ |
| `/prestations/nos-formules` | Formules (stub ou contenu selon version) |
| `/proprietaires` | Landing programme propriétaires (même famille hero que l’accueil si configuré) |
| `/qui-sommes-nous` | À propos |
| `/contact` | Contact |
| `/soumettre-ma-villa` | Lead propriétaire |
| `/villas` | Catalogue carte + liste (Leaflet), filtres |
| `/villas/[id]` | Fiche villa — galerie, réservation, détails |

### Réservation & légal

| Route | Description |
|-------|-------------|
| `/book` | Recherche / checkout |
| `/success` | Confirmation |
| `/tarifs`, `/experience` | Pages satellite |
| `/terms`, `/confidentialite`, `/cookies` | Légal / cookies |

### Espace client (locataire)

| Route | Description |
|-------|-------------|
| `/espace-client` | Tableau de bord séjour |
| `/espace-client/reservations/[id]` | Détail réservation / livret |
| `/espace-client/livret`, `/livret/print` | Livret & impression |
| `/espace-client/messagerie` | Messages |
| `/espace-client/profil` | Profil |
| `/espace-client/checklist` | Checklist |
| `/espace-client/conciergerie`, `/documents` | Contacts / docs (évolution) |

### Authentification & dashboard propriétaire

| Route | Description |
|-------|-------------|
| `/login`, `/register` | Auth Supabase |
| `/dashboard/proprio` | Liste des villas, chrome propriétaire |
| `/dashboard/proprio/[villaId]` | Éditeur villa (planning, contenu, réglages, réservations, sync iCal…) |
| `/dashboard/proprio/analytics` | Analytics multi-villas |
| `/dashboard/proprio/submissions` | Soumissions « soumettre ma villa » |
| `/dashboard/proprio/assistant` | **Copilot propriétaire** — récap : [`docs/RECAP_COPILOT_PROPRIETAIRE.md`](docs/RECAP_COPILOT_PROPRIETAIRE.md) · spec technique : [`docs/OWNER_ASSISTANT_COPILOT.md`](docs/OWNER_ASSISTANT_COPILOT.md) |
| `/dashboard/team/[secret]` | Accès équipe par secret URL |

---

## 6. API Routes (aperçu)

| Route | Rôle principal |
|-------|------------------|
| `POST /api/booking` | Création réservation (+ Stripe si configuré) |
| `POST /api/booking-session` | Session de booking |
| `POST /api/chat`, `POST /api/chat/tenant` | Chatbot public / locataire |
| `POST /api/contact` | Formulaire contact |
| `POST /api/import-airbnb` | Import listing Airbnb |
| `GET/POST /api/sync`, `POST /api/sync-ota` | Synchro calendriers / OTA |
| `POST /api/villa-photo-upload` | Upload photos |
| `POST /api/villa-submissions` | Soumissions villa |
| `POST /api/webhooks/stripe` | Webhooks paiement |
| `POST /api/notify-admin-booking`, `POST /api/send-booking-confirmation` | Notifications |
| `POST /api/admin/chat` | Assistant **gérant / admin** → n8n — **Bearer + allowlist** (`ADMIN_CHAT_ALLOWED_EMAILS` / `ADMIN_CHAT_ALLOWED_USER_IDS`) |
| `GET` / `POST /api/dashboard/owner-assistant` | **Copilot propriétaire** — [`docs/RECAP_COPILOT_PROPRIETAIRE.md`](docs/RECAP_COPILOT_PROPRIETAIRE.md) · [`docs/OWNER_ASSISTANT_COPILOT.md`](docs/OWNER_ASSISTANT_COPILOT.md) |
| `POST /api/dashboard/*` | create-villa, update-villa, delete-villa, delete-booking |
| `GET /api/dashboard/analytics-villas`, `GET /api/analytics/villa` | Métriques |

---

## 7. Fonctionnalités majeures (état actuel)

### Marketing & marque

- **Conciergerie first** : hero accueil avec cartes (conciergerie → `/prestations`, voyageur → recherche), TrustBand avec conciergerie 24/7 en tête, bloc `HomeConciergeHighlight`, propriétaires avant catalogue villas, CTA bas de page priorisant la conciergerie
- **Hero wordmark** : `DIAMANT NOIR` + « Conciergerie privée » ; sur l’**accueil** les trois mots micro *Confiance · Réactivité · Excellence* sont **désactivés** (`showValuesTriplet={false}`) ; conservés sur `/proprietaires` si besoin
- **Navbar** : CTA principal **Conciergerie** → `/prestations` ; logo cliquable vers `/` (correction `pointer-events` + `z-index` colonne logo) ; barre **z-index > Leaflet** pour ne pas être recouverte par la carte sur `/villas`
- **Fiches villa** : chrome header adapté fond clair (pas texte blanc sur galerie claire) ; lightbox galerie et aperçu catalogue au-dessus des couches carte

### Produit & données

- **Supabase** : villas, bookings, tâches, logs assistant, soumissions, champs premium villa (équipements, règles, iCal feeds…), **RLS** multi-tenant propriétaires
- **Import Airbnb / enrichissement** : parsing HTML, prix, équipements, normalisation labels, persistance `amenities_import_labels`
- **Sync iCal** : cron Vercel sur `/api/sync`

### Dashboard & IA

- **Éditeur villa** : onglets réorganisés (Planning, Contenu, Réglages), registre réservations avec filtres / export, feedback sync iCal
- **Assistant propriétaire** : copilot scoped (`owner_id`), snapshot « Aujourd’hui » + alertes + chat via `owner-assistant` ; tables `owner_alerts` / `ai_action_logs` ; n8n optionnel — **récap** [`docs/RECAP_COPILOT_PROPRIETAIRE.md`](docs/RECAP_COPILOT_PROPRIETAIRE.md) · **spec** [`docs/OWNER_ASSISTANT_COPILOT.md`](docs/OWNER_ASSISTANT_COPILOT.md)

### Espace client & réservation

- Checkout multi-étapes, calendrier disponibilités, livret et messagerie (évolution continue)

---

## 8. Variables d’environnement

Modèle : `.env.local.example` → copier en `.env.local`.

| Variable | Usage |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client public |
| `SUPABASE_SERVICE_ROLE_KEY` | API serveur / admin |
| `STRIPE_*` | Paiements (optionnel en dev) |
| `N8N_WEBHOOK_URL` | Webhook chat (admin / repli) |
| `N8N_OWNER_WEBHOOK_URL` | Webhook optionnel **copilot propriétaire** (prioritaire sur `N8N_WEBHOOK_URL` pour cette route) — voir [`docs/n8n/OWNER_COPILOT_AUTOMATION.md`](docs/n8n/OWNER_COPILOT_AUTOMATION.md) |
| `N8N_OWNER_WEBHOOK_SECRET` | (Optionnel) Envoyé en `X-Webhook-Secret` vers n8n pour sécuriser le webhook |
| `ADMIN_CHAT_ALLOWED_EMAILS` | Emails autorisés sur `POST /api/admin/chat` (CSV, insensible à la casse) |
| `ADMIN_CHAT_ALLOWED_USER_IDS` | UUID Supabase autorisés sur `POST /api/admin/chat` (CSV) — au moins une des deux listes requise pour accès |
| `NEXT_PUBLIC_BASE_URL` | URLs absolues (OG, emails) |

Ne **jamais** committer `.env.local` ni de secrets.

---

## 9. Déploiement

- **Vercel** : `vercel deploy --prod` (CLI connectée au compte projet)
- **`vercel.json`** : cron sur `/api/sync` (planning type `0 3 * * *` ou équivalent selon fichier)
- Après un **build** de vérification, relancer le **serveur de dev** pour prévisualiser localement (`npm run dev` sur le port 3000)

---

## 10. Pistes & dette connue

- Stripe production + webhooks validés de bout en bout
- CSP / rate limit ciblés sur `/api/contact` et `/api/chat` si besoin
- Baseline Lighthouse + `MESURES_BASELINE.md` (règle perf Karibloom)
- Nettoyage optionnel : dépendances UI non utilisées, `heroui.min.css` si migration terminée
- Warning ESLint connu : `Chatbot.tsx` — `useEffect` / dépendance `messages.length`

---

## 11. État d’avancement (indicatif)

| Domaine | État indicatif |
|---------|----------------|
| Marketing public & conciergerie | Très avancé |
| Catalogue & fiche villa | Très avancé |
| Dashboard propriétaire & import | Très avancé |
| Espace client & paiement | Avancé (itérations possibles) |
| Perf / sécurité durcie prod | À cadrer avec audit continu |

---

## 12. Audit & conformité Karibloom

- **Audit multi-domaines** : [`docs/audits/audit-complet-2026-04-07.md`](docs/audits/audit-complet-2026-04-07.md) (stack, mobile, SEO, sécurité, a11y, données)
- **Règles projet** : `.cursor/rules/` + pack `client-builder/` (workflow, stack, UI, perf)

---

## 13. Traçabilité

| Emplacement | Rôle |
|-------------|------|
| `docs/ACTIONS_LOG.md` | Journal **global** append-only (`agent: cursor` ou `agent: claude`) |
| `docs/logs/YYYY-MM-DD.md` | Détail des sessions par jour |
| `docs/superpowers/specs/`, `plans/`, `prompts/` | Specs et prompts Claude Code |

Les **sorties brutes de terminal** ne sont pas versionnées ; l’historique exploitable est dans ces fichiers.

---

## 14. Chronologie récente (synthèse)

| Période | Thèmes |
|---------|--------|
| **2026-04-05** | Mobile heroes, `text-[10px]`, captures Playwright |
| **2026-04-06** | Éditeur villa (onglets, TOC, résas, iCal), mobile (`dvh`, navbar, safe area), sync rules Builder |
| **2026-04-07** | Import prix & équipements, migrations SQL, audit complet documenté |
| **2026-04-07 (Claude)** | **Repositionnement conciergerie first** : home, TrustBand, `HomeConciergeHighlight`, ordre sections, CTAs, page `/prestations` enrichie — spec `docs/superpowers/specs/2026-04-07-conciergerie-first-design.md` |
| **2026-04-08** | Hero `/prestations` image dédiée, bande noire CTA compacte et centrée, **fix logo → accueil** (Navbar / BrandLogo), déploiements Vercel ; hero accueil sans les trois mots micro |

*Le détail fichier par fichier est dans `ACTIONS_LOG.md` et les `docs/logs/` correspondants.*

---

**Dernière mise à jour du récap :** 2026-04-08  
**Version package :** `0.1.0` (`package.json`)
