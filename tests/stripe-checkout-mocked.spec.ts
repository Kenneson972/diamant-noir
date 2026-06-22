import { test, expect } from "@playwright/test";
import { setupStripeMock, FAKE_SESSION_ID } from "./helpers/stripe-mock";

test.describe("Stripe Checkout (mocké)", () => {
  test.beforeEach(async ({ page }) => {
    await setupStripeMock(page);
  });

  test("CGV non cochée → bouton Confirm désactivé", async ({ page }) => {
    await page.goto(
      "/checkout?villaId=00000000-0000-0000-0000-000000000002&checkin=2026-08-01&checkout=2026-08-07&guests=2"
    );
    await page.waitForLoadState("networkidle");

    const confirmButton = page
      .locator("button, a")
      .filter({ hasText: /confirmer|réserver|payer/i })
      .first();
    await expect(confirmButton).toBeDisabled();
  });

  test("CGV cochée → bouton Confirm actif", async ({ page }) => {
    await page.goto(
      "/checkout?villaId=00000000-0000-0000-0000-000000000002&checkin=2026-08-01&checkout=2026-08-07&guests=2"
    );
    await page.waitForLoadState("networkidle");

    const cgvCheckbox = page
      .locator('[role="checkbox"], input[type="checkbox"]')
      .first();
    await cgvCheckbox.check();

    const confirmButton = page
      .locator("button, a")
      .filter({ hasText: /confirmer|réserver|payer/i })
      .first();
    await expect(confirmButton).toBeEnabled();
  });

  test("Checkout visiteur → redirection vers /success", async ({ page }) => {
    await page.goto(
      "/checkout?villaId=00000000-0000-0000-0000-000000000002&checkin=2026-08-01&checkout=2026-08-07&guests=2"
    );
    await page.waitForLoadState("networkidle");

    // Remplir nom + email
    await page.fill("#guestName", "Marie Dupont");
    await page.fill("#guestEmail", "marie@test.com");

    // Cocher CGV
    const cgvCheckbox = page
      .locator('[role="checkbox"], input[type="checkbox"]')
      .first();
    await cgvCheckbox.check();

    // Cliquer Confirmer
    const confirmButton = page
      .locator("button, a")
      .filter({ hasText: /confirmer|réserver|payer/i })
      .first();
    await confirmButton.click();

    // Vérifier redirection vers /success
    await page.waitForURL(`**/success?session_id=${FAKE_SESSION_ID}`, {
      timeout: 10000,
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

    await expect(page.locator("text=Villa Test")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Marie")).toBeVisible({ timeout: 5000 });
  });
});
