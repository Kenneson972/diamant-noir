# Dashboard Client & Admin — Vraies Données Supabase

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Brancher toutes les pages dashboard membre sur Supabase (vraies données) et créer un dashboard admin complet (membres, événements, produits).

**Architecture:** SQL migration → TypeScript types → hooks React → pages client → pages admin. Chaque couche dépend de la précédente. Les hooks encapsulent toutes les requêtes Supabase et exposent `{ data, loading, error }`.

**Tech Stack:** React 19, TypeScript, Supabase JS v2, React Hook Form + Zod, Tailwind v4, HeroUI v3, React Router v6, Lucide React.

---

## File Map

**Create:**
- `docs/supabase_migration_dashboard.sql` — SQL à exécuter dans Supabase dashboard
- `src/hooks/useOrders.ts`
- `src/hooks/useUpcomingEvents.ts`
- `src/hooks/useDashboardStats.ts`
- `src/hooks/useAdminMembers.ts`
- `src/hooks/useAdminEventRegistrations.ts`
- `src/pages/admin/AdminLayout.tsx`
- `src/pages/admin/AdminOverview.tsx`
- `src/pages/admin/AdminMembers.tsx`
- `src/pages/admin/AdminEvenements.tsx`
- `src/pages/admin/AdminProduits.tsx`

**Modify:**
- `src/types/database.ts` — extend Event, Profile, orders
- `src/pages/member/Dashboard.tsx` — real KPIs + events + products
- `src/pages/member/History.tsx` — real orders
- `src/pages/member/Profile.tsx` — real dates + working prefs
- `src/pages/EvenementDetail.tsx` — check `registration_open`
- `src/App.tsx` — admin sub-routes

---

## Task 1: SQL Migration

**Files:**
- Create: `docs/supabase_migration_dashboard.sql`

- [ ] **Step 1: Créer le fichier migration**

```sql
-- docs/supabase_migration_dashboard.sql
-- À exécuter dans Supabase > SQL Editor

-- ── 1. Helper admin (security definer évite la récursion RLS) ──────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── 2. profiles: colonne préférences ──────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferences jsonb
  DEFAULT '{"notifications": true, "newsletter": true}'::jsonb;

-- ── 3. Politique RLS profiles: membres lisent le leur, admins lisent tout ─
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- ── 4. subscriptions: admins lisent tout ──────────────────────────────────
DROP POLICY IF EXISTS "Users can read own subscription" ON public.subscriptions;
CREATE POLICY "Users can read own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- ── 5. events: nouvelles colonnes ─────────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS meeting_point text,
  ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS registration_open boolean DEFAULT true;

-- Étendre le type CHECK pour inclure 'bilan'
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_type_check
  CHECK (type IN ('run_club', 'popup', 'atelier', 'event', 'partenariat', 'bilan'));

-- ── 6. orders: colonnes Stripe (future intégration) ───────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- ── 7. event_registrations: admins gèrent tout ────────────────────────────
DROP POLICY IF EXISTS "Admins manage all registrations" ON public.event_registrations;
CREATE POLICY "Admins manage all registrations"
  ON public.event_registrations FOR ALL
  USING (public.is_admin());

-- ── 8. products: admins gèrent ────────────────────────────────────────────
DROP POLICY IF EXISTS "Only admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Only admins can update products" ON public.products;
DROP POLICY IF EXISTS "Only admins can delete products" ON public.products;
CREATE POLICY "Admins manage products"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

- [ ] **Step 2: Exécuter dans Supabase SQL Editor**

Aller dans Supabase > projet Pessóra > SQL Editor > coller le contenu du fichier > Run.
Vérifier qu'il n'y a pas d'erreurs dans la sortie.

- [ ] **Step 3: Vérifier les colonnes en base**

Dans Supabase > Table Editor > `events` : confirmer que `meeting_point`, `price`, `is_free`, `registration_open` apparaissent.
Dans `profiles` : confirmer `preferences`.
Dans `orders` : confirmer `stripe_payment_intent_id`.

- [ ] **Step 4: Commit**

```bash
git add docs/supabase_migration_dashboard.sql
git commit -m "docs: SQL migration dashboard — nouvelles colonnes + policies admin"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Mettre à jour les types**

