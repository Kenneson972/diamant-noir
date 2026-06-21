import { test, expect, type Page } from "@playwright/test";

const OWNER = {
  email: process.env.TEST_OWNER_EMAIL || "owner@kayvila.com",
  password: process.env.TEST_OWNER_PASSWORD || "owner123",
};

async function loginOwnerAndOpenChat(page: Page): Promise<boolean> {
  // Mock l'endpoint copilot : réponse longue et instantanée
  await page.route("**/api/dashboard/owner-assistant", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        response: "Voici une réponse de test détaillée. ".repeat(20),
        reply: "Voici une réponse de test détaillée. ".repeat(20),
        suggested_prompts: [],
        suggestedPrompts: [],
      }),
    });
  });

  await page.goto("/login");
  await page.locator("input[type='email'], input[name='email']").first().fill(OWNER.email);
  await page.locator("input[type='password']").first().fill(OWNER.password);
  await page.locator("button[type='submit']").first().click();
  const reached = await page
    .waitForURL((url) => url.pathname.startsWith("/dashboard"), { timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (!reached) return false;

  const input = page.getByPlaceholder("Posez votre question...");
  if (!(await input.isVisible().catch(() => false))) return false;
  return true;
}

test.describe("Chatbot proprio — scroll isolé", () => {
  test("envoyer un message ne déplace pas le scroll de la page", async ({ page }) => {
    test.skip(!(await loginOwnerAndOpenChat(page)), "Owner de test / chat indisponible");
    const before = await page.evaluate(() => window.scrollY);
    const input = page.getByPlaceholder("Posez votre question...");
    await input.fill("Bonjour");
    await input.press("Enter");
    await expect(page.getByText(/réponse de test détaillée/i).first()).toBeVisible();
    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(4);
  });

  test("la réponse s'affiche dans la boîte de chat", async ({ page }) => {
    test.skip(!(await loginOwnerAndOpenChat(page)), "Owner de test / chat indisponible");
    const input = page.getByPlaceholder("Posez votre question...");
    await input.fill("Combien de réservations ?");
    await input.press("Enter");
    await expect(page.getByText(/réponse de test détaillée/i).first()).toBeVisible();
  });

  test("le rendu de la réponse ne repousse pas la page", async ({ page }) => {
    test.skip(!(await loginOwnerAndOpenChat(page)), "Owner de test / chat indisponible");
    const input = page.getByPlaceholder("Posez votre question...");
    await input.fill("Mes revenus ce mois ?");
    const before = await page.evaluate(() => window.scrollY);
    await input.press("Enter");
    await expect(page.getByText(/réponse de test détaillée/i).first()).toBeVisible();
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(4);
  });

  test("l'input reste focus après envoi", async ({ page }) => {
    test.skip(!(await loginOwnerAndOpenChat(page)), "Owner de test / chat indisponible");
    const input = page.getByPlaceholder("Posez votre question...");
    await input.fill("Test focus");
    await input.press("Enter");
    // Attendre que la réponse soit arrivée (isLoading redevient false) avant de vérifier le focus
    await expect(page.getByText(/réponse de test détaillée/i).first()).toBeVisible();
    await expect(input).toBeFocused();
  });
});
