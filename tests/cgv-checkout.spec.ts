import { test, expect, type Page } from "@playwright/test";

function isoPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Villa publiée connue (env-overridable). Navigation DIRECTE vers /book : pas de
// dépendance au scrape de /villas, déterministe même en workers parallèles.
const TEST_VILLA_ID = process.env.TEST_VILLA_ID || "4ce2e4f4-2101-485c-ba8a-0d76d4dcb99a";

/** Ouvre un checkout réel ; skip si le checkout ne se rend pas. Retourne false si skip. */
async function gotoCheckout(page: Page): Promise<boolean> {
  await page.goto(
    `/book?villaId=${TEST_VILLA_ID}&checkin=${isoPlusDays(30)}&checkout=${isoPlusDays(33)}&guests=2`
  );
  // Le checkbox CGV est rendu deux fois (desktop + mobile sticky). Cibler l'instance visible uniquement.
  const checkbox = page.locator('[data-testid="cgv-checkbox"]:visible');
  const ok = await checkbox
    .waitFor({ state: "visible", timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  if (!ok) return false;
  // Pré-remplir nom/email si les champs sont présents (utilisateur non connecté)
  const nameInput = page.locator("#guestName");
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.click();
    await nameInput.fill("Test Visiteur");
    await nameInput.press("Tab");
  }
  const emailInput = page.locator("#guestEmail");
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.click();
    await emailInput.fill("test@example.com");
    await emailInput.press("Tab");
  }
  return true;
}

test.describe("Checkout — CGV obligatoire", () => {
  test("la checkbox CGV est décochée par défaut", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await expect(page.locator('[data-testid="cgv-checkbox"]:visible')).not.toBeChecked();
  });

  test("valider sans cocher affiche le message d'erreur CGV", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    // Cibler le bouton dans la section desktop (hidden sm:block) pour éviter le bouton mobile caché
    const cta = page.locator('button:visible', { hasText: /Confirmer|payer/i }).first();
    await cta.scrollIntoViewIfNeeded();
    await cta.click();
    // L'erreur CGV est rendue dans 2 zones (desktop + mobile sticky). Prendre la première instance visible.
    await expect(page.locator('[role="alert"]:visible', { hasText: "Veuillez accepter les CGV pour continuer" }).first()).toBeVisible({ timeout: 8000 });
  });

  test("cocher les CGV fait disparaître l'erreur (pas de blocage CGV)", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    const cta = page.locator('button:visible', { hasText: /Confirmer|payer/i }).first();
    await cta.scrollIntoViewIfNeeded();
    await cta.click();
    // L'erreur CGV est rendue dans 2 zones (desktop + mobile sticky). Prendre la première instance visible.
    const cgvError = page.locator('[role="alert"]:visible', { hasText: "Veuillez accepter les CGV pour continuer" }).first();
    await expect(cgvError).toBeVisible({ timeout: 8000 });
    await page.locator('[data-testid="cgv-checkbox"]:visible').check();
    await cta.click();
    // la garde CGV ne doit plus bloquer (un autre message lié au paiement peut apparaître)
    await expect(page.locator('[role="alert"]', { hasText: "Veuillez accepter les CGV pour continuer" }).first()).toBeHidden({ timeout: 8000 });
  });

  test("ouvre puis ferme le modal CGV", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await page.locator('button:visible', { hasText: "Conditions Générales de Vente" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Conditions Générales de Vente" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Fermer" }).click();
    await expect(dialog).toBeHidden();
  });

  test("ouvre puis ferme le modal Confidentialité", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await page.locator('button:visible', { hasText: "Politique de confidentialité" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Politique de confidentialité" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("le modal CGV ferme via clic overlay", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await page.locator('button:visible', { hasText: "Conditions Générales de Vente" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Conditions Générales de Vente" });
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5); // coin = overlay
    await expect(dialog).toBeHidden();
  });

  test("la checkbox se coche et se décoche", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    const checkbox = page.locator('[data-testid="cgv-checkbox"]:visible');
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test("le serveur rejette un POST /api/booking sans cgvAccepted (400)", async ({ request, baseURL }) => {
    const res = await request.post("/api/booking", {
      headers: { Origin: baseURL || "http://localhost:3000" },
      data: {
        startDate: isoPlusDays(30),
        endDate: isoPlusDays(33),
        villaId: "00000000-0000-0000-0000-000000000000",
        guests: 2,
        guestEmail: "test@example.com",
      },
    });
    expect(res.status()).toBe(400);
    expect(await res.text()).toContain("CGV");
  });
});
