# Design — Fondation Supabase + Run Club + Espace Client PESSORA
**Date :** 2026-04-18  
**Statut :** Validé  
**Supabase project ID :** `tulhiipucrnyejheuitv`  
**Supabase URL :** `https://tulhiipucrnyejheuitv.supabase.co`

---

## Contexte

PESSORA est un bar protéiné & bien-être en Martinique (C.C. La Véranda, Fort-de-France). Le site existe (React 19 / Vite / TypeScript / HeroUI v3 / Tailwind v4) avec un espace membre dont toutes les données sont mockées et un backend Express + SQLite minimal (6 routes, 4 tables).

**Décision architecturale :** migrer vers Supabase (PostgreSQL + Auth + Storage) et supprimer le backend Express. Le projet a besoin d'une vraie fondation data pour :
- Le Run Club (chaque mercredi, inscriptions via Google Forms → à remplacer)
- L'espace client complet (dashboard réel, profil, historique, abonnement)
- L'e-commerce futur (Stripe, commandes)

---

## Stack cible

| Couche | Technologie |
|---|---|
| Frontend | React 19 / Vite / TypeScript / HeroUI v3 / Tailwind v4 |
| Base de données | Supabase PostgreSQL |
| Auth | Supabase Auth (remplace JWT Express) |
| Storage | Supabase Storage (avatars, photos) |
| Client SDK | `@supabase/supabase-js` |
| Backend | **Supprimé** (Express + SQLite retirés) |
| Email futur | Resend |
| SMS/WhatsApp futur | Twilio |
| Paiement futur | Stripe |

---

## Schéma Supabase — 10 tables

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

### Groupe 2 : Run Club

```sql
-- Sessions Run Club (1 par mercredi)
CREATE TABLE run_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date            date NOT NULL,
  heure_debut     time DEFAULT '18:30',
  heure_fin       time DEFAULT '20:00',
  lieu            text DEFAULT 'PESSORA — C.C. La Véranda, Fort-de-France',
  places_max      integer DEFAULT 50,
  statut          text DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'complet', 'annule')),
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- Inscriptions Run Club (public, sans compte)
CREATE TABLE run_registrations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid REFERENCES run_sessions(id) ON DELETE CASCADE,
  nom           text NOT NULL,
  prenom        text NOT NULL,
  telephone     text NOT NULL,
  nb_personnes  text DEFAULT 'Je viens seul',
  souhait_info  text DEFAULT 'Non merci',
  created_at    timestamptz DEFAULT now(),
  UNIQUE (session_id, telephone)  -- anti-doublon DB level
);
```

### Groupe 3 : Catalogue & Commerce

```sql
-- Produits (remplace menuData.ts statique à terme)
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

-- Commandes
CREATE TABLE orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  total       numeric(10,2) NOT NULL,
  status      text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at  timestamptz DEFAULT now()
);

-- Lignes de commande
CREATE TABLE order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id      uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name    text NOT NULL,
  quantity        integer DEFAULT 1,
  price_at_time   numeric(10,2) NOT NULL
);

-- Favoris
CREATE TABLE favorites (
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
```

### Groupe 4 : Engagement

```sql
-- Notifications membres
CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type        text DEFAULT 'info' CHECK (type IN ('info', 'promo', 'reminder', 'event')),
  message     text NOT NULL,
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- Événements (pop-ups, ateliers, etc.)
CREATE TABLE events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  date        date,
  location    text,
  type        text DEFAULT 'event' CHECK (type IN ('popup', 'event', 'atelier')),
  description text,
  image_url   text,
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
```

---

## Row Level Security (RLS)

| Table | INSERT | SELECT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | auth trigger | own row | own row | — |
| `subscriptions` | auth trigger | own row | admin | — |
| `run_sessions` | admin | public | admin | admin |
| `run_registrations` | public (anon) | admin | — | — |
| `products` | admin | public | admin | admin |
| `orders` | authenticated | own rows | — | — |
| `order_items` | authenticated | own via order | — | — |
| `favorites` | authenticated | own rows | — | authenticated |
| `notifications` | admin/trigger | own rows | own (mark read) | — |
| `events` | admin | public | admin | admin |

**Trigger automatique :** à la création d'un compte Supabase Auth → INSERT dans `profiles` + INSERT dans `subscriptions` (plan free).

---

## Migration Auth

### Avant (Express JWT)
- `POST /api/auth/login` → JWT 7j en localStorage
- `POST /api/auth/register` → même
- `GET /api/auth/me` → hydrate le contexte

