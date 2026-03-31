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
│   │   ├── proprio/              # Dashboard propriétaire
│   │   │   ├── page.tsx          # Liste villas
│   │   │   ├── assistant/        # Assistant IA (Command Center)
│   │   │   └── [villaId]/        # Fiche villa (édition, résas)
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
| `/dashboard/proprio` | Liste des villas (filtre Publiées/Toutes, accès assistant + détail) |
| `/dashboard/proprio/new` | Création d’une nouvelle villa |
| `/dashboard/proprio/[villaId]` | Fiche villa : édition, réservations, statut Publié/Brouillon, suppression |
| `/dashboard/proprio/assistant` | Assistant IA admin (Command Center : chat + panneau visuel) |
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
- **Build** : `npm run build` — **Dev** : `npm run dev` (ou `npm run dev -- -p 3002` pour le port 3002)

---

## 10. À faire (priorisation)

### Priorité haute

- [ ] Configurer les clés Stripe réelles dans `.env.local`
- [ ] Déployer et vérifier le cron Vercel pour la synchro iCal
- [ ] Finaliser le chatbot concierge public (réponses 24/7)

### Priorité moyenne

- [ ] Webhooks Stripe pour passer la résa en « Confirmé » après paiement
- [ ] Livret d’accueil digital par villa (page dédiée / QR code)

---

## 11. État d’avancement

| Domaine | État |
|---------|------|
| Frontend & UX | ✅ ~100 % |
| Assistant IA (Command Center) | ✅ ~95 % |
| Dashboard admin | ✅ ~100 % |
| Backend & sync | ✅ ~95 % |

**Estimation globale : ~95 % du projet complété.**

---

**Dernière mise à jour :** 2026-03-31  
**Version :** 0.9.0 (UI unifiée Radix+Tailwind, Next 15/React 19)
