import { test, expect } from "@playwright/test";

// Run: npx playwright test tests/login/redesign.spec.ts --reporter=line
// Requires: npm run dev

test.describe("Login Page — Redesign", () => {
  test("page load sans 5xx (flow locataire)", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/login?redirect=/espace-client");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login/);
  });

  test("page load sans 5xx (flow propriétaire)", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/login?redirect=/dashboard/proprio");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login/);
  });

  test("plus de role=tablist dans la page (tabs supprimés)", async ({ page }) => {
    await page.goto("http://localhost:3000/login?redirect=/espace-client");
    const tablist = page.locator("[role='tablist']");
    await expect(tablist).toHaveCount(0);
  });

  test("input email visible — flow locataire", async ({ page }) => {
    await page.goto("http://localhost:3000/login?redirect=/espace-client");
    await expect(page.locator("input[type='email']")).toBeVisible();
  });

  test("input email et password visibles — flow propriétaire", async ({ page }) => {
    await page.goto("http://localhost:3000/login?redirect=/dashboard/proprio");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("footer 'Accès propriétaire' présent sur flow locataire", async ({ page }) => {
    await page.goto("http://localhost:3000/login?redirect=/espace-client");
    await expect(page.getByText(/accès propriétaire/i)).toBeVisible();
  });

  test("footer 'Espace locataire' présent sur flow propriétaire", async ({ page }) => {
    await page.goto("http://localhost:3000/login?redirect=/dashboard/proprio");
    await expect(page.getByText(/espace locataire/i)).toBeVisible();
  });
});
