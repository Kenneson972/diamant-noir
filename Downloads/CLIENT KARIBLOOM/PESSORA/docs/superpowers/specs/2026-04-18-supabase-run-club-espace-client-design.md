# Design — Fondation Supabase + Événements + Bilan Bien-être + Espace Client PESSORA
**Date :** 2026-04-18  
**Statut :** Validé  
**Supabase project ID :** `tulhiipucrnyejheuitv`  
**Supabase URL :** `https://tulhiipucrnyejheuitv.supabase.co`

---

## Contexte

PESSORA est un bar protéiné & bien-être en Martinique (C.C. La Véranda, Fort-de-France). Le site existe (React 19 / Vite / TypeScript / HeroUI v3 / Tailwind v4) avec un espace membre dont toutes les données sont mockées et un backend Express + SQLite minimal (6 routes, 4 tables).

**Décision architecturale :** migrer vers Supabase (PostgreSQL + Auth + Storage) et supprimer le backend Express.

**Périmètre validé :**
- Page `/evenements` refaite (liste visuelle avec cards image/infos)
- Page `/evenements/[slug]` (détail + formulaire d'inscription remplace Google Forms)
- Page `/bilan-bien-etre` (booking 30min avec calendrier HeroUI + créneaux Supabase)
- Admin amélioré (gestion événements, inscriptions, créneaux bilan)
- Espace client avec vraies données (phase suivante)

---

## Stack cible

| Couche | Technologie |
|---|---|
| Frontend | React 19 / Vite / TypeScript / HeroUI v3 / Tailwind v4 |
| Base de données | Supabase PostgreSQL |
| Auth | Supabase Auth (remplace JWT Express) |
| Storage | Supabase Storage (photos événements, avatars) |
| Client SDK | `@supabase/supabase-js` |
| Backend | **Supprimé** (Express + SQLite retirés) |
| Calendrier | HeroUI Calendar component |
| Email futur | Resend |
| SMS/WhatsApp futur | Twilio |
| Google Calendar futur | Google Calendar API (Phase 6) |
| Paiement futur | Stripe |

---

## Schéma Supabase — 12 tables

### Groupe 1 : Identité & Auth

```sql
-- Profils utilisateurs (lié à auth.users via id = auth.uid())
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name  text,
  last_name   text,
  phone       text,
  avatar_url  text,
  role        text DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Abonnements membres
CREATE TABLE subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  plan                    text DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'premium', 'vip')),
  status                  text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date              date DEFAULT CURRENT_DATE,
  end_date                date,
  auto_renew              boolean DEFAULT true,
  price                   numeric(10,2) DEFAULT 0,
  stripe_subscription_id  text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);
```

### Groupe 2 : Événements

```sql
-- Événements (remplace la page /evenements statique)
CREATE TABLE events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  slug        text UNIQUE NOT NULL,        -- ex: "run-club-23-avril"
  date        date NOT NULL,
  heure       time,
  location    text,
  type        text DEFAULT 'event' CHECK (type IN ('run_club', 'popup', 'atelier', 'event')),
  description text,
  image_url   text,
  places_max  integer,
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Inscriptions événements (guest ET membre connecté)
CREATE TABLE event_registrations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES profiles(id),    -- NULL si guest
  nom           text NOT NULL,
  prenom        text NOT NULL,
  telephone     text NOT NULL,                   -- WhatsApp de préférence
  nb_personnes  text DEFAULT 'Je viens seul',
  souhait_info  text DEFAULT 'Non merci',
  created_at    timestamptz DEFAULT now(),
  UNIQUE (event_id, telephone)                   -- anti-doublon DB level
);
```

### Groupe 3 : Bilan Bien-être

```sql
-- Créneaux disponibles (gérés par l'admin)
CREATE TABLE bilan_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date        date NOT NULL,
  heure       time NOT NULL,
  disponible  boolean DEFAULT true,
  UNIQUE (date, heure)
);

-- Réservations Bilan Bien-être (guest ET membre connecté)
CREATE TABLE bilan_bookings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id     uuid REFERENCES bilan_slots(id) ON DELETE SET NULL,
  user_id     uuid REFERENCES profiles(id),      -- NULL si guest
  nom         text NOT NULL,
  prenom      text NOT NULL,
  telephone   text NOT NULL,
  email       text,
  date_rdv    date NOT NULL,
  heure_rdv   time NOT NULL,
  statut      text DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirme', 'annule')),
  notes       text,
  created_at  timestamptz DEFAULT now()
);
```

### Groupe 4 : Catalogue & Commerce

```sql
CREATE TABLE products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text NOT NULL,
  price       numeric(10,2),
  calories    integer,
  protein     numeric(5,1),
  description text,
  ingredients text[],
  benefits    text[],
  image_url   text,
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  total       numeric(10,2) NOT NULL,
  status      text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id      uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name    text NOT NULL,
  quantity        integer DEFAULT 1,
  price_at_time   numeric(10,2) NOT NULL
);

CREATE TABLE favorites (
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
```

### Groupe 5 : Engagement

```sql
CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type        text DEFAULT 'info' CHECK (type IN ('info', 'promo', 'reminder', 'event')),
  message     text NOT NULL,
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);
```

---

## Row Level Security (RLS)

| Table | INSERT | SELECT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | trigger auth | own row | own row | — |
| `subscriptions` | trigger auth | own row | admin | — |
| `events` | admin | public | admin | admin |
| `event_registrations` | public anon | admin | — | — |
| `bilan_slots` | admin | public | admin | admin |
| `bilan_bookings` | public anon | admin + own | admin | — |
| `products` | admin | public | admin | admin |
| `orders` | authenticated | own rows | — | — |
| `order_items` | authenticated | own via order | — | — |
| `favorites` | authenticated | own rows | — | authenticated |
| `notifications` | admin/trigger | own rows | own (mark read) | — |

**Trigger automatique :** création compte Supabase Auth → INSERT dans `profiles` + INSERT dans `subscriptions` (plan free).

---

## Migration Auth (Express → Supabase Auth)

| Avant | Après |
|---|---|
| `POST /api/auth/login` → JWT 7j localStorage | `supabase.auth.signInWithPassword()` |
| `POST /api/auth/register` | `supabase.auth.signUp()` |
| `GET /api/auth/me` | `supabase.auth.onAuthStateChange()` |
| Token en localStorage (XSS-vulnerable) | Géré par Supabase SDK |

**Fichiers modifiés :**
- `src/lib/supabaseClient.ts` — nouveau (remplace `apiClient.ts`)
- `src/contexts/AuthContext.tsx` — réécrit pour Supabase
- `src/pages/auth/Login.tsx` — appel Supabase
- `src/pages/auth/Register.tsx` — appel Supabase
- `src/components/DemoAuthWrapper.tsx` — compte demo dans Supabase Auth
- `server/` — **supprimé entièrement**
- `vite.config.ts` — suppression proxy `/api`

---

## Page `/evenements` (liste)

**Layout :** alternance image gauche / infos droite pour les événements à venir (style inspiration fourni). Pour chaque événement :
- Photo grande format
- Badge type (Run Club / Pop-up / Atelier / Événement)
- Titre, date, lieu
- Description courte
- Compteur d'inscrits (avatars + "+X autres")
- Bouton "Je m'inscris" → `/evenements/[slug]`

**CTA Bilan Bien-être :** bannière pleine largeur entre la liste et le footer :
> *"Tu viens pour transpirer ? Commence par comprendre ton corps."*
> **Prendre mon Bilan Bien-être gratuit →** (lien vers `/bilan-bien-etre`)

**Si aucun événement actif :** message d'état vide + lien Instagram.

---

## Page `/evenements/[slug]`

**Layout :**
- Photo hero pleine largeur
- Badge type + titre + date + heure + lieu
- Description complète
- Compteur places restantes (places_max - nb inscrits)
- **Formulaire d'inscription** (5 champs) :
  - Nom* / Prénom* / Téléphone* (WhatsApp)
  - Combien de personnes ? (select: Je viens seul / +1 / +2 / +3 ou plus)
  - Souhaites-tu rester informé(e) ? (radio)
  - Bouton "Je m'inscris"
- Confirmation on-screen après succès
- Anti-doublon : message doux si téléphone déjà inscrit à cet événement
- Si connecté : prénom/nom/téléphone pré-remplis depuis `profiles`

---

## Page `/bilan-bien-etre`

**Layout :**
1. **Hero** : "Bilan Bien-être Gratuit · 30 minutes pour tout changer"
2. **4 blocs programme** : Analyse corporelle · Nutrition · Skincare · Challenge 21 jours
3. **Calendrier HeroUI** : dates disponibles depuis `bilan_slots` (dates avec `disponible = true`)
4. **Sélection créneau** : horaires disponibles pour la date choisie
5. **Formulaire** : Nom*, Prénom*, Téléphone*, Email (optionnel), Notes (optionnel)
6. **Confirmation** : "Réservation reçue ! L'équipe vous confirme par WhatsApp sous 24h."
7. **CTA secondaire** : lien vers `/evenements` ("Voir aussi nos événements")

**Google Calendar :** Phase 6 (branché via API Google Calendar pour sync automatique).  
**Phase 1 :** créneaux gérés manuellement dans `bilan_slots` depuis l'Admin.

---

## Admin amélioré

### Section Événements
- Liste complète avec statut (actif/inactif)
- Create / Edit / Delete
- Upload photo → Supabase Storage
- Gestion des places max
- Génération automatique du slug depuis le titre

### Section Inscriptions
- Tableau par événement : nom, prénom, téléphone, nb personnes, opt-in, date inscription
- Export CSV

### Section Bilan Bien-être
- Liste des réservations (nom, date, heure, statut)
- Changer statut : en_attente → confirmé / annulé
- Ajouter / supprimer des créneaux (interface calendrier)

---

## Phases d'implémentation

| Phase | Contenu | Session |
|---|---|---|
| **1** | Schéma Supabase (migrations) + `supabaseClient.ts` + `.env` | Aujourd'hui |
| **2** | Migration Auth (AuthContext + Login + Register) + suppression Express | Aujourd'hui |
| **3** | Page `/evenements` liste + page `/evenements/[slug]` + formulaire inscription | Aujourd'hui |
| **4** | Page `/bilan-bien-etre` + calendrier HeroUI + réservation | Aujourd'hui |
| **5** | Admin amélioré (événements CRUD + inscriptions + créneaux bilan) | Session suivante |
| **6** | Espace client avec vraies données (dashboard, profil, historique) | Session suivante |
| **7** | Google Calendar + Resend + Twilio | Session dédiée |
| **8** | Stripe + E-commerce | Session dédiée |

---

## Variables d'environnement

```env
VITE_SUPABASE_URL=https://tulhiipucrnyejheuitv.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_kkMncNOyaVGTzr2GWzCSUw_lEmAONgP
```

---

## Ce qui est supprimé

- `server/` — tout le dossier (Express, SQLite, routes, db.js, uploads/)
- `src/lib/apiClient.ts` — remplacé par `supabaseClient.ts`
- Proxy `/api` dans `vite.config.ts`
- Variables `VITE_API_URL`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`
- Page `/run-club` — absorbée dans le système d'événements (`type: 'run_club'`)
