# Supabase + Événements + Bilan Bien-être — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer PESSORA vers Supabase (suppression Express), créer le système d'événements avec inscription et la page Bilan Bien-être avec réservation de créneaux.

**Architecture:** Le frontend React appelle directement Supabase via SDK (zéro backend Express). L'AuthContext est réécrit pour Supabase Auth. Deux nouvelles pages publiques : `/evenements` (liste) + `/evenements/:slug` (détail + formulaire) + `/bilan-bien-etre` (booking).

**Tech Stack:** React 19, TypeScript, HeroUI v3, Tailwind v4, @supabase/supabase-js, react-hook-form, zod, @internationalized/date

**Supabase project:** `tulhiipucrnyejheuitv` — `https://tulhiipucrnyejheuitv.supabase.co`

---

## Fichiers — Carte complète

### Créés
| Fichier | Rôle |
|---|---|
| `src/lib/supabaseClient.ts` | Client Supabase singleton typé |
| `src/types/database.ts` | Types TypeScript pour toutes les tables |
| `src/pages/EvenementDetail.tsx` | Page détail événement + formulaire d'inscription |
| `src/pages/BilanBienEtre.tsx` | Page booking bilan (calendrier + créneaux + form) |

### Réécrits
| Fichier | Changement |
|---|---|
| `src/contexts/AuthContext.tsx` | Supabase Auth remplace JWT Express |
| `src/pages/Evenements.tsx` | Fetch Supabase + nouveau layout cards |

### Modifiés
| Fichier | Changement |
|---|---|
| `src/App.tsx` | +route `/evenements/:slug`, +route `/bilan-bien-etre` |
| `src/components/layout/Header.tsx` | +lien "Bilan Bien-être" dans la nav |
| `src/components/member/MemberLayout.tsx` | logout async |
| `src/components/DemoAuthWrapper.tsx` | compte demo Supabase |
| `vite.config.ts` | suppression proxy `/api` |
| `.env` | variables Supabase |
| `package.json` | +@supabase/supabase-js, +@internationalized/date |

### Supprimés
- `server/` (tout le dossier Express + SQLite)
- `src/lib/apiClient.ts`

---

## Task 1 — Installer les dépendances + configurer l'environnement

**Files:**
- Modify: `package.json`
- Modify: `.env`
- Modify: `vite.config.ts`

- [ ] **Step 1: Installer les packages**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
npm install @supabase/supabase-js @internationalized/date
```

Expected: `added X packages` sans erreur.

- [ ] **Step 2: Mettre à jour .env**

Ouvrir `.env` et remplacer tout le contenu par :

```env
VITE_SUPABASE_URL=https://tulhiipucrnyejheuitv.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_kkMncNOyaVGTzr2GWzCSUw_lEmAONgP
VITE_PESSOBOT_WEBHOOK_URL=
```

- [ ] **Step 3: Supprimer le proxy `/api` dans vite.config.ts**

Remplacer `vite.config.ts` par :

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-ui': ['lucide-react', '@heroui/react'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 3000,
    open: true,
  },
})
```

- [ ] **Step 4: Vérifier que le projet compile**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
npm run build 2>&1 | tail -20
```

Expected: build réussi (des erreurs TypeScript sur apiClient sont attendues — elles seront réglées à Task 3).

- [ ] **Step 5: Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
git add package.json package-lock.json .env vite.config.ts
git commit -m "feat: add supabase deps, remove api proxy"
```

---

## Task 2 — Créer le client Supabase + les types TypeScript

**Files:**
- Create: `src/lib/supabaseClient.ts`
- Create: `src/types/database.ts`

- [ ] **Step 1: Créer `src/types/database.ts`**

```typescript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          role: 'member' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'free' | 'starter' | 'premium' | 'vip'
          status: 'active' | 'expired' | 'cancelled'
          start_date: string
          end_date: string | null
          auto_renew: boolean
          price: number
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>>
      }
      events: {
        Row: {
          id: string
          title: string
          slug: string
          date: string
          heure: string | null
          location: string | null
          type: 'run_club' | 'popup' | 'atelier' | 'event'
          description: string | null
          image_url: string | null
          places_max: number | null
          active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>>
      }
      event_registrations: {
        Row: {
          id: string
          event_id: string
          user_id: string | null
          nom: string
          prenom: string
          telephone: string
          nb_personnes: string
          souhait_info: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['event_registrations']['Row'], 'id' | 'created_at'>
        Update: never
      }
      bilan_slots: {
        Row: {
          id: string
          date: string
          heure: string
          disponible: boolean
        }
        Insert: Omit<Database['public']['Tables']['bilan_slots']['Row'], 'id'>
        Update: Partial<Omit<Database['public']['Tables']['bilan_slots']['Row'], 'id'>>
      }
      bilan_bookings: {
        Row: {
          id: string
          slot_id: string | null
          user_id: string | null
          nom: string
          prenom: string
          telephone: string
          email: string | null
          date_rdv: string
          heure_rdv: string
          statut: 'en_attente' | 'confirme' | 'annule'
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bilan_bookings']['Row'], 'id' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['bilan_bookings']['Row'], 'statut' | 'notes'>>
      }
    }
  }
}

export type Event = Database['public']['Tables']['events']['Row']
export type EventRegistration = Database['public']['Tables']['event_registrations']['Row']
export type BilanSlot = Database['public']['Tables']['bilan_slots']['Row']
export type BilanBooking = Database['public']['Tables']['bilan_bookings']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
```

- [ ] **Step 2: Créer `src/lib/supabaseClient.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont requis dans .env')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 3: Vérifier qu'il n'y a pas d'erreur TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
npx tsc --noEmit 2>&1 | grep -E "supabaseClient|database" | head -10
```

