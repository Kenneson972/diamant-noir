import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");
    // Vérifie que la page de login s'affiche
    await expect(page.locator("input[type='email'], input[name='email']").first()).toBeVisible();
  });

  test("should redirect unauthenticated user to login for protected pages", async ({ page }) => {
    await page.goto("/espace-client");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });
});
