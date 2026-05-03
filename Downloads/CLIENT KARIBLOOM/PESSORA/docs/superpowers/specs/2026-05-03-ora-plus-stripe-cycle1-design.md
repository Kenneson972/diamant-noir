# Spec — Óra+ Stripe Cycle 1 : Souscription + Webhooks

**Date :** 2026-05-03  
**Branche :** feat/supabase-events-bilan  
**Périmètre :** Checkout abonnement Óra+ · Webhooks Stripe · Gating avantages · Pages succès

---

## Contexte

PESSORA propose un abonnement mensuel **Óra+** (tarif indicatif ~29 €/mois) qui donne accès à des prix réduits sur les boissons (-50%), des bilans offerts, et l'accès prioritaire aux ateliers. Le flux de paiement abonnement n'existe pas encore — les membres se retrouvent avec un plan stocké en dur en DB sans lien Stripe réel.

Cycle 1 couvre : le checkout abonnement (sans auth préalable), les webhooks pour tenir la DB synchronisée avec Stripe, et le gating des avantages basé sur le vrai statut Stripe.

Cycle 2 (ultérieur) couvrira : espace membre enrichi (liste factures, annulation en 1 clic), vues admin Stripe (MRR, paiements échoués).

---

## 1. Changements DB

### 1.1 Migration du champ `plan`

```sql
-- Étape 1 : ajouter la nouvelle valeur à l'enum (si c'est un type enum Postgres)
-- OU simplement : mettre à jour la contrainte CHECK si c'est un text + constraint

-- Migration one-shot : migrer les abonnés actifs existants vers ora_plus
UPDATE subscriptions
SET plan = 'ora_plus'
WHERE plan IN ('starter', 'premium', 'vip')
  AND status = 'active';
```

Valeurs valides après migration : `'free' | 'ora_plus'` uniquement.

### 1.2 Nouvelles colonnes