Expected: aucune erreur sur ces 2 fichiers.

- [ ] **Step 4: Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
git add src/lib/supabaseClient.ts src/types/database.ts
git commit -m "feat: add supabase client + database types"
```

---

## Task 3 — Appliquer les migrations Supabase

**Action:** Créer les 11 tables + RLS + trigger dans Supabase via le MCP.

- [ ] **Step 1: Appliquer la migration — tables principales**

Via Supabase MCP (`mcp__claude_ai_Supabase__apply_migration`), appliquer ce SQL sur le projet `tulhiipucrnyejheuitv` :

```sql
-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name  text,
  last_name   text,
  phone       text,
  avatar_url  text,
  role        text DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
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

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  slug        text UNIQUE NOT NULL,
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

-- EVENT REGISTRATIONS
CREATE TABLE IF NOT EXISTS event_registrations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  nom           text NOT NULL,
  prenom        text NOT NULL,
  telephone     text NOT NULL,
  nb_personnes  text DEFAULT 'Je viens seul',
  souhait_info  text DEFAULT 'Non merci',
  created_at    timestamptz DEFAULT now(),
  UNIQUE (event_id, telephone)
);

-- BILAN SLOTS
CREATE TABLE IF NOT EXISTS bilan_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date        date NOT NULL,
  heure       time NOT NULL,
  disponible  boolean DEFAULT true,
  UNIQUE (date, heure)
);

-- BILAN BOOKINGS
CREATE TABLE IF NOT EXISTS bilan_bookings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id     uuid REFERENCES bilan_slots(id) ON DELETE SET NULL,
  user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
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

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
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

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  total       numeric(10,2) NOT NULL,
  status      text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at  timestamptz DEFAULT now()
);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id      uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name    text NOT NULL,
  quantity        integer DEFAULT 1,
  price_at_time   numeric(10,2) NOT NULL
);

-- FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type        text DEFAULT 'info' CHECK (type IN ('info', 'promo', 'reminder', 'event')),
  message     text NOT NULL,
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);
```

- [ ] **Step 2: Appliquer RLS + trigger (même projet)**

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bilan_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bilan_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- SUBSCRIPTIONS
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- EVENTS (lecture publique)
CREATE POLICY "events_select_public" ON events FOR SELECT USING (active = true);
CREATE POLICY "events_all_admin" ON events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- EVENT REGISTRATIONS (insert public, lecture admin)
CREATE POLICY "event_reg_insert_public" ON event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "event_reg_select_admin" ON event_registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- BILAN SLOTS (lecture publique)
CREATE POLICY "bilan_slots_select_public" ON bilan_slots FOR SELECT USING (true);
CREATE POLICY "bilan_slots_all_admin" ON bilan_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- BILAN BOOKINGS (insert public, lecture admin)
CREATE POLICY "bilan_bookings_insert_public" ON bilan_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bilan_bookings_select_admin" ON bilan_bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PRODUCTS (lecture publique)
CREATE POLICY "products_select_public" ON products FOR SELECT USING (active = true);
CREATE POLICY "products_all_admin" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ORDERS
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ORDER ITEMS
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
);

-- FAVORITES
CREATE POLICY "favorites_select_own" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_all_own" ON favorites FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- TRIGGER : création automatique profile + subscription à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

- [ ] **Step 3: Créer le compte demo dans Supabase Auth**

Dans le dashboard Supabase (`https://supabase.com/dashboard/project/tulhiipucrnyejheuitv/auth/users`), créer manuellement l'utilisateur :
- Email : `demo@pessora.mq`
- Password : `demo123`
- Confirm email : oui (bypass confirmation)

Puis dans SQL Editor, définir son rôle admin :
```sql
UPDATE profiles SET role = 'admin' WHERE id = (
  SELECT id FROM auth.users WHERE email = 'demo@pessora.mq'
);
```

- [ ] **Step 4: Vérifier les tables dans Supabase**

Dans le dashboard Supabase → Table Editor, vérifier que les 11 tables sont présentes : `profiles`, `subscriptions`, `events`, `event_registrations`, `bilan_slots`, `bilan_bookings`, `products`, `orders`, `order_items`, `favorites`, `notifications`.

---

## Task 4 — Réécrire AuthContext avec Supabase Auth

**Files:**
- Rewrite: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: Remplacer entièrement `src/contexts/AuthContext.tsx`**

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile, Subscription } from '../types/database';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role?: 'member' | 'admin';
  createdAt: string;
}

