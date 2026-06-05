import { test, expect } from "@playwright/test";

test.describe("Booking flow", () => {
  test("should display villa detail page", async ({ page }) => {
    await page.goto("/villas");
    // Attendre que les villas soient chargées
    await page.waitForTimeout(2000);
    // Cliquer sur la première villa si elle existe
    const villaLink = page.locator("a[href*='/villas/']").first();
    if (await villaLink.isVisible()) {
      await villaLink.click();
      await page.waitForURL(/\/villas\/.+/);
      expect(page.url()).toMatch(/\/villas\/.+/);
    }
  });
});
