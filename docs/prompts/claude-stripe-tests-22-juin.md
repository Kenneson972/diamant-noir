# 🔧 KAYVILA — Mega Prompt Claude — Stripe Live + Tests Complets

**Projet** : Kayvila / Diamant Noir — Conciergerie de luxe Martinique
**Repo** : `diamant-noir` (`/opt/data/repos/diamant-noir`)
**Stack** : Next.js 15, HeroUI, Supabase, Stripe Connect, Resend, Tailwind 4
**Package** : `stripe@^14.25.0`, `vitest@^4.1.9`, `@playwright/test@^1.58.2`
**Tests existants** : 17 fichiers Playwright + pattern Vitest (`lib/**/*.test.ts`)

---

## ⚠️ RÈGLES ABSOLUES

1. **Pas de redesign.** Le design Kayvila est verrouillé. Tu fais du POLISH et des CORRECTIONS.
2. **Un commit par feature** — Stripe checkout, webhook, tests Vitest, tests Playwright = commits séparés.
3. **Les tests doivent PASSER.** `npx vitest run` et `npx playwright test` = vert.
4. **Mode test Stripe d'abord**, clés de prod après validation.
5. **Toutes les migrations SQL sont déjà écrites** dans `migration-missing-columns.sql` et `update_bookings_payment.sql` — les appliquer si pas déjà faites.
6. **Ne jamais commit les clés Stripe.** Variables d'env uniquement.

---

## PHASE 1 — STRIPE CHECKOUT (Réservation directe Kayvila)

### 1.1 Endpoint API Checkout Session
**Fichier** : `app/api/booking/route.ts` (existe déjà ? vérifier)

Si absent, créer `app/api/checkout/route.ts` (POST) :
- Reçoit `{ villaId, checkin, checkout, guests, guestName, guestEmail }`
- Calcule le prix total (prix/nuit × nuits + ménage + frais service)
- Crée une `stripe.checkout.sessions.create()` avec :
  - `mode: "payment"`
  - `line_items` : nuitées + frais ménage + frais service
  - `customer_email` : email du guest
  - `metadata` : `{ villaId, checkin, checkout, guests, bookingId }`
  - `success_url` : `{baseUrl}/reservation/confirmee?session_id={CHECKOUT_SESSION_ID}`
  - `cancel_url` : `{baseUrl}/villas/{villaId}`
- Insère un booking avec `status: "pending"`, `payment_status: "unpaid"`, `stripe_session_id`
- Retourne `{ url: session.url }` (redirection frontend)

### 1.2 Page de confirmation
**Fichier** : `app/reservation/confirmee/page.tsx`
- Lit `session_id` depuis l'URL
- Appelle Stripe pour vérifier le statut du checkout
- Affiche : ✅ Réservation confirmée, détails, prochaines étapes
- Si `session_id` invalide → message d'erreur + lien vers /villas

### 1.3 Redirection checkout côté frontend
**Modifier** `components/booking/CheckoutView.tsx` :
- Après validation CGV + formulaire → POST `/api/checkout` → redirection vers `session.url`
- Loading state pendant la création de session
- Gestion d'erreur si Stripe HS

---

## PHASE 2 — STRIPE WEBHOOK

### 2.1 Endpoint webhook
**Fichier** : `app/api/webhooks/stripe/route.ts`

Gère `checkout.session.completed` :
- Vérifie la signature webhook (`stripe.webhooks.constructEvent`)
- Met à jour le booking : `status: "confirmed"`, `payment_status: "paid"`
- Si réservation directe Kayvila → exécute le transfert Connect (voir 1.2)
- Envoie email confirmation via Resend (guest + admin)
- Log l'événement dans `stripe_events_processed`

Gère `checkout.session.expired` :
- Booking → `status: "cancelled"`, `payment_status: "expired"`

### 2.2 Transfert Connect (réservations directes Kayvila)
**Utiliser** `lib/stripe/connect.ts` déjà existant :
- `calculateTransferAmounts(stayCents, cleaningCents, serviceCents, 25)` → split 75/25
- Créer un transfert vers le compte Connect du proprio
- Mettre à jour le booking avec `stripe_transfer_id`

---

## PHASE 3 — TESTS VITEST (Logique métier Stripe)

### 3.1 Test : calculateTransferAmounts
**Fichier** : `lib/stripe/connect.test.ts`

```typescript
// Tester :
// stayCents=10000 (100€), cleaningFeeCents=5000, serviceFeeCents=2000
// → ownerAmountCents = 7500 (75€), platformFeeCents = 9500 (25€ + 50€ + 20€)
// stayCents=0 → ownerAmountCents=0, platformFeeCents=cleaning+service
// stayCents=20000, commission=20 → ownerAmountCents=16000
```

### 3.2 Test : calculateBookingTotal (nouveau)
**Fichier** : `lib/revenue/booking-revenue.test.ts`
- Prix/nuit × nuits → total séjour
- Ajout frais ménage + service
- Arrondi correct (cents)

