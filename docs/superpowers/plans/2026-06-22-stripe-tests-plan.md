# Stripe Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehensive Stripe tests (Vitest + Playwright) without modifying existing business logic.

**Architecture:** 3 Vitest files testing existing functions in isolation, 1 Playwright helper mocking Stripe API, 2 Playwright spec files (mocked CI + live pre-release), 1 CI workflow. Zero changes to production code.

**Tech Stack:** Vitest ^4.1.9, @playwright/test ^1.58.2, Next.js 15, Stripe ^14.25.0

## Global Constraints

- **Zéro modification du code métier Stripe existant** — tests uniquement
- `npx vitest run` doit passer
- `npx playwright test --project=mocked` doit passer
- `npx next build` doit passer
- Un commit par tâche
- Ne jamais commit les clés Stripe
- `buildExternalId` est privé dans `ota-hub.ts` — ne pas l'exporter, ne pas le tester directement

---

### Task 1: Vitest — `lib/stripe/connect.test.ts`

**Files:**
- Create: `lib/stripe/connect.test.ts`

**Interfaces:**
- Consumes: `calculateTransferAmounts(stayCents: number, cleaningFeeCents: number, serviceFeeCents: number, applicationFeePercent?: number): { ownerAmountCents: number; platformFeeCents: number }` from `lib/stripe/connect.ts`

- [ ] **Step 1: Write the test file**

```ts
import { describe, it, expect } from "vitest";
import { calculateTransferAmounts } from "./connect";

describe("calculateTransferAmounts", () => {
  it("100€ séjour + 50€ ménage + 20€ frais service, commission 25%", () => {
    const result = calculateTransferAmounts(10000, 5000, 2000, 25);
    expect(result).toEqual({ ownerAmountCents: 7500, platformFeeCents: 9500 });
  });

  it("séjour à 0€ → seul le ménage + service vont à la plateforme", () => {
    const result = calculateTransferAmounts(0, 5000, 2000, 25);
    expect(result).toEqual({ ownerAmountCents: 0, platformFeeCents: 7000 });
  });

  it("commission 20% → proprio reçoit 80% du séjour", () => {
    const result = calculateTransferAmounts(20000, 0, 0, 20);
    expect(result).toEqual({ ownerAmountCents: 16000, platformFeeCents: 4000 });
  });

  it("commission par défaut (25%) si non spécifiée", () => {
    const result = calculateTransferAmounts(10000, 0, 0);
    expect(result).toEqual({ ownerAmountCents: 7500, platformFeeCents: 2500 });
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run lib/stripe/connect.test.ts`
Expected: 4 tests PASS

- [ ] **Step 3: Commit**

```bash
git add lib/stripe/connect.test.ts
git commit -m "test: calculateTransferAmounts — 4 cas (25%, 20%, 0€, défaut)"

Co-Authored-By: claude-flow <ruv@ruv.net>
```

---

### Task 2: Vitest — `lib/revenue/booking-revenue.test.ts`

**Files:**
- Create: `lib/revenue/booking-revenue.test.ts`

**Interfaces:**
- Consumes: `getCommissionRate(source: string | null): number` from `lib/revenue/booking-revenue.ts`
- Consumes: `grossCentsFromBooking(b: BookingRevenueInput): number` from `lib/revenue/booking-revenue.ts`

- [ ] **Step 1: Write the test file**

```ts
import { describe, it, expect } from "vitest";
import { getCommissionRate, grossCentsFromBooking } from "./booking-revenue";

describe("getCommissionRate", () => {
  it('"airbnb" → 20%', () => {
    expect(getCommissionRate("airbnb")).toBe(20);
  });

  it('"direct" → 25%', () => {
    expect(getCommissionRate("direct")).toBe(25);
  });

  it('"booking" → 20%', () => {
    expect(getCommissionRate("booking")).toBe(20);
  });

  it("null → 25% (défaut)", () => {
    expect(getCommissionRate(null)).toBe(25);
  });
});

describe("grossCentsFromBooking", () => {
  it("calcule le total à partir de price + cleaning + service", () => {
    const result = grossCentsFromBooking({
      price: 150,
      cleaning_fee: 80,
      service_fee: 22.5,
      total_price_cents: null,
    });
    // 150€ = 15000c + 80€ = 8000c + 22.5€ = 2250c → 25250
    expect(result).toBe(25250);
  });

  it("fallback sur total_price_cents si price absent", () => {
    const result = grossCentsFromBooking({
      price: null,
      cleaning_fee: null,
      service_fee: null,
      total_price_cents: 30000,
    });
    expect(result).toBe(30000);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run lib/revenue/booking-revenue.test.ts`
