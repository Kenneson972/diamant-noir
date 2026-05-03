# Óra+ Cycle 3 — Admin Stripe Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admin to view real-time Stripe subscription data and cancel or access the billing portal from `AdminMemberDetail`.

**Architecture:** 3 new Supabase Edge Functions (POST, JWT + admin-role check) + a new Stripe section in `AdminMemberDetail.tsx`. All Stripe API calls are server-side; the browser never touches a Stripe secret. The functions use the same Deno + npm:stripe@14 pattern as existing edge functions.

**Tech Stack:** React 19, Supabase Edge Functions (Deno), Stripe API v2024-04-10 (npm:stripe@14), @supabase/supabase-js@2, Zod (npm:zod@3).

> **Note — Section C (Menu/DrinkDetail depuis Supabase):** Already implemented. `src/lib/menuCatalog.ts` + `src/hooks/useMenuCatalog.ts` already fetch from the `products` Supabase table with `menuData.ts` as fallback. Menu.tsx and DrinkDetail.tsx both use `useMenuCatalog()`. No changes needed for C.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/20260503200000_subscriptions_cancel_at_period_end.sql` | Add `cancel_at_period_end boolean DEFAULT false` column |
| Modify | `src/types/database.ts:39-53` | Add `cancel_at_period_end` to `Subscription.Row` |
| Create | `supabase/functions/get-stripe-member/index.ts` | Return Stripe subscription details for a customer |
| Create | `supabase/functions/cancel-stripe-subscription/index.ts` | Cancel subscription at period end |
| Create | `supabase/functions/admin-portal-session/index.ts` | Create billing portal session for admin |
| Modify | `src/pages/admin/AdminMemberDetail.tsx` | Add Stripe section after Abonnement block |

---

## Task 1: Migration + Type — `cancel_at_period_end`

**Files:**
- Create: `supabase/migrations/20260503200000_subscriptions_cancel_at_period_end.sql`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260503200000_subscriptions_cancel_at_period_end.sql
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;
```

- [ ] **Step 2: Apply via Supabase MCP or SQL Editor**

Run in Supabase SQL Editor (project `tulhiipucrnyejheuitv`):
```sql
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;
```
Expected: `ALTER TABLE` with no error. Verify: `SELECT cancel_at_period_end FROM subscriptions LIMIT 1;` returns `false`.

- [ ] **Step 3: Add field to TypeScript Subscription.Row**

In `src/types/database.ts`, the `subscriptions.Row` block currently ends at `updated_at`. Add `cancel_at_period_end` after `current_period_end`:

```ts
// src/types/database.ts — subscriptions.Row block (lines ~39-53)
subscriptions: {
  Row: {
    id: string
    user_id: string
    plan: 'free' | 'ora_plus'
    status: 'active' | 'expired' | 'cancelled'
    start_date: string
    end_date: string | null
    auto_renew: boolean
    price: number
    stripe_subscription_id: string | null
    stripe_price_id: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean          // ← add this line
    created_at: string
    updated_at: string
  }
  Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
  Update: Partial<Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>>
  Relationships: []
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260503200000_subscriptions_cancel_at_period_end.sql src/types/database.ts
git commit -m "feat(db): add cancel_at_period_end to subscriptions"
```

---

## Task 2: Edge Function `get-stripe-member`

**Files:**
- Create: `supabase/functions/get-stripe-member/index.ts`

This function accepts POST `{ stripe_customer_id }`, verifies the caller is an admin, then fetches the Stripe customer + subscription.

- [ ] **Step 1: Create the Edge Function**

```ts
// supabase/functions/get-stripe-member/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'npm:stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const BodySchema = z.object({
  stripe_customer_id: z.string().min(1),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function verifyAdmin(req: Request): Promise<{ ok: true } | { ok: false; response: Response }> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return { ok: false, response: new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
  }
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) {
    return { ok: false, response: new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
  }
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return { ok: false, response: new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
  }
  return { ok: true }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authResult = await verifyAdmin(req)
    if (!authResult.ok) return authResult.response

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe non configuré' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'stripe_customer_id requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })
    const customer = await stripe.customers.retrieve(parsed.data.stripe_customer_id, {
      expand: ['subscriptions'],
    }) as Stripe.Customer

    if (customer.deleted) {
      return new Response(JSON.stringify({ error: 'Client Stripe supprimé' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const sub = customer.subscriptions?.data[0]
    if (!sub) {
      return new Response(JSON.stringify({ error: 'Aucun abonnement Stripe actif' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const price = sub.items.data[0]?.price
    let paymentMethod: { brand: string; last4: string; exp_month: number; exp_year: number } | null = null

    const pmRef = sub.default_payment_method
    if (pmRef) {
      const pmId = typeof pmRef === 'string' ? pmRef : pmRef.id
      try {
        const pm = await stripe.paymentMethods.retrieve(pmId)
        if (pm.card) {
          paymentMethod = { brand: pm.card.brand, last4: pm.card.last4, exp_month: pm.card.exp_month, exp_year: pm.card.exp_year }
        }
      } catch { /* ignore — payment method may not exist */ }
    }

    return new Response(JSON.stringify({
      status: sub.status,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
      plan_name: price?.nickname ?? 'Óra+',
      amount: price?.unit_amount ?? 2490,
      currency: price?.currency ?? 'eur',
      payment_method: paymentMethod,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('[get-stripe-member]', err)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

- [ ] **Step 2: Verify the file exists**

```bash
ls supabase/functions/get-stripe-member/index.ts
```
Expected: file listed.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/get-stripe-member/index.ts
git commit -m "feat(edge): get-stripe-member — Stripe subscription details for admin"
```

