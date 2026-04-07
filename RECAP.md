# 💎 DIAMANT NOIR — Récapitulatif complet du projet

## 1. Présentation

**Diamant Noir** est une plateforme logicielle de conciergerie de luxe « all-in-one ». Elle permet de gérer un portefeuille de villas d’exception avec une expérience client immersive type Airbnb, une synchronisation intelligente (iCal, import Airbnb) et un dashboard de pilotage business complet, assisté par IA.

---

## 2. Stack technique

| Couche | Technologies |
|--------|---------------|
| **Framework** | Next.js 15.5.x (App Router) |
| **Langage** | TypeScript 5.5 |
| **UI / styling** | Tailwind CSS 3.4, Radix UI (Dropdown, Tabs, Popover), Lucide React, composants type shadcn (`components/ui`: Button, Card, Input, Tabs, Skeleton) |
| **Base de données & auth** | Supabase (PostgreSQL + Auth) — `@supabase/supabase-js` 2.45 |
| **Paiements** | Stripe 14.x (`stripe`) |
| **Calendrier** | FullCalendar 6.x (React, DayGrid, Interaction), `node-ical` 0.16 |
| **Utilitaires** | `clsx`, `tailwind-merge` |
| **Déploiement** | Vercel (crons pour `/api/sync`) |

### Dépendances principales (`package.json`)

- **Runtime :** `next`, `react`, `react-dom`, `@supabase/supabase-js`, `stripe`, `lucide-react`, `@fullcalendar/*`, `node-ical`, `@radix-ui/*`
- **Dev :** `typescript`, `tailwindcss`, `autoprefixer`, `postcss`, `@types/react`

---

## 3. Design system