Expected: 6 tests PASS

- [ ] **Step 3: Commit**

```bash
git add lib/revenue/booking-revenue.test.ts
git commit -m "test: getCommissionRate + grossCentsFromBooking — 6 cas"

Co-Authored-By: claude-flow <ruv@ruv.net>
```

---

### Task 3: Vitest — `lib/ota-hub.test.ts`

**Files:**
- Create: `lib/ota-hub.test.ts`

**Interfaces:**
- Consumes: `detectOTASource(url: string): OTASource` from `lib/ota-hub.ts`
- Note: `buildExternalId` est privé — non testé directement

- [ ] **Step 1: Write the test file**

```ts
import { describe, it, expect } from "vitest";
import { detectOTASource } from "./ota-hub";

describe("detectOTASource", () => {
  it('URL contenant "airbnb.com" → "airbnb"', () => {
    expect(detectOTASource("https://www.airbnb.com/rooms/123")).toBe("airbnb");
  });

  it('URL contenant "booking.com" → "booking"', () => {
    expect(detectOTASource("https://booking.com/hotel/fr/villa")).toBe("booking");
  });

  it('URL contenant "expedia.com" → "expedia"', () => {
    expect(detectOTASource("https://www.expedia.com/martinique/villa")).toBe("expedia");
  });

  it('URL contenant "vrbo.com" → "vrbo"', () => {
    expect(detectOTASource("https://www.vrbo.com/fr-fr/location/abc")).toBe("vrbo");
  });

  it('URL contenant "trivago.com" → "trivago"', () => {
    expect(detectOTASource("https://www.trivago.com/martinique")).toBe("trivago");
  });

  it("URL inconnue → direct", () => {
    expect(detectOTASource("https://kayvila.com/villas/abc")).toBe("direct");
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run lib/ota-hub.test.ts`
Expected: 6 tests PASS

- [ ] **Step 3: Commit**

```bash
git add lib/ota-hub.test.ts
git commit -m "test: detectOTASource — 6 cas (airbnb, booking, expedia, vrbo, trivago, direct)"

Co-Authored-By: claude-flow <ruv@ruv.net>
```

---

### Task 4: Playwright — Stripe Mock Helper

**Files:**
- Create: `tests/helpers/stripe-mock.ts`

**Interfaces:**
- Produces: `setupStripeMock(page: Page): Promise<void>` — intercepte `POST /api/booking` et `GET /api/booking-session`

- [ ] **Step 1: Create `tests/helpers/` directory and write helper**

```bash
mkdir -p tests/helpers
```

```ts
// tests/helpers/stripe-mock.ts
import type { Page } from "@playwright/test";

const FAKE_SESSION_ID = "cs_test_mock_fake";

export async function setupStripeMock(page: Page): Promise<void> {
  // Intercepte POST /api/booking → retourne success_url sans Stripe réel
  await page.route("**/api/booking", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        url: `/success?session_id=${FAKE_SESSION_ID}`,
        bookingId: "00000000-0000-0000-0000-000000000001",
      }),
    });
  });

  // Intercepte GET /api/booking-session → booking confirmed
  await page.route(`**/api/booking-session?session_id=${FAKE_SESSION_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        booking: {
          id: "00000000-0000-0000-0000-000000000001",
          villa_id: "00000000-0000-0000-0000-000000000002",
          start_date: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
          end_date: new Date(Date.now() + 86400000 * 37).toISOString().slice(0, 10),
          status: "confirmed",
          payment_status: "paid",
          guest_name: "Marie Dupont",
          guest_email: "marie@test.com",
          guests: 2,
          total_price_cents: 25250,
        },
        villa: {
          id: "00000000-0000-0000-0000-000000000002",
          name: "Villa Test — Vue Mer",
          location: "Le Diamant",
          image_url: null,
        },
        pending: false,
      }),
    });
  });
}

export { FAKE_SESSION_ID };
```

- [ ] **Step 2: Commit**

```bash
git add tests/helpers/stripe-mock.ts
git commit -m "test(helpers): setupStripeMock — intercepte /api/booking et /api/booking-session"

