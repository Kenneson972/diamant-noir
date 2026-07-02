import { test, expect, type Page } from "@playwright/test";

const ADMIN = { email: "admin@diamantnoir.com", password: "Admin123!" };
const OWNER = {
  email: process.env.TEST_OWNER_EMAIL || "proprio1@test.com",
  password: process.env.TEST_OWNER_PASSWORD || "Test123456!",
};
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

async function loginAs(page: Page, email: string, password: string, redirectPrefix: string) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "kayvila-cookie-consent",
      JSON.stringify({ necessary: true, analytics: false, marketing: false })
    );
  });
  await page.goto("/login");
  await page.locator("input[type='email'], input[name='email']").first().fill(email);
  await page.locator("input[type='password']").first().fill(password);
  await page.locator("button[type='submit']").first().click();
  await page.waitForURL((url: URL) => url.pathname.startsWith(redirectPrefix), { timeout: 20000 });
}

// La villa de test créée par le premier test, réutilisée ensuite (brouillon non publié, inoffensif)
const TEST_VILLA_NAME = `Villa Test E2E ${Date.now()}`;
let testVillaUrl = "";

test.describe.serial("Éditeur villa v2", () => {
  test("création : mini-form → brouillon → éditeur unifié", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loginAs(page, ADMIN.email, ADMIN.password, "/admin");
    await page.goto("/admin/villas/ajouter");

    const form = page.getByTestId("villa-create-form");
    await expect(form).toBeVisible();

    // Submit vide → erreur sous le champ nom
    await form.getByRole("button", { name: /Créer le brouillon/ }).click();
    await expect(form.getByText("Le nom est requis")).toBeVisible();

    await page.locator("#vc-name").fill(TEST_VILLA_NAME);
    await page.locator("#vc-price").fill("300");
    await page.locator("#vc-capacity").fill("4");
    await form.getByRole("button", { name: /Créer le brouillon/ }).click();

    // Redirection vers l'éditeur du brouillon
    await page.waitForURL(/\/admin\/villas\/[0-9a-f-]+$/, { timeout: 20000 });
    testVillaUrl = new URL(page.url()).pathname;
    await expect(page.getByTestId("editor-summary")).toBeVisible();
    await expect(page.getByTestId("editor-section-identite")).toBeVisible();
  });

  test("sommaire : clic → scroll vers la section + bloc admin visible", async ({ page }) => {
    test.skip(!testVillaUrl, "dépend du test de création");
    await page.setViewportSize(DESKTOP);
    await loginAs(page, ADMIN.email, ADMIN.password, "/admin");
    await page.goto(testVillaUrl);

    const summary = page.getByTestId("editor-summary");
    await expect(summary).toBeVisible();
    await summary.getByRole("button", { name: "Équipements" }).click();
    await expect(page.getByTestId("editor-section-equipments")).toBeInViewport({ timeout: 5000 });

    // Bloc admin présent pour l'admin
    await expect(page.getByTestId("villa-editor-admin-bloc")).toBeAttached();
    // Anciens systèmes de navigation disparus
    await expect(page.locator("[data-testid='villa-editor-sections'] details")).toHaveCount(0);
  });

  test("autosave : modification → point 'saved'", async ({ page }) => {
    test.skip(!testVillaUrl, "dépend du test de création");
    await page.setViewportSize(DESKTOP);
    await loginAs(page, ADMIN.email, ADMIN.password, "/admin");
    await page.goto(testVillaUrl);

    await page.locator("#vf-surface").fill("150");
    await expect(page.locator("[data-testid='autosave-indicator'][data-status='saved']")).toBeVisible({ timeout: 15000 });
  });

  test("proprio : pas de bloc admin, iCal réel présent", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loginAs(page, OWNER.email, OWNER.password, "/dashboard");
    await page.goto("/dashboard/villas");

    // Ouvrir la première villa du proprio (lien UUID — exclut /nouvelle)
    const hrefs = await page
      .locator("a[href^='/dashboard/villas/']")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    const villaHref = hrefs.find((h) => /\/dashboard\/villas\/[0-9a-f-]{36}/.test(h ?? ""));
    test.skip(!villaHref, "le proprio de test n'a aucune villa");
    await page.goto(villaHref as string);
    await page.waitForURL(/\/dashboard\/villas\/[0-9a-f-]+/, { timeout: 20000 });

    await expect(page.getByTestId("editor-summary")).toBeVisible();
    await expect(page.getByTestId("villa-editor-admin-bloc")).toHaveCount(0);
    // La section iCal existe côté proprio (bloc Configuration)
    await expect(page.getByTestId("editor-section-ical")).toBeAttached();
  });

  test("mobile : dropdown 'Aller à…' navigue", async ({ page }) => {
    test.skip(!testVillaUrl, "dépend du test de création");
    await page.setViewportSize(MOBILE);
    await loginAs(page, ADMIN.email, ADMIN.password, "/admin");
    await page.goto(testVillaUrl);

    const goto = page.getByTestId("summary-goto");
    await expect(goto).toBeVisible();
    await goto.selectOption("pricing");
    await expect(page.getByTestId("editor-section-pricing")).toBeInViewport({ timeout: 5000 });

    // Pas d'overflow horizontal
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
