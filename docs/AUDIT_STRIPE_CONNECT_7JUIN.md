# Prompt Cursor — Audit Stripe Connect Kayvila (Juin 2026)

## Contexte

Kayvila utilise Stripe Connect Express pour splitter les paiements entre Kayvila et les propriétaires. Le flux : client réserve → checkout Stripe → webhook confirme → transfert automatique vers le compte Connect du proprio.

Code à auditer : `lib/stripe/connect.ts`, `app/api/webhooks/stripe/route.ts`, `app/api/booking/route.ts`, `app/api/stripe/admin-refund/route.ts`, `app/api/stripe/connect-onboarding/route.ts`, `lib/revenue/booking-revenue.ts`.

---

## Points d'audit

### 1. Commission — Taux fixe vs variable

**Fichier :** `app/api/booking/route.ts:318-323`

```typescript
const { platformFeeCents } = calculateTransferAmounts(
  stayCents, cleaningFeeCents, serviceFeeCents, 25  // ← hardcodé
);
```

**Question :** Le taux est hardcodé à 25%. Richard veut 20% OTA / 25% Direct. Est-ce que le champ `bookings.source` est renseigné au moment du checkout ? Si oui → passer le bon taux. Si non → le fix doit aussi inclure le renseignement de `source` à la création du booking.

**Vérifier aussi :** `lib/revenue/booking-revenue.ts` — `ownerNetCents()` et `platformFeeCents()` appliquent aussi 25% fixe.

---

### 2. Webhook — Gestion des erreurs non bloquantes

**Fichier :** `app/api/webhooks/stripe/route.ts`

- Ligne 138-156 : `fetch()` pour notifs email/booking — les erreurs sont loggées mais n'empêchent pas le retour 200. ✅ Bon pattern.
- Ligne 463-467 : Si le handler crash après le claim de l'event, Stripe ne retentera pas (l'event est marqué comme processed). ⚠️ **Risque** : une réservation confirmée dans Stripe mais pas dans Supabase.

**Check :** Ajouter un try/catch autour du traitement métier (après le claim) qui, en cas d'échec, supprime l'entrée dans `stripe_events_processed` pour permettre le retry.

---

### 3. Admin Refund — Robustesse

**Fichier :** `app/api/stripe/admin-refund/route.ts`

- Ligne 62-69 : `stripe.refunds.create()` avec `reverse_transfer: true` — ✅ reverse le transfert Connect
- Ligne 54-56 : Vérifie `payment_status === "refunded"` avant de rembourser — ✅ évite double refund
- ⚠️ **Manquant** : Pas de vérification que le PaymentIntent est bien `succeeded` avant de tenter le refund. Si le paiement est encore en `processing`, Stripe va rejeter.

**Action :** Ajouter un appel `stripe.paymentIntents.retrieve()` avant le refund pour vérifier le statut, et retourner une erreur claire si pas encore `succeeded`.

---

### 4. Booking Session — Sync fallback

**Fichier :** `app/api/booking-session/route.ts`

**Check :** Le commentaire dit "Sync local booking when Stripe Checkout is paid but webhook is delayed". Vérifier que cette route :
- Vérifie bien le statut du PaymentIntent via l'API Stripe avant de marquer comme payé
- Ne duplique pas le traitement si le webhook arrive juste après
- Utilise `stripe_events_processed` pour l'idempotence (ou un autre mécanisme)

---

### 5. Connect Onboarding — États de bord

**Fichier :** `app/api/stripe/connect-onboarding/route.ts`

**Check :**
- Si un proprio a déjà un compte Connect mais pas complété (`charges_enabled = false`), l'API crée-t-elle un nouveau compte ou réutilise-t-elle l'existant ?
- Le `refresh_url` et `return_url` pointent vers `/dashboard` — vérifier que cette page gère correctement les paramètres `?connect=refresh` et `?connect=success`

---

### 6. Double paiement — Idempotence checkout

**Fichier :** `app/api/booking/route.ts`

