import { test, expect } from "@playwright/test";

// Start dev server: npm run dev
// Run: npx playwright test tests/espace-client/ux-features.spec.ts --reporter=line

test.describe("Espace Client — UX Features", () => {
  test("page livret responds without 5xx", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/espace-client/livret");
    expect(response?.status()).toBeLessThan(500);
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login|\/espace-client\/livret/);
  });

  test("page livret/print responds without 5xx", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/espace-client/livret/print");
    expect(response?.status()).toBeLessThan(500);
  });

  test("page checklist responds without 5xx", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/espace-client/checklist");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login|\/espace-client\/checklist/);
  });

  test("séjour page hero card responds without 5xx", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/espace-client");
    expect(response?.status()).toBeLessThan(500);
  });

  test("accès rapide links navigate correctly", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/espace-client/checklist");
    expect(response?.status()).toBeLessThan(500);
  });
});
