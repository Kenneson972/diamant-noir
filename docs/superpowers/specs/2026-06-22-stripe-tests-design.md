# Spec — Tests Stripe Kayvila

**Date** : 2026-06-22
**Projet** : Kayvila / Diamant Noir
**Repo** : `diamant-noir`
**Stack** : Next.js 15, HeroUI, Supabase, Stripe Connect, Resend, Vitest, Playwright

---

## Contexte

Le code métier Stripe est déjà complet et en production :
- `POST /api/booking` — création session checkout Stripe + booking pending
- `POST /api/webhooks/stripe` — 13 événements gérés avec idempotence
- Stripe Connect Express pour payouts proprios (75/25)
- Page de confirmation `/success` avec polling fallback
- Toutes les colonnes DB présentes (`stripe_session_id`, `stripe_payment_intent_id`, `payment_status`)

**Objectif** : Ajouter uniquement les tests (Vitest + Playwright). Zéro modification du code métier existant.

---

## Stratégie de test

| Couche | Approche | CI | Déclencheur |
|---|---|---|---|
| **Vitest (unitaire)** | Tests isolés, sans Stripe réel | ✅ Chaque push | `npx vitest run` |
| **Playwright mocké** | API mockée via `setupStripeMock()`, pas de checkout.stripe.com | ✅ Chaque push | `npx playwright test --project=mocked` |
| **Playwright réel** | Flow complet avec `checkout.stripe.com`, CB `4242…` | ❌ | Manuel / weekly cron / `--project=live-stripe` |

---

## Phase 1 — Tests Vitest (3 fichiers)

### `lib/stripe/connect.test.ts`
Teste `calculateTransferAmounts` du fichier existant `lib/stripe/connect.ts`.

```
describe("calculateTransferAmounts")
  it("100€ séjour + 50€ ménage + 20€ frais service, commission 25%")
     stayCents=10000, cleaningFeeCents=5000, serviceFeeCents=2000, 25
     → { ownerAmountCents: 7500, platformFeeCents: 9500 }

  it("séjour à 0€ → seul le ménage + service vont à la plateforme")
     stayCents=0, cleaningFeeCents=5000, serviceFeeCents=2000, 25
     → { ownerAmountCents: 0, platformFeeCents: 7000 }

  it("commission 20% → proprio reçoit 80% du séjour")
     stayCents=20000, cleaningFeeCents=0, serviceFeeCents=0, 20
     → { ownerAmountCents: 16000, platformFeeCents: 4000 }
```

### `lib/revenue/booking-revenue.test.ts`
Teste `calculateBookingTotal` et `getCommissionRate`. Si ces fonctions n'existent pas en export standalone, extraire la logique depuis `app/api/booking/route.ts` et `lib/stripe/connect.ts` dans le test lui-même (tester via l'API route POST /api/booking plutôt que l'import direct).

```
describe("calculateBookingTotal")
  it("3 nuits × 150€ + 80€ ménage + 5% service")
     → total en cents vérifié (arrondi correct)

describe("getCommissionRate")
  it('"airbnb" → 25%')
  it('"direct" → 25%')
  it('"booking" → 25%')
  it('null → 25% (défaut)')
```

### `lib/ota-hub.test.ts`
Teste `buildExternalId` et `detectOTASource`. Si ces fonctions n'existent pas dans `lib/ota-hub.ts`, tester via la logique équivalente dans l'API booking (le champ `source` du booking).

```
describe("buildExternalId")
  it('("airbnb", "abc123") → "airbnb_abc123"')

describe("detectOTASource")
  it('URL contenant "airbnb.com" → "airbnb"')
  it('URL contenant "booking.com" → "booking"')
  it('URL inconnue → "direct"')
```

---

## Phase 2 — Tests Playwright mockés (CI chaque push)

### Helper : `tests/helpers/stripe-mock.ts`

```ts
export function setupStripeMock(page: Page) {
  // Intercepte POST /api/booking → retourne une URL de succès fake
  // Intercepte GET /api/booking-session → booking confirmed
  // Réutilisable par tous les tests mockés
}
```

### `tests/stripe-checkout-mocked.spec.ts`