**Check :** Si un utilisateur clique deux fois sur "Payer", deux sessions Stripe sont-elles créées pour la même réservation ? Vérifier :
- Un garde existe-t-il côté serveur (ex: vérifier que le booking n'est pas déjà `confirmed` ou `paid` avant de créer une session) ?
- Le `idempotency_key` est-il utilisé dans l'appel à `stripe.checkout.sessions.create()` ?

---

### 7. Contentieux (Disputes) — Complétude

**Fichier :** `app/api/webhooks/stripe/route.ts:341-423`

- ✅ `charge.dispute.created` → INSERT dans `stripe_disputes` + email admin
- ✅ `charge.dispute.closed` → UPDATE statut
- ✅ `charge.dispute.funds_reinstated` → statut "won"
- ✅ `charge.dispute.funds_withdrawn` → statut "lost"

**Check :** Le handler `charge.dispute.created` n'enregistre PAS le booking_id dans `stripe_disputes`. Si un litige arrive, l'admin n'a aucun lien direct vers la réservation concernée. Ajouter une colonne `booking_id` à `stripe_disputes` et la peupler lors de la création.

---

### 8. Edge cases — Paiements asynchrones

**Fichier :** `app/api/webhooks/stripe/route.ts:308-327`

- `payment_intent.succeeded` (ligne 308) : met à jour le booking → `paid` + `confirmed`
- `payment_intent.payment_failed` (ligne 319) : met à jour → `failed`

⚠️ **Problème potentiel :** Si `payment_intent.succeeded` arrive APRÈS `checkout.session.completed` (cas normal pour SEPA/SOFORT), le booking est déjà `confirmed`. Le handler ligne 311 vérifie `status === "pending"` — donc OK, pas de double update. Mais il ne log PAS dans `order_status_history`.

**Action :** Ajouter l'insertion dans `order_status_history` pour le handler `payment_intent.succeeded`.

---

### 9. Remboursement partiel

**Fichiers :** `app/api/webhooks/stripe/route.ts:425-446` + `app/api/stripe/admin-refund/route.ts`

Le handler `charge.refunded` ne vérifie pas si c'est un refund PARTIEL ou TOTAL. Si Stripe fait un refund partiel, le booking passe en `payment_status: "refunded"` alors que le client a peut-être encore payé une partie.

**Action :** Vérifier `charge.amount_refunded === charge.amount` avant de marquer comme `refunded`. Si partiel → nouveau statut `partially_refunded`.

---

### 10. Sécurité — CSRF / Auth admin-refund

**Fichier :** `app/api/stripe/admin-refund/route.ts`

- ✅ Auth via `requireAdmin(request)` — protégé par PIN admin
- ✅ Validation Zod sur le body
- ✅ Audit log via `logAdminAction()`

✅ RAS, bien sécurisé.

---

## Résumé des actions

| # | Priorité | Fichier | Action |
|---|----------|---------|--------|
| 1 | 🟡 | `app/api/booking/route.ts` | Remplacer 25% hardcodé par `getCommissionRate(source)` |
| 2 | 🔴 | `app/api/webhooks/stripe/route.ts` | Rollback `stripe_events_processed` en cas d'erreur handler |
| 3 | 🟡 | `app/api/stripe/admin-refund/route.ts` | Vérifier statut PaymentIntent avant refund |
| 4 | ✅ | `app/api/booking-session/route.ts` | ✅ OK — rate limiting, validation ID, sync uniquement si `payment_status=paid`. Pas d'idempotence via `stripe_events_processed` (mineur, webhook normalement plus rapide que le polling). |
| 5 | ✅ | `app/api/stripe/connect-onboarding/route.ts` | ✅ OK — réutilise compte existant non complété, retourne `already_onboarded` si OK, auth obligatoire. |
| 6 | ✅ | `app/api/booking/route.ts` | ✅ OK — idempotency check lignes 218-244 (même villa + dates + email + status pending). Retourne l'URL de session existante si double-clic. |
| 7 | 🟡 | `app/api/webhooks/stripe/route.ts` | Ajouter `booking_id` dans `stripe_disputes` |
| 8 | 🔵 | `app/api/webhooks/stripe/route.ts` | Ajouter `order_status_history` pour paiements async |
| 9 | 🟡 | `app/api/webhooks/stripe/route.ts` | Distinguer refund partiel vs total |

**Total : 9 points audités — 3 ✅ OK, 1 🔴 critique, 4 🟡 important, 1 🔵 mineur.**
**Actions réelles : 5 points à corriger dans 3 fichiers.**
