# ⚡ Stripe Live — Checklist Vercel

> Dernière mise à jour : 2026-07-05

## Variables à changer sur Vercel (Production)

| Variable | Ancienne (test) | Nouvelle (live) |
|----------|-----------------|-----------------|
| `STRIPE_SECRET_KEY` | `sk_test_…` | **`sk_live_…`** |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (test) | **`whsec_…` endpoint n°1** (paiements/litiges) |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | (absent) | **`whsec_…` endpoint n°2** (Connect) |

> ⚠️ `NEXT_PUBLIC_BASE_URL` = `https://kayvila.com` ✅ (déjà bon)

## Après changement

1. **Redeploy** Vercel
2. **Tester** : Stripe Dashboard → endpoint n°1 → « Envoyer un événement test » (`checkout.session.completed`) → doit répondre **200**

## URLs des endpoints Stripe

- **Endpoint n°1** (votre compte) : `https://kayvila.com/api/webhooks/stripe` — 10 événements paiements/litiges/refunds
- **Endpoint n°2** (comptes connectés) : `https://kayvila.com/api/webhooks/stripe` — `v2.core.account.updated`

## Rappel utile

- Le localhost reste en clés **test** (`.env.local` inchangé)
- Un re-depoy est obligatoire après tout changement d'env
- Si 400 « signature failed » → vérifier le `whsec_` + redéployer
