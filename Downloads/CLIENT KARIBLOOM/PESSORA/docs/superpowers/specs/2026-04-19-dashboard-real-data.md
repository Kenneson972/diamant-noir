# Spec — Dashboard Client & Admin (vraies données)

**Date :** 2026-04-19
**Branche :** feat/supabase-events-bilan

---

## Contexte

Le dashboard membre actuel affiche des données entièrement fictives (KPIs hardcodés, commandes fake, événements fake). Aucun dashboard admin n'existe. L'objectif est de brancher toutes les pages sur Supabase avec de vraies données et de créer un admin complet.

---

## 1. Schéma Supabase — nouvelles tables

### `events` — mise à jour de la table existante

```sql
ALTER TABLE public.events
  ALTER COLUMN date TYPE timestamptz USING date::timestamptz,
  ADD COLUMN end_date timestamptz,
  ADD COLUMN meeting_point text,
  ADD COLUMN capacity int,          -- null = illimité
  ADD COLUMN price numeric(10,2) DEFAULT 0,
  ADD COLUMN is_free boolean DEFAULT true,
  ADD COLUMN registration_open boolean DEFAULT true;

-- Étendre le CHECK sur type
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_type_check,
  ADD CONSTRAINT events_type_check
    CHECK (type IN ('popup', 'run-club', 'bilan', 'partenariat', 'atelier'));
```

### `orders` — Stripe-ready

```sql
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  total numeric(10,2) NOT NULL DEFAULT 0,
  stripe_payment_intent_id text,
  stripe_session_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own orders"
  ON public.orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins read all orders"
  ON public.orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins update orders"
  ON public.orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
```

### `order_items`

```sql
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,   -- snapshot au moment de la commande
  product_price numeric(10,2) NOT NULL,
  quantity int NOT NULL DEFAULT 1
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own order items"
  ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));

CREATE POLICY "Admins read all order items"
  ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
```

### `event_registrations` — miroir du Google Form Pessóra

Champs issus du formulaire : https://forms.gle/4BtREyytV9PW4isGA

```sql
CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- nullable = invité
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,           -- WhatsApp de préférence
  group_size int NOT NULL DEFAULT 1, -- 1=seul, 2=+1, 3=+2, 4=+3 ou plus
  newsletter_consent text NOT NULL DEFAULT 'none'
    CHECK (newsletter_consent IN ('all', 'none')),
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  registered_at timestamptz DEFAULT now(),
  UNIQUE (user_id, event_id) -- pas de double inscription pour les membres connectés
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own registrations"
  ON public.event_registrations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own registration"
  ON public.event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users cancel own registration"
  ON public.event_registrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all registrations"
  ON public.event_registrations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
```

### `profiles` — colonne preferences

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{"notifications": true, "newsletter": true}'::jsonb;
```

---

## 2. Hooks Supabase (src/hooks/)

| Hook | Données retournées |
|------|-------------------|
| `useOrders()` | orders + order_items du membre connecté, triés par date DESC |
| `useUpcomingEvents()` | event_registrations join events où date > now(), triés par date ASC, limite 5 |
| `useDashboardStats()` | count inscriptions ce trimestre, count bilans, abonnement courant |
| `useAdminMembers()` | tous les profiles join subscriptions, admin only |
| `useAdminEventRegistrations(eventId)` | inscrits d'un événement spécifique, admin only |

---

## 3. Dashboard Client — pages mises à jour

### `Dashboard.tsx`
- **KPI Événements** → `count(event_registrations)` confirmed ce trimestre
- **KPI Bilans** → count des registrations type `bilan` confirmed
- **KPI Abonnement** → `subscription.plan` réel
- **Prochains événements** → `useUpcomingEvents()`, 3 premières
- **Commander à nouveau** → `products` réels depuis Supabase (catégorie shakes + gauffres)
- Suppression de toutes les valeurs hardcodées

### `History.tsx`
- Liste depuis `useOrders()` — ordres réels + items
- Sidebar calculée dynamiquement (total du mois courant, count, moyenne)
- Favoris → produit le plus commandé via `order_items` GROUP BY product_name
- État vide élégant si aucune commande

### `Subscription.tsx`
- Plan + status + dates depuis `subscription` (Supabase)
- Prix depuis `subscription.price`
- Bouton "Gérer mon abonnement" → placeholder en attente intégration Stripe Pessóra
- ⏸️ **Stripe en attente** — à connecter avec la team Pessóra

### `Profile.tsx`
- "Membre depuis" → `user.createdAt` formaté en français
- Bouton "Sauvegarder" → `updateProfile()` (déjà dans AuthContext)
- Toggles préférences → lire/écrire `profiles.preferences` (jsonb)

---

## 4. Formulaire d'inscription événement

Remplace le Google Form actuel. Disponible sur chaque page événement (`/evenements/:id`).

**Champs — miroir exact du Google Form :**
1. Prénom (pré-rempli si connecté)
2. Nom (pré-rempli si connecté)
3. Téléphone WhatsApp (pré-rempli si connecté)
4. Combien de personnes → radio : Seul / +1 / +2 / +3 ou plus
5. Rester informé → radio : Oui (tout) / Oui (Run Club seulement) / Non merci

**Comportement :**
- Membre connecté → champs 1-3 pré-remplis depuis `user`, désactivés mais éditables
- Visiteur → tous les champs visibles et obligatoires
- Submit → INSERT dans `event_registrations` + feedback visuel de confirmation
- Si déjà inscrit → affiche le statut + bouton "Annuler mon inscription"
- Si `registration_open = false` → formulaire désactivé, message "Inscriptions fermées"
- Si capacité atteinte → message "Complet"

---

## 5. Dashboard Admin (nouvelles pages)

### Layout
- Route protégée `/admin/*` — redirect vers `/` si `user.role !== 'admin'`
- Sidebar compacte dédiée, séparée du layout membre
- Fond `bg-surface-page`, navigation sobre

### `/admin` — Vue d'ensemble
- Membres actifs total, nouvelles inscriptions ce mois
- Prochain événement + places restantes (capacity - count inscrits)
- Commandes en attente (status = 'pending')

### `/admin/membres`
- Table : nom, email, plan, statut abonnement, date inscription
- Filtre par plan (free/starter/premium/vip) et statut (active/expired/cancelled)
- Clic sur un membre → drawer latéral avec profil complet + historique des commandes

### `/admin/evenements`
- Liste des événements avec badge type, date, `inscrits / capacity`
- Toggle `registration_open` directement depuis la liste
- Créer / modifier / supprimer → formulaire complet (tous les champs de la table `events`)
- Sur chaque événement → liste des inscrits : nom, téléphone, groupe, newsletter consent
- Export CSV des inscrits

### `/admin/produits`
- Liste : nom, catégorie, prix, calories, protéines, image_url
- Créer / modifier / supprimer → formulaire simple
- Modifications visibles immédiatement sur le menu public (`/menu`)

---

## 6. Ce qui ne change pas

- Auth flow (AuthContext) — déjà fonctionnel
- Pages publiques (Home, Menu, Événements, Bilan) — non touchées
- Design system (tokens OKLCH, Bodoni Moda, Jost) — inchangé
- Stripe — ⏸️ en attente, intégration future avec la team Pessóra

---

## Ordre d'implémentation

1. Migration SQL (nouvelles tables + ALTER events)
2. Types TypeScript mis à jour (`src/types/database.ts`)
3. Hooks Supabase (`src/hooks/`)
4. Pages client mises à jour (Dashboard → History → Profile)
5. Formulaire d'inscription événement
6. Layout + pages admin
7. Protection de route admin