---

## Task 3: Edge Function `cancel-stripe-subscription`

**Files:**
- Create: `supabase/functions/cancel-stripe-subscription/index.ts`

- [ ] **Step 1: Create the Edge Function**

Copy the `verifyAdmin` helper (identical to Task 2). The body is `{ stripe_subscription_id }`.

```ts
// supabase/functions/cancel-stripe-subscription/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'npm:stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const BodySchema = z.object({
  stripe_subscription_id: z.string().min(1),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function verifyAdmin(req: Request): Promise<{ ok: true; supabaseAdmin: ReturnType<typeof createClient> } | { ok: false; response: Response }> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return { ok: false, response: new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
  }
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) {
    return { ok: false, response: new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
  }
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return { ok: false, response: new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
  }
  return { ok: true, supabaseAdmin }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authResult = await verifyAdmin(req)
    if (!authResult.ok) return authResult.response
    const { supabaseAdmin } = authResult

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe non configuré' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'stripe_subscription_id requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })
    const updated = await stripe.subscriptions.update(parsed.data.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    await supabaseAdmin
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('stripe_subscription_id', parsed.data.stripe_subscription_id)

    return new Response(JSON.stringify({ success: true, cancel_at: updated.cancel_at }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[cancel-stripe-subscription]', err)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/cancel-stripe-subscription/index.ts
git commit -m "feat(edge): cancel-stripe-subscription — cancel at period end"
```

---

## Task 4: Edge Function `admin-portal-session`

**Files:**
- Create: `supabase/functions/admin-portal-session/index.ts`

- [ ] **Step 1: Create the Edge Function**

```ts
// supabase/functions/admin-portal-session/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'npm:stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const BodySchema = z.object({
  stripe_customer_id: z.string().min(1),
  return_url: z.string().url(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function verifyAdmin(req: Request): Promise<{ ok: true } | { ok: false; response: Response }> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return { ok: false, response: new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
  }
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) {
    return { ok: false, response: new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
  }
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return { ok: false, response: new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
  }
  return { ok: true }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authResult = await verifyAdmin(req)
    if (!authResult.ok) return authResult.response

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe non configuré' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'stripe_customer_id et return_url requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })
    const session = await stripe.billingPortal.sessions.create({
      customer: parsed.data.stripe_customer_id,
      return_url: parsed.data.return_url,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[admin-portal-session]', err)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/admin-portal-session/index.ts
git commit -m "feat(edge): admin-portal-session — Stripe billing portal for admin"
```

---

## Task 5: AdminMemberDetail — Section Stripe

**Files:**
- Modify: `src/pages/admin/AdminMemberDetail.tsx`

The new section is inserted between the existing `</section>` that closes **Abonnement** (around line 468) and the `<section>` that opens **Commandes** (line 470). Shown only if `profile?.stripe_customer_id` is defined.

- [ ] **Step 1: Add `StripeData` type and new state at the top of the component**

After the existing `type EventRegRow` definition (around line 47), add:

```tsx
type StripeData = {
  status: string
  current_period_end: number
  cancel_at_period_end: boolean
  plan_name: string
  amount: number
  currency: string
  payment_method: { brand: string; last4: string; exp_month: number; exp_year: number } | null
}
```

After the existing `const [error, setError] = useState<string | null>(null)` state declarations, add:

```tsx
const [stripeData, setStripeData] = useState<StripeData | null>(null)
const [stripeLoading, setStripeLoading] = useState(false)
const [stripeError, setStripeError] = useState<string | null>(null)
const [cancellingStripe, setCancellingStripe] = useState(false)
const [confirmCancel, setConfirmCancel] = useState(false)
```

- [ ] **Step 2: Add `loadStripeDataForCustomer` callback**

After the `showToast` function (around line 167), add:

```tsx
const loadStripeDataForCustomer = useCallback(async (customerId: string) => {
  setStripeLoading(true)
  setStripeError(null)
  const { data, error: fnErr } = await supabase.functions.invoke('get-stripe-member', {
    body: { stripe_customer_id: customerId },
  })
  setStripeLoading(false)
  if (fnErr || !data) {
    setStripeError('Données Stripe indisponibles')
    return
  }
  setStripeData(data as StripeData)
}, [])
```

- [ ] **Step 3: Call `loadStripeDataForCustomer` at end of `load` callback**

Inside the existing `load` `useCallback`, after `setProfile(p)` and `setSubscription(subs ?? null)` are called (around line 111), add a call to load Stripe data if the customer ID is present:

```tsx
// After: setSubscription(subs ?? null)
if (p.stripe_customer_id) {
  void loadStripeDataForCustomer(p.stripe_customer_id)
}
```

Also add `loadStripeDataForCustomer` to the `useCallback` dependency array.

- [ ] **Step 4: Add `cancelStripeSubscription` and `openStripePortal` functions**

After `loadStripeDataForCustomer`, add:

```tsx
const cancelStripeSubscription = async () => {
  if (!subscription?.stripe_subscription_id) return
  setCancellingStripe(true)
  const { error: fnErr } = await supabase.functions.invoke('cancel-stripe-subscription', {
    body: { stripe_subscription_id: subscription.stripe_subscription_id },
  })
  setCancellingStripe(false)
  if (fnErr) {
    showToast("Erreur lors de l'annulation Stripe.")
    return
  }
  setConfirmCancel(false)
  showToast('Annulation programmée au prochain renouvellement.')
  if (profile?.stripe_customer_id) void loadStripeDataForCustomer(profile.stripe_customer_id)
}

const openStripePortal = async () => {
  if (!profile?.stripe_customer_id) return
  const returnUrl = `${window.location.origin}/admin/membres/${memberId}`
  const { data, error: fnErr } = await supabase.functions.invoke('admin-portal-session', {
    body: { stripe_customer_id: profile.stripe_customer_id, return_url: returnUrl },
  })
  if (fnErr || !data?.url) {
    showToast('Impossible d\'ouvrir le portail Stripe.')
    return
  }
  window.open(data.url, '_blank', 'noopener')
}
```

- [ ] **Step 5: Add the Stripe section JSX**

Insert the following between the closing `</section>` of the Abonnement block and the opening `<section>` of the Commandes block (after line 468):

