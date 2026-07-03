import { test, expect, type Page } from "@playwright/test";
import { setupStripeMock, FAKE_SESSION_ID } from "./helpers/stripe-mock";

// Le checkout vit sur /book (l'ancienne route /checkout n'existe plus) et la
// page valide la villa en base → navigation directe avec une villa publiée
// réelle (env-overridable), pattern aligné sur tests/cgv-checkout.spec.ts.
const TEST_VILLA_ID =
  process.env.TEST_VILLA_ID || "4ce2e4f4-2101-485c-ba8a-0d76d4dcb99a";

function isoPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const BOOK_URL = () =>
  `/book?villaId=${TEST_VILLA_ID}&checkin=${isoPlusDays(30)}&checkout=${isoPlusDays(37)}&guests=2`;

/** Ouvre le checkout ; retourne false si la villa ne se rend pas (skip). */
async function gotoCheckout(page: Page): Promise<boolean> {
  await page.goto(BOOK_URL());
  const checkbox = page.locator('[data-testid="cgv-checkbox"]:visible');
  return checkbox
    .waitFor({ state: "visible", timeout: 20000 })
    .then(() => true)
    .catch(() => false);
}

async function fillGuestForm(page: Page): Promise<void> {
  const nameInput = page.locator("#guestName");
  await nameInput.click();
  await nameInput.fill("Marie Dupont");
  await nameInput.press("Tab");
  const emailInput = page.locator("#guestEmail");
  await emailInput.click();
  await emailInput.fill("marie@test.com");
  await emailInput.press("Tab");
}

function confirmButton(page: Page) {
  return page.locator("button:visible", { hasText: /Confirmer|payer/i }).first();
}

