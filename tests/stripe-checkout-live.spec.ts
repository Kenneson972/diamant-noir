import { test, expect } from "@playwright/test";

test.describe("@live-stripe Flow complet Stripe test", () => {
  test("booking -> Stripe Checkout -> confirmation", async ({ page }) => {
    test.setTimeout(60000);

    // 1. Aller sur /villas -> cliquer premiere villa
    await page.goto("/villas");
    await page.waitForLoadState("networkidle");
    const firstVilla = page.locator('a[href*="/villas/"]').first();
    await firstVilla.click();
    await page.waitForLoadState("networkidle");

    // 2. Cliquer "Reserver" ou "Checkout"
    const bookButton = page
      .locator("button, a")
      .filter({ hasText: /reserver|checkout|disponibilites/i })
      .first();
    await bookButton.click();
    await page.waitForLoadState("networkidle");

    // 3. Remplir le formulaire checkout
    await page.fill("#guestName", "Marie Test");
    await page.fill("#guestEmail", "marie.test@kayvila.com");

    // Cocher CGV
    const cgvCheckbox = page
      .locator('[role="checkbox"], input[type="checkbox"]')
      .first();
    await cgvCheckbox.check();

    // 4. Confirmer -> redirection vers checkout.stripe.com
    const confirmButton = page
      .locator("button, a")
      .filter({ hasText: /confirmer|reserver|payer/i })
      .first();
    await confirmButton.click();

    // 5. Attendre la redirection vers Stripe
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });

    // 6. Remplir CB test Stripe
    await page.fill('[name="cardNumber"]', "4242424242424242");
    await page.fill('[name="cardExpiry"]', "12/30");
    await page.fill('[name="cardCvc"]', "123");
    await page.fill('[name="billingName"]', "Marie Test");

    // 7. Payer
    const payButton = page
      .locator("button")
      .filter({ hasText: /pay|payer|pay/i })
      .first();
    await payButton.click();

    // 8. Attendre redirection vers /success
    await page.waitForURL("**/success?session_id=*", { timeout: 30000 });

    // 9. Verifier confirmation
    await expect(page.locator("text=Réservation confirmée")).toBeVisible({
      timeout: 10000,
    });
  });
});