export interface SubscriptionData {
  id: string;
  plan: 'free' | 'starter' | 'premium' | 'vip';
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  price: number;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  subscription: SubscriptionData | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateSubscription: (planId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapProfile(profile: Profile, email: string): User {
  return {
    id: profile.id,
    email,
    firstName: profile.first_name ?? '',
    lastName: profile.last_name ?? '',
    phone: profile.phone ?? undefined,
    avatar: profile.avatar_url ?? undefined,
    role: profile.role as User['role'],
    createdAt: profile.created_at,
  };
}

function mapSubscription(sub: Subscription): SubscriptionData {
  return {
    id: sub.id,
    plan: sub.plan as SubscriptionData['plan'],
    status: sub.status as SubscriptionData['status'],
    startDate: sub.start_date,
    endDate: sub.end_date,
    autoRenew: sub.auto_renew,
    price: Number(sub.price),
  };
}

async function fetchUserData(supabaseUser: SupabaseUser): Promise<{ user: User; subscription: SubscriptionData | null }> {
  const [profileRes, subRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', supabaseUser.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', supabaseUser.id).single(),
  ]);
  if (!profileRes.data) throw new Error('Profil introuvable');
  return {
    user: mapProfile(profileRes.data, supabaseUser.email ?? ''),
    subscription: subRes.data ? mapSubscription(subRes.data) : null,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const data = await fetchUserData(session.user);
          setUser(data.user);
          setSubscription(data.subscription);
        } catch {
          setUser(null);
          setSubscription(null);
        }
      }
      setIsLoading(false);
    });

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          try {
            const data = await fetchUserData(session.user);
            setUser(data.user);
            setSubscription(data.subscription);
          } catch {
            setUser(null);
            setSubscription(null);
          }
        } else {
          setUser(null);
          setSubscription(null);
        }
      }
    );

    return () => authListener.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const register = async ({ email, password, firstName, lastName, phone }: RegisterData) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName, phone: phone ?? '' } },
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSubscription(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      avatar_url: data.avatar,
    }).eq('id', user.id);
    if (error) throw new Error(error.message);
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const updateSubscription = async (planId: string) => {
    if (!subscription || !user) return;
    const { error } = await supabase.from('subscriptions').update({
      plan: planId as SubscriptionData['plan'],
    }).eq('user_id', user.id);
    if (error) throw new Error(error.message);
    setSubscription(prev => prev ? { ...prev, plan: planId as SubscriptionData['plan'] } : null);
  };

  return (
    <AuthContext.Provider value={{
      user, subscription,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isLoading,
      login, register, logout, updateProfile, updateSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

- [ ] **Step 2: Mettre à jour le logout async dans `src/components/member/MemberLayout.tsx`**

Trouver la fonction `handleLogout` (ligne ~40) et la remplacer :

```typescript
const handleLogout = async () => {
  await logout();
  navigate('/');
};
```

Et sur le bouton correspondant, ajouter `type="button"` s'il ne l'a pas et s'assurer que `onPress={handleLogout}` est bien présent (il l'est déjà).

- [ ] **Step 3: Mettre à jour `src/components/DemoAuthWrapper.tsx`**

```typescript
import { ReactNode, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface DemoAuthWrapperProps {
  children: ReactNode;
}

const DemoAuthWrapper = ({ children }: DemoAuthWrapperProps) => {
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) return;
    login('demo@pessora.mq', 'demo123').catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
};

export default DemoAuthWrapper;
```

- [ ] **Step 4: Supprimer `src/lib/apiClient.ts`**

```bash
rm "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA/src/lib/apiClient.ts"
```

- [ ] **Step 5: Vérifier que TypeScript compile sans erreur liée à apiClient**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
npx tsc --noEmit 2>&1 | head -30
```

Résoudre tout import restant vers `apiClient`.

- [ ] **Step 6: Tester en dev**

```bash
npm run dev
```

Aller sur `http://localhost:3000/connexion`, se connecter avec `demo@pessora.mq / demo123`. Vérifier que le dashboard s'ouvre sans erreur console.

- [ ] **Step 7: Supprimer le dossier server/**

```bash
rm -rf "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA/server"
```

- [ ] **Step 8: Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
git add -A
git commit -m "feat: migrate auth to supabase, remove express backend"
```

---

## Task 5 — Réécrire la page `/evenements` (liste)

**Files:**
- Rewrite: `src/pages/Evenements.tsx`

- [ ] **Step 1: Remplacer entièrement `src/pages/Evenements.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, ArrowRight, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type { Event } from '../types/database';

const TYPE_LABELS: Record<Event['type'], string> = {
  run_club: '🏃 Run Club',
  popup: '📍 Pop-up',
  atelier: '🌿 Atelier',
  event: '🎉 Événement',
};

const TYPE_COLORS: Record<Event['type'], string> = {
  run_club: 'bg-primary-forest/15 text-primary-forest',
  popup: 'bg-primary/10 text-primary',
  atelier: 'bg-[#EBE6E8] text-rose-800',
  event: 'bg-accent-leaf/20 text-primary-forest',
};

interface EventWithCount extends Event {
  registrationCount: number;
}

const Evenements = () => {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('events')
        .select('*, event_registrations(count)')
        .eq('active', true)
        .gte('date', today)
        .order('date', { ascending: true });

      if (!error && data) {
        setEvents(
          data.map((e) => ({
            ...e,
            registrationCount: (e.event_registrations as unknown as { count: number }[])?.[0]?.count ?? 0,
          }))
        );
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  return (
    <div className="min-h-screen pt-[10.25rem] pb-24 bg-[#EDE7DF]">
      <div className="container-custom">

        {/* Hero */}
        <div className="mb-24 text-center md:text-left">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/40 mb-6 block">
            Agenda PessÓra
          </span>
          <h1 className="text-6xl md:text-8xl font-serif text-primary tracking-tighter">
            Événements à <span className="italic text-primary-forest">venir</span>
          </h1>
          <div className="w-24 h-[1px] bg-primary/20 mt-12 mb-8 md:mx-0 mx-auto" />
          <p className="text-xl text-primary/60 font-light max-w-2xl font-serif italic">
            Rejoins la communauté PessÓra lors de nos runs, ateliers et pop-ups en Martinique.
          </p>
        </div>

        {/* Liste événements */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-16 text-center bg-accent-cream-light rounded-3xl border border-primary/5 mb-16">
            <Calendar size={48} strokeWidth={1} className="mx-auto text-primary/30 mb-6" />
            <h3 className="text-2xl font-serif text-primary mb-4">Événements en préparation</h3>
            <p className="text-primary/60 font-light max-w-md mx-auto">
              De nouveaux événements seront bientôt annoncés. Suis-nous sur Instagram pour ne rien manquer.
            </p>
          </div>
        ) : (
          <div className="space-y-0 mb-32">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-0 border-b border-primary/5 last:border-0`}
              >
                {/* Image */}
                <div className="md:w-1/2 aspect-[4/3] md:aspect-auto overflow-hidden bg-primary/5">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[320px] bg-gradient-to-br from-primary to-primary-forest flex items-center justify-center">
                      <span className="text-6xl">{TYPE_LABELS[event.type].split(' ')[0]}</span>
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="md:w-1/2 p-12 md:p-16 lg:p-20 flex flex-col justify-center gap-6 bg-accent-cream-light">
                  <span className={`inline-flex w-fit px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${TYPE_COLORS[event.type]}`}>
                    {TYPE_LABELS[event.type]}
                  </span>

                  <h2 className="text-3xl md:text-4xl font-serif text-primary tracking-tight leading-tight">
                    {event.title}
                  </h2>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary/60 text-sm">
                      <Calendar size={15} strokeWidth={1.5} />
                      <span className="capitalize">{formatDate(event.date)}</span>
                      {event.heure && (
                        <>
                          <span className="text-primary/20">·</span>
                          <Clock size={15} strokeWidth={1.5} />
                          <span>{event.heure.slice(0, 5)}</span>
                        </>
                      )}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-primary/60 text-sm">
                        <MapPin size={15} strokeWidth={1.5} />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-primary/70 leading-relaxed font-light max-w-md">
                      {event.description}
                    </p>
                  )}

                  <div className="flex items-center gap-6 pt-2">
                    {event.registrationCount > 0 && (
                      <div className="flex items-center gap-2 text-primary/50 text-sm">
                        <Users size={15} strokeWidth={1.5} />
                        <span>{event.registrationCount} inscrit{event.registrationCount > 1 ? 's' : ''}</span>
                        {event.places_max && (
                          <span className="text-primary/30">/ {event.places_max} places</span>
                        )}
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/evenements/${event.slug}`}
                    className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest w-fit hover:bg-primary-forest transition-colors"
                  >
                    Je m'inscris <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Bilan Bien-être */}
        <div className="rounded-[2.5rem] bg-gradient-to-br from-primary via-[#2D472C] to-[#6B9544] p-12 md:p-16 text-white text-center mb-16">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/50 mb-4 block">
            Nouveau
          </span>
          <h2 className="text-3xl md:text-5xl font-serif tracking-tight mb-4">
            Tu viens pour transpirer ?
          </h2>
          <p className="text-xl font-serif italic text-white/80 mb-8 max-w-xl mx-auto">
            Commence par comprendre ton corps. 30 minutes. Gratuit.
          </p>
          <Link
            to="/bilan-bien-etre"
            className="inline-flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-white/90 transition-colors"
          >
            Prendre mon Bilan Bien-être <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Evenements;
```

- [ ] **Step 2: Vérifier visuellement**

```bash
npm run dev
```

Aller sur `http://localhost:3000/evenements`. La page doit charger sans erreur (liste vide c'est OK — les données seront seedées à Task 8).

- [ ] **Step 3: Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
git add src/pages/Evenements.tsx
git commit -m "feat: events list page with supabase data + bilan cta"
```

---

## Task 6 — Créer la page `/evenements/:slug` (détail + inscription)

**Files:**
- Create: `src/pages/EvenementDetail.tsx`

- [ ] **Step 1: Créer `src/pages/EvenementDetail.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, Input, Label, TextField, FieldError, Form, cn } from '@heroui/react';
import { MapPin, Clock, Users, Calendar, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Event } from '../types/database';

