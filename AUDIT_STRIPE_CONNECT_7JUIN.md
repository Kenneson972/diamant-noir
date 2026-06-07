# Audit Stripe Connect — 7 Juin 2026

Kayvila (Diamant Noir) — Plateforme de conciergerie de luxe, Martinique.

## Fichiers audités

| Fichier | Rôle |
|---------|------|
| `lib/stripe/connect.ts` | Création compte Connect, onboarding, `calculateTransferAmounts` |
| `lib/stripe/server.ts` | Singleton Stripe serveur |
| `app/api/booking/route.ts` | Création réservation + Checkout Session Stripe |
| `app/api/webhooks/stripe/route.ts` | Webhooks Stripe (14 events gérés) |
| `app/api/stripe/connect-onboarding/route.ts` | Onboarding propriétaire Connect Express |
| `app/api/stripe/connect-verify/route.ts` | Vérification statut onboarding |
| `app/api/admin/owners/[id]/stripe/route.ts` | Dashboard admin — statut Connect + transfers + disputes |
| `app/api/stripe/admin-refund/route.ts` | Remboursement admin avec reverse_transfer |
| `lib/commission.ts` | Calcul commission (modèle legacy 25%) |
| `lib/revenue/booking-revenue.ts` | Calcul revenus + `getCommissionRate` (NOUVEAU 7 Juin) |

---

## 1. Architecture globale

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Client Web  │────▶│  POST /api/booking │────▶│  Stripe Checkout │
│  (locataire) │     │  (route.ts)        │     │  Session         │
└─────────────┘     └────────┬─────────┘     └────────┬────────┘
                             │                        │
                             │ create booking (DB)    │ payment
                             │ create Stripe session  │
                             ▼                        ▼
                    ┌─────────────────────────────────────┐
                    │         Stripe Webhooks              │
                    │  POST /api/webhooks/stripe/route.ts  │
                    └──────────────┬──────────────────────┘
                                   │
            ┌──────────────────────┼──────────────────────┐
            │                      │                      │
            ▼                      ▼                      ▼
   checkout.completed    account.updated       charge.dispute.*
   → booking=confirmed   → onboarding=ok      → dispute DB + email
   → emails (guest,      → email proprio      → admin alert
     admin, owner)
```

**Flux onboarding proprio :**
```
Proprio → POST connect-onboarding → createConnectAccount()
       → Stripe Express onboarding (navigateur)
       → POST connect-verify → getConnectAccount()
       → webhook account.updated → profile mis à jour
```

---

## 2. Ce qui fonctionne ✅

### 2.1 Création de compte Connect Express
- `lib/stripe/connect.ts:9-24` — `createConnectAccount(email)` crée un compte Express avec `capabilities: { transfers: { requested: true } }`.
- Idempotent côté API : vérifie `stripe_connect_onboarding_completed` avant de créer un nouveau compte.
- Lien d'onboarding généré avec `refresh_url` et `return_url` pointant vers le dashboard.

### 2.2 Vérification onboarding
- `connect-verify/route.ts` — vérifie `charges_enabled` et `details_submitted` via l'API Stripe.
- Webhook `account.updated` (ligne 279-305) met à jour automatiquement le profil quand l'onboarding est complété.
- Email Resend de confirmation envoyé au proprio (`sendOwnerConnectOnboardedEmail`).

### 2.3 Checkout Session avec split Connect
- `booking/route.ts:379-386` — si le proprio a un compte Connect, la Session inclut :
  - `payment_intent_data.transfer_data.destination` = compte proprio
  - `payment_intent_data.application_fee_amount` = commission Kayvila
- Empêche la réservation si le proprio n'a pas finalisé son onboarding (ligne 120-140).

### 2.4 Webhooks — robustesse
- **Idempotence** : table `stripe_events_processed` avec upsert atomique (ligne 50-66). Pas de double traitement.
- **14 events gérés** : `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_failed`, `account.updated`, `account.application.deauthorized`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`, `charge.dispute.funds_reinstated`, `charge.dispute.funds_withdrawn`.
- **Session expirée** : annulation + remboursement automatique avec `reverse_transfer: true` (ligne 256-274).
- **Paiements asynchrones** (SEPA, SOFORT) : `payment_intent.succeeded` met à jour le statut même sans `checkout.session.completed`.
- **Création compte client auto** : quand un guest non inscrit paie, création compte + magic link (ligne 192-228).

### 2.5 Remboursement admin
- `admin-refund/route.ts` — validation Zod, vérifie que le booking existe et n'est pas déjà remboursé.
- Utilise `reverse_transfer: true` pour récupérer les fonds du compte Connect proprio.
- Audit log via `logAdminAction`.

### 2.6 Dashboard admin — statut Connect
- `admin/owners/[id]/stripe/route.ts` — affiche `chargesEnabled`, `payoutsEnabled`, `detailsSubmitted`, 10 derniers transfers, disputes.
- Graceful degradation si `stripe_disputes` n'existe pas encore.

### 2.7 Sécurité
- Rate limiting sur POST /api/booking (10 req/60s par IP).
- CSRF check sur POST /api/booking.
- Validation Zod sur booking request et admin refund.
- Double vérification disponibilité (date conflict check + statut published).
- Vérification capacité et min_nights.

---

## 3. Problèmes identifiés 🔴

### 3.1 [P1] Booking route — taux de commission hardcodé à 25%

**Fichier :** `app/api/booking/route.ts:318-323`

```typescript
const { platformFeeCents } = calculateTransferAmounts(
  stayCents, cleaningFeeCents, serviceFeeCents,
  25  // ← HARDCODÉ
);
```