**Table `profiles`**
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
```

**Table `subscriptions`**
```sql
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
```

La colonne `stripe_subscription_id` existe déjà sur `subscriptions`.

---

## 2. Edge Functions

### 2.1 `create-subscription-session` (NOUVEAU)

**Auth :** aucune requise — le checkout Stripe collecte l'email directement.

**Body (JSON) :**
```ts
{
  price_id?: string  // default: env STRIPE_ORA_PLUS_PRICE_ID
  email?: string     // pré-rempli dans Stripe si fourni
}
```

**Ce qu'elle fait :**
1. Lit `STRIPE_ORA_PLUS_PRICE_ID` depuis les env vars (fallback si `price_id` non fourni)
2. Crée `stripe.checkout.sessions.create({ mode: 'subscription', locale: 'fr', phone_number_collection: { enabled: true }, ... })`
3. `success_url` → `${SITE_URL}/abonnement/succes?session_id={CHECKOUT_SESSION_ID}`
4. `cancel_url` → `${SITE_URL}/commande/annulee`
5. Retourne `{ url: session.url }`

**Price ID Stripe de test (déjà créé) :** `price_1TT0CYB5fgzfgwh0QH90jTjF`

---

### 2.2 `stripe-webhook` (NOUVEAU)

**Auth :** vérifie l'en-tête `Stripe-Signature` avec `STRIPE_WEBHOOK_SECRET` (rejet 401 si invalide). Pas d'Authorization Supabase.

**Events gérés :**

| Event | Action DB |
|-------|-----------|
| `checkout.session.completed` | 1) Cherche dans `auth.users` par email · 2a) Si trouvé : récupère `user_id` · 2b) Si non trouvé : appelle `auth.admin.inviteUserByEmail()` → reçoit `user_id` du nouvel utilisateur · 3) Upsert `profiles` (first_name/phone depuis session Stripe si disponibles) · 4) Upsert subscription `plan: ora_plus, status: active, stripe_subscription_id, stripe_price_id, current_period_end` · 5) Update `profiles.stripe_customer_id` |
| `invoice.paid` | Update subscription `status: active`, `current_period_end` mis à jour |
| `invoice.payment_failed` | Update subscription `status: expired` |
| `customer.subscription.deleted` | Update subscription `status: cancelled` — perte des avantages immédiate |

**Idempotence :** chaque handler fait un upsert (match sur `stripe_subscription_id`) pour éviter les doublons en cas de livraison multiple.

---

### 2.3 `verify-subscription-session` (NOUVEAU)

**Auth :** aucune.

**Query param :** `session_id`

**Ce qu'elle fait :**
1. Récupère la session Stripe via `session_id`
2. Vérifie si une subscription existe en DB avec le `stripe_subscription_id` de cette session
3. Si oui → retourne `{ status: 'processed' }` (webhook a déjà traité)
4. Si non → exécute la même logique que `checkout.session.completed` (fallback race condition)
5. Retourne `{ status: 'processed' }`

**Pourquoi ce fallback :** En production le webhook précède la page succès, mais en dev ou sous latence réseau il peut arriver après. Ce fallback garantit l'activation Óra+ dans tous les cas.

---

## 3. Pages & composants frontend

### 3.1 `/ora-plus` — bouton CTA modifié

Le bouton "S'abonner" appelle la nouvelle edge function :
```ts
const { data } = await supabase.functions.invoke('create-subscription-session', {
  body: { email: user?.email },
})
window.location.href = data.url
```
Pas d'auth gate — si l'utilisateur n'est pas connecté, `email` est simplement `undefined` et Stripe le collecte.

### 3.2 `/abonnement/succes` (NOUVEAU)

- Appelle `verify-subscription-session?session_id=…` au mount
- Affiche "Bienvenue dans Óra+ — vérifie ton email"
- Si `status: 'pending'` après 5s → message "Activation en cours, revenez dans quelques instants"
- Différent de `/commande/succes` : pas de lien vers l'historique commandes

### 3.3 `/commande/annulee` (EXISTANT)

Réutilisée telle quelle comme `cancel_url` pour le checkout abonnement.

### 3.4 `AuthContext` — mise à jour des types

```ts
// SubscriptionData : ajout du nouveau plan et des nouveaux champs
plan: 'free' | 'ora_plus'  // supprime 'starter' | 'premium' | 'vip'
stripeCustomerId: string | null  // nouveau
currentPeriodEnd: string | null  // nouveau
```

`mapSubscription()` mappe les nouvelles colonnes DB.

---

## 4. Gating des avantages Óra+

### 4.1 Hook `useIsOraPlus()`

Fichier : `src/hooks/useIsOraPlus.ts`

```ts
export function useIsOraPlus() {
  const { subscription } = useAuth()
  const isOraPlus = subscription?.plan === 'ora_plus' && subscription?.status === 'active'

  function effectiveUnitPrice(publicPrice: number): number {
    return isOraPlus ? oraMemberUnitPrice(publicPrice) : publicPrice
  }

  return { isOraPlus, effectiveUnitPrice }
}
```

### 4.2 Points d'application

- **`DrinkOptionsModal`** : affiche le prix réduit uniquement si `isOraPlus`
- **`HomeProductCarousel`** : idem
- **`Menu.tsx`** : idem
- **`CartDrawer`** : `effectiveUnitPrice` pour calculer le total affiché

`oraMemberUnitPrice()` reste dans `src/lib/oraPricing.ts` comme fonction pure — le hook l'encapsule.

---

## 5. Variables d'environnement requises

| Variable | Usage |
|----------|-------|
| `STRIPE_SECRET_KEY` | Toutes les edge functions Stripe |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` (vérification signature) |
| `STRIPE_ORA_PLUS_PRICE_ID` | `create-subscription-session` (default price) |
| `SITE_URL` | URLs de redirection dans les sessions Stripe |
| `SUPABASE_URL` | Déjà configuré |
| `SUPABASE_SERVICE_ROLE_KEY` | Déjà configuré |

---

## 6. Hors périmètre Cycle 1

- Liste des factures PDF Stripe dans l'espace membre (Cycle 2)
- Bouton annulation en 1 clic depuis l'espace membre (Cycle 2)
- Dashboard admin : MRR, paiements échoués (Cycle 2)
- Portail Stripe billing (déjà existant via `create-customer-portal-session`)
