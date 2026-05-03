# Óra+ Stripe Cycle 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the Óra+ subscription checkout to Stripe (mode: subscription), sync DB via webhooks, and gate the -50% drink discount on real Ora+ active status.

**Architecture:** Three new Supabase Edge Functions (create-subscription-session, stripe-webhook, verify-subscription-session) backed by a shared Deno helper. The frontend OraPlus CTA calls the checkout function directly; a new /abonnement/succes page calls the verify function as a race-condition fallback. A new `useIsOraPlus` hook gates discounted prices in DrinkOptionsModal, Menu, and HomeProductCarousel.

**Tech Stack:** Supabase Edge Functions (Deno), Stripe API v2024-04-10 (npm:stripe@14), React + Zustand, supabase-js v2, Zod v3

---

## File Map

| Status | File | Responsibility |
|--------|------|---------------|
| NEW | `supabase/migrations/20260503150000_ora_plus_stripe.sql` | Add stripe_customer_id to profiles; add stripe_price_id + current_period_end to subscriptions; migrate plan enum |
| MODIFY | `src/types/database.ts` | Add stripe_customer_id to ProfilesTableRow; update subscriptions.Row plan type + new fields |
| MODIFY | `src/contexts/AuthContext.tsx` | Update SubscriptionData type; update mapSubscription() |
| NEW | `src/hooks/useIsOraPlus.ts` | Hook: `isOraPlus` boolean + `effectiveUnitPrice()` |
| NEW | `supabase/functions/_shared/activateOraPlus.ts` | Shared Deno helper: find/invite user, upsert subscription + profile |
| NEW | `supabase/functions/create-subscription-session/index.ts` | Edge fn: Stripe Checkout mode:subscription, no auth |
| NEW | `supabase/functions/stripe-webhook/index.ts` | Edge fn: handles 4 Stripe events, verifies signature |
| NEW | `supabase/functions/verify-subscription-session/index.ts` | Edge fn: idempotent fallback from success page |
| MODIFY | `src/pages/OraPlus.tsx` | Replace navigate('/inscription') CTAs with subscription checkout call |
| NEW | `src/pages/AbonnementSucces.tsx` | Success page for subscription: calls verify fn, shows magic link prompt |
| MODIFY | `src/App.tsx` | Add lazy import + route `/abonnement/succes` |
| MODIFY | `src/components/cart/DrinkOptionsModal.tsx` | Use useIsOraPlus → effectiveUnitPrice for cart add |
| MODIFY | `src/pages/Menu.tsx` | Replace direct oraMemberUnitPrice call with effectiveUnitPrice from hook |
| MODIFY | `src/components/home/HomeProductCarousel.tsx` | Replace direct oraMemberUnitPrice call with effectiveUnitPrice from hook |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/20260503150000_ora_plus_stripe.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- 1. Ajouter stripe_customer_id sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 2. Ajouter stripe_price_id + current_period_end sur subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- 3. Migration one-shot : abonnés actifs starter/premium/vip → ora_plus
UPDATE public.subscriptions
SET plan = 'ora_plus'
WHERE plan IN ('starter', 'premium', 'vip')
  AND status = 'active';
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `mcp__claude_ai_Supabase__apply_migration` tool with the SQL above, or run:
```bash
supabase db push
```

- [ ] **Step 3: Verify columns exist**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id';

SELECT column_name FROM information_schema.columns
WHERE table_name = 'subscriptions' AND column_name IN ('stripe_price_id', 'current_period_end');
```

Expected: 3 rows returned.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260503150000_ora_plus_stripe.sql
git commit -m "feat(db): add stripe_customer_id to profiles, stripe_price_id + current_period_end to subscriptions"
```

---

## Task 2: TypeScript Types + AuthContext

**Files:**
- Modify: `src/types/database.ts`
- Modify: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: Update ProfilesTableRow in database.ts**

In `src/types/database.ts`, add `stripe_customer_id` to `ProfilesTableRow` after `admin_ui_prefs`:

