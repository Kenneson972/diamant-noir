# Stripe Connect + Compte Client Automatique

## Résumé

Relier les paiements Stripe aux comptes propriétaires (reversement) et aux comptes clients (espace client).

## Problème

1. Les paiements vont sur le compte Stripe de Kayvila sans split vers les propriétaires
2. Les clients peuvent réserver sans compte — la réservation est dans la DB mais pas liée à un espace client
3. Le modèle commercial promet 20% de commission et un espace propriétaire avec suivi des revenus

## Solution

### 1. Stripe Connect — Reversement aux propriétaires

- Activer Stripe Connect (mode test) dans le dashboard Stripe
- Ajouter `stripe_connect_account_id` à la table `profiles`
- Créer une route `/api/stripe/connect-onboarding` qui génère un lien d'onboarding Stripe
- Dans `/api/booking`, la session Checkout inclut `transfer_data` et `application_fee_amount` pour que Stripe split automatiquement

**Flux :**
```
Client paie 1000€ → Stripe prend 0€ (frais de traitement à part)
                    → 200€ (20%) va sur compte Kayvila
                    → 800€ va directement sur compte Stripe du propriétaire
```

**Frais de ménage et service :** 100% sur le compte Kayvila (hors commission, comme promis sur le site)

### 2. Compte client automatique après paiement

- Le webhook `checkout.session.completed` vérifie si un compte Supabase existe pour l'email
- Si non, il crée le compte via `supabase.auth.admin.createUser()` avec `email_confirm: true`
- Envoie un email d'invitation (magic link) pour que le client définisse son mot de passe
- La réservation est déjà liée par `guest_email` — elle apparaît immédiatement dans l'espace client

### 3. UI Checkout — Champ email obligatoire

- Le champ email dans le checkout passe en `required`
- On capture l'email avant la redirection Stripe
- L'email est passé en `customer_email` à Stripe (déjà fait) et stocké dans `guest_email` (déjà fait)

## Architecture

### Base de données

```sql
-- profiles table (déjà existante)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_completed BOOLEAN DEFAULT false;
```

### Fichiers à créer

| Fichier | Rôle |
|---------|------|
| `lib/stripe/connect.ts` | Helpers Stripe Connect (create account, generate onboarding link) |
| `app/api/stripe/connect-onboarding/route.ts` | Génère le lien d'onboarding Stripe pour un proprio |
| `app/api/stripe/connect-account/route.ts` | Webhook pour recevoir le statut du compte Connect |

### Fichiers à modifier

| Fichier | Changement |
|---------|-----------|
| `app/api/booking/route.ts` | Ajouter `transfer_data` + `application_fee_amount` à la session Checkout |
| `app/api/webhooks/stripe/route.ts` | Ajouter création de compte client automatique |
| `components/booking/CheckoutView.tsx` | Email obligatoire + message "un compte sera créé" |
| `app/(proprio)/dashboard/page.tsx` | Ajouter section "Connecter mon compte Stripe" si pas encore fait |

## Sécurité

- `STRIPE_CONNECT_CLIENT_ID` : variable d'environnement à ajouter
- Le webhook Stripe Connect est signé avec le `webhookSecret` existant (même endpoint ou webhook dédié)
- Les comptes Connect test sont créés avec `type: 'express'` (le plus simple pour les propriétaires)

## Tests

1. Activer Stripe Connect dans le dashboard Stripe
2. Créer un compte propriétaire test, cliquer "Connecter mon compte Stripe"
3. Suivre le flow d'onboarding Stripe Express (2-3 écrans)
4. Faire une réservation avec une villa liée à ce propriétaire
5. Vérifier dans le dashboard Stripe que le paiement est splitté
6. Vérifier que le client reçoit l'email d'invitation
7. Vérifier que la réservation apparaît dans l'espace client
