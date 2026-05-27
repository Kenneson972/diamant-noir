# Stripe Connect webhooks + Auto-refund + Disputes

**Date** : 2026-05-26
**Statut** : Implementé

## A. Webhook account.updated

Quand Stripe envoie `account.updated` avec `charges_enabled` et `details_submitted`, mettre à jour `profiles.stripe_connect_onboarding_completed = true` pour le propriétaire concerné.

## B. Auto-refund sur annulation

Dans `checkout.session.expired`, après avoir marqué le booking cancelled, si un paiement a été capturé (`payment_status = "paid"`), créer automatiquement un refund Stripe et marquer `payment_status = "refunded"`.

## C. Handler disputes

Quand `charge.dispute.created` est reçu, insérer une ligne dans `stripe_disputes` avec dispute_id, charge_id, montant, raison, statut et date limite de preuve.

## D. Migration

Nouvelle table `stripe_disputes` pour tracer les litiges Stripe.