```tsx
{profile?.stripe_customer_id && (
  <section className="mb-10 rounded-[2px] border border-noir/[0.06] bg-white p-6">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-[18px] font-normal text-black" style={{ fontFamily: 'var(--font-display)' }}>
        Abonnement Stripe
      </h2>
      {stripeData && (
        <span
          className={`rounded-[20px] border px-2.5 py-0.5 text-[9px] font-normal uppercase tracking-[0.1em] ${
            stripeData.cancel_at_period_end
              ? 'border-orange-200 bg-orange-50 text-orange-700'
              : stripeData.status === 'active'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-noir/10 bg-noir/[0.03] text-black/45'
          }`}
        >
          {stripeData.cancel_at_period_end
            ? `Annulation le ${new Date(stripeData.current_period_end * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
            : stripeData.status === 'active'
              ? 'Actif'
              : stripeData.status}
        </span>
      )}
    </div>

    {stripeLoading && (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-[2px] bg-noir/[0.05]" />
        ))}
      </div>
    )}

    {stripeError && !stripeLoading && (
      <p className="text-[11px] font-light text-black/40">{stripeError}</p>
    )}

    {stripeData && !stripeLoading && (
      <>
        {stripeData.cancel_at_period_end && (
          <div className="mb-4 rounded-[2px] border border-orange-200 bg-orange-50 px-3 py-2 text-[11px] text-orange-800">
            ⚠ Annulation programmée — accès Óra+ jusqu'au{' '}
            {new Date(stripeData.current_period_end * 1000).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
          </div>
        )}

        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-[2px] border border-noir/[0.07] bg-surface-muted p-3">
            <p className="mb-1 text-[9px] uppercase tracking-[0.08em] text-black/35">Plan</p>
            <p className="text-[13px] font-normal text-black">{stripeData.plan_name}</p>
            <p className="text-[9px] text-black/40">
              {(stripeData.amount / 100).toFixed(2).replace('.', ',')} € / mois
            </p>
          </div>
          <div className="rounded-[2px] border border-noir/[0.07] bg-surface-muted p-3">
            <p className="mb-1 text-[9px] uppercase tracking-[0.08em] text-black/35">Prochain prélèvement</p>
            <p className="text-[13px] font-normal text-black">
              {new Date(stripeData.current_period_end * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="rounded-[2px] border border-noir/[0.07] bg-surface-muted p-3">
            <p className="mb-1 text-[9px] uppercase tracking-[0.08em] text-black/35">Paiement</p>
            {stripeData.payment_method ? (
              <>
                <p className="text-[13px] font-normal capitalize text-black">
                  {stripeData.payment_method.brand} ···· {stripeData.payment_method.last4}
                </p>
                <p className="text-[9px] text-black/40">
                  exp. {stripeData.payment_method.exp_month}/{String(stripeData.payment_method.exp_year).slice(-2)}
                </p>
              </>
            ) : (
              <p className="text-[12px] font-light text-black/35">—</p>
            )}
          </div>
        </div>

        <p className="mb-4 font-mono text-[10px] text-black/40">
          {subscription?.stripe_subscription_id ?? '—'}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={openStripePortal}
            className="flex-1 h-9 rounded-[2px] border border-noir/10 px-4 text-[10px] uppercase tracking-[0.1em] text-black/55 transition-colors hover:border-noir/25 hover:text-black"
          >
            Portail Stripe ↗
          </button>
          {!stripeData.cancel_at_period_end && subscription?.stripe_subscription_id && (
            confirmCancel ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-black/50">Confirmer l'annulation ?</span>
                <button
                  type="button"
                  disabled={cancellingStripe}
                  onClick={cancelStripeSubscription}
                  className="h-9 rounded-[2px] border border-red-200 bg-red-50 px-4 text-[10px] uppercase tracking-[0.1em] text-red-700 hover:bg-red-100 disabled:opacity-45"
                >
                  {cancellingStripe ? 'Annulation…' : 'Oui, annuler'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="h-9 rounded-[2px] border border-noir/10 px-3 text-[10px] text-black/45 hover:border-noir/25"
                >
                  Non
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="h-9 rounded-[2px] border border-red-200 px-4 text-[10px] uppercase tracking-[0.1em] text-red-600 transition-colors hover:bg-red-50"
              >
                Annuler abonnement
              </button>
            )
          )}
        </div>
        <p className="mt-2 text-right text-[9px] font-light text-black/30">
          L'annulation prend effet à la fin de la période en cours
        </p>
      </>
    )}
  </section>
)}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/AdminMemberDetail.tsx
git commit -m "feat(admin): section Stripe dans AdminMemberDetail — statut, annulation, portail"
```

---

## Task 6: Deploy the 3 Edge Functions

**Files:** Supabase project `tulhiipucrnyejheuitv`

- [ ] **Step 1: Deploy `get-stripe-member` via Supabase MCP**

Use the `mcp__claude_ai_Supabase__deploy_edge_function` MCP tool:
- `function_name`: `get-stripe-member`
- `entrypoint_path`: `supabase/functions/get-stripe-member/index.ts`

Expected: function status `ACTIVE`.

- [ ] **Step 2: Deploy `cancel-stripe-subscription`**

- `function_name`: `cancel-stripe-subscription`
- `entrypoint_path`: `supabase/functions/cancel-stripe-subscription/index.ts`

Expected: function status `ACTIVE`.

- [ ] **Step 3: Deploy `admin-portal-session`**

- `function_name`: `admin-portal-session`
- `entrypoint_path`: `supabase/functions/admin-portal-session/index.ts`

Expected: function status `ACTIVE`.

- [ ] **Step 4: Verify all 3 functions appear in the list**

Use `mcp__claude_ai_Supabase__list_edge_functions`. Expected: `get-stripe-member`, `cancel-stripe-subscription`, `admin-portal-session` all with status `ACTIVE`.

- [ ] **Step 5: Final TypeScript check + commit**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

```bash
git add -A
git commit -m "feat(cycle3): deploy admin Stripe Edge Functions"
```

---

## Self-Review

**Spec coverage:**
- ✅ C (Menu/DrinkDetail depuis Supabase): already implemented, noted in plan header
- ✅ Migration `cancel_at_period_end`: Task 1
- ✅ `get-stripe-member`: Task 2
- ✅ `cancel-stripe-subscription`: Task 3
- ✅ `admin-portal-session`: Task 4
- ✅ AdminMemberDetail Stripe section with all 4 states (loading, error, active, cancel_at_period_end): Task 5
- ✅ Deploy: Task 6

**Placeholder scan:** No TBD, TODO, or vague steps. All code is complete.

**Type consistency:**
- `StripeData` defined in Task 5 Step 1, used in Tasks 5 Steps 2–5 ✓
- `cancel_at_period_end: boolean` added to DB type in Task 1, referenced in Task 5 JSX as `stripeData.cancel_at_period_end` ✓
- `supabase.functions.invoke` pattern matches existing usage in `AbonnementSucces.tsx` and `OraPlus.tsx` ✓