```ts
export interface ProfilesTableRow {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  role: 'member' | 'admin' | null
  preferences: Record<string, boolean> | null
  admin_ui_prefs: Record<string, unknown> | null
  stripe_customer_id: string | null  // ← NEW
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2: Update subscriptions Row type in database.ts**

Replace the `subscriptions.Row` type:

```ts
subscriptions: {
  Row: {
    id: string
    user_id: string
    plan: 'free' | 'ora_plus'   // ← was 'free' | 'starter' | 'premium' | 'vip'
    status: 'active' | 'expired' | 'cancelled'
    start_date: string
    end_date: string | null
    auto_renew: boolean
    price: number
    stripe_subscription_id: string | null
    stripe_price_id: string | null          // ← NEW
    current_period_end: string | null       // ← NEW
    created_at: string
    updated_at: string
  }
  Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
  Update: Partial<Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>>
  Relationships: []
}
```

- [ ] **Step 3: Update SubscriptionData in AuthContext.tsx**

Replace the `SubscriptionData` interface in `src/contexts/AuthContext.tsx`:

```ts
export interface SubscriptionData {
  id: string
  plan: 'free' | 'ora_plus'    // ← removed 'starter' | 'premium' | 'vip'
  status: 'active' | 'expired' | 'cancelled'
  startDate: string
  endDate: string | null
  autoRenew: boolean
  price: number
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null     // ← NEW
  currentPeriodEnd: string | null     // ← NEW
}
```

- [ ] **Step 4: Update mapSubscription() in AuthContext.tsx**

Replace `mapSubscription` function:

```ts
function mapSubscription(sub: Subscription): SubscriptionData {
  return {
    id: sub.id,
    plan: sub.plan as SubscriptionData['plan'],
    status: sub.status as SubscriptionData['status'],
    startDate: sub.start_date,
    endDate: sub.end_date,
    autoRenew: sub.auto_renew,
    price: Number(sub.price),
    stripeSubscriptionId: sub.stripe_subscription_id ?? null,
    stripeCustomerId: (sub as unknown as { stripe_customer_id?: string | null }).stripe_customer_id ?? null,
    currentPeriodEnd: sub.current_period_end ?? null,
  }
}
```

Note: `stripe_customer_id` is on `profiles`, not `subscriptions`. It's already loaded via `useAuth` from the profile. If you want it in `SubscriptionData`, either join the profile query or add it via a separate profile field on `User`. The simpler approach: read it from `user.stripeCustomerId` if you add it to the `User` interface, or skip it in SubscriptionData and just use `subscription.stripeSubscriptionId` where needed. For Cycle 1, `stripeCustomerId` on `SubscriptionData` can be left null — the webhook handles it server-side.

Simplified version of `mapSubscription` (no change to subscription query needed):

```ts
function mapSubscription(sub: Subscription): SubscriptionData {
  return {
    id: sub.id,
    plan: sub.plan as SubscriptionData['plan'],
    status: sub.status as SubscriptionData['status'],
    startDate: sub.start_date,
    endDate: sub.end_date,
    autoRenew: sub.auto_renew,
    price: Number(sub.price),
    stripeSubscriptionId: sub.stripe_subscription_id ?? null,
    stripeCustomerId: null,         // populated server-side, not needed client-side
    currentPeriodEnd: sub.current_period_end ?? null,
  }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors (fix any type complaints before proceeding).

- [ ] **Step 6: Commit**

```bash
git add src/types/database.ts src/contexts/AuthContext.tsx
git commit -m "feat(types): update subscriptions plan enum + new Stripe fields, update SubscriptionData"
```

---

## Task 3: `useIsOraPlus` Hook

**Files:**
- Create: `src/hooks/useIsOraPlus.ts`

- [ ] **Step 1: Create the hook**

```ts
import { useAuth } from '../contexts/AuthContext'
import { oraMemberUnitPrice } from '../lib/oraPricing'

export function useIsOraPlus() {
  const { subscription } = useAuth()
  const isOraPlus = subscription?.plan === 'ora_plus' && subscription?.status === 'active'

  function effectiveUnitPrice(publicPrice: number): number {
    return isOraPlus ? oraMemberUnitPrice(publicPrice) : publicPrice
  }

  return { isOraPlus, effectiveUnitPrice }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useIsOraPlus.ts
git commit -m "feat: add useIsOraPlus hook for subscription-gated pricing"
```

---

## Task 4: Shared Edge Function Helper

**Files:**
- Create: `supabase/functions/_shared/activateOraPlus.ts`

This helper is called by both `stripe-webhook` and `verify-subscription-session`.

- [ ] **Step 1: Create the shared helper**

```ts
// supabase/functions/_shared/activateOraPlus.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14'

export async function activateOraPlus(
  supabase: SupabaseClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const email = session.customer_details?.email ?? session.customer_email
  if (!email) throw new Error('No email in Stripe session')

  const customerId =
    typeof session.customer === 'string' ? session.customer : (session.customer as Stripe.Customer)?.id ?? null
  const stripeSubId =
    typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as Stripe.Subscription)?.id ?? null

  if (!stripeSubId) throw new Error('No stripe subscription_id in session')

  // Récupérer current_period_end + price_id depuis l'abonnement Stripe
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubId)
  const priceId = stripeSub.items.data[0]?.price.id ?? null
  const currentPeriodEnd = new Date(stripeSub.current_period_end * 1000).toISOString()

  // Chercher l'utilisateur par email dans profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  let userId: string

  if (profile) {
    userId = profile.id
  } else {
    // Nouveau membre — envoyer un magic link d'invitation
    const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email)
    if (inviteErr || !inviteData.user) {
      throw new Error(`inviteUserByEmail failed: ${inviteErr?.message}`)
    }
    userId = inviteData.user.id
    // Upsert profile (le trigger peut l'avoir déjà créé)
    await supabase.from('profiles').upsert(
      { id: userId, email },
      { onConflict: 'id', ignoreDuplicates: true },
    )
  }

  // Mettre à jour stripe_customer_id sur profiles
  if (customerId) {
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
  }

  // Upsert subscription (idempotent — update if exists, insert if not)
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  const subPayload = {
    plan: 'ora_plus',
    status: 'active',
    stripe_subscription_id: stripeSubId,
    stripe_price_id: priceId,
    current_period_end: currentPeriodEnd,
    end_date: currentPeriodEnd.split('T')[0],
    auto_renew: true,
    price: 24.90,
  }

  if (existingSub) {
    await supabase.from('subscriptions').update(subPayload).eq('id', existingSub.id)
  } else {
    await supabase.from('subscriptions').insert({
      user_id: userId,
      start_date: new Date().toISOString().split('T')[0],
      ...subPayload,
    })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/activateOraPlus.ts
git commit -m "feat(edge): shared activateOraPlus helper"
```

---

## Task 5: `create-subscription-session` Edge Function

**Files:**
- Create: `supabase/functions/create-subscription-session/index.ts`

- [ ] **Step 1: Create the function**

```ts
// supabase/functions/create-subscription-session/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'npm:stripe@14'
import { z } from 'npm:zod@3'

const BodySchema = z.object({
  price_id: z.string().optional(),
  email: z.string().email().optional(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const siteUrl = (Deno.env.get('SITE_URL') ?? 'http://localhost:5173').replace(/\/+$/, '')
    const defaultPriceId = Deno.env.get('STRIPE_ORA_PLUS_PRICE_ID')

    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY non configurée' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    const { price_id, email } = parsed.success ? parsed.data : {}

    const priceId = price_id ?? defaultPriceId
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'price_id manquant — configurez STRIPE_ORA_PLUS_PRICE_ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      locale: 'fr',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/abonnement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/commande/annulee`,
      phone_number_collection: { enabled: true },
    }

    if (email) {
      sessionParams.customer_email = email
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[create-subscription-session]', err)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/create-subscription-session/index.ts
git commit -m "feat(edge): create-subscription-session — Stripe Checkout mode:subscription"
```

---

## Task 6: `stripe-webhook` Edge Function

**Files:**
- Create: `supabase/functions/stripe-webhook/index.ts`

- [ ] **Step 1: Create the function**

```ts
// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14'
import { activateOraPlus } from '../_shared/activateOraPlus.ts'

serve(async (req) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const body = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe-webhook] invalid signature:', err)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription') {
          await activateOraPlus(supabase, stripe, session)
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const stripeSubId =
          typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
        if (!stripeSubId) break
        const periodEnd = invoice.lines?.data[0]?.period?.end
          ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
          : null
        await supabase
          .from('subscriptions')
          .update({ status: 'active', ...(periodEnd ? { current_period_end: periodEnd } : {}) })
          .eq('stripe_subscription_id', stripeSubId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const stripeSubId =
          typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
        if (!stripeSubId) break
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('stripe_subscription_id', stripeSubId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', sub.id)
        break
      }
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error:', event.type, err)
    return new Response(JSON.stringify({ error: 'Handler error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/stripe-webhook/index.ts
git commit -m "feat(edge): stripe-webhook — handles checkout.completed, invoice.paid/failed, subscription.deleted"
```

---

## Task 7: `verify-subscription-session` Edge Function

**Files:**
- Create: `supabase/functions/verify-subscription-session/index.ts`

- [ ] **Step 1: Create the function**

```ts
// supabase/functions/verify-subscription-session/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14'
import { activateOraPlus } from '../_shared/activateOraPlus.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const body = await req.json().catch(() => ({}))
    const sessionId = typeof body.session_id === 'string' ? body.session_id : null

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'session_id requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.mode !== 'subscription') {
      return new Response(JSON.stringify({ error: 'Not a subscription session' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripeSubId =
      typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as Stripe.Subscription)?.id ?? null

    if (!stripeSubId) {
      return new Response(JSON.stringify({ status: 'pending' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Vérifier si le webhook a déjà traité cette session
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', stripeSubId)
      .maybeSingle()

    if (!existing) {
      // Fallback : traiter maintenant (webhook pas encore arrivé)
      await activateOraPlus(supabase, stripe, session)
    }

    return new Response(JSON.stringify({ status: 'processed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[verify-subscription-session]', err)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/verify-subscription-session/index.ts
git commit -m "feat(edge): verify-subscription-session — idempotent fallback from success page"
```

---

## Task 8: OraPlus.tsx — CTA Subscription Checkout

**Files:**
- Modify: `src/pages/OraPlus.tsx`

There are 3 buttons that navigate to `/inscription` — lines ~220, ~482, ~498. All three must call the edge function instead.

- [ ] **Step 1: Add state + handler at the top of `OraPlus` component**

After line `const navigate = useNavigate();` (line ~190), add:

```tsx
import { useState } from 'react';  // already imported
import { supabase } from '../lib/supabaseClient';  // add this import at top of file
import { useAuth } from '../contexts/AuthContext';   // add this import at top of file

// Inside OraPlus component:
const { user } = useAuth();
const [subLoading, setSubLoading] = useState(false);
const [subError, setSubError] = useState<string | null>(null);

const handleSubscribe = async () => {
  setSubLoading(true);
  setSubError(null);
  try {
    const { data, error } = await supabase.functions.invoke('create-subscription-session', {
      body: { email: user?.email },
    });
    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data?.error ?? 'URL manquante');
    }
  } catch (err) {
    setSubError(err instanceof Error ? err.message : 'Impossible de démarrer le paiement');
    setSubLoading(false);
  }
};
```

- [ ] **Step 2: Update the Hero CTA button (line ~220)**

Replace:
```tsx
onPress={() => navigate(oraPlusHero.ctaPrimary.href)}
```
With:
```tsx
onPress={() => void handleSubscribe()}
isDisabled={subLoading}
```

- [ ] **Step 3: Update both Final CTA buttons (lines ~482 and ~498)**

Replace both:
```tsx
onPress={() => navigate(oraPlusFinalCta.cta.href)}
```
With:
```tsx
onPress={() => void handleSubscribe()}
isDisabled={subLoading}
```

- [ ] **Step 4: Add error display near the hero CTA (after the buttons div)**

After the `<div className="mt-8 flex flex-wrap items-center gap-4">` closing tag, add:
```tsx
{subError && (
  <p className="mt-3 text-[11px] text-red-500">{subError}</p>
)}
```

- [ ] **Step 5: Verify dev server — no TypeScript errors**

```bash
npm run dev
```

Open http://localhost:5173/ora-plus — buttons should be clickable, no console errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/OraPlus.tsx
git commit -m "feat: OraPlus CTA calls create-subscription-session edge fn"
```

---

## Task 9: `/abonnement/succes` Page + Route

**Files:**
- Create: `src/pages/AbonnementSucces.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/pages/AbonnementSucces.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { PageShell } from '../components/layout/PageShell';

type Status = 'loading' | 'processed' | 'pending' | 'error';

const AbonnementSucces = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }

    supabase.functions
      .invoke('verify-subscription-session', { body: { session_id: sessionId } })
      .then(({ data, error }) => {
        if (error || !data) { setStatus('pending'); return; }
        setStatus(data.status === 'processed' ? 'processed' : 'pending');
      })
      .catch(() => setStatus('pending'));
  }, [sessionId]);

  return (
    <PageShell className="flex min-h-[60vh] items-center justify-center py-20">
      <div className="mx-auto max-w-md text-center">
        {status === 'loading' && (
          <p className="text-[13px] text-black/40">Activation en cours…</p>
        )}

        {status === 'processed' && (
          <>
            <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.22em] text-black/35">
              Bienvenue dans
            </p>
            <h1
              className="font-display font-normal leading-none text-noir"
              style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}
            >
              Óra+
            </h1>
            <p className="mt-6 text-[14px] font-light leading-relaxed text-black/55">
              Votre abonnement est confirmé. Un email vous a été envoyé —
              cliquez sur le lien pour accéder à votre espace membre.
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-noir/15 px-6 text-[10px] font-normal uppercase tracking-[0.14em] text-black/60 transition-colors hover:border-noir/30 hover:text-black"
            >
              Retour à l'accueil
            </Link>
          </>
        )}

        {(status === 'pending' || status === 'error') && (
          <>
            <h1 className="font-display text-[32px] font-normal leading-none text-noir">
              Merci !
            </h1>
            <p className="mt-4 text-[13px] font-light leading-relaxed text-black/55">
              Paiement reçu. L'activation de votre Óra+ peut prendre quelques minutes.
              Vérifiez votre email.
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-noir/15 px-6 text-[10px] font-normal uppercase tracking-[0.14em] text-black/60 transition-colors hover:border-noir/30 hover:text-black"
            >
              Retour à l'accueil
            </Link>
          </>
        )}
      </div>
    </PageShell>
  );
};

export default AbonnementSucces;
```

- [ ] **Step 2: Add lazy import to App.tsx**

After the `CommandeAnnulee` import line (~line 58), add:
```tsx
const AbonnementSucces = lazy(() => import('./pages/AbonnementSucces'));
```

- [ ] **Step 3: Add route to App.tsx**

Find the route for `/commande/succes` and add the new route immediately after it:
```tsx
<Route path="/commande/succes" element={<CommandeSucces />} />
<Route path="/commande/annulee" element={<CommandeAnnulee />} />
<Route path="/abonnement/succes" element={<AbonnementSucces />} />
```

- [ ] **Step 4: Verify the page renders**

Open http://localhost:5173/abonnement/succes — should show "Merci !" (no session_id → error state, which shows the Merci fallback).

- [ ] **Step 5: Commit**

```bash
git add src/pages/AbonnementSucces.tsx src/App.tsx
git commit -m "feat: add /abonnement/succes page with verify-subscription-session call"
```

---

## Task 10: DrinkOptionsModal — Ora+ Price Gating

**Files:**
- Modify: `src/components/cart/DrinkOptionsModal.tsx`

- [ ] **Step 1: Import useIsOraPlus and update price computation**

Add import at the top:
```tsx
import { useIsOraPlus } from '../../hooks/useIsOraPlus';
```

Inside `DrinkOptionsModal` component, after the existing state declarations (after `const [justAdded, setJustAdded] = useState(false);`), add:
```tsx
const { isOraPlus, effectiveUnitPrice } = useIsOraPlus();
```

- [ ] **Step 2: Apply effectiveUnitPrice to basePrice**

Replace the existing `unitPrice` calculation:
```tsx
// Before:
const unitPrice = basePrice + selectedBoosters.length;
```
With:
```tsx
const unitPrice = effectiveUnitPrice(basePrice) + selectedBoosters.length;
```

- [ ] **Step 3: Show Ora+ badge on size buttons when isOraPlus**

In the size button rendering (around line ~133), replace the price display:
```tsx
{sLabel}
<br />
{sPrice}€
```
With:
```tsx
{sLabel}
<br />
{isOraPlus
  ? <><span className="line-through text-white/50">{sPrice}€</span>{' '}{effectiveUnitPrice(sPrice).toFixed(2).replace('.', ',')}€</>
  : <>{sPrice}€</>
}
```

- [ ] **Step 4: Update footer button label to show crossed price when Ora+**

The footer button shows `Ajouter · ${total.toFixed(2).replace('.', ',')} €`. This already uses `unitPrice` (now effective), so no change needed to the total. The correct price is already applied.

- [ ] **Step 5: Test manually**

1. Log in as an `ora_plus` + `active` subscription user
2. Open DrinkOptionsModal — size button prices should show crossed-out + discounted
3. Log in as a `free` user — full prices only

- [ ] **Step 6: Commit**

```bash
git add src/components/cart/DrinkOptionsModal.tsx
git commit -m "feat: gate DrinkOptionsModal prices on Ora+ subscription status"
```

---

## Task 11: Menu.tsx + HomeProductCarousel — Display Gating

**Files:**
- Modify: `src/pages/Menu.tsx`
- Modify: `src/components/home/HomeProductCarousel.tsx`

### Menu.tsx

- [ ] **Step 1: Replace oraMemberUnitPrice import with useIsOraPlus**

In `src/pages/Menu.tsx`, remove `oraMemberUnitPrice` from the import on line 12:
```tsx
// Before:
import { formatEurFr, oraMemberUnitPrice } from '../lib/oraPricing';
// After:
import { formatEurFr } from '../lib/oraPricing';
```

Add import:
```tsx
import { useIsOraPlus } from '../hooks/useIsOraPlus';
```

- [ ] **Step 2: Add hook call in Menu component**

In the `Menu` component body (after the useState calls), add:
```tsx
const { effectiveUnitPrice } = useIsOraPlus();
```

- [ ] **Step 3: Update the oraMemberHint usage (line ~211)**

Replace:
```tsx
oraMemberHint={formatEurFr(oraMemberUnitPrice(effectivePrice))}
```
With:
```tsx
oraMemberHint={formatEurFr(effectiveUnitPrice(effectivePrice))}
```

### HomeProductCarousel.tsx

- [ ] **Step 4: Replace oraMemberUnitPrice with useIsOraPlus**

In `src/components/home/HomeProductCarousel.tsx`, remove `oraMemberUnitPrice` from import on line 8:
```tsx
// Before:
import { formatEurFr, oraMemberUnitPrice } from '../../lib/oraPricing';
// After:
import { formatEurFr } from '../../lib/oraPricing';
```

Add import:
```tsx
import { useIsOraPlus } from '../../hooks/useIsOraPlus';
```

- [ ] **Step 5: Add hook call + update price display**

In the carousel component body, add:
```tsx
const { effectiveUnitPrice } = useIsOraPlus();
```

On line ~100, replace:
```tsx
Óra+ dès {formatEurFr(oraMemberUnitPrice(item.price))}
```
With:
```tsx
Óra+ dès {formatEurFr(effectiveUnitPrice(item.price))}
```

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Menu.tsx src/components/home/HomeProductCarousel.tsx
git commit -m "feat: gate Ora+ price display on subscription status in Menu and HomeProductCarousel"
```

---

## Task 12: Deploy Edge Functions + Configure Secrets

- [ ] **Step 1: Deploy all three new functions**

```bash
supabase functions deploy create-subscription-session
supabase functions deploy stripe-webhook
supabase functions deploy verify-subscription-session
```

Expected: each command reports "Deployed Function <name>"

- [ ] **Step 2: Set Supabase secrets**

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_ORA_PLUS_PRICE_ID=price_1TT0CYB5fgzfgwh0QH90jTjF
supabase secrets set SITE_URL=https://your-production-url.com
```

For local dev, also create/update `supabase/functions/.env`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ORA_PLUS_PRICE_ID=price_1TT0CYB5fgzfgwh0QH90jTjF
SITE_URL=http://localhost:5173
```

- [ ] **Step 3: Register the webhook in Stripe Dashboard (or CLI)**

In Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://<supabase-project>.supabase.co/functions/v1/stripe-webhook`
- Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
- Copy the webhook signing secret → use as `STRIPE_WEBHOOK_SECRET`

For local testing with Stripe CLI:
```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

- [ ] **Step 4: End-to-end smoke test**

1. Go to `/ora-plus` → click "Rejoindre Óra+"
2. Should redirect to Stripe Checkout (subscription mode, French locale)
3. Use test card `4242 4242 4242 4242`, any future date, any CVC
4. Should redirect to `/abonnement/succes` → page shows "Bienvenue dans Óra+"
5. Check Supabase `subscriptions` table — row with `plan: ora_plus, status: active`
6. Check `profiles` table — `stripe_customer_id` populated

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: Óra+ Stripe Cycle 1 complete — subscription checkout, webhooks, benefit gating"
```
