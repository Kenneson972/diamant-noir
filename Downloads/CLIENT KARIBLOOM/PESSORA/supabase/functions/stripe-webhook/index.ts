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
