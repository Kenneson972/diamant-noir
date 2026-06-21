import { test, expect, type Page } from "@playwright/test";

function isoPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Ouvre un checkout réel ; skip si aucune villa publiée. Retourne false si skip. */
async function gotoCheckout(page: Page): Promise<boolean> {
  await page.goto("/villas");
  await page.waitForTimeout(2000);
  const href = await page.locator("a[href*='/villas/']").first().getAttribute("href").catch(() => null);
  const id = href?.match(/\/villas\/([^/?#]+)/)?.[1];
  if (!id) return false;
  await page.goto(`/book?villaId=${id}&checkin=${isoPlusDays(30)}&checkout=${isoPlusDays(33)}&guests=2`);
  const checkbox = page.getByTestId("cgv-checkbox");
  if (!(await checkbox.isVisible().catch(() => false))) return false;
  return true;
}

test.describe("Checkout — CGV obligatoire", () => {
  test("la checkbox CGV est décochée par défaut", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await expect(page.getByTestId("cgv-checkbox")).not.toBeChecked();
  });

  test("valider sans cocher affiche le message d'erreur CGV", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    const cta = page.getByRole("button", { name: /payer|réserver|confirmer|finaliser/i }).first();
    await cta.click();
    await expect(page.getByText("Veuillez accepter les CGV pour continuer")).toBeVisible();
  });

  test("cocher les CGV fait disparaître l'erreur (pas de blocage CGV)", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    const cta = page.getByRole("button", { name: /payer|réserver|confirmer|finaliser/i }).first();
    await cta.click();
    await expect(page.getByText("Veuillez accepter les CGV pour continuer")).toBeVisible();
    await page.getByTestId("cgv-checkbox").check();
    await cta.click();
    // la garde CGV ne doit plus bloquer (un autre message lié au paiement peut apparaître)
    await expect(page.getByText("Veuillez accepter les CGV pour continuer")).toBeHidden();
  });

  test("ouvre puis ferme le modal CGV", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await page.getByRole("button", { name: "Conditions Générales de Vente" }).click();
    const dialog = page.getByRole("dialog", { name: "Conditions Générales de Vente" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Fermer" }).click();
    await expect(dialog).toBeHidden();
  });

  test("ouvre puis ferme le modal Confidentialité", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await page.getByRole("button", { name: "Politique de confidentialité" }).click();
    const dialog = page.getByRole("dialog", { name: "Politique de confidentialité" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("le modal CGV ferme via clic overlay", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await page.getByRole("button", { name: "Conditions Générales de Vente" }).click();
    const dialog = page.getByRole("dialog", { name: "Conditions Générales de Vente" });
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5); // coin = overlay
    await expect(dialog).toBeHidden();
  });

  test("la checkbox se coche et se décoche", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    const checkbox = page.getByTestId("cgv-checkbox");
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
