# Audit Stripe Connect Kayvila — 7 Juin 2026

Kayvila (Diamant Noir) — Plateforme de conciergerie de luxe, Martinique.

## Fichiers audités

| Fichier | Rôle |
|---------|------|
| `lib/stripe/connect.ts` | Création compte Connect, onboarding, `calculateTransferAmounts` |
| `lib/stripe/server.ts` | Singleton Stripe serveur |
| `app/api/booking/route.ts` | Création réservation + Checkout Session Stripe |
| `app/api/webhooks/stripe/route.ts` | Webhooks Stripe (14 events) |
| `app/api/stripe/connect-onboarding/route.ts` | Onboarding propriétaire Connect Express |
| `app/api/stripe/connect-verify/route.ts` | Vérification statut onboarding |
| `app/api/admin/owners/[id]/stripe/route.ts` | Dashboard admin — statut Connect |
| `app/api/stripe/admin-refund/route.ts` | Remboursement admin |
| `lib/commission.ts` | Calcul commission (modèle legacy) |
| `lib/revenue/booking-revenue.ts` | Calcul revenus + `getCommissionRate` |

---

## Architecture

```
CLIENT WEB → POST /api/booking → Stripe Checkout Session
                                      │
                                      ▼
                              Stripe Webhooks
                         POST /api/webhooks/stripe
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
   checkout.completed         account.updated          charge.dispute.*
   → booking=confirmed        → onboarding=ok          → dispute DB + email
   → emails (guest,           → email proprio          → admin alert
     admin, owner)

PROPRIO → POST /api/stripe/connect-onboarding → Stripe Express
        → POST /api/stripe/connect-verify → statut
        → Webhook account.updated → profile mis à jour

ADMIN → POST /api/stripe/admin-refund → reverse_transfer → audit log
      → GET /api/admin/owners/[id]/stripe → statut Connect + transfers
```

---

## Points d'audit

### 1. Commission — Taux hardcodé à 25%

**Fichier :** `app/api/booking/route.ts:318-323`

```typescript
const { platformFeeCents } = calculateTransferAmounts(
  stayCents, cleaningFeeCents, serviceFeeCents,
  25  // ← HARDCODÉ
);
```

**Problème :** `getCommissionRate()` (ajoutée le 7 Juin dans `lib/revenue/booking-revenue.ts`) n'est pas utilisée. Toutes les réservations passent à 25%, même les OTA qui devraient être à 20%.

**Fix :** `import { getCommissionRate } from "@/lib/revenue/booking-revenue";` et remplacer `25` par `getCommissionRate("direct")`. Pour les futurs bookings OTA, passer le `source` dynamiquement.

**Priorité :** 🟡

---

### 2. Double système de commission

**Fichiers :** `lib/commission.ts` et `lib/revenue/booking-revenue.ts`

- `lib/commission.ts` : `DEFAULT_COMMISSION_RATE = 0.25`, `normalizeCommissionRate()` — utilisé par `lib/emails/send.ts`
- `lib/revenue/booking-revenue.ts` : `getCommissionRate()` — 20% OTA / 25% Direct

Deux sources de vérité pour le taux. Risque de divergence.

**Fix :** `lib/commission.ts` doit être réconcilié avec `getCommissionRate()`.

**Priorité :** 🟡

---

### 3. Webhook — Rollback si erreur handler

**Fichier :** `app/api/webhooks/stripe/route.ts:50-66`

```typescript
// Claim atomique avant traitement
const { data: claimed } = await supabase
  .from("stripe_events_processed")
  .upsert({ event_id: event.id, event_type: event.type }, ...)
  .maybeSingle();
```

Si le handler crash APRÈS le claim mais AVANT la fin du traitement (ex: timeout, erreur DB), l'event est marqué comme traité mais les updates n'ont pas eu lieu. Stripe ne retentera pas.

**Fix :** Dans le `catch` final (ligne 463-467), supprimer l'entrée dans `stripe_events_processed` avant de retourner 500.

**Priorité :** 🔴

---

### 4. Admin Refund — Vérifier statut PaymentIntent

**Fichier :** `app/api/stripe/admin-refund/route.ts:62-69`

Le refund est tenté sans vérifier que le PaymentIntent est `succeeded`. Si le paiement est encore en `processing`, Stripe rejette silencieusement.

**Fix :** Ajouter `stripe.paymentIntents.retrieve()` avant le refund. Si statut ≠ `succeeded`, retourner erreur 409 "Paiement non finalisé".