### Après (Supabase Auth)
- `supabase.auth.signInWithPassword({ email, password })`
- `supabase.auth.signUp({ email, password, options: { data: { first_name, last_name, phone } } })`
- `supabase.auth.onAuthStateChange()` → hydrate le contexte
- Token géré automatiquement par Supabase (httpOnly cookie ou localStorage selon config)

### Fichiers modifiés
- `src/lib/supabaseClient.ts` — nouveau (remplace `apiClient.ts` pour l'auth)
- `src/contexts/AuthContext.tsx` — réécrit pour Supabase
- `src/pages/auth/Login.tsx` — appel Supabase au lieu de `api.post('/auth/login')`
- `src/pages/auth/Register.tsx` — pareil
- `src/components/DemoAuthWrapper.tsx` — compte demo dans Supabase Auth
- `server/` — **supprimé entièrement**

---

## Page publique Run Club (`/run-club`)

### Sections (dans l'ordre)
1. **Hero** : fond sombre, typographie massive "RUN CLUB", tagline "Viens courir avec nous", photo du flyer
2. **Prochain Run** : card avec date calculée (prochain mercredi), 18h30→20h, adresse, infos pratiques (gilet réfléchissant, baskets, motivation obligatoire)
3. **Le Concept** : 4 blocs — Coach sportif · Shakes & Gauffres · Dépassement de soi · Communauté
4. **Formulaire d'inscription** : les 5 champs du Google Form original
   - Nom* (text)
   - Prénom* (text)
   - Téléphone* (text, note WhatsApp)
   - Combien de personnes ? (select: Je viens seul / +1 / +2 / +3 ou plus)
   - Souhaites-tu rester informé(e) ? (radio: Oui avec plaisir / Oui Run Club seulement / Non merci)
   - Bouton "Je m'inscris" → INSERT dans `run_registrations` via SDK anon
   - Confirmation on-screen après succès
5. **Lien WhatsApp Channel** : bouton secondaire vers le canal WhatsApp PESSORA

### Logique métier
- La session affichée = prochain enregistrement dans `run_sessions` avec `statut = 'ouvert'` et `date >= today`
- Si aucune session → message "Prochain Run Club bientôt annoncé"
- Anti-doublon : vérification téléphone + session_id avant INSERT (message d'erreur doux)

### Fichiers créés/modifiés
- `src/pages/RunClub.tsx` — nouvelle page
- `src/data/infoData.ts` — ajout `runClubInfo`
- `src/App.tsx` — route `/run-club`
- `src/components/layout/Header.tsx` — lien "Run Club" dans la nav

---

## Espace Client avec vraies données (Phase 4)

### Dashboard
- Stats réelles : `orders` (total mois, panier moyen), `order_items` (produit favori), streak calculé
- Prochain Run Club : `run_sessions` prochaine session ouverte
- Notifications : `notifications` où `user_id = auth.uid()`
- Objectifs Wellness : profil utilisateur (à stocker dans `profiles` avec champ `wellness_goals jsonb`)

### Profile
- Formulaire connecté : `supabase.from('profiles').update({...}).eq('id', user.id)`
- Upload avatar : `supabase.storage.from('avatars').upload()`
- Changement mot de passe : `supabase.auth.updateUser({ password: newPassword })`

### Historique
- Vraies commandes : `supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id)`

### Run Club dans l'espace membre
- Mes inscriptions : `supabase.from('run_registrations').select('*, run_sessions(*)').eq('telephone', user.phone)`

---

## Phases d'implémentation

| Phase | Contenu | Session |
|---|---|---|
| **1** | Schéma Supabase (migrations SQL) + SDK client (`supabaseClient.ts`) + variables `.env` | Aujourd'hui |
| **2** | Migration Auth (AuthContext + Login + Register + DemoAuthWrapper) + suppression Express | Aujourd'hui |
| **3** | Page Run Club publique (`/run-club`) + route + nav | Aujourd'hui |
| **4** | Espace client avec vraies données (Dashboard, Profile, History, Run Club membre) | Session suivante |
| **5** | Stripe + E-commerce | Session dédiée |

---

## Variables d'environnement à ajouter

```env
VITE_SUPABASE_URL=https://tulhiipucrnyejheuitv.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_kkMncNOyaVGTzr2GWzCSUw_lEmAONgP
```

---

## Ce qui est supprimé

- `server/` — tout le dossier (Express, SQLite, routes, db.js)
- `src/lib/apiClient.ts` — remplacé par `supabaseClient.ts`
- Variables `VITE_API_URL`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`
- `vite.config.ts` proxy `/api`