Co-Authored-By: claude-flow <ruv@ruv.net>
```

---

### Task 5: Playwright Config — Projets mocké + live

**Files:**
- Modify: `playwright.config.ts`

- [ ] **Step 1: Update playwright.config.ts**

```ts
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mocked",
      testMatch: [
        "tests/stripe-checkout-mocked.spec.ts",
        "tests/cgv-checkout.spec.ts",
        "tests/booking.spec.ts",
      ],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "live-stripe",
      testMatch: ["tests/stripe-checkout-live.spec.ts"],
      retries: 1,
      timeout: 60000,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

- [ ] **Step 2: Run all existing tests to verify nothing is broken**

Run: `npx playwright test --project=mocked`
Expected: tests run (may fail if stripe-checkout-mocked doesn't exist yet — that's expected)

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "config(playwright): projets mocked + live-stripe pour tests Stripe"

Co-Authored-By: claude-flow <ruv@ruv.net>
```

---

### Task 6: Playwright — `tests/stripe-checkout-mocked.spec.ts`

**Files:**
- Create: `tests/stripe-checkout-mocked.spec.ts`

**Interfaces:**
- Consumes: `setupStripeMock(page)` from `tests/helpers/stripe-mock.ts`
- Consumes: `FAKE_SESSION_ID` from `tests/helpers/stripe-mock.ts`

- [ ] **Step 1: Write the test file**

```ts
import { test, expect } from "@playwright/test";
import { setupStripeMock, FAKE_SESSION_ID } from "./helpers/stripe-mock";