- **Couleurs (Tailwind)** : `gold` (#D4AF37), `navy` (#0A0A0A), `offwhite` (#FAFAFA) + neutres (cream/champagne/sand)
- **Typographie** : Inter + Playfair Display (convention projet)
- **Images** : Next.js Image — domaines autorisés : `*.supabase.co`, `a0.muscache.com`, `*.muscache.com` (`next.config.mjs`)
- **Ambiance** : Prestige, minimalisme, haute performance
- **Doctrine UI (2026-03-31)** : **une seule base UI** = Radix primitives + Tailwind via `components/ui`. Chakra/HeroUI retirés.

---

## 4. Structure du projet

```
diamant-noir/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── admin/chat/           # Chat assistant admin (n8n)
│   │   ├── booking/              # Création réservation + Stripe
│   │   ├── chat/                 # Chatbot public
│   │   ├── dashboard/            # CRUD sécurisé (villas, résas)
│   │   │   ├── create-villa/
│   │   │   ├── delete-booking/
│   │   │   ├── delete-villa/
│   │   │   └── update-villa/
│   │   ├── import-airbnb/        # Import villa depuis URL Airbnb
│   │   └── sync/                 # Synchronisation iCal (cron)
│   ├── book/                     # Recherche + checkout 2 étapes
│   ├── dashboard/
│   │   ├── proprio/              # Dashboard propriétaire (layout + chrome partagé)
│   │   │   ├── layout.tsx        # ProprioChrome sticky sur toutes les routes proprio
│   │   │   ├── page.tsx          # Liste villas + intro navy
│   │   │   ├── analytics/        # Stats par villa (tableau éditorial)
│   │   │   ├── submissions/      # Soumissions villas (leads)
│   │   │   ├── assistant/        # Assistant IA (thème « salon privé » navy/or)
│   │   │   └── [villaId]/        # Fiche villa (édition, résas, sections avec filet or)
│   │   └── team/[secret]/        # Page équipe (accès par secret)
│   ├── login/                    # Connexion Supabase
│   ├── villas/                   # Catalogue + fiche villa
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── espace-client/            # Espace locataire (UI Radix+Tailwind)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── messagerie/page.tsx
│   │   ├── profil/page.tsx
│   │   └── reservations/[id]/page.tsx
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── booking/                  # Réservation & checkout
│   │   ├── AvailabilityCalendar.tsx
│   │   ├── CheckoutView.tsx
│   │   ├── SearchResults.tsx
│   │   └── VillaSelectionCard.tsx
│   ├── chatbot/                  # Chatbot public (FAB)
│   │   └── Chatbot.tsx
│   ├── espace-client/            # Composants espace locataire (Avatar, Chatbot SAV, etc.)
│   ├── dashboard/                # Admin
│   │   ├── ActionMenu.tsx
│   │   ├── SortableImage.tsx
│   │   ├── proprio/              # Dashboard propriétaire (chrome + intros)
│   │   │   └── ui.tsx            # ProprioChrome, ProprioPageIntro, StatTile, SectionHeading
│   │   └── assistant-views/      # Vues du Command Center
│   │       ├── BookingsView.tsx
│   │       ├── MaintenanceView.tsx
│   │       ├── StatsView.tsx
│   │       └── VillasView.tsx
│   ├── layout/
│   │   ├── Footer.tsx
│   │   └── Navbar.tsx
│   ├── ui/                       # Composants de base (button, card, input, tabs)
│   ├── AdminCalendar.tsx
│   ├── BookingForm.tsx
│   ├── TeamCalendar.tsx
│   ├── VillaGallery.tsx
│   ├── VillaInteractions.tsx
│   └── debug/SupabaseDebug.tsx
├── lib/
│   ├── actions.ts                # Server Actions (revalidation)
│   ├── airbnb-import.ts          # Logique import Airbnb
│   ├── ical-sync.ts              # Sync iCal (UIDs, annulations)
│   ├── price-engine.ts           # Moteur de prix
│   ├── supabase-server.ts        # Client Supabase serveur (service role)
│   ├── supabase.ts               # Client Supabase navigateur
│   └── utils.ts                  # Utilitaires (cn, etc.)
├── types/
│   └── index.ts                  # Types partagés
├── .env.local.example            # Modèle variables d'environnement
├── next.config.mjs
├── tailwind.config.ts
├── vercel.json                   # Crons (sync horaire)
├── docs/
│   ├── ACTIONS_LOG.md            # Journal global des changements
│   ├── audits/audit-complet-2026-04-07.md
│   └── logs/                     # Journaux de session (YYYY-MM-DD.md)
├── GUIDE_INSERT_VILLAS.md
├── GUIDE_RECUPERER_CLES_SUPABASE.md
├── VERIFICATION_SUPABASE.md
├── README.md
└── RECAP.md                      # Ce fichier
```

---

## 5. Routes & pages

### Public

| Route | Description |
|-------|-------------|
| `/` | Landing (hero, collection de villas) |
| `/villas` | Catalogue des villas publiées |
| `/villas/[id]` | Fiche villa (galerie, calendrier dispo, réservation) |
| `/book` | Recherche / sélection villas **ou** checkout 2 étapes (si `villaId`, `checkin`, `checkout` en query) |

### Espace client (locataire)

| Route | Description |
|-------|-------------|
| `/espace-client` | Tableau de bord locataire (séjours, hero prochain séjour) |
| `/espace-client/messagerie` | Messagerie SAV (chat) |
| `/espace-client/profil` | Profil (avatar + metadata user) |
| `/espace-client/reservations/[id]` | Livret de séjour (WiFi / recommandations / urgences) |

### Admin (authentification Supabase)

| Route | Description |
|-------|-------------|
| `/login` | Connexion — redirection vers `/dashboard/proprio` après succès |
| `/dashboard/proprio` | Liste des villas (intro éditoriale, filtres, ProprioChrome) |
| `/dashboard/proprio/new` | Création d’une nouvelle villa |
| `/dashboard/proprio/analytics` | Vues / clics / résas / CA par villa |
| `/dashboard/proprio/submissions` | Gestion des soumissions « soumettre ma villa » |
| `/dashboard/proprio/[villaId]` | Fiche villa : onglets, calendrier, contenu premium, finances |
| `/dashboard/proprio/assistant` | Assistant IA (Command Center : chat + panneau visuel, thème aligné marque) |
| `/dashboard/team/[secret]` | Page équipe (accès par secret dans l’URL) |

---

## 6. API Routes

| Méthode | Route | Rôle |
|---------|--------|------|
| POST | `/api/admin/chat` | Envoi du contexte business + message vers n8n (assistant admin) |
| POST | `/api/chat` | Chatbot public (webhook IA) |
| POST | `/api/booking` | Création réservation + intention Stripe (si configuré) |
| POST | `/api/dashboard/create-villa` | Création villa (serveur, service role) |
| POST | `/api/dashboard/update-villa` | Mise à jour villa |
| POST | `/api/dashboard/delete-villa` | Suppression villa (délai 10 s + undo) |
| POST | `/api/dashboard/delete-booking` | Suppression réservation |
| POST | `/api/import-airbnb` | Import d’une villa depuis une URL Airbnb |
| GET/POST | `/api/sync` | Synchronisation iCal (appelée par cron Vercel) |

---

## 7. Fonctionnalités réalisées

### 7.1 Assistant IA & Command Center (admin)

- **Visual Pane** réactif au chat : `StatsView`, `VillasView`, `BookingsView`, `MaintenanceView`
- **KPIs** : RevPAR, taux d’occupation, détection villas sous-performantes (données envoyées à n8n)
- **Smart Insights Bar** : alertes (ex. villa non publiée en haute saison)
- **Journalisation** : actions admin enregistrées dans `admin_chat_logs`

### 7.2 Expérience client (inspiration Airbnb)

- **Checkout 2 étapes** : récap voyage, politique d’annulation, règles, résumé prix (frais ménage/service)
- **Calendrier de disponibilité** : dates réservées grisées en temps réel sur la fiche villa
- **Note UI calendrier (2026-03-31)** : FullCalendar en build module n’embarque pas une feuille CSS séparée ; styles “grille” minimaux fournis dans `components/booking/AvailabilityCalendar.tsx` (pour éviter un rendu “blanc”).
- **Page `/book`** : header cinématique, filtres, vue Grille / Liste

### 7.3 Dashboard & robustesse

- **APIs dashboard** : CRUD villas et résas côté serveur (Supabase service role, vérification session)
- **Undo** : suppression villa et résa avec délai 10 s et bouton « Annuler »
- **Statut Publié/Brouillon** : toggle sur la fiche villa, filtrage côté public (villas publiées uniquement)
- **Filtre** dans la liste : « Publiées » ou « Toutes »
- **UI propriétaire (2026-04-01)** : `app/dashboard/proprio/layout.tsx` + `components/dashboard/proprio/ui.tsx` — navigation sticky unifiée (`ProprioChrome`), intros de page (`ProprioPageIntro`), titres de section (`ProprioSectionHeading`) ; pages index, analytics, submissions, assistant et détail villa alignées sur le langage visuel luxe (navy, or, typo display).

### 7.4 Données & sync

- **Supabase** : tables `villas`, `bookings`, `tasks`, `admin_chat_logs` ; RLS multi-propriétaires
- **Import Airbnb** : création villa à partir d’une URL (détails + photos)
- **Sync iCal** : `node-ical`, gestion UIDs et annulations, cron horaire sur `/api/sync`
- **Fiche villa data-driven (2026-03-31)** : champs premium (équipements int/ext, services, conditions, check-in/out, map embed, etc.) + édition via dashboard propriétaire (migration SQL `supabase/migrations/20260331_01_villa_detail_premium_fields.sql`).

---

## 8. Variables d’environnement

Fichier modèle : `.env.local.example`. À copier en `.env.local`.

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Oui | Clé anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui (admin) | Clé service role (côté serveur uniquement) |
| `STRIPE_SECRET_KEY` | Optionnel | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | Optionnel | Secret webhook Stripe |
| `N8N_WEBHOOK_URL` / `CHAT_WEBHOOK_URL` | Optionnel | Webhook chatbot / assistant |
| `NEXT_PUBLIC_BASE_URL` | Optionnel | URL de base (ex. `http://localhost:3002`) |

---

## 9. Déploiement

- **Plateforme** : Vercel
- **Cron** (`vercel.json`) : `/api/sync` toutes les heures (`0 * * * *`)
- **Build** : `npm run build` — **Dev** : depuis le dossier `diamant-noir/`, `npm run dev` (port 3000 par défaut ; libérer le port ou purger `.next` si erreur 500). Vérification recommandée : HTTP 200 sur `/` après démarrage.

---

## 10. À faire (priorisation)

### Priorité haute

- [ ] Configurer les clés Stripe réelles dans `.env.local`
- [ ] Déployer et vérifier le cron Vercel pour la synchro iCal
- [ ] Finaliser le chatbot concierge public (réponses 24/7)

### Priorité moyenne

- [ ] Webhooks Stripe pour passer la résa en « Confirmé » après paiement
- [ ] Livret d’accueil digital par villa (page dédiée / QR code)
- [ ] Baseline PageSpeed Insights + fichier `MESURES_BASELINE.md` (règle perf Karibloom)
- [ ] Vérifier si `public/heroui.min.css` est encore nécessaire (chargement global dans `layout.tsx`)

### Pistes audit 2026-04-07

- [ ] CSP progressive en production ; rate limit ciblé sur `/api/contact` et `/api/chat` si besoin
- [ ] `generateMetadata` sur fiches villa pour partage social optimal

---

## 11. État d’avancement

| Domaine | État |
|---------|------|
| Frontend & UX | ✅ ~100 % |
| Assistant IA (Command Center) | ✅ ~95 % |
| Dashboard admin | ✅ ~100 % |
| Backend & sync | ✅ ~95 % |
| Mobile / responsive (passes 2026-04) | ✅ bonne couverture (dvh, safe area, blur maîtrisé) |
| Import Airbnb + équipements | ✅ normalisation + persistance labels import |

**Estimation globale : ~95 % du projet complété.**

---

## 12. Audit complet & règles (2026-04-07)

Un **audit technique multi-domaines** (stack, mobile, perf, SEO, sécurité, a11y, données) a été rédigé selon le pack **Karibloom Client Builder** et les règles racine du projet :

- **Document principal :** [`docs/audits/audit-complet-2026-04-07.md`](docs/audits/audit-complet-2026-04-07.md)  
- **Synthèse :** viewport et safe area OK ; APIs dashboard avec auth Bearer + contrôle `owner_id` ; en-têtes HTTP de base présents ; vigilance sur CSS HeroUI global et `backdrop-blur-xl` galerie ; pas de secrets en dur dans le code applicatif.

---

## 13. Traçabilité : journaux Cursor, « terminal Claude » et logs

| Emplacement | Rôle |
|-------------|------|
| **`docs/ACTIONS_LOG.md`** | Journal **global** append-only : chaque entrée peut porter `agent: cursor` ou `agent: claude`. |
| **`docs/logs/YYYY-MM-DD.md`** | Journal **de session** (détail du jour : correctifs, fichiers, vérifs). |
| **Sorties terminal** | Les **logs bruts de terminal ne sont pas versionnés** dans ce dépôt. Pour retrouver le travail d’une session **Claude Code**, utiliser les entrées **`agent: claude`** dans `ACTIONS_LOG.md` et le fichier `docs/logs/` du jour correspondant (ex. refonte mobile `text-[10px]`, heroes, captures Playwright — 2026-04-05). |
| **Prompts Claude Code** | `docs/superpowers/prompts/claude-code-*.md` (ex. n8n listing import, home gate, landing propriétaires). |

---

## 14. Chronologie récente des livraisons (résumé)

### 2026-04-05 — Claude Code (mobile, typo, screenshots)

- Heroes éditoriaux : hauteurs progressives sur petit mobile (éviter ~88vh trop haut).
- Remplacement global `text-[9px]` → `text-[10px]` sur ~13 fichiers (lisibilité / WCAG).
- Régénération captures `docs/screenshots/mobile-390px/` (Playwright).
- Détail dans `ACTIONS_LOG` (entrée `agent: claude`) + `docs/logs/2026-04-05.md`.

### 2026-04-06 — Cursor (éditeur villa, mobile, Builder)

- **Éditeur villa :** onglets Planning / Contenu / Réglages ; TOC + ancres + checklist publication ; registre réservations (filtres, CSV) ; sync iCal + `villa_ical_feeds` ; composants extraits `components/dashboard/villa-editor/`.
- **Import / équipements :** correction doublon extérieur, `getEquipmentDisplayLists`, icônes incontournables.
- **Mobile :** `overflow-x` global, `min-h-dvh`, assistant / messagerie / carte en `dvh`, navbar blur réservé à `md+`, fiche villa `pb-24` + barre réservation safe area, overlay menu sans blur mobile, `touch-action: manipulation`.
- **Builder :** sync pack `client-builder` → `CLIENT BUILDER KARIBLOOM/client-builder-rules/`, skill `mobile-responsive`, doc `kb-action-documentation`.
- **Docs :** `docs/logs/2026-04-06.md`.

### 2026-04-07 — Cursor (import prix, équipements, SQL)

- **Prix import :** alias n8n (`price`, `prix`…), `coerceNumber`, `amountMicros` / `qualifyingPrice` dans le parse HTML.
- **Équipements :** migration `amenities_import_labels`, `lib/amenity-import-normalize.ts`, grille suggestions + persistance marques Import/Perso, évolution UI dashboard (textarea / badges alignés sur données réelles).
- **Docs :** `docs/logs/2026-04-07.md`, entrées associées dans `ACTIONS_LOG.md`.

---

## 15. Session 2026-04-01 (historique dashboard)

| Thème | Détail |
|--------|--------|
| **Dashboard propriétaire** | Refonte « éditoriale / premium » : `ProprioChrome` (logo, liens portfolio / IA / stats / leads / nouvelle villa / déconnexion), `ProprioPageIntro` sur l’index et les sous-pages, cartes soumissions et tableau analytics harmonisés, assistant en palette navy/or (moins « terminal pur »), détail villa avec en-tête intro + sections sous filet or. |
| **Fichiers clés** | `components/dashboard/proprio/ui.tsx`, `app/dashboard/proprio/layout.tsx`, pages sous `app/dashboard/proprio/*`. |
| **Docs & règles** | Entrées `ACTIONS_LOG` + `docs/logs/2026-04-01.md`. |
| **Vérifs** | `npm run lint` / `npm run build` OK sur la livrée dashboard. |

---

**Dernière mise à jour :** 2026-04-07  
**Version :** 0.9.2 (audit complet + recap sessions + traçabilité journaux)
