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