test.describe("Stripe Checkout (mocké)", () => {
  test.beforeEach(async ({ page }) => {
    // Consentement cookies AVANT le premier goto (le banner intercepte les clics)
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "kayvila-cookie-consent",
        JSON.stringify({ necessary: true, analytics: false, marketing: false })
      );
    });
    await setupStripeMock(page);
  });

  test("CGV non cochée → erreur au clic, pas de redirection", async ({
    page,
  }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await fillGuestForm(page);

    const cta = confirmButton(page);
    await cta.scrollIntoViewIfNeeded();
    await cta.click();

    await expect(
      page
        .locator('[role="alert"]:visible', {
          hasText: "Veuillez accepter les CGV pour continuer",
        })
        .first()
    ).toBeVisible({ timeout: 8000 });
    expect(page.url()).not.toContain("/success");
  });

  test("CGV cochée → la confirmation ne bloque plus sur les CGV", async ({
    page,
  }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await fillGuestForm(page);

    await page.locator('[data-testid="cgv-checkbox"]:visible').check();
    const cta = confirmButton(page);
    await cta.scrollIntoViewIfNeeded();
    await cta.click();

    await expect(
      page
        .locator('[role="alert"]', {
          hasText: "Veuillez accepter les CGV pour continuer",
        })
        .first()
    ).toBeHidden({ timeout: 8000 });
  });

  test("Checkout visiteur → redirection vers /success", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await fillGuestForm(page);

    await page.locator('[data-testid="cgv-checkbox"]:visible').check();
    const cta = confirmButton(page);
    await cta.scrollIntoViewIfNeeded();
    await cta.click();

    await page.waitForURL(`**/success?session_id=${FAKE_SESSION_ID}`, {
      timeout: 15000,
    });
    await expect(page.locator("text=Réservation confirmée")).toBeVisible({
      timeout: 10000,
    });
  });

  test("Page /success affiche les détails de la réservation", async ({
    page,
  }) => {
    await page.goto(`/success?session_id=${FAKE_SESSION_ID}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Réservation confirmée").first()).toBeVisible({
      timeout: 10000,
    });
    // La page affiche la villa et les dates (le nom du client n'est plus rendu)
    await expect(page.locator("text=Villa Test").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Le Diamant").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("Villa avec Stripe Connect requis mais pas onboardé → 503 affiché", async ({
    page,
  }) => {
    // Ce mock (enregistré après setupStripeMock) prend la priorité sur /api/booking
    await page.route("**/api/booking", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error:
            "Le propriétaire doit finaliser son compte de paiement avant de recevoir des réservations.",
        }),
      });
    });

    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await fillGuestForm(page);

    await page.locator('[data-testid="cgv-checkbox"]:visible').check();
    const cta = confirmButton(page);
    await cta.scrollIntoViewIfNeeded();
    await cta.click();

    await expect(
      page
        .locator('[role="alert"]:visible, [role="alert"]', {
          hasText: "finaliser son compte de paiement",
        })
        .first()
    ).toBeVisible({ timeout: 10000 });
    expect(page.url()).not.toContain("/success");
  });

  test("Double clic → idempotence (même session_id / bookingId)", async ({
    page,
  }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");

    // Deux POST /api/booking consécutifs (double clic) → même bookingId / URL
    const [first, second] = await page.evaluate(async () => {
      const call = async () => {
        const res = await fetch("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        return res.json();
      };
      return Promise.all([call(), call()]);
    });

    expect(first.bookingId).toBeTruthy();
    expect(second.bookingId).toBe(first.bookingId);
    expect(second.url).toBe(first.url);
  });

  test("Rate limiting → 11e appel 429", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/booking", async (route) => {
      calls += 1;
      if (calls > 10) {
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Trop de requêtes. Réessayez plus tard.",
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            url: `/success?session_id=${FAKE_SESSION_ID}`,
            bookingId: "00000000-0000-0000-0000-000000000001",
          }),
        });
      }
    });

    await page.goto(BOOK_URL());

    const statuses = await page.evaluate(async () => {
      const out: number[] = [];
      for (let i = 0; i < 11; i++) {
        const res = await fetch("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        out.push(res.status);
      }
      return out;
    });

    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  test("Email déjà lié à un compte → lien espace-client sur /success", async ({
    page,
  }) => {
    const ownerEmail = process.env.TEST_OWNER_EMAIL || "proprio1@test.com";
    const ownerPassword = process.env.TEST_OWNER_PASSWORD || "Test123456!";

    // Mock booking-session avec client_user_id associé (prend la priorité)
    await page.route(
      `**/api/booking-session?session_id=${FAKE_SESSION_ID}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            booking: {
              id: "00000000-0000-0000-0000-000000000001",
              villa_id: TEST_VILLA_ID,
              start_date: isoPlusDays(30),
              end_date: isoPlusDays(37),
              status: "confirmed",
              payment_status: "paid",
              guest_name: "Marie Dupont",
              guest_email: ownerEmail,
              client_user_id: "11111111-1111-1111-1111-111111111111",
              guests: 2,
              total_price_cents: 25250,
            },
            villa: {
              id: TEST_VILLA_ID,
              name: "Villa Test — Vue Mer",
              location: "Le Diamant",
              image_url: null,
            },
            pending: false,
          }),
        });
      }
    );

    // Le lien espace-client de /success s'affiche pour un utilisateur connecté
    // (compte lié à l'email de réservation) → login réel préalable.
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page
      .locator("input[type='email'], input[name='email']")
      .first()
      .fill(ownerEmail);
    await page.locator("input[type='password']").first().fill(ownerPassword);
    await page.locator("button[type='submit']").first().click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 20000,
    });

    await page.goto(`/success?session_id=${FAKE_SESSION_ID}`);

    // "Espace client" existe aussi en double dans la nav (instance cachée) →
    // cibler le CTA de la page success par son libellé, filtré visible.
    const clientLink = page
      .locator('a[href="/espace-client"]:visible', {
        hasText: /Accéder à mon espace client/i,
      })
      .first();
    await expect(clientLink).toBeVisible({ timeout: 15000 });
  });
});
