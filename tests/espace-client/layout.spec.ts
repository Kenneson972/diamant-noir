import { test, expect } from "@playwright/test";

// These tests run against the dev server (http://localhost:3000)
// Run with: npx playwright test tests/espace-client/layout.spec.ts

test.describe("Espace Client — Layout", () => {
  test("redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("http://localhost:3000/espace-client");
    // Must redirect to /login with redirect param
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/login/);
    expect(page.url()).toMatch(/redirect.*espace-client/);
  });

  test("no server error on /espace-client (desktop)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto("http://localhost:3000/espace-client");
    expect(response?.status()).toBeLessThan(500);
  });

  test("no server error on /espace-client (mobile)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto("http://localhost:3000/espace-client");
    expect(response?.status()).toBeLessThan(500);
  });

  test("placeholder pages respond without 5xx error", async ({ page }) => {
    for (const path of [
      "/espace-client/livret",
      "/espace-client/documents",
      "/espace-client/conciergerie",
    ]) {
      const response = await page.goto(`http://localhost:3000${path}`);
      expect(response?.status()).toBeLessThan(500);
    }
  });
});