```
test("CGV non cochée → bouton désactivé")
  1. Aller sur /checkout?villaId=...&checkin=...&checkout=...&guests=2
  2. Vérifier que le bouton "Confirmer" est disabled
  3. Cocher CGV → bouton enabled

test("Checkout visiteur non connecté → redirection succès")
  1. Aller sur /checkout avec params
  2. Remplir nom + email invité
  3. Cocher CGV
  4. Cliquer "Confirmer"
  5. POST /api/booking est appelé → mock retourne { url: "/success?session_id=cs_test_fake" }
  6. Vérifier redirection vers /success
  7. /success affiche "Réservation confirmée"

test("Confirmation page — polling booking-session")
  1. Aller sur /success?session_id=cs_test_fake
  2. GET /api/booking-session → mock retourne { booking: { status: "confirmed", ... }, pending: false }
  3. Vérifier affichage : nom villa, dates, montant

test("Webhook simulé — pending → confirmed")
  1. POST /api/webhooks/stripe avec payload checkout.session.completed (signature mock)
  2. Vérifier booking passe en status "confirmed" + payment_status "paid"
```

### `tests/cgv-checkout.spec.ts` (existant — vérifier et compléter)
Déjà présent dans le projet. Vérifier qu'il passe avec les mocks. Ajouter un test pour l'ouverture/fermeture des modales légales.

---

## Phase 3 — Test Playwright réel (pré-déploiement / weekly)

### `tests/stripe-checkout-live.spec.ts`

Tag `@live-stripe`. Projet Playwright `live-stripe` (exclu du `npx playwright test` par défaut).

```
test("@live-stripe flow complet Stripe test")
  1. Aller sur /villas → cliquer première villa
  2. Sélectionner dates → remplir guests
  3. Cliquer "Réserver" → page /checkout
  4. Remplir nom + email guest
  5. Cocher CGV → cliquer "Confirmer"
  6. Redirection vers checkout.stripe.com
  7. Remplir CB 4242 4242 4242 4242 + date future + CVC 123
  8. Soumettre → redirection vers /success
  9. Vérifier message "Réservation confirmée"
  10. Vérifier que le booking est en "confirmed" + "paid" (poll /api/booking-session)
```

Timeout : 60s. Retries : 1. Variables d'env : `STRIPE_SECRET_KEY=sk_test_...`, `NEXT_PUBLIC_BASE_URL`.

---

## Configuration Playwright

```ts
// playwright.config.ts — 2 projets
{
  name: "mocked",
  testMatch: [
    "tests/stripe-checkout-mocked.spec.ts",
    "tests/cgv-checkout.spec.ts",
    "tests/booking.spec.ts"
  ],
  use: { baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000" },
},
{
  name: "live-stripe",
  testMatch: ["tests/stripe-checkout-live.spec.ts"],
  retries: 1,
  timeout: 60000,
  use: { baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000" },
}
```

Commande par défaut : `npx playwright test` → lance uniquement le projet `mocked`.

---

## CI (GitHub Actions)

```yaml
# .github/workflows/test.yml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npx vitest run                    # Tests unitaires
    - run: npx playwright test --project=mocked  # E2E mockés
    - run: npx next build                    # Build check

test-live-stripe:
  runs-on: ubuntu-latest
  if: github.event_name == 'workflow_dispatch'  # Manuel uniquement
  steps:
    - run: npx playwright test --project=live-stripe
```

Ou en cron hebdomadaire (`schedule: "0 9 * * 1"` — lundi 9h).

---

## Fichiers créés/modifiés

| Action | Fichier | Type |
|---|---|---|
| Créer | `lib/stripe/connect.test.ts` | Test Vitest |
| Créer | `lib/revenue/booking-revenue.test.ts` | Test Vitest |
| Créer | `lib/ota-hub.test.ts` | Test Vitest |
| Créer | `tests/helpers/stripe-mock.ts` | Helper Playwright |
| Créer | `tests/stripe-checkout-mocked.spec.ts` | Test Playwright |
| Créer | `tests/stripe-checkout-live.spec.ts` | Test Playwright |
| Modifier | `playwright.config.ts` | Config projets |
| Créer | `.github/workflows/test.yml` | CI |

---

## Critères de succès

1. `npx vitest run` → tous les tests passent (3 fichiers, ~10 cas)
2. `npx playwright test --project=mocked` → tous les tests passent (4-5 cas)
3. `npx playwright test --project=live-stripe` → passe en mode test Stripe (manuel)
4. `npx next build` → build OK
5. Zéro modification du code métier Stripe existant
