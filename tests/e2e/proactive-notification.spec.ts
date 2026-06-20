import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Proactive Notification — Owner Dashboard", () => {
  test("displays daily digest and can mark it as read", async ({ page }) => {
    // Login as owner
    await page.goto(`${BASE}/login?redirect=/dashboard`);
    await page.getByLabel(/email/i).fill("proprio1@test.com");
    await page.getByLabel(/mot de passe/i).fill("Test123456!");
    await page.getByRole("button", { name: /accéder/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 15000 });

    // Verify the proactive notification card is displayed
    const card = page.locator('[aria-label="Point du jour Kayvila"]');
    await expect(card).toBeVisible({ timeout: 15000 });

    // Verify it has content
    const body = card.locator(".text-navy\\/75");
    await expect(body).not.toBeEmpty();

    // Click "Marquer comme lu"
    const dismissButton = card.locator('button[aria-label="Marquer comme lu"]');
    await dismissButton.click();

    // Card should disappear
    await expect(card).not.toBeVisible({ timeout: 5000 });

    // Reload — card should stay gone
    await page.reload();
    await page.waitForURL("**/dashboard");
    await page.waitForTimeout(3000);
    const cardAfterReload = page.locator('[aria-label="Point du jour Kayvila"]');
    await expect(cardAfterReload).not.toBeVisible({ timeout: 5000 });
  });
});
