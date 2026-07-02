import { test, expect } from "@playwright/test";

const ADMIN = { email: "admin@diamantnoir.com", password: "Admin123!" };
const OWNER = {
  email: process.env.TEST_OWNER_EMAIL || "proprio1@test.com",
  password: process.env.TEST_OWNER_PASSWORD || "Test123456!",
};

const MOBILE = { width: 390, height: 844 };
const NARROW = { width: 360, height: 740 };
const DESKTOP = { width: 1280, height: 800 };

async function loginAs(page: any, email: string, password: string, redirectPrefix: string) {
  // Pré-consentement cookies pour éviter le banner qui intercepte les clics bas d'écran
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

async function expectNoHorizontalOverflow(page: any) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("Responsive mobile dashboards", () => {
  test("admin : bottom nav + navigation + pas d'overflow", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await loginAs(page, ADMIN.email, ADMIN.password, "/admin");

    const nav = page.getByTestId("mobile-bottom-nav");
    await expect(nav).toBeVisible({ timeout: 15000 });
    await expectNoHorizontalOverflow(page);

    await nav.getByRole("link", { name: "Villas" }).click();
    await page.waitForURL("**/admin/villas", { timeout: 15000 });
  });

  test("admin villas : cartes mobiles, DataGrid caché, filtres sheet", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await loginAs(page, ADMIN.email, ADMIN.password, "/admin");
    await page.goto("/admin/villas");

    await expect(page.getByTestId("admin-villas-cards")).toBeVisible({ timeout: 20000 });
    await expect(
      page.locator('[aria-label="Catalogue des villas"]').filter({ visible: true })
    ).toHaveCount(0);
    await page.getByTestId("filter-bottom-sheet-trigger").click();
    await expect(page.getByTestId("filter-bottom-sheet-panel")).toBeVisible({ timeout: 5000 });
    await expectNoHorizontalOverflow(page);
  });

  test("admin réservations : cartes mobiles en vue liste", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await loginAs(page, ADMIN.email, ADMIN.password, "/admin");
    await page.goto("/admin/reservations");

    await expect(page.getByTestId("admin-reservations-cards")).toBeVisible({ timeout: 20000 });
    await expectNoHorizontalOverflow(page);
  });

  test("proprio : dashboard mobile", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await loginAs(page, OWNER.email, OWNER.password, "/dashboard");

    await expect(page.getByTestId("mobile-bottom-nav")).toBeVisible({ timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test("proprio réservations : filtres", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await loginAs(page, OWNER.email, OWNER.password, "/dashboard");
    await page.goto("/dashboard/reservations");

    // Filtre "Confirmées"
    const confirmBtn = page.getByRole("button", { name: "Confirmées" });
    await confirmBtn.click();
    await page.waitForTimeout(500);
    const allBefore = await page.getByRole("button", { name: "Toutes" }).isVisible();
    expect(allBefore).toBeTruthy();

    await expectNoHorizontalOverflow(page);
  });

  test("écran étroit 360px : pas d'overflow sur les 3 dashboards", async ({ page }) => {
    await page.setViewportSize(NARROW);
    await loginAs(page, ADMIN.email, ADMIN.password, "/admin");

    for (const url of ["/admin", "/admin/villas", "/admin/reservations"]) {
      await page.goto(url);
      await page.waitForTimeout(1000);
      await expectNoHorizontalOverflow(page);
    }
  });

  test("non-régression desktop : DataGrids présents, bottom nav absente", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loginAs(page, ADMIN.email, ADMIN.password, "/admin");
    await page.goto("/admin/villas");

    await expect(
      page.locator('[aria-label="Catalogue des villas"]').filter({ visible: true }).first()
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("mobile-bottom-nav")).not.toBeVisible();
  });
});