const schema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  prenom: z.string().min(2, 'Prénom requis'),
  telephone: z.string().min(8, 'Téléphone requis'),
  nb_personnes: z.string(),
  souhait_info: z.string(),
});

type FormData = z.infer<typeof schema>;

const NB_OPTIONS = [
  { value: 'Je viens seul', label: 'Je viens seul(e)' },
  { value: '+1 personne', label: '+1 personne' },
  { value: '+2 personnes', label: '+2 personnes' },
  { value: '+3 personnes ou plus', label: '+3 personnes ou plus' },
];

const INFO_OPTIONS = [
  { value: 'Oui avec plaisir 🔥', label: 'Oui avec plaisir 🔥' },
  { value: 'Oui, uniquement pour les Run Club', label: 'Oui, uniquement pour les Run Club' },
  { value: 'Non merci', label: 'Non merci' },
];

const TYPE_LABELS: Record<string, string> = {
  run_club: '🏃 Run Club',
  popup: '📍 Pop-up',
  atelier: '🌿 Atelier',
  event: '🎉 Événement',
};

const inputClass = cn(
  'w-full border-0 border-b border-primary/10 bg-transparent py-4 font-serif text-lg',
  'focus-visible:border-primary-forest'
);

interface EventWithCount extends Event {
  registrationCount: number;
}

const EvenementDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventWithCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'duplicate' | 'full' | 'error'>('idle');

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: user?.lastName ?? '',
      prenom: user?.firstName ?? '',
      telephone: user?.phone ?? '',
      nb_personnes: 'Je viens seul',
      souhait_info: 'Non merci',
    },
  });

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, event_registrations(count)')
        .eq('slug', slug!)
        .eq('active', true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setEvent({
          ...data,
          registrationCount: (data.event_registrations as unknown as { count: number }[])?.[0]?.count ?? 0,
        });
      }
      setLoading(false);
    };
    fetchEvent();
  }, [slug]);

  useEffect(() => {
    if (user) {
      reset({
        nom: user.lastName ?? '',
        prenom: user.firstName ?? '',
        telephone: user.phone ?? '',
        nb_personnes: 'Je viens seul',
        souhait_info: 'Non merci',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: FormData) => {
    if (!event) return;

    if (event.places_max && event.registrationCount >= event.places_max) {
      setSubmitStatus('full');
      return;
    }

    const { error } = await supabase.from('event_registrations').insert({
      event_id: event.id,
      user_id: user?.id ?? null,
      nom: data.nom,
      prenom: data.prenom,
      telephone: data.telephone,
      nb_personnes: data.nb_personnes,
      souhait_info: data.souhait_info,
    });

    if (error) {
      if (error.code === '23505') {
        setSubmitStatus('duplicate');
      } else {
        setSubmitStatus('error');
      }
      return;
    }

    setSubmitStatus('success');
    setEvent(prev => prev ? { ...prev, registrationCount: prev.registrationCount + 1 } : null);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

  if (loading) {
    return (
      <div className="min-h-screen pt-[10.25rem] bg-[#EDE7DF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen pt-[10.25rem] pb-24 bg-[#EDE7DF]">
        <div className="container-custom text-center py-32">
          <h1 className="text-4xl font-serif text-primary mb-4">Événement introuvable</h1>
          <Link to="/evenements" className="text-primary-forest font-bold underline">
            Voir tous les événements
          </Link>
        </div>
      </div>
    );
  }

  const placesDispo = event.places_max ? event.places_max - event.registrationCount : null;
  const isFull = placesDispo !== null && placesDispo <= 0;

  return (
    <div className="min-h-screen bg-[#EDE7DF]">

      {/* Hero image */}
      <div className="relative h-[55vh] min-h-[380px] overflow-hidden">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-forest" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="container-custom">
            <Link
              to="/evenements"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 transition-colors"
            >
              <ArrowLeft size={14} /> Tous les événements
            </Link>
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest mb-4">
              {TYPE_LABELS[event.type] ?? event.type}
            </span>
            <h1 className="text-4xl md:text-6xl font-serif text-white tracking-tight">{event.title}</h1>
          </div>
        </div>
      </div>

      <div className="container-custom py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl">

          {/* Infos événement */}
          <div className="space-y-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-primary/70">
                <Calendar size={18} strokeWidth={1.5} />
                <span className="capitalize font-medium">{formatDate(event.date)}</span>
              </div>
              {event.heure && (
                <div className="flex items-center gap-3 text-primary/70">
                  <Clock size={18} strokeWidth={1.5} />
                  <span>{event.heure.slice(0, 5)}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-3 text-primary/70">
                  <MapPin size={18} strokeWidth={1.5} />
                  <span>{event.location}</span>
                </div>
              )}
              {event.places_max && (
                <div className="flex items-center gap-3 text-primary/70">
                  <Users size={18} strokeWidth={1.5} />
                  <span>
                    {event.registrationCount} inscrit{event.registrationCount > 1 ? 's' : ''}
                    {placesDispo !== null && (
                      <span className={`ml-2 ${placesDispo <= 5 ? 'text-orange-500 font-bold' : 'text-primary/40'}`}>
                        · {placesDispo} place{placesDispo > 1 ? 's' : ''} restante{placesDispo > 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {event.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-primary/70 leading-relaxed text-lg font-light font-serif">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* Formulaire d'inscription */}
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm">
            <h2 className="text-2xl font-serif text-primary mb-8 tracking-tight">
              {submitStatus === 'success' ? 'Inscription confirmée !' : "Je m'inscris"}
            </h2>

            {submitStatus === 'success' && (
              <div className="flex flex-col items-center text-center gap-4 py-8">
                <CheckCircle size={56} strokeWidth={1} className="text-primary-forest" />
                <p className="text-primary/70 font-light text-lg">
                  Bravo <strong>{}</strong> ! Tu es inscrit(e) au <strong>{event.title}</strong>.
                </p>
                <p className="text-primary/50 text-sm">
                  RDV le{' '}
                  <span className="capitalize font-medium">
                    {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  {event.heure && <> à {event.heure.slice(0, 5)}</>}.
                </p>
              </div>
            )}

            {submitStatus === 'duplicate' && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl mb-6 text-sm text-orange-700">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                Ce numéro est déjà inscrit à cet événement. Tu es déjà dans la liste !
              </div>
            )}

            {submitStatus === 'full' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl mb-6 text-sm text-red-700">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                Cet événement est complet. Suis-nous sur Instagram pour les prochaines dates.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl mb-6 text-sm text-red-700">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                Une erreur est survenue. Réessaie ou contacte-nous sur Instagram.
              </div>
            )}

            {submitStatus !== 'success' && !isFull && (
              <Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Controller name="prenom" control={control} render={({ field, fieldState }) => (
                    <TextField className="space-y-1" isInvalid={fieldState.invalid}>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Prénom *</Label>
                      <Input {...field} variant="secondary" placeholder="Jean" className={inputClass} />
                      {errors.prenom?.message && <FieldError className="text-xs text-red-600">{errors.prenom.message}</FieldError>}
                    </TextField>
                  )} />
                  <Controller name="nom" control={control} render={({ field, fieldState }) => (
                    <TextField className="space-y-1" isInvalid={fieldState.invalid}>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Nom *</Label>
                      <Input {...field} variant="secondary" placeholder="Dupont" className={inputClass} />
                      {errors.nom?.message && <FieldError className="text-xs text-red-600">{errors.nom.message}</FieldError>}
                    </TextField>
                  )} />
                </div>

                <Controller name="telephone" control={control} render={({ field, fieldState }) => (
                  <TextField className="space-y-1" isInvalid={fieldState.invalid}>
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">
                      Téléphone * <span className="normal-case font-normal text-primary/30">(WhatsApp de préférence)</span>
                    </Label>
                    <Input {...field} type="tel" variant="secondary" placeholder="0696 XX XX XX" className={inputClass} />
                    {errors.telephone?.message && <FieldError className="text-xs text-red-600">{errors.telephone.message}</FieldError>}
                  </TextField>
                )} />

                <Controller name="nb_personnes" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40 block">
                      Combien de personnes ?
                    </label>
                    <select
                      {...field}
                      className="w-full border-0 border-b border-primary/10 bg-transparent py-4 font-serif text-lg text-primary focus:outline-none focus:border-primary-forest"
                    >
                      {NB_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                )} />

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40 block">
                    Souhaites-tu rester informé(e) des prochains événements ?
                  </label>
                  <Controller name="souhait_info" control={control} render={({ field }) => (
                    <div className="space-y-2">
                      {INFO_OPTIONS.map(o => (
                        <label key={o.value} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            value={o.value}
                            checked={field.value === o.value}
                            onChange={() => field.onChange(o.value)}
                            className="accent-primary-forest"
                          />
                          <span className="text-sm text-primary/70 group-hover:text-primary transition-colors">{o.label}</span>
                        </label>
                      ))}
                    </div>
                  )} />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isDisabled={isSubmitting}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-primary-forest transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Inscription en cours...' : "Je m'inscris gratuitement"}
                </Button>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvenementDetail;
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
git add src/pages/EvenementDetail.tsx
git commit -m "feat: event detail page with registration form"
```

---

## Task 7 — Créer la page `/bilan-bien-etre`

**Files:**
- Create: `src/pages/BilanBienEtre.tsx`

- [ ] **Step 1: Créer `src/pages/BilanBienEtre.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, Input, Label, TextField, FieldError, Form, Calendar, cn } from '@heroui/react';
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
import { Activity, Utensils, Sparkles, Target, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { BilanSlot } from '../types/database';

const schema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  prenom: z.string().min(2, 'Prénom requis'),
  telephone: z.string().min(8, 'Téléphone requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PROGRAMME = [
  { icon: Activity, title: 'Analyse corporelle', desc: 'Composition corporelle, IMC, masse musculaire et graisseuse' },
  { icon: Utensils, title: 'Bilan nutritionnel', desc: 'Habitudes alimentaires, apports, carences et recommandations personnalisées' },
  { icon: Sparkles, title: 'Skincare', desc: 'Analyse de peau, routine recommandée et produits adaptés à ton profil' },
  { icon: Target, title: 'Challenge 21 jours', desc: 'Programme personnalisé et objectifs concrets pour transformer tes habitudes' },
];

const inputClass = cn(
  'w-full border-0 border-b border-primary/10 bg-transparent py-4 font-serif text-lg',
  'focus-visible:border-primary-forest'
);

const BilanBienEtre = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<BilanSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BilanSlot | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: user?.lastName ?? '',
      prenom: user?.firstName ?? '',
      telephone: user?.phone ?? '',
      email: user?.email ?? '',
      notes: '',
    },
  });

  useEffect(() => {
    const fetchSlots = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('bilan_slots')
        .select('*')
        .eq('disponible', true)
        .gte('date', todayStr)
        .order('date', { ascending: true })
        .order('heure', { ascending: true });
      setSlots(data ?? []);
    };
    fetchSlots();
  }, []);

  useEffect(() => {
    if (user) {
      reset({
        nom: user.lastName ?? '',
        prenom: user.firstName ?? '',
        telephone: user.phone ?? '',
        email: user.email ?? '',
        notes: '',
      });
    }
  }, [user, reset]);

  const availableDates = new Set(slots.map(s => s.date));

  const isDateUnavailable = (date: CalendarDate) => {
    const dateStr = date.toString();
    return !availableDates.has(dateStr);
  };

  const timeSlotsForDate = selectedDate
    ? slots.filter(s => s.date === selectedDate.toString())
    : [];

  const onSubmit = async (data: FormData) => {
    if (!selectedSlot) return;

    const { error } = await supabase.from('bilan_bookings').insert({
      slot_id: selectedSlot.id,
      user_id: user?.id ?? null,
      nom: data.nom,
      prenom: data.prenom,
      telephone: data.telephone,
      email: data.email || null,
      date_rdv: selectedSlot.date,
      heure_rdv: selectedSlot.heure,
      notes: data.notes || null,
    });

    if (error) {
      setSubmitStatus('error');
      return;
    }

    await supabase.from('bilan_slots').update({ disponible: false }).eq('id', selectedSlot.id);
    setSubmitStatus('success');
  };

  const minDate = today(getLocalTimeZone());

  return (
    <div className="min-h-screen pt-[10.25rem] pb-24 bg-[#EDE7DF]">
      <div className="container-custom">

        {/* Hero */}
        <div className="mb-24 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/40 mb-6 block">
            Gratuit · 30 minutes
          </span>
          <h1 className="text-6xl md:text-8xl font-serif text-primary tracking-tighter mb-6">
            Bilan <span className="italic text-primary-forest">Bien-être</span>
          </h1>
          <p className="text-xl text-primary/60 font-light max-w-2xl mx-auto font-serif italic">
            30 minutes pour comprendre ton corps, tes habitudes et définir un programme qui te ressemble vraiment.
          </p>
        </div>

        {/* 4 blocs programme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {PROGRAMME.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-8 bg-accent-cream-light rounded-3xl border border-primary/5 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Icon size={22} strokeWidth={1.5} className="text-primary" />
              </div>
              <h3 className="text-lg font-serif text-primary mb-3 tracking-tight">{title}</h3>
              <p className="text-sm text-primary/60 font-light leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Réservation */}
        {submitStatus === 'success' ? (
          <div className="max-w-xl mx-auto text-center py-16">
            <CheckCircle size={64} strokeWidth={1} className="text-primary-forest mx-auto mb-6" />
            <h2 className="text-3xl font-serif text-primary mb-4">Réservation reçue !</h2>
            <p className="text-primary/60 font-light text-lg">
              L'équipe PessÓra te confirme ton rendez-vous par WhatsApp sous 24h.
            </p>
            <p className="text-primary/40 text-sm mt-4">
              {selectedSlot && (
                <>
                  {new Date(selectedSlot.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' '}à {selectedSlot.heure.slice(0, 5)}
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif text-primary tracking-tight mb-12 text-center">
              Choisir mon créneau
            </h2>

            {submitStatus === 'error' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl mb-8 text-sm text-red-700 max-w-lg mx-auto">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                Une erreur est survenue. Réessaie ou contacte-nous sur Instagram.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

              {/* Calendrier + créneaux */}
              <div className="space-y-8">
                {slots.length === 0 ? (
                  <div className="p-10 text-center bg-accent-cream-light rounded-3xl border border-primary/5">
                    <Clock size={36} strokeWidth={1} className="mx-auto text-primary/30 mb-4" />
                    <p className="text-primary/60 font-light">
                      Aucun créneau disponible pour le moment. Contacte-nous sur Instagram.
                    </p>
                  </div>
                ) : (
                  <>
                    <Calendar
                      value={selectedDate}
                      onChange={(date) => {
                        setSelectedDate(date);
                        setSelectedSlot(null);
                      }}
                      minValue={minDate}
                      isDateUnavailable={isDateUnavailable}
                      className="rounded-3xl shadow-sm border border-primary/5 overflow-hidden mx-auto"
                    />

                    {selectedDate && timeSlotsForDate.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-4">
                          Créneaux disponibles
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlotsForDate.map(slot => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-3 px-4 rounded-2xl text-sm font-bold tracking-wide transition-all ${
                                selectedSlot?.id === slot.id
                                  ? 'bg-primary text-white shadow-md'
                                  : 'bg-accent-cream-light border border-primary/10 text-primary hover:border-primary/30'
                              }`}
                            >
                              {slot.heure.slice(0, 5)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDate && timeSlotsForDate.length === 0 && (
                      <p className="text-sm text-primary/50 text-center">
                        Aucun créneau disponible ce jour-là.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Formulaire */}
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm">
                <h3 className="text-xl font-serif text-primary mb-6">Tes coordonnées</h3>
                <Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Controller name="prenom" control={control} render={({ field, fieldState }) => (
                      <TextField className="space-y-1" isInvalid={fieldState.invalid}>
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Prénom *</Label>
                        <Input {...field} variant="secondary" placeholder="Jean" className={inputClass} />
                        {errors.prenom?.message && <FieldError className="text-xs text-red-600">{errors.prenom.message}</FieldError>}
                      </TextField>
                    )} />
                    <Controller name="nom" control={control} render={({ field, fieldState }) => (
                      <TextField className="space-y-1" isInvalid={fieldState.invalid}>
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Nom *</Label>
                        <Input {...field} variant="secondary" placeholder="Dupont" className={inputClass} />
                        {errors.nom?.message && <FieldError className="text-xs text-red-600">{errors.nom.message}</FieldError>}
                      </TextField>
                    )} />
                  </div>

                  <Controller name="telephone" control={control} render={({ field, fieldState }) => (
                    <TextField className="space-y-1" isInvalid={fieldState.invalid}>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">
                        Téléphone * <span className="normal-case font-normal text-primary/30">(WhatsApp)</span>
                      </Label>
                      <Input {...field} type="tel" variant="secondary" placeholder="0696 XX XX XX" className={inputClass} />
                      {errors.telephone?.message && <FieldError className="text-xs text-red-600">{errors.telephone.message}</FieldError>}
                    </TextField>
                  )} />

                  <Controller name="email" control={control} render={({ field, fieldState }) => (
                    <TextField className="space-y-1" isInvalid={fieldState.invalid}>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">
                        Email <span className="normal-case font-normal text-primary/30">(optionnel)</span>
                      </Label>
                      <Input {...field} type="email" variant="secondary" placeholder="votre@email.com" className={inputClass} />
                      {errors.email?.message && <FieldError className="text-xs text-red-600">{errors.email.message}</FieldError>}
                    </TextField>
                  )} />

                  <Controller name="notes" control={control} render={({ field }) => (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40 block">
                        Message <span className="normal-case font-normal text-primary/30">(optionnel)</span>
                      </label>
                      <textarea
                        {...field}
                        rows={3}
                        placeholder="Objectifs, questions, informations utiles..."
                        className="w-full border-b border-primary/10 bg-transparent py-3 font-serif text-base text-primary placeholder:text-primary/30 focus:outline-none focus:border-primary-forest resize-none"
                      />
                    </div>
                  )} />

                  {!selectedSlot && (
                    <p className="text-xs text-orange-600 font-medium">
                      Sélectionne d'abord une date et un créneau dans le calendrier.
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    isDisabled={isSubmitting || !selectedSlot}
                    className="w-full bg-primary text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-primary-forest transition-colors disabled:opacity-40"
                  >
                    {isSubmitting ? 'Réservation...' : 'Confirmer mon Bilan Bien-être'}
                  </Button>
                </Form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BilanBienEtre;
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
git add src/pages/BilanBienEtre.tsx
git commit -m "feat: bilan bien-etre page with heroui calendar + supabase booking"
```

---

## Task 8 — Mettre à jour App.tsx + Header

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Ajouter les imports et routes dans `src/App.tsx`**

Après la ligne `const OraPlus = lazy(...)`, ajouter :

```typescript
const EvenementDetail = lazy(() => import('./pages/EvenementDetail'));
const BilanBienEtre = lazy(() => import('./pages/BilanBienEtre'));
```

Dans le bloc `<Routes>`, après la route `/evenements` :

```tsx
<Route path="/evenements/:slug" element={<EvenementDetail />} />
<Route path="/bilan-bien-etre" element={<BilanBienEtre />} />
```

- [ ] **Step 2: Ajouter "Bilan Bien-être" dans le Header**

Dans `src/components/layout/Header.tsx`, trouver le tableau de liens de navigation (probablement un tableau `navLinks` ou similaire). Ajouter après le lien "Événements" :

```typescript
{ label: 'Bilan Bien-être', href: '/bilan-bien-etre' },
```

Si la nav utilise des `<Link>` directs, ajouter :

```tsx
<Link to="/bilan-bien-etre">Bilan Bien-être</Link>
```

- [ ] **Step 3: Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
npx tsc --noEmit 2>&1 | head -30
```

Corriger toute erreur.

- [ ] **Step 4: Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
git add src/App.tsx src/components/layout/Header.tsx
git commit -m "feat: add routes /evenements/:slug and /bilan-bien-etre + nav link"
```

---

## Task 9 — Seeder les données de test

**Action:** Insérer des événements + des créneaux bilan dans Supabase pour tester les pages.

- [ ] **Step 1: Insérer 2 événements de test via Supabase MCP**

Via `mcp__claude_ai_Supabase__execute_sql` sur le projet `tulhiipucrnyejheuitv` :

```sql
INSERT INTO events (title, slug, date, heure, location, type, description, places_max, active)
VALUES
  (
    'Run Club PessÓra — Mercredi',
    'run-club-mercredi-23-avril',
    '2026-04-23',
    '18:30:00',
    'PessÓra — C.C. La Véranda, Fort-de-France',
    'run_club',
    'Rejoins la team PessÓra pour une session de running suivie de shakes et gauffres ! Toutes les semaines le mercredi à 18h30. Gilet réfléchissant recommandé, baskets obligatoires, motivation obligatoire 💪',
    50,
    true
  ),
  (
    'Pop-up PessÓra × GigaFit',
    'popup-gigafit-mai',
    '2026-05-10',
    '10:00:00',
    'GigaFit — Le Lamentin',
    'popup',
    'Retrouvez notre stand PessÓra lors des portes ouvertes de GigaFit. Dégustez nos shakes protéinés et découvrez nos nouvelles gammes bien-être.',
    null,
    true
  );
```

- [ ] **Step 2: Insérer des créneaux bilan**

```sql
INSERT INTO bilan_slots (date, heure, disponible)
VALUES
  ('2026-04-25', '10:00:00', true),
  ('2026-04-25', '11:00:00', true),
  ('2026-04-25', '14:00:00', true),
  ('2026-04-25', '15:00:00', true),
  ('2026-04-26', '10:00:00', true),
  ('2026-04-26', '11:00:00', true),
  ('2026-04-28', '14:00:00', true),
  ('2026-04-28', '15:00:00', true),
  ('2026-04-28', '16:00:00', true);
```

- [ ] **Step 3: Vérifier visuellement en dev**

```bash
npm run dev
```

- Aller sur `http://localhost:3000/evenements` → vérifier que les 2 événements s'affichent avec le nouveau layout
- Cliquer sur "Je m'inscris" → vérifier la page détail et le formulaire
- Remplir et soumettre une inscription → vérifier le message de confirmation
- Aller sur `http://localhost:3000/bilan-bien-etre` → vérifier le calendrier avec les dates disponibles
- Sélectionner une date → vérifier les créneaux horaires
- Remplir et soumettre une réservation → vérifier le message de confirmation

- [ ] **Step 4: Vérifier les données dans Supabase**

Dans le dashboard Supabase → Table Editor → `event_registrations` : vérifier que l'inscription apparaît.  
Dans `bilan_bookings` : vérifier que la réservation apparaît avec `statut = 'en_attente'`.

- [ ] **Step 5: Commit final**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
git add -A
git commit -m "feat: seed test events and bilan slots"
```

---

## Checklist finale

- [ ] Les 11 tables Supabase existent avec RLS actif
- [ ] Le trigger crée automatiquement `profiles` + `subscriptions` à l'inscription
- [ ] Login / Register fonctionnent avec Supabase Auth
- [ ] Le compte demo `demo@pessora.mq` se connecte en `/demo-espace`
- [ ] `server/` est supprimé, `apiClient.ts` est supprimé
- [ ] `/evenements` affiche les événements depuis Supabase
- [ ] `/evenements/:slug` affiche le détail et permet l'inscription
- [ ] L'anti-doublon fonctionne (même téléphone = message doux)
- [ ] `/bilan-bien-etre` affiche le calendrier avec les dates disponibles
- [ ] La réservation bilan s'enregistre dans `bilan_bookings`
- [ ] Le créneau réservé passe à `disponible = false`
- [ ] Header contient le lien "Bilan Bien-être"
- [ ] `npm run build` sans erreur TypeScript