**Problème :** La nouvelle fonction `getCommissionRate()` (ajoutée le 7 Juin dans `lib/revenue/booking-revenue.ts`) n'est pas utilisée ici. Toutes les réservations passent par 25%, même les OTA qui devraient être à 20%.

**Impact :** Si un jour des réservations OTA passent par cette route (actuellement `source: "direct"` est hardcodé ligne 267), la commission serait incorrecte. Pour l'instant, impact nul car `source = "direct"` → 25% est correct. Mais le code n'est pas prêt pour le futur flux OTA.

**Fix :** Remplacer `25` par `getCommissionRate("direct")`. Documenter que pour les bookings OTA, le `source` doit être passé dynamiquement.

### 3.2 [P2] Double système de commission — `lib/commission.ts` vs `getCommissionRate()`

**Fichiers :** `lib/commission.ts` et `lib/revenue/booking-revenue.ts`

- `lib/commission.ts` utilise `DEFAULT_COMMISSION_RATE = 0.25` (fraction) et `normalizeCommissionRate()`.
- `lib/revenue/booking-revenue.ts` utilise `getCommissionRate()` qui différencie OTA (20%) et Direct (25%) basé sur `bookings.source`.
- `lib/commission.ts` est encore utilisé par `lib/emails/send.ts` (ligne 202) pour l'email proprio.

**Problème :** Deux sources de vérité pour le taux de commission. Risque de divergence.

**Fix :** `lib/commission.ts` devrait appeler `getCommissionRate()` ou être déprécié. Pour l'email proprio, utiliser `getCommissionRate(booking.source)`.

### 3.3 [P3] `source` hardcodé à "direct" dans booking route

**Fichier :** `app/api/booking/route.ts:267`

```typescript
source: "direct",
```

**Problème :** Aucun mécanisme pour différencier une réservation OTA d'une réservation directe au moment de la création. Si le flux OTA (iCal sync, API externe) crée des bookings via une autre route, c'est OK. Mais si un jour cette route est utilisée pour des bookings OTA, le `source` sera incorrect.

**Recommandation :** Vérifier que les bookings OTA passent bien par une route séparée (import iCal, API OTA sync). Si oui, documenter. Si non, ajouter un paramètre `source` à `BookingRequestSchema`.

### 3.4 [P3] Pas de gestion des remboursements partiels

**Fichier :** `app/api/stripe/admin-refund/route.ts`

**Problème :** `stripe.refunds.create()` sans paramètre `amount` rembourse la totalité. Aucun support pour un remboursement partiel (ex: une nuit sur un séjour de 7 nuits).

**Impact :** Faible pour le moment. À prévoir si le business model évolue.

### 3.5 [P3] Pas de payout schedule ni de gestion des délais de transfert

**Fichier :** `lib/stripe/connect.ts`

**Problème :** Les transferts Stripe Connect utilisent le comportement par défaut (payout T+7 ou selon la config du compte). Aucune logique métier pour gérer :
- Retenue de garantie (caution)
- Payout après check-in (et non après paiement)
- Payout partiel (acompte vs solde)

**Recommandation :** À discuter avec Richard. Si le modèle évolue vers "paiement à l'arrivée" ou "acompte 30%", il faudra gérer les transferts manuellement.

---

## 4. Recommandations

| # | Priorité | Action | Effort |
|---|----------|--------|--------|
| 1 | P1 | Utiliser `getCommissionRate()` dans `booking/route.ts` au lieu du 25 hardcodé | 5 min |
| 2 | P2 | Réconcilier `lib/commission.ts` avec `getCommissionRate()` — utiliser une source unique | 30 min |
| 3 | P3 | Documenter ou implémenter le paramètre `source` dans `BookingRequestSchema` | 15 min |
| 4 | P3 | Ajouter support remboursement partiel dans `admin-refund` | 30 min |
| 5 | P3 | Vérifier que les bookings OTA (iCal) passent par une route séparée avec `source` correct | 15 min |

---

## 5. Variables d'environnement requises

| Variable | Status | Usage |
|----------|--------|-------|
| `STRIPE_SECRET_KEY` | ✅ Configurée | Toutes les opérations Stripe |
| `STRIPE_WEBHOOK_SECRET` | ✅ Configurée | Vérification signature webhooks |
| `NEXT_PUBLIC_BASE_URL` | ✅ Configurée | URLs de redirection |
| `RESEND_API_KEY` | ✅ Configurée | Emails transactionnels |
| `API_SECRET_KEY` | ✅ Configurée | Auth interne appels API→API |

---

## 6. Tables Supabase

| Table | Status | Usage |
|-------|--------|-------|
| `bookings` | ✅ | `stripe_session_id`, `stripe_payment_intent_id`, `payment_status`, `source` |
| `profiles` | ✅ | `stripe_connect_account_id`, `stripe_connect_onboarding_completed` |
| `stripe_events_processed` | ✅ | Idempotence webhooks (`event_id`, `event_type`) |
| `stripe_disputes` | ✅ | Suivi litiges (`dispute_id`, `charge_id`, `amount_cents`, `reason`, `status`) |
| `order_status_history` | ✅ | Historique changements de statut |
| `villas` | ✅ | `owner_id`, `cleaning_fee_cents`, `commission_rate` |

---

**Conclusion :** L'implémentation Stripe Connect est solide et couvre le flow complet (onboarding → réservation → paiement → webhook → remboursement → litiges). Les 14 events webhook sont gérés avec idempotence. Le seul vrai gap est l'intégration du nouveau modèle de commission différencié OTA/Direct dans la route de booking, qui est un fix trivial.