test.describe("Stripe Checkout (mocké)", () => {
  test.beforeEach(async ({ page }) => {
    await setupStripeMock(page);
  });

  test("CGV non cochée → bouton Confirm désactivé", async ({ page }) => {
    await page.goto("/checkout?villaId=00000000-0000-0000-0000-000000000002&checkin=2026-08-01&checkout=2026-08-07&guests=2");
    await page.waitForLoadState("networkidle");

    const confirmButton = page.locator("button, a").filter({ hasText: /confirmer|réserver|payer/i }).first();
    await expect(confirmButton).toBeDisabled();
  });

  test("CGV cochée → bouton Confirm actif", async ({ page }) => {
    await page.goto("/checkout?villaId=00000000-0000-0000-0000-000000000002&checkin=2026-08-01&checkout=2026-08-07&guests=2");
    await page.waitForLoadState("networkidle");

    const cgvCheckbox = page.locator('[role="checkbox"], input[type="checkbox"]').first();
    await cgvCheckbox.check();

    const confirmButton = page.locator("button, a").filter({ hasText: /confirmer|réserver|payer/i }).first();
    await expect(confirmButton).toBeEnabled();
  });

  test("Checkout visiteur → redirection vers /success", async ({ page }) => {
    await page.goto("/checkout?villaId=00000000-0000-0000-0000-000000000002&checkin=2026-08-01&checkout=2026-08-07&guests=2");
    await page.waitForLoadState("networkidle");

    // Remplir nom + email
    await page.fill("#guestName", "Marie Dupont");
    await page.fill("#guestEmail", "marie@test.com");

    // Cocher CGV
    const cgvCheckbox = page.locator('[role="checkbox"], input[type="checkbox"]').first();
    await cgvCheckbox.check();

    // Cliquer Confirmer
    const confirmButton = page.locator("button, a").filter({ hasText: /confirmer|réserver|payer/i }).first();
    await confirmButton.click();

    // Vérifier redirection vers /success
    await page.waitForURL(`**/success?session_id=${FAKE_SESSION_ID}`, { timeout: 10000 });
    await expect(page.locator("text=Réservation confirmée")).toBeVisible({ timeout: 10000 });
  });

  test("Page /success affiche les détails de la réservation", async ({ page }) => {
    await page.goto(`/success?session_id=${FAKE_SESSION_ID}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Villa Test")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Marie")).toBeVisible({ timeout: 5000 });
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx playwright test --project=mocked tests/stripe-checkout-mocked.spec.ts`
Expected: 4 tests PASS (or skip with note if app not running locally)

- [ ] **Step 3: Commit**

```bash
git add tests/stripe-checkout-mocked.spec.ts
git commit -m "test(e2e): stripe checkout mocké — 4 cas (CGV, visiteur, redirection, confirmation)"

Co-Authored-By: claude-flow <ruv@ruv.net>
```

---

### Task 7: Playwright — `tests/stripe-checkout-live.spec.ts`

**Files:**
- Create: `tests/stripe-checkout-live.spec.ts`

- [ ] **Step 1: Write the test file**

```ts
import { test, expect } from "@playwright/test";

test.describe("@live-stripe Flow complet Stripe test", () => {
  test("booking → Stripe Checkout → confirmation", async ({ page }) => {
    test.setTimeout(60000);

    // 1. Aller sur /villas → cliquer première villa
    await page.goto("/villas");
    await page.waitForLoadState("networkidle");
    const firstVilla = page.locator('a[href*="/villas/"]').first();
    await firstVilla.click();
    await page.waitForLoadState("networkidle");

    // 2. Cliquer "Réserver" ou "Checkout"
    const bookButton = page.locator("button, a").filter({ hasText: /réserver|checkout|disponibilités/i }).first();
    await bookButton.click();
    await page.waitForLoadState("networkidle");

    // 3. Remplir le formulaire checkout
    await page.fill("#guestName", "Marie Test");
    await page.fill("#guestEmail", "marie.test@kayvila.com");

    // Cocher CGV
    const cgvCheckbox = page.locator('[role="checkbox"], input[type="checkbox"]').first();
    await cgvCheckbox.check();

    // 4. Confirmer → redirection vers checkout.stripe.com
    const confirmButton = page.locator("button, a").filter({ hasText: /confirmer|réserver|payer/i }).first();
    await confirmButton.click();

    // 5. Attendre la redirection vers Stripe
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });

    // 6. Remplir CB test Stripe
    await page.fill('[name="cardNumber"]', "4242424242424242");
    await page.fill('[name="cardExpiry"]', "12/30");
    await page.fill('[name="cardCvc"]', "123");
    await page.fill('[name="billingName"]', "Marie Test");

    // 7. Payer
    const payButton = page.locator("button").filter({ hasText: /pay|payer|pay/i }).first();
    await payButton.click();

    // 8. Attendre redirection vers /success
    await page.waitForURL("**/success?session_id=*", { timeout: 30000 });

    // 9. Vérifier confirmation
    await expect(page.locator("text=Réservation confirmée")).toBeVisible({ timeout: 10000 });
  });
});
```

- [ ] **Step 2: Commit (ne pas exécuter — nécessite serveur local + clés Stripe test)**

```bash
git add tests/stripe-checkout-live.spec.ts
git commit -m "test(e2e): stripe checkout live — flow complet avec Stripe test (manuel/CI weekly)"

Co-Authored-By: claude-flow <ruv@ruv.net>
```

---

### Task 8: CI — GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/test.yml`

- [ ] **Step 1: Write the workflow file**

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  unit-and-mocked:
    runs-on: ubuntu-latest
    env:
      STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY }}
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - run: npm ci --legacy-peer-deps

      - name: Vitest unit tests
        run: npx vitest run

      - name: Install Playwright browsers
        run: npx playwright install chromium

      - name: Build Next.js (needed for production server)
        run: npx next build

      - name: Start server
        run: npx next start &
        env:
          PORT: 3000

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Playwright mocked E2E
        run: npx playwright test --project=mocked

  live-stripe:
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_dispatch'
    env:
      STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY }}
      STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci --legacy-peer-deps
      - run: npx playwright install chromium
      - run: npx next build
      - run: npx next start &
        env:
          PORT: 3000
      - run: npx wait-on http://localhost:3000
      - run: npx playwright test --project=live-stripe
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci: workflow tests — Vitest + Playwright mocké (push) + live-stripe (manual)"

Co-Authored-By: claude-flow <ruv@ruv.net>
```

---

### Task 9: Final Verification

- [ ] **Step 1: Run all Vitest tests**

Run: `npx vitest run`
Expected: 3 files, ~16 tests, all PASS

- [ ] **Step 2: Run all Playwright mocked tests**

Run: `npx playwright test --project=mocked`
Expected: all tests in mocked project PASS (or skip if server not running)

- [ ] **Step 3: Verify build**

Run: `npx next build`
Expected: BUILD OK

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "test: final verification — all tests green, build OK"
```
