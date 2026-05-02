import { test, expect } from "@playwright/test";

test.describe("Villa search", () => {
  test("should load the home page with search widget", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("form[aria-label*='Recherche']")).toBeVisible();
  });

  test("should display villas list page", async ({ page }) => {
    await page.goto("/villas");
    await expect(page.locator("h1, [data-testid='villas-title']")).toBeVisible();
  });
});