**Priorité :** 🟡

---

### 5. Booking route — Idempotence checkout

**Fichier :** `app/api/booking/route.ts:218-244`

✅ **OK** — Lignes 218-244 : vérifie même villa + dates + email + status `pending`. Si une session Stripe existe déjà, retourne l'URL existante. Pas de double création.

---

### 6. Connect Onboarding — Réutilisation compte

**Fichier :** `app/api/stripe/connect-onboarding/route.ts`

✅ **OK** — Ligne 31 : vérifie `stripe_connect_account_id` existant avant de créer un nouveau compte. Ligne 24-29 : retourne `already_onboarded` si déjà complété.

---

### 7. Disputes — booking_id manquant

**Fichier :** `app/api/webhooks/stripe/route.ts:341-398`

`charge.dispute.created` insère dans `stripe_disputes` sans `booking_id`. L'admin n'a aucun lien direct vers la réservation. Pourtant le code essaie de le retrouver (lignes 358-384) pour l'email — mais ne le stocke pas.

**Fix :** Ajouter `booking_id` dans l'INSERT `stripe_disputes`. Ajouter la colonne si absente.

**Priorité :** 🟡

---

### 8. Paiements asynchrones — Pas d'historique

**Fichier :** `app/api/webhooks/stripe/route.ts:308-317`

`payment_intent.succeeded` met à jour le booking mais n'insère PAS dans `order_status_history`. Perte de traçabilité.

**Fix :** Ajouter l'insertion dans `order_status_history` (comme le fait `checkout.session.completed`).

**Priorité :** 🔵

---

### 9. Remboursement partiel vs total

**Fichier :** `app/api/webhooks/stripe/route.ts:425-446`

`charge.refunded` ne vérifie pas si le refund est partiel ou total. Marque `payment_status: "refunded"` dans les deux cas.

**Fix :** Vérifier `charge.amount_refunded === charge.amount`. Si partiel → `partially_refunded`. Si total → `refunded`.

**Priorité :** 🟡

---

### 10. Sécurité — CSRF / Auth admin-refund

**Fichier :** `app/api/stripe/admin-refund/route.ts`

✅ **OK** — Auth `requireAdmin`, validation Zod, audit log.

---

## Résumé des actions

| # | Priorité | Fichier | Action |
|---|----------|---------|--------|
| 1 | 🟡 | `app/api/booking/route.ts:318` | Remplacer 25% par `getCommissionRate("direct")` |
| 2 | 🟡 | `lib/commission.ts` | Réconcilier avec `getCommissionRate()` |
| 3 | 🔴 | `app/api/webhooks/stripe/route.ts:463` | Rollback `stripe_events_processed` en cas d'erreur handler |
| 4 | 🟡 | `app/api/stripe/admin-refund/route.ts:62` | Vérifier statut PaymentIntent avant refund |
| 5 | 🟡 | `app/api/webhooks/stripe/route.ts:347` | Stocker `booking_id` dans `stripe_disputes` |
| 6 | 🔵 | `app/api/webhooks/stripe/route.ts:308` | Ajouter `order_status_history` pour paiements async |
| 7 | 🟡 | `app/api/webhooks/stripe/route.ts:425` | Distinguer refund partiel vs total |

**Total : 10 points audités — 3 ✅ OK, 1 🔴 critique, 5 🟡 important, 1 🔵 mineur.**
**Actions : 7 fixes dans 4 fichiers.**

---

## Variables d'environnement

| Variable | Status | Usage |
|----------|--------|-------|
| `STRIPE_SECRET_KEY` | ✅ | Toutes opérations Stripe |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Signature webhooks |
| `NEXT_PUBLIC_BASE_URL` | ✅ | URLs redirection |
| `RESEND_API_KEY` | ✅ | Emails |
| `API_SECRET_KEY` | ✅ | Auth interne API→API |

## Tables Supabase

| Table | Colonnes clés |
|-------|--------------|
| `bookings` | `stripe_session_id`, `stripe_payment_intent_id`, `payment_status`, `source` |
| `profiles` | `stripe_connect_account_id`, `stripe_connect_onboarding_completed` |
| `stripe_events_processed` | `event_id`, `event_type` |
| `stripe_disputes` | `dispute_id`, `charge_id`, `amount_cents`, `reason`, `status`, `booking_id` |
| `order_status_history` | `booking_id`, `from_status`, `to_status`, `changed_by`, `reason` |