### 3.3 Test : getCommissionRate
**Fichier** : `lib/revenue/booking-revenue.test.ts`
- Source "airbnb" → 25%
- Source "direct" → 25%
- Source "booking" → 25%
- Source null → 25% (défaut)

### 3.4 Test : buildExternalId
**Fichier** : `lib/ota-hub.test.ts`
- `buildExternalId("airbnb", "abc123")` → `"airbnb_abc123"`

### 3.5 Test : detectOTASource
**Fichier** : `lib/ota-hub.test.ts`
- URL contenant "airbnb.com" → "airbnb"
- URL contenant "booking.com" → "booking"
- URL inconnue → "direct"

→ **Commande** : `npx vitest run` doit passer

---

## PHASE 4 — TESTS PLAYWRIGHT (Flows E2E)

### 4.1 Booking complet (mode test Stripe)
**Fichier** : `tests/booking-complete.spec.ts`
1. Aller sur `/villas` → cliquer première villa
2. Sélectionner dates → remplir guests
3. Cliquer "Réserver" → vérifier redirection vers Stripe Checkout
4. Sur la page Stripe (test) : remplir CB `4242 4242 4242 4242`
5. Vérifier redirection vers `/reservation/confirmee`
6. Vérifier message confirmation

### 4.2 Webhook simulé
**Fichier** : `tests/stripe-webhook.spec.ts`
1. Créer un booking pending via API
2. Simuler `checkout.session.completed` (appel direct à l'API webhook)
3. Vérifier que le booking passe en `confirmed` + `paid`
4. Vérifier que l'email Resend est envoyé (mock ou vérifier les logs)

### 4.3 Checkout sans CGV
**Fichier** : `tests/cgv-checkout.spec.ts` (existe déjà — vérifier et compléter)
- Vérifier que le bouton est désactivé si CGV non cochée

### 4.4 Checkout visiteur non connecté
**Fichier** : `tests/checkout-guest.spec.ts`
- Aller sur `/book?villaId=...&checkin=...&checkout=...&guests=2`
- Remplir nom + email invité
- Cocher CGV → bouton actif
- Cliquer → redirection Stripe

→ **Commande** : `npx playwright test` doit passer

---

## PHASE 5 — VÉRIFICATIONS STRIPE CONNECT

### 5.1 Dashboard admin — Sync OTA
**Vérifier** `components/dashboard/admin/SyncOtaAdminPage.tsx` :
- Bouton "Sync maintenant" → appelle `/api/admin/sync-ota`
- Affiche résultats par villa (inserted/deleted/errors)

### 5.2 Onboarding proprio
**Vérifier** le flow existant dans `lib/stripe/connect.ts` :
- `createConnectAccount(email)` → crée un compte Express
- `createOnboardingLink(accountId)` → URL d'onboarding
- Intégré dans le dashboard proprio ? Vérifier.

---

## PHASE 6 — CLEANUP & ENV

### 6.1 Variables d'environnement à vérifier
```
STRIPE_SECRET_KEY=sk_test_...     # clé secrète test
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # clé publique
STRIPE_WEBHOOK_SECRET=whsec_...    # secret webhook
STRIPE_CONNECT_CLIENT_ID=ca_...    # client ID Connect (si utilisé)
NEXT_PUBLIC_BASE_URL=https://kayvila.vercel.app
```

### 6.2 Migrations SQL
**Appliquer si pas déjà faites** :
```sql
-- migration-missing-columns.sql
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- update_bookings_payment.sql
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
```

### 6.3 Stripe Dashboard
- Créer un endpoint webhook pointant vers `https://kayvila.vercel.app/api/webhooks/stripe`
- Événements à écouter : `checkout.session.completed`, `checkout.session.expired`
- Mode test → valider → mode live

---

## 📊 RÉCAP — Fichiers à créer/modifier

| Action | Fichier | Type |
|--------|---------|------|
| Créer | `app/api/checkout/route.ts` | Nouveau |
| Créer | `app/reservation/confirmee/page.tsx` | Nouveau |
| Créer | `app/api/webhooks/stripe/route.ts` | Nouveau |
| Modifier | `components/booking/CheckoutView.tsx` | Existant |
| Créer | `lib/stripe/connect.test.ts` | Nouveau |
| Créer | `lib/revenue/booking-revenue.test.ts` | Nouveau |
| Créer | `lib/ota-hub.test.ts` | Nouveau |
| Créer | `tests/booking-complete.spec.ts` | Nouveau |
| Créer | `tests/stripe-webhook.spec.ts` | Nouveau |
| Créer | `tests/checkout-guest.spec.ts` | Nouveau |
| Vérifier | `tests/cgv-checkout.spec.ts` | Existant |
| Appliquer | `migration-missing-columns.sql` | SQL |
| Appliquer | `update_bookings_payment.sql` | SQL |

---

## ✅ CRITÈRES DE SUCCÈS

1. `npx vitest run` → tous les tests passent
2. `npx playwright test` → tous les tests passent
3. `npx next build` → build OK
4. Réservation test complète : `/villas → villa → checkout → Stripe → confirmation → webhook → booking confirmed`
5. Onboarding Connect proprio fonctionnel (mode test)