Dans `src/types/database.ts`, remplacer le contenu par :

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
          role: 'member' | 'admin' | null
          preferences: Record<string, boolean> | null
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
          type: 'run_club' | 'popup' | 'atelier' | 'event' | 'partenariat' | 'bilan'
          description: string | null
          image_url: string | null
          places_max: number | null
          meeting_point: string | null
          price: number | null
          is_free: boolean
          registration_open: boolean
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
      products: {
        Row: {
          id: string
          name: string
          category: string
          price: number | null
          calories: number | null
          protein: number | null
          description: string | null
          ingredients: string[] | null
          benefits: string[] | null
          image_url: string | null
          active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>>
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          total: number
          status: 'pending' | 'completed' | 'cancelled'
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['orders']['Row'], 'status'>>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          price_at_time: number
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>
        Update: never
      }
      favorites: {
        Row: {
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['favorites']['Row'], 'created_at'>
        Update: never
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'info' | 'promo' | 'reminder' | 'event'
          message: string
          read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['notifications']['Row'], 'read'>>
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
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
```

- [ ] **Step 2: Vérifier pas d'erreurs TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
npx tsc --noEmit 2>&1 | head -30
```

Résoudre les erreurs éventuelles (souvent des propriétés manquantes après l'ajout de `preferences`, `meeting_point`, etc.).

- [ ] **Step 3: Commit**

```bash
git add src/types/database.ts
git commit -m "types: extend Event (bilan, new cols), Profile (preferences), Order (stripe fields)"
```

---

## Task 3: Hook `useOrders`

**Files:**
- Create: `src/hooks/useOrders.ts`

- [ ] **Step 1: Créer le hook**

```typescript
// src/hooks/useOrders.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Order, OrderItem } from '../types/database';
import { useAuth } from '../contexts/AuthContext';

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }: { data: OrderWithItems[] | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (err) setError('Impossible de charger vos commandes.');
        else setOrders(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const totalThisMonth = orders
    .filter(o => {
      const d = new Date(o.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, o) => sum + o.total, 0);

  const topProducts = Object.entries(
    orders.flatMap(o => o.order_items).reduce<Record<string, number>>((acc, item) => {
      acc[item.product_name] = (acc[item.product_name] ?? 0) + item.quantity;
      return acc;
    }, {})
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  return { orders, loading, error, totalThisMonth, topProducts };
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep useOrders
```

Aucune sortie = aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useOrders.ts
git commit -m "feat: hook useOrders — orders + items, stats mois courant, top produits"
```

---

## Task 4: Hook `useUpcomingEvents`

**Files:**
- Create: `src/hooks/useUpcomingEvents.ts`

- [ ] **Step 1: Créer le hook**

```typescript
// src/hooks/useUpcomingEvents.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Event } from '../types/database';

export interface RegistrationWithEvent {
  id: string;
  event_id: string;
  user_id: string | null;
  nom: string;
  prenom: string;
  nb_personnes: string;
  created_at: string;
  events: Event;
}

export function useUpcomingEvents(limit = 5) {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRegistrations([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const today = new Date().toISOString().split('T')[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('event_registrations')
      .select('*, events!inner(*)')
      .eq('user_id', user.id)
      .gte('events.date', today)
      .order('events.date', { ascending: true })
      .limit(limit)
      .then(({ data }: { data: RegistrationWithEvent[] | null }) => {
        if (cancelled) return;
        setRegistrations(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id, limit]);

  return { registrations, loading };
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep useUpcomingEvents
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUpcomingEvents.ts
git commit -m "feat: hook useUpcomingEvents — prochains événements inscrits"
```

---

## Task 5: Hook `useDashboardStats`

**Files:**
- Create: `src/hooks/useDashboardStats.ts`

- [ ] **Step 1: Créer le hook**

```typescript
// src/hooks/useDashboardStats.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface DashboardStats {
  eventsThisQuarter: number;
  bilansTotal: number;
}

function getQuarterStart(): string {
  const now = new Date();
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), quarterMonth, 1).toISOString().split('T')[0];
}

export function useDashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ eventsThisQuarter: 0, bilansTotal: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    const db = supabase as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const quarterStart = getQuarterStart();

    Promise.all([
      db.from('event_registrations')
        .select('*, events!inner(date)')
        .eq('user_id', user.id)
        .gte('events.date', quarterStart),
      db.from('bilan_bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('statut', 'confirme'),
    ]).then(([evRes, bilanRes]: [{ data: unknown[] | null }, { data: unknown[] | null }]) => {
      if (cancelled) return;
      setStats({
        eventsThisQuarter: evRes.data?.length ?? 0,
        bilansTotal: bilanRes.data?.length ?? 0,
      });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  return { stats, loading };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useDashboardStats.ts
git commit -m "feat: hook useDashboardStats — KPIs trimestre + bilans confirmés"
```

---

## Task 6: Hooks admin

**Files:**
- Create: `src/hooks/useAdminMembers.ts`
- Create: `src/hooks/useAdminEventRegistrations.ts`

- [ ] **Step 1: Créer `useAdminMembers`**

```typescript
// src/hooks/useAdminMembers.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface MemberWithSub {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: 'member' | 'admin' | null;
  created_at: string;
  subscriptions: Array<{
    plan: string;
    status: string;
    end_date: string | null;
  }>;
}

export function useAdminMembers() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<MemberWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('profiles')
      .select('*, subscriptions(plan, status, end_date)')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }: { data: MemberWithSub[] | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (err) setError('Impossible de charger les membres.');
        else setMembers(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAdmin]);

  return { members, loading, error };
}
```

- [ ] **Step 2: Créer `useAdminEventRegistrations`**

```typescript
// src/hooks/useAdminEventRegistrations.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { EventRegistration } from '../types/database';

export function useAdminEventRegistrations(eventId: string | null) {
  const { isAdmin } = useAuth();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = () => {
    if (!isAdmin || !eventId) { setRegistrations([]); return; }
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .then(({ data }: { data: EventRegistration[] | null }) => {
        setRegistrations(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { refetch(); }, [isAdmin, eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { registrations, loading, refetch };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAdminMembers.ts src/hooks/useAdminEventRegistrations.ts
git commit -m "feat: hooks admin — useAdminMembers + useAdminEventRegistrations"
```

---

## Task 7: Dashboard.tsx — vraies données

**Files:**
- Modify: `src/pages/member/Dashboard.tsx`

- [ ] **Step 1: Réécrire Dashboard.tsx**

Remplacer le contenu complet de `src/pages/member/Dashboard.tsx` par :

```tsx
// src/pages/member/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useUpcomingEvents } from '../../hooks/useUpcomingEvents';
import { supabase } from '../../lib/supabaseClient';
import type { Product } from '../../types/database';

const KPI = ({
  label,
  value,
  sub,
  green = false,
  trend,
}: {
  label: string;
  value: string;
  sub: string;
  green?: boolean;
  trend?: string;
}) => (
  <div className="bg-white rounded-[2px] border border-black/[0.06] p-[22px]">
    <p className="text-[9px] tracking-[0.25em] uppercase text-black/35 mb-[10px]">{label}</p>
    <p
      className={`font-display font-normal text-[42px] leading-none mb-1.5 ${green ? 'text-[oklch(57%_0.065_68)]' : 'text-black'}`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {value}
    </p>
    <p className="text-[10px] text-black/30">{sub}</p>
    {trend && (
      <p className="flex items-center gap-1 text-[10px] text-[oklch(57%_0.065_68)] mt-1">
        <TrendingUp size={12} /> {trend}
      </p>
    )}
  </div>
);

const EventRow = ({
  day,
  month,
  name,
  meta,
}: {
  day: string;
  month: string;
  name: string;
  meta: string;
}) => (
  <div className="flex items-center gap-[14px] p-[14px] rounded-[2px] bg-white hover:bg-black/[0.04] transition-colors">
    <div className="w-11 h-11 rounded-[2px] bg-[#0a0a0a] flex flex-col items-center justify-center flex-shrink-0">
      <span className="text-[16px] font-normal text-white leading-none">{day}</span>
      <span className="text-[8px] tracking-[0.12em] uppercase text-white/50">{month}</span>
    </div>
    <div className="flex-1">
      <p className="text-[12px] font-normal text-black">{name}</p>
      <p className="text-[10px] text-black/38">{meta}</p>
    </div>
    <span className="text-[8px] tracking-[0.15em] uppercase px-2 py-[3px] rounded-[3px] bg-[oklch(75%_0.085_68)/10] text-[oklch(57%_0.065_68)]">
      Confirmé
    </span>
  </div>
);

const Dashboard = () => {
  const { user, subscription } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { registrations, loading: eventsLoading } = useUpcomingEvents(3);
  const [products, setProducts] = useState<Product[]>([]);

  const firstName = user?.firstName || user?.email?.split('@')[0] || 'Membre';

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('products')
      .select('*')
      .eq('active', true)
      .in('category', ['shakes', 'wellness'])
      .order('name', { ascending: true })
      .limit(3)
      .then(({ data }: { data: Product[] | null }) => {
        setProducts(data ?? []);
      });
  }, []);

  const planLabel = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : '—';

  const endDate = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : '—';

  return (
    <div>
      <h1
        className="font-display font-normal text-[38px] text-black leading-none mb-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Bonjour,{' '}
        <em className="italic text-black/40">{firstName}</em>
      </h1>
      <p className="text-[11px] text-black/35 tracking-[0.05em] mb-9">
        {new Date().toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-9">
        <KPI
          label="Événements"
          value={statsLoading ? '…' : String(stats.eventsThisQuarter)}
          sub="ce trimestre"
        />
        <KPI
          label="Bilans"
          value={statsLoading ? '…' : String(stats.bilansTotal)}
          sub="bilans confirmés"
          green={stats.bilansTotal > 0}
        />
        <KPI
          label="Abonnement"
          value={planLabel}
          sub={subscription?.endDate ? `Renouvellement : ${endDate}` : 'Actif'}
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 mb-4">
        {/* Abonnement card */}
        <div className="bg-[#0a0a0a] rounded-[2px] p-6">
          <div className="flex justify-between items-start mb-5">
            <h3
              className="font-display font-normal text-white text-[24px] leading-[1.0]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Plan<br />
              <em className="italic text-white/55">{planLabel}</em>
            </h3>
            <span className="text-[8px] tracking-[0.2em] uppercase bg-[oklch(8%_0.005_55)] text-white px-[10px] py-1 rounded-[3px]">
              {subscription?.status === 'active' ? 'Actif' : subscription?.status ?? '—'}
            </span>
          </div>
          {[
            { label: 'Shakes à -10%', on: true },
            { label: '2 bilans/mois offerts', on: true },
            { label: 'Accès ateliers prioritaire', on: true },
            { label: 'Programme de parrainage Óra+', on: false },
          ].map((perk) => (
            <div
              key={perk.label}
              className={`flex items-center gap-2.5 text-[11px] mb-2.5 ${perk.on ? 'text-white/85' : 'text-white/25'}`}
            >
              <span className={perk.on ? 'text-[oklch(57%_0.065_68)]' : 'text-white/20'}>✓</span>
              {perk.label}
            </div>
          ))}
          <p className="text-[10px] text-white/22 mt-4">
            {subscription?.autoRenew ? 'Renouvellement automatique' : 'Sans renouvellement automatique'}
            {subscription?.endDate ? ` · ${endDate}` : ''}
          </p>
        </div>

        {/* Prochains événements */}
        <div className="bg-white rounded-[2px] border border-black/[0.06] p-6">
          <div className="flex justify-between items-center mb-5">
            <p className="text-[12px] font-normal text-black">Mes prochains événements</p>
            <Link
              to="/evenements"
              className="text-[10px] text-black/40 border-b border-black/20 pb-px"
            >
              Voir tout
            </Link>
          </div>
          {eventsLoading ? (
            <p className="text-[11px] text-black/30">Chargement…</p>
          ) : registrations.length === 0 ? (
            <p className="text-[11px] text-black/30 leading-relaxed">
              Aucun événement à venir.{' '}
              <Link to="/evenements" className="underline hover:text-black transition-colors">
                Voir les événements
              </Link>
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {registrations.map((reg) => {
                const d = new Date(reg.events.date + 'T00:00:00');
                return (
                  <EventRow
                    key={reg.id}
                    day={String(d.getDate())}
                    month={d.toLocaleDateString('fr-FR', { month: 'short' })}
                    name={reg.events.title}
                    meta={[
                      reg.events.heure?.slice(0, 5),
                      reg.events.location ?? reg.events.meeting_point,
                    ].filter(Boolean).join(' · ')}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Commander à nouveau */}
      <div className="bg-white rounded-[2px] border border-black/[0.06] p-6">
        <div className="flex justify-between items-center mb-5">
          <p className="text-[12px] font-normal text-black">Commander à nouveau</p>
          <Link
            to="/menu"
            className="text-[10px] text-black/40 border-b border-black/20 pb-px"
          >
            Voir la carte
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="text-[11px] text-black/30">Chargement des produits…</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {products.map((product) => (
              <Link
                key={product.id}
                to="/menu"
                className="flex items-center gap-3 p-3 rounded-[2px] bg-white hover:bg-black/[0.04] transition-colors"
              >
                <div className="w-8 h-8 rounded-[2px] bg-gradient-to-b from-[oklch(22%_0.005_55)] to-[oklch(11%_0.004_55)] flex-shrink-0" />
                <p className="flex-1 text-[12px] font-normal text-black">{product.name}</p>
                <p className="text-[12px] text-black/40">
                  {product.price ? `${product.price.toFixed(2).replace('.', ',')}€` : '—'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
```

- [ ] **Step 2: Tester dans le navigateur**

Lancer `npm run dev`, aller sur `/demo-espace` ou `/mon-espace`.
Vérifier :
- KPIs affichent "…" pendant le chargement puis les valeurs réelles (0 si aucune donnée)
- Section événements affiche "Aucun événement à venir" si aucune inscription
- Produits se chargent depuis Supabase

- [ ] **Step 3: Commit**

```bash
git add src/pages/member/Dashboard.tsx
git commit -m "feat: Dashboard membre — KPIs + événements + produits depuis Supabase"
```

---

## Task 8: History.tsx — vraies commandes

**Files:**
- Modify: `src/pages/member/History.tsx`

- [ ] **Step 1: Réécrire History.tsx**

Remplacer le contenu de `src/pages/member/History.tsx` par :

```tsx
// src/pages/member/History.tsx
import { ChevronRight, Calendar, MapPin } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';

const History = () => {
  const { orders, loading, error, totalThisMonth, topProducts } = useOrders();

  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 flex flex-col gap-6">
        <h1
          className="font-display font-normal text-[28px] text-black leading-none"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Historique
        </h1>

        {error && (
          <p className="text-[11px] text-red-500/80">{error}</p>
        )}

        {loading ? (
          <p className="text-[11px] text-black/30">Chargement…</p>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-[2px] border border-black/[0.06] p-10 text-center">
            <p className="text-[13px] font-normal text-black mb-2">Aucune commande</p>
            <p className="text-[11px] font-light text-black/40">
              Votre historique de commandes apparaîtra ici.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[2px] border border-black/[0.06] overflow-hidden">
            {orders.map((order, index) => {
              const itemNames = order.order_items.map(i => i.product_name).join(', ');
              const date = new Date(order.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
              });
              return (
                <div
                  key={order.id}
                  className={`group flex flex-col sm:flex-row items-start sm:items-center p-6 hover:bg-black/[0.02] transition-colors duration-200 gap-4 ${
                    index < orders.length - 1 ? 'border-b border-black/[0.05]' : ''
                  }`}
                >
                  <div className={`w-11 h-11 rounded-[2px] flex items-center justify-center text-xl shrink-0 ${
                    order.status === 'pending' ? 'bg-[oklch(57%_0.065_68)] text-white' : 'bg-black/[0.05]'
                  }`}>
                    🥤
                  </div>

                  <div className="flex-1 space-y-1">
                    <h4 className="text-[13px] font-normal text-black">{itemNames || '—'}</h4>
                    <div className="flex flex-wrap gap-4 text-[10px] font-light text-black/40">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} strokeWidth={1.3} /> {date}
                      </span>
                      {order.status === 'pending' && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} strokeWidth={1.3} /> En cours
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {order.status === 'pending' && (
                      <span className="text-[8px] font-normal uppercase tracking-[0.15em] text-[oklch(57%_0.065_68)] border border-[oklch(57%_0.065_68)]/30 px-2.5 py-1 rounded-[2px]">
                        En attente
                      </span>
                    )}
                    <p className="text-[15px] font-normal text-black">
                      {order.total.toFixed(2).replace('.', ',')}€
                    </p>
                    <ChevronRight size={15} strokeWidth={1.3} className="text-black/20 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Stats */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-[oklch(8%_0.005_55)] rounded-[2px] p-8 text-white">
          <p className="text-[9px] font-normal uppercase tracking-[0.25em] text-white/30 mb-3">
            Total ({monthLabel})
          </p>
          <p
            className="font-display font-normal text-white leading-none mb-6"
            style={{ fontFamily: 'var(--font-display)', fontSize: '40px' }}
          >
            {totalThisMonth.toFixed(2).replace('.', ',')}€
          </p>
          <div className="border-t border-white/[0.08] pt-5 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-light text-white/50">Commandes</span>
              <span className="text-[13px] font-normal text-white">{orders.length}</span>
            </div>
            {orders.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-light text-white/50">Moyenne</span>
                <span className="text-[13px] font-normal text-white">
                  {(orders.reduce((s, o) => s + o.total, 0) / orders.length).toFixed(2).replace('.', ',')}€
                </span>
              </div>
            )}
          </div>
        </div>

        {topProducts.length > 0 && (
          <div className="bg-white rounded-[2px] p-6 border border-black/[0.06]">
            <p className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/35 mb-5">
              Produits favoris
            </p>
            <div className="flex flex-col divide-y divide-black/[0.05]">
              {topProducts.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-normal text-black/25 tabular-nums w-5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[12px] font-normal text-black">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-normal text-black/35">{item.count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
```

- [ ] **Step 2: Vérifier dans le navigateur**

Sur `/mon-espace/historique` :
- Si pas de commandes : affiche l'état vide avec le message
- La sidebar affiche 0.00€ pour le mois courant si aucune commande

- [ ] **Step 3: Commit**

```bash
git add src/pages/member/History.tsx
git commit -m "feat: History membre — commandes réelles + stats + top produits"
```

---

## Task 9: Profile.tsx — données réelles + préférences

**Files:**
- Modify: `src/pages/member/Profile.tsx`

- [ ] **Step 1: Réécrire Profile.tsx**

Remplacer le contenu de `src/pages/member/Profile.tsx` par :

```tsx
// src/pages/member/Profile.tsx
import { useState } from 'react';
import { User, Mail, Phone, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [prefs, setPrefs] = useState({
    notifications: true,
    newsletter: true,
  });

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '—';

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateProfile({ firstName, lastName, phone });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('profiles')
        .update({ preferences: prefs })
        .eq('id', user?.id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const togglePref = (key: 'notifications' | 'newsletter') => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left — Identity */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-white rounded-[2px] p-8 text-center border border-black/[0.06]">
          <div className="w-24 h-24 bg-black/[0.04] rounded-full mx-auto mb-6 flex items-center justify-center">
            <span
              className="text-3xl font-light text-black/40"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {(firstName[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
            </span>
          </div>
          <h2
            className="font-display font-normal text-[22px] text-black mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {firstName} {lastName}
          </h2>
          <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-black/35 mb-6">
            Membre depuis {memberSince}
          </p>
        </div>

        <div className="bg-[oklch(8%_0.005_55)] rounded-[2px] p-6 text-white">
          <p className="text-[9px] font-normal uppercase tracking-[0.2em] text-white/30 mb-5">
            Préférences
          </p>
          <div className="flex flex-col gap-4">
            {([
              { key: 'notifications' as const, label: 'Notifications' },
              { key: 'newsletter' as const, label: 'Newsletter' },
            ]).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[12px] font-light text-white/65">{label}</span>
                <button
                  type="button"
                  aria-label={`${label} ${prefs[key] ? 'activé' : 'désactivé'}`}
                  onClick={() => togglePref(key)}
                  className={`w-9 h-5 rounded-full p-[3px] transition-colors duration-200 flex items-center ${prefs[key] ? 'bg-[oklch(57%_0.065_68)]' : 'bg-white/15'}`}
                >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 ${prefs[key] ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Forms */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="bg-white rounded-[2px] p-8 border border-black/[0.06]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[13px] font-normal text-black">Informations Personnelles</h3>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-[10px] font-normal uppercase tracking-[0.1em] text-black/35 hover:text-black transition-colors duration-200 disabled:opacity-40"
            >
              {saving ? 'Sauvegarde…' : saveSuccess ? 'Sauvegardé ✓' : 'Sauvegarder'}
            </button>
          </div>

          {saveError && (
            <p className="text-[11px] text-red-500/80 mb-4">{saveError}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'Prénom', Icon: User, value: firstName, onChange: setFirstName, type: 'text' },
              { label: 'Nom', Icon: User, value: lastName, onChange: setLastName, type: 'text' },
            ].map((field) => (
              <div key={field.label} className="flex flex-col gap-2">
                <label className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/35 flex items-center gap-1.5">
                  <field.Icon size={11} strokeWidth={1.3} />
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  className="w-full h-11 bg-black/[0.03] rounded-[2px] px-4 text-[13px] font-normal text-black border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 transition-colors duration-200"
                />
              </div>
            ))}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/35 flex items-center gap-1.5">
                <Mail size={11} strokeWidth={1.3} /> Email
              </label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full h-11 bg-black/[0.03] rounded-[2px] px-4 text-[13px] font-normal text-black/40 border border-transparent cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/35 flex items-center gap-1.5">
                <Phone size={11} strokeWidth={1.3} /> Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+596 696 00 00 00"
                className="w-full h-11 bg-black/[0.03] rounded-[2px] px-4 text-[13px] font-normal text-black border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 transition-colors duration-200"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-white rounded-[2px] p-6 text-left hover:bg-black/[0.02] transition-colors duration-200 border border-black/[0.06]">
            <div className="w-9 h-9 bg-black/[0.04] rounded-[2px] flex items-center justify-center text-black/50 mb-4">
              <Shield size={17} strokeWidth={1.3} />
            </div>
            <h4 className="text-[13px] font-normal text-black mb-1">Sécurité</h4>
            <p className="text-[11px] font-light text-black/40">Changer mot de passe</p>
          </button>

          <button
            onClick={logout}
            className="bg-white rounded-[2px] p-6 text-left hover:bg-red-50/40 transition-colors duration-200 border border-black/[0.06] group"
          >
            <div className="w-9 h-9 bg-black/[0.04] rounded-[2px] flex items-center justify-center text-black/50 mb-4 group-hover:bg-red-50 group-hover:text-red-500 transition-colors duration-200">
              <LogOut size={17} strokeWidth={1.3} />
            </div>
            <h4 className="text-[13px] font-normal text-black mb-1 group-hover:text-red-600 transition-colors duration-200">
              Déconnexion
            </h4>
            <p className="text-[11px] font-light text-black/40">Se déconnecter</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
```

- [ ] **Step 2: Vérifier dans le navigateur**

Sur `/mon-espace/profil` :
- "Membre depuis" affiche la vraie date du compte
- Modifier le prénom et cliquer "Sauvegarder" : le texte passe à "Sauvegardé ✓" pendant 3 secondes
- Les toggles préférences sont fonctionnels

- [ ] **Step 3: Commit**

```bash
git add src/pages/member/Profile.tsx
git commit -m "feat: Profile membre — formulaire fonctionnel + préférences + vraie date"
```

---

## Task 10: EvenementDetail — `registration_open` check

**Files:**
- Modify: `src/pages/EvenementDetail.tsx`

La registration form est déjà fonctionnelle (elle sauvegarde `user_id`, préremplit depuis le profil, gère les doublons). Il manque uniquement la vérification du champ `registration_open`.

- [ ] **Step 1: Lire le fichier pour trouver la condition `places_max`**

```bash
grep -n "places_max\|submitStatus\|registration_open" src/pages/EvenementDetail.tsx
```

- [ ] **Step 2: Ajouter le check `registration_open` dans `onSubmit`**

Trouver la fonction `onSubmit` (autour de la ligne 129). Juste avant la vérification `places_max`, ajouter :

```typescript
// Avant le check places_max existant :
if (event.registration_open === false) {
  setSubmitStatus('error');
  return;
}
```

- [ ] **Step 3: Afficher "Inscriptions fermées" dans le JSX**

Trouver l'endroit dans le JSX où le formulaire est rendu (chercher `<form`). Envelopper avec une condition :

```tsx
{event.registration_open === false ? (
  <div className="text-center py-8">
    <p className="text-[13px] font-normal text-black mb-2">Inscriptions fermées</p>
    <p className="text-[11px] font-light text-black/40">
      Les inscriptions pour cet événement ne sont plus disponibles.
    </p>
  </div>
) : (
  /* form JSX existant */
)}
```

- [ ] **Step 4: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep EvenementDetail
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/EvenementDetail.tsx
git commit -m "feat: EvenementDetail — check registration_open avant soumission"
```

---

## Task 11: Admin Layout + Routes

**Files:**
- Create: `src/pages/admin/AdminLayout.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Créer `AdminLayout.tsx`**

```tsx
// src/pages/admin/AdminLayout.tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, Package, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { label: 'Vue d\'ensemble', icon: LayoutDashboard, path: '/admin' },
  { label: 'Membres', icon: Users, path: '/admin/membres' },
  { label: 'Événements', icon: CalendarDays, path: '/admin/evenements' },
  { label: 'Produits', icon: Package, path: '/admin/produits' },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/connexion');
  };

  return (
    <div className="flex min-h-screen bg-[oklch(98.5%_0.004_55)]">
      {/* Sidebar */}
      <aside className="w-[220px] bg-white border-r border-black/[0.06] flex flex-col py-8 flex-shrink-0">
        <Link
          to="/"
          className="px-6 mb-8 font-display font-normal text-[16px] tracking-[0.28em] uppercase text-black block"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Pessóra
        </Link>
        <p className="px-6 mb-6 text-[8px] font-normal uppercase tracking-[0.35em] text-black/30">
          Admin
        </p>

        <nav className="flex-1 px-3" aria-label="Navigation admin">
          {NAV.map((item) => {
            const active = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-[10px] px-3 py-[9px] rounded-[2px] mb-1 text-[11px] transition-colors ${
                  active
                    ? 'bg-black text-white font-normal'
                    : 'text-black/50 hover:bg-black/[0.04] hover:text-black font-light'
                }`}
              >
                <item.icon size={14} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 mt-4 border-t border-black/[0.06] pt-4">
          <p className="px-3 mb-2 text-[10px] font-normal text-black truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-[10px] px-3 py-[9px] rounded-[2px] text-[11px] text-black/35 hover:text-black transition-colors w-full font-light"
          >
            <LogOut size={14} strokeWidth={1.5} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-10">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
```

- [ ] **Step 2: Ajouter les routes admin dans `App.tsx`**

Dans `src/App.tsx`, ajouter les lazy imports :

```typescript
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminMembers = lazy(() => import('./pages/admin/AdminMembers'));
const AdminEvenements = lazy(() => import('./pages/admin/AdminEvenements'));
const AdminProduits = lazy(() => import('./pages/admin/AdminProduits'));
```

Remplacer la route admin existante :
```tsx
// Avant :
<Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />

// Après :
<Route path="/admin" element={
  <ProtectedAdminRoute>
    <AdminLayout><AdminOverview /></AdminLayout>
  </ProtectedAdminRoute>
} />
<Route path="/admin/membres" element={
  <ProtectedAdminRoute>
    <AdminLayout><AdminMembers /></AdminLayout>
  </ProtectedAdminRoute>
} />
<Route path="/admin/evenements" element={
  <ProtectedAdminRoute>
    <AdminLayout><AdminEvenements /></AdminLayout>
  </ProtectedAdminRoute>
} />
<Route path="/admin/produits" element={
  <ProtectedAdminRoute>
    <AdminLayout><AdminProduits /></AdminLayout>
  </ProtectedAdminRoute>
} />
```

Aussi dans `AppLayout`, ajouter `/admin` aux zones sans header/footer :

```typescript
// Ligne 43 — ajouter isAdminArea
const isAdminArea = location.pathname.startsWith('/admin');

// Ligne 65 — mettre à jour la condition
{!isMemberArea && !isAuthPage && !isLuxeMockup && !isAdminArea && <Header />}
// idem pour Footer et Chatbot
```

- [ ] **Step 3: Vérifier que `/admin` charge sans erreur**

```bash
npm run dev
```

Naviguer vers `/admin` avec un compte admin. La sidebar doit apparaître.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminLayout.tsx src/App.tsx
git commit -m "feat: AdminLayout sidebar + routes /admin/* protégées"
```

---

## Task 12: AdminOverview

**Files:**
- Create: `src/pages/admin/AdminOverview.tsx`

- [ ] **Step 1: Créer `AdminOverview.tsx`**

```tsx
// src/pages/admin/AdminOverview.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface OverviewStats {
  totalMembers: number;
  activeSubscriptions: number;
  newMembersThisMonth: number;
  nextEvent: { title: string; date: string; registrationCount: number } | null;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<OverviewStats>({
    totalMembers: 0,
    activeSubscriptions: 0,
    newMembersThisMonth: 0,
    nextEvent: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = supabase as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const today = new Date().toISOString().split('T')[0];

    Promise.all([
      db.from('profiles').select('id', { count: 'exact' }).neq('role', 'admin'),
      db.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
      db.from('profiles').select('id', { count: 'exact' }).gte('created_at', monthStart).neq('role', 'admin'),
      db.from('events')
        .select('title, date, event_registrations(count)')
        .eq('active', true)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(1)
        .single(),
    ]).then(([membersRes, subsRes, newMembersRes, nextEvRes]) => {
      setStats({
        totalMembers: membersRes.count ?? 0,
        activeSubscriptions: subsRes.count ?? 0,
        newMembersThisMonth: newMembersRes.count ?? 0,
        nextEvent: nextEvRes.data
          ? {
              title: nextEvRes.data.title,
              date: nextEvRes.data.date,
              registrationCount: Number(nextEvRes.data.event_registrations?.[0]?.count ?? 0),
            }
          : null,
      });
      setLoading(false);
    });
  }, []);

  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="bg-white rounded-[2px] border border-black/[0.06] p-6">
      <p className="text-[9px] tracking-[0.25em] uppercase text-black/35 mb-3">{label}</p>
      <p className="font-display font-normal text-[36px] leading-none text-black"
         style={{ fontFamily: 'var(--font-display)' }}>
        {loading ? '…' : value}
      </p>
    </div>
  );

  return (
    <div>
      <h1
        className="font-display font-normal text-[32px] text-black leading-none mb-8"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Vue d'ensemble
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Stat label="Membres" value={stats.totalMembers} />
        <Stat label="Abonnements actifs" value={stats.activeSubscriptions} />
        <Stat label="Nouveaux ce mois" value={stats.newMembersThisMonth} />
        <Stat label="Prochain événement" value={stats.nextEvent?.title ?? '—'} />
      </div>

      {stats.nextEvent && (
        <div className="bg-[#0a0a0a] rounded-[2px] p-6 text-white max-w-md">
          <p className="text-[8px] font-light tracking-[0.32em] uppercase text-white/30 mb-2">
            Prochain événement
          </p>
          <p className="text-[16px] font-normal text-white mb-1">{stats.nextEvent.title}</p>
          <p className="text-[11px] font-light text-white/40">
            {new Date(stats.nextEvent.date + 'T00:00:00').toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long',
            })} · {stats.nextEvent.registrationCount} inscrit(s)
          </p>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Link to="/admin/membres" className="text-[10px] font-light uppercase tracking-[0.12em] text-black/50 border-b border-black/20 pb-px hover:text-black hover:border-black transition-colors">
          Voir les membres →
        </Link>
        <Link to="/admin/evenements" className="text-[10px] font-light uppercase tracking-[0.12em] text-black/50 border-b border-black/20 pb-px hover:text-black hover:border-black transition-colors">
          Gérer les événements →
        </Link>
      </div>
    </div>
  );
};

export default AdminOverview;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/AdminOverview.tsx
git commit -m "feat: AdminOverview — stats membres, abonnements, prochain événement"
```

---

## Task 13: AdminMembers

**Files:**
- Create: `src/pages/admin/AdminMembers.tsx`

- [ ] **Step 1: Créer `AdminMembers.tsx`**

```tsx
// src/pages/admin/AdminMembers.tsx
import { useState } from 'react';
import { useAdminMembers } from '../../hooks/useAdminMembers';

const PLAN_COLORS: Record<string, string> = {
  free: 'text-black/40',
  starter: 'text-[oklch(57%_0.065_68)]',
  premium: 'text-[oklch(40%_0.08_68)]',
  vip: 'text-black',
};

const AdminMembers = () => {
  const { members, loading, error } = useAdminMembers();
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(q);
    const sub = m.subscriptions?.[0];
    const matchPlan = filterPlan === 'all' || sub?.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  return (
    <div>
      <h1
        className="font-display font-normal text-[32px] text-black leading-none mb-8"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Membres
      </h1>

      <div className="flex gap-3 mb-6">
        <input
          type="search"
          placeholder="Rechercher un membre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-10 flex-1 max-w-xs bg-white rounded-[2px] border border-black/[0.08] px-4 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        />
        <select
          value={filterPlan}
          onChange={e => setFilterPlan(e.target.value)}
          className="h-10 bg-white rounded-[2px] border border-black/[0.08] px-3 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <option value="all">Tous les plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="premium">Premium</option>
          <option value="vip">VIP</option>
        </select>
      </div>

      {error && <p className="text-[11px] text-red-500/80 mb-4">{error}</p>}

      <div className="bg-white rounded-[2px] border border-black/[0.06] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.05]">
              {['Membre', 'Email', 'Plan', 'Statut', 'Inscrit le'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[8px] font-normal uppercase tracking-[0.25em] text-black/35">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-6 text-[11px] text-black/30">Chargement…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-6 text-[11px] text-black/30">Aucun membre trouvé.</td></tr>
            ) : (
              filtered.map(m => {
                const sub = m.subscriptions?.[0];
                return (
                  <tr key={m.id} className="border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors">
                    <td className="px-5 py-4 text-[12px] font-normal text-black">
                      {m.first_name} {m.last_name}
                    </td>
                    <td className="px-5 py-4 text-[11px] font-light text-black/50">{m.email ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-normal uppercase tracking-[0.12em] ${PLAN_COLORS[sub?.plan ?? 'free'] ?? 'text-black/40'}`}>
                        {sub?.plan ?? 'free'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[9px] font-normal uppercase tracking-[0.12em] px-2 py-[3px] rounded-[2px] ${
                        sub?.status === 'active' ? 'bg-[oklch(57%_0.065_68)/10] text-[oklch(40%_0.065_68)]' : 'bg-black/5 text-black/35'
                      }`}>
                        {sub?.status ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[11px] font-light text-black/40">
                      {new Date(m.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[10px] font-light text-black/35">
        {filtered.length} membre{filtered.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

export default AdminMembers;
```

- [ ] **Step 2: Vérifier dans le navigateur**

Naviguer vers `/admin/membres`. La table doit afficher tous les membres depuis Supabase.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/AdminMembers.tsx
git commit -m "feat: AdminMembers — table membres + filtre plan + recherche"
```

---

## Task 14: AdminEvenements — CRUD

**Files:**
- Create: `src/pages/admin/AdminEvenements.tsx`

- [ ] **Step 1: Créer `AdminEvenements.tsx`**

```tsx
// src/pages/admin/AdminEvenements.tsx
import { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminEventRegistrations } from '../../hooks/useAdminEventRegistrations';
import type { Event } from '../../types/database';

interface EventWithCount extends Event {
  event_registrations: { count: number | string }[];
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  type: 'event' as Event['type'],
  date: '',
  heure: '',
  location: '',
  meeting_point: '',
  description: '',
  places_max: '',
  image_url: '',
  price: '',
  is_free: true,
  registration_open: true,
  active: true,
};

type FormState = typeof EMPTY_FORM;

const TYPE_OPTIONS: Event['type'][] = ['event', 'popup', 'atelier', 'partenariat', 'bilan', 'run_club'];
const TYPE_LABELS: Record<Event['type'], string> = {
  event: 'Événement', popup: 'Pop-up', atelier: 'Atelier',
  partenariat: 'Partenariat', bilan: 'Bilan', run_club: 'Course',
};

function slugify(str: string) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EventForm = ({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<FormState>;
  onSave: (data: FormState) => Promise<void>;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.title || !form.date) { setError('Titre et date requis.'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...form, slug: form.slug || slugify(form.title) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full h-10 bg-[oklch(98.5%_0.004_55)] rounded-[2px] border border-black/[0.08] px-3 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20';

  return (
    <div className="bg-white rounded-[2px] border border-black/[0.06] p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Titre *</label>
          <input className={inputClass} value={form.title}
            onChange={e => { set('title', e.target.value); if (!initial?.slug) set('slug', slugify(e.target.value)); }} />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Type</label>
          <select className={inputClass} value={form.type}
            onChange={e => set('type', e.target.value)}>
            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Date *</label>
          <input type="date" className={inputClass} value={form.date}
            onChange={e => set('date', e.target.value)} />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Heure</label>
          <input type="time" className={inputClass} value={form.heure}
            onChange={e => set('heure', e.target.value)} />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Lieu</label>
          <input className={inputClass} value={form.location}
            onChange={e => set('location', e.target.value)} />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Point de rendez-vous</label>
          <input className={inputClass} value={form.meeting_point}
            onChange={e => set('meeting_point', e.target.value)} />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Capacité max</label>
          <input type="number" className={inputClass} value={form.places_max}
            onChange={e => set('places_max', e.target.value)} placeholder="Illimité" />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Image URL</label>
          <input className={inputClass} value={form.image_url}
            onChange={e => set('image_url', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Description</label>
          <textarea className={`${inputClass} h-24 py-2.5 resize-none`} value={form.description}
            onChange={e => set('description', e.target.value)} />
        </div>
        <div className="flex items-center gap-6">
          {[
            { key: 'is_free' as const, label: 'Entrée libre' },
            { key: 'registration_open' as const, label: 'Inscriptions ouvertes' },
            { key: 'active' as const, label: 'Visible' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form[key]}
                onChange={e => set(key, e.target.checked)}
                className="w-4 h-4 accent-black rounded-[2px]" />
              <span className="text-[11px] text-black/60">{label}</span>
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-[11px] text-red-500/80 mb-3">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-6 bg-black text-white rounded-[2px] text-[10px] font-normal uppercase tracking-[0.12em] hover:bg-black/85 transition-colors disabled:opacity-40"
        >
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
        <button
          onClick={onCancel}
          className="h-10 px-6 border border-black/15 rounded-[2px] text-[10px] font-light uppercase tracking-[0.12em] text-black/50 hover:border-black/30 hover:text-black transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

const RegistrantsList = ({ eventId }: { eventId: string }) => {
  const { registrations, loading } = useAdminEventRegistrations(eventId);

  const exportCSV = () => {
    const rows = [
      ['Prénom', 'Nom', 'Téléphone', 'Nb personnes', 'Info souhaitée'],
      ...registrations.map(r => [r.prenom, r.nom, r.telephone, r.nb_personnes, r.souhait_info]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `inscrits-${eventId}.csv`;
    a.click();
  };

  if (loading) return <p className="text-[11px] text-black/30 px-5 py-4">Chargement…</p>;

  return (
    <div className="border-t border-black/[0.05]">
      <div className="flex justify-between items-center px-5 py-3">
        <p className="text-[10px] font-normal text-black/50">{registrations.length} inscrit(s)</p>
        {registrations.length > 0 && (
          <button onClick={exportCSV}
            className="text-[9px] font-light uppercase tracking-[0.12em] text-black/40 hover:text-black border-b border-black/20 pb-px transition-colors">
            Exporter CSV
          </button>
        )}
      </div>
      {registrations.length > 0 && (
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.04]">
              {['Prénom', 'Nom', 'Téléphone', 'Groupe', 'Newsletter'].map(h => (
                <th key={h} className="px-5 py-2 text-left text-[8px] uppercase tracking-[0.2em] text-black/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {registrations.map(r => (
              <tr key={r.id} className="border-b border-black/[0.03] hover:bg-black/[0.015]">
                <td className="px-5 py-3 text-[11px] text-black">{r.prenom}</td>
                <td className="px-5 py-3 text-[11px] text-black">{r.nom}</td>
                <td className="px-5 py-3 text-[11px] text-black/60">{r.telephone}</td>
                <td className="px-5 py-3 text-[11px] text-black/60">{r.nb_personnes}</td>
                <td className="px-5 py-3 text-[11px] text-black/40">{r.souhait_info}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const AdminEvenements = () => {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<EventWithCount | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchEvents = () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('events')
      .select('*, event_registrations(count)')
      .order('date', { ascending: true })
      .then(({ data }: { data: EventWithCount[] | null }) => {
        setEvents(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (form: FormState) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('events').insert({
      title: form.title,
      slug: form.slug,
      type: form.type,
      date: form.date,
      heure: form.heure || null,
      location: form.location || null,
      meeting_point: form.meeting_point || null,
      description: form.description || null,
      places_max: form.places_max ? Number(form.places_max) : null,
      image_url: form.image_url || null,
      price: form.price ? Number(form.price) : 0,
      is_free: form.is_free,
      registration_open: form.registration_open,
      active: form.active,
    });
    if (error) throw new Error(error.message);
    setShowForm(false);
    fetchEvents();
  };

  const handleUpdate = async (form: FormState) => {
    if (!editEvent) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('events').update({
      title: form.title,
      slug: form.slug,
      type: form.type,
      date: form.date,
      heure: form.heure || null,
      location: form.location || null,
      meeting_point: form.meeting_point || null,
      description: form.description || null,
      places_max: form.places_max ? Number(form.places_max) : null,
      image_url: form.image_url || null,
      price: form.price ? Number(form.price) : 0,
      is_free: form.is_free,
      registration_open: form.registration_open,
      active: form.active,
    }).eq('id', editEvent.id);
    if (error) throw new Error(error.message);
    setEditEvent(null);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet événement ?')) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('events').delete().eq('id', id);
    fetchEvents();
  };

  const toggleRegistrationOpen = async (ev: EventWithCount) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('events')
      .update({ registration_open: !ev.registration_open })
      .eq('id', ev.id);
    fetchEvents();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display font-normal text-[32px] text-black leading-none"
            style={{ fontFamily: 'var(--font-display)' }}>
          Événements
        </h1>
        <button
          onClick={() => { setShowForm(true); setEditEvent(null); }}
          className="flex items-center gap-2 h-10 px-5 bg-black text-white rounded-[2px] text-[10px] font-normal uppercase tracking-[0.12em] hover:bg-black/85 transition-colors"
        >
          <Plus size={14} /> Créer
        </button>
      </div>

      {showForm && !editEvent && (
        <EventForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {loading ? (
        <p className="text-[11px] text-black/30">Chargement…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map(ev => {
            const count = Number(ev.event_registrations?.[0]?.count ?? 0);
            const isEditing = editEvent?.id === ev.id;
            const isExpanded = expandedId === ev.id;
            return (
              <div key={ev.id} className="bg-white rounded-[2px] border border-black/[0.06] overflow-hidden">
                {isEditing ? (
                  <div className="p-4">
                    <EventForm
                      initial={{
                        title: ev.title, slug: ev.slug, type: ev.type,
                        date: ev.date, heure: ev.heure ?? '',
                        location: ev.location ?? '', meeting_point: ev.meeting_point ?? '',
                        description: ev.description ?? '',
                        places_max: ev.places_max ? String(ev.places_max) : '',
                        image_url: ev.image_url ?? '',
                        price: ev.price ? String(ev.price) : '',
                        is_free: ev.is_free, registration_open: ev.registration_open,
                        active: ev.active,
                      }}
                      onSave={handleUpdate}
                      onCancel={() => setEditEvent(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-0.5">
                        <p className="text-[12px] font-normal text-black">{ev.title}</p>
                        <span className="text-[8px] font-light uppercase tracking-[0.2em] text-black/35">
                          {TYPE_LABELS[ev.type]}
                        </span>
                        {!ev.active && (
                          <span className="text-[8px] uppercase tracking-[0.15em] px-1.5 py-0.5 bg-black/5 text-black/30 rounded-[2px]">
                            Masqué
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-light text-black/40">
                        {new Date(ev.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {ev.heure ? ` · ${ev.heure.slice(0, 5)}` : ''}
                        {ev.location ? ` · ${ev.location}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => toggleRegistrationOpen(ev)}
                        className={`text-[8px] font-normal uppercase tracking-[0.15em] px-2.5 py-1 rounded-[2px] transition-colors ${
                          ev.registration_open
                            ? 'bg-[oklch(57%_0.065_68)/10] text-[oklch(40%_0.065_68)]'
                            : 'bg-black/5 text-black/35'
                        }`}
                      >
                        {ev.registration_open ? 'Inscriptions ouvertes' : 'Fermées'}
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                        className="flex items-center gap-1 text-[10px] font-light text-black/40 hover:text-black transition-colors"
                      >
                        <Users size={13} /> {count}
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      <button
                        onClick={() => { setEditEvent(ev); setShowForm(false); }}
                        className="text-[10px] font-light text-black/40 hover:text-black transition-colors border-b border-black/20 pb-px"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="text-[10px] font-light text-red-400 hover:text-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
                {isExpanded && !isEditing && <RegistrantsList eventId={ev.id} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminEvenements;
```

- [ ] **Step 2: Vérifier dans le navigateur**

Naviguer vers `/admin/evenements`.
- Créer un événement test → il apparaît dans la liste
- Cliquer le badge "Inscriptions ouvertes" → ça bascule
- Cliquer le compte d'inscrits → la liste des inscrits s'ouvre
- Modifier → le formulaire pré-rempli s'affiche
- Supprimer → confirmation + disparition

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/AdminEvenements.tsx
git commit -m "feat: AdminEvenements — CRUD complet + liste inscrits + export CSV"
```

---

## Task 15: AdminProduits — CRUD

**Files:**
- Create: `src/pages/admin/AdminProduits.tsx`

- [ ] **Step 1: Créer `AdminProduits.tsx`**

```tsx
// src/pages/admin/AdminProduits.tsx
import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { Product } from '../../types/database';

const CATEGORIES = ['wellness', 'energie', 'shakes', 'coffee'];

const EMPTY_FORM = {
  name: '',
  category: 'shakes',
  price: '',
  calories: '',
  protein: '',
  description: '',
  image_url: '',
  active: true,
};
type FormState = typeof EMPTY_FORM;

const ProductForm = ({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<FormState>;
  onSave: (data: FormState) => Promise<void>;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name) { setError('Nom requis.'); return; }
    setSaving(true);
    setError(null);
    try { await onSave(form); } catch (e) { setError(e instanceof Error ? e.message : 'Erreur'); }
    finally { setSaving(false); }
  };

  const inputClass = 'w-full h-10 bg-[oklch(98.5%_0.004_55)] rounded-[2px] border border-black/[0.08] px-3 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20';

  return (
    <div className="bg-white rounded-[2px] border border-black/[0.06] p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Nom *</label>
          <input className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Catégorie</label>
          <select className={inputClass} value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Prix (€)</label>
          <input type="number" step="0.01" className={inputClass} value={form.price}
            onChange={e => set('price', e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Calories</label>
          <input type="number" className={inputClass} value={form.calories}
            onChange={e => set('calories', e.target.value)} />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Protéines (g)</label>
          <input type="number" className={inputClass} value={form.protein}
            onChange={e => set('protein', e.target.value)} />
        </div>
        <div className="md:col-span-3">
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Description</label>
          <textarea className={`${inputClass} h-20 py-2.5 resize-none`} value={form.description}
            onChange={e => set('description', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Image URL</label>
          <input className={inputClass} value={form.image_url} onChange={e => set('image_url', e.target.value)} />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)}
              className="w-4 h-4 accent-black" />
            <span className="text-[11px] text-black/60">Visible sur le menu</span>
          </label>
        </div>
      </div>
      {error && <p className="text-[11px] text-red-500/80 mb-3">{error}</p>}
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="h-10 px-6 bg-black text-white rounded-[2px] text-[10px] font-normal uppercase tracking-[0.12em] hover:bg-black/85 transition-colors disabled:opacity-40">
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
        <button onClick={onCancel}
          className="h-10 px-6 border border-black/15 rounded-[2px] text-[10px] font-light uppercase tracking-[0.12em] text-black/50 hover:border-black/30 hover:text-black transition-colors">
          Annuler
        </button>
      </div>
    </div>
  );
};

const AdminProduits = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [filterCat, setFilterCat] = useState('all');

  const fetchProducts = () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('products')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data }: { data: Product[] | null }) => {
        setProducts(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleCreate = async (form: FormState) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('products').insert({
      name: form.name,
      category: form.category,
      price: form.price ? Number(form.price) : null,
      calories: form.calories ? Number(form.calories) : null,
      protein: form.protein ? Number(form.protein) : null,
      description: form.description || null,
      image_url: form.image_url || null,
      active: form.active,
    });
    if (error) throw new Error(error.message);
    setShowForm(false);
    fetchProducts();
  };

  const handleUpdate = async (form: FormState) => {
    if (!editProduct) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('products').update({
      name: form.name,
      category: form.category,
      price: form.price ? Number(form.price) : null,
      calories: form.calories ? Number(form.calories) : null,
      protein: form.protein ? Number(form.protein) : null,
      description: form.description || null,
      image_url: form.image_url || null,
      active: form.active,
    }).eq('id', editProduct.id);
    if (error) throw new Error(error.message);
    setEditProduct(null);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('products').delete().eq('id', id);
    fetchProducts();
  };

  const filtered = filterCat === 'all' ? products : products.filter(p => p.category === filterCat);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display font-normal text-[32px] text-black leading-none"
            style={{ fontFamily: 'var(--font-display)' }}>
          Produits
        </h1>
        <button
          onClick={() => { setShowForm(true); setEditProduct(null); }}
          className="flex items-center gap-2 h-10 px-5 bg-black text-white rounded-[2px] text-[10px] font-normal uppercase tracking-[0.12em] hover:bg-black/85 transition-colors"
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {showForm && !editProduct && (
        <ProductForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      <div className="flex gap-2 mb-5">
        {['all', ...CATEGORIES].map(cat => (
          <button key={cat}
            onClick={() => setFilterCat(cat)}
            className={`h-8 px-4 rounded-full text-[10px] font-light tracking-[0.06em] transition-colors ${
              filterCat === cat
                ? 'bg-black text-white'
                : 'border border-black/15 text-black/50 hover:border-black/30 hover:text-black'
            }`}
          >
            {cat === 'all' ? 'Tous' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[11px] text-black/30">Chargement…</p>
      ) : (
        <div className="bg-white rounded-[2px] border border-black/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                {['Nom', 'Catégorie', 'Prix', 'Cal.', 'Prot.', 'Statut', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[8px] font-normal uppercase tracking-[0.25em] text-black/35">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-6 text-[11px] text-black/30">Aucun produit.</td></tr>
              ) : filtered.map(p => {
                const isEditing = editProduct?.id === p.id;
                if (isEditing) {
                  return (
                    <tr key={p.id}>
                      <td colSpan={7} className="p-4">
                        <ProductForm
                          initial={{
                            name: p.name, category: p.category,
                            price: p.price ? String(p.price) : '',
                            calories: p.calories ? String(p.calories) : '',
                            protein: p.protein ? String(p.protein) : '',
                            description: p.description ?? '',
                            image_url: p.image_url ?? '',
                            active: p.active,
                          }}
                          onSave={handleUpdate}
                          onCancel={() => setEditProduct(null)}
                        />
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={p.id} className="border-b border-black/[0.04] hover:bg-black/[0.02]">
                    <td className="px-5 py-4 text-[12px] font-normal text-black">{p.name}</td>
                    <td className="px-5 py-4 text-[10px] text-black/40 uppercase tracking-[0.08em]">{p.category}</td>
                    <td className="px-5 py-4 text-[12px] text-black">{p.price ? `${p.price.toFixed(2).replace('.', ',')}€` : '—'}</td>
                    <td className="px-5 py-4 text-[11px] text-black/40">{p.calories ?? '—'}</td>
                    <td className="px-5 py-4 text-[11px] text-black/40">{p.protein ? `${p.protein}g` : '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[8px] uppercase tracking-[0.12em] px-2 py-[3px] rounded-[2px] ${
                        p.active ? 'bg-[oklch(57%_0.065_68)/10] text-[oklch(40%_0.065_68)]' : 'bg-black/5 text-black/30'
                      }`}>
                        {p.active ? 'Visible' : 'Masqué'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => { setEditProduct(p); setShowForm(false); }}
                          className="text-[10px] font-light text-black/40 hover:text-black border-b border-black/20 pb-px transition-colors">
                          Modifier
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="text-red-400 hover:text-red-600 transition-colors">
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProduits;
```

- [ ] **Step 2: Vérifier dans le navigateur**

Naviguer vers `/admin/produits`.
- La liste des produits s'affiche depuis Supabase
- Créer un produit → apparaît dans la liste ET sur `/menu`
- Modifier → formulaire pré-rempli
- Basculer `active` → visible/masqué sur le menu public

- [ ] **Step 3: Vérifier TypeScript global**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Résoudre les erreurs éventuelles.

- [ ] **Step 4: Commit final**

```bash
git add src/pages/admin/AdminProduits.tsx
git commit -m "feat: AdminProduits — CRUD produits avec effet immédiat sur le menu public"
```

---

## Self-Review — Couverture de la spec

| Exigence | Tâche |
|----------|-------|
| SQL migration (orders, order_items, event_registrations) | Task 1 |
| events élargi (meeting_point, price, is_free, registration_open, bilan type) | Task 1 + 2 |
| profiles.preferences | Task 1 + 2 |
| Admin RLS via is_admin() | Task 1 |
| Types TS mis à jour | Task 2 |
| useOrders (orders + items, stats mois, top produits) | Task 3 |
| useUpcomingEvents (prochaines inscriptions) | Task 4 |
| useDashboardStats (trimestre + bilans) | Task 5 |
| useAdminMembers + useAdminEventRegistrations | Task 6 |
| Dashboard.tsx — KPIs + événements + produits réels | Task 7 |
| History.tsx — commandes réelles | Task 8 |
| Profile.tsx — vraie date + formulaire fonctionnel + prefs | Task 9 |
| EvenementDetail — registration_open check | Task 10 |
| Admin layout + routes protégées | Task 11 |
| AdminOverview — stats globales | Task 12 |
| AdminMembers — table + filtres | Task 13 |
| AdminEvenements — CRUD + liste inscrits + export CSV | Task 14 |
| AdminProduits — CRUD | Task 15 |
| Stripe abonnement | ⏸️ hors scope (en attente) |
