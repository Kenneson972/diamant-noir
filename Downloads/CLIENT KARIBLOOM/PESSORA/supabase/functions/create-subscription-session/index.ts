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
