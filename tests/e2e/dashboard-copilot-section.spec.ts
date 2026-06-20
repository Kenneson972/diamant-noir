import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Dashboard Copilot Section", () => {
  test("displays inline chat, sends message, shows response", async ({ page }) => {
    await page.goto(`${BASE}/login?redirect=/dashboard`);
    await page.locator("#email-pass").fill("proprio1@test.com");
    await page.locator("#password-pass").fill("Test123456!");
    await page.getByRole("button", { name: /accéder/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 15000 });

    // Verify copilot chat is inline (not floating FAB)
    const chatSection = page.locator("text=Diamant — Votre copilot Kayvila");
    await expect(chatSection).toBeVisible({ timeout: 10000 });

    // Verify floating FAB is gone
    const fab = page.locator('[aria-label="Ouvrir Diamant, votre copilot"]');
    await expect(fab).not.toBeAttached();

    // Send a message
    const input = page.locator('input[placeholder="Posez votre question..."]');
    await input.fill("Bonjour Diamant");
    await input.press("Enter");

    // Wait for response (typing dots disappear)
    await page.waitForTimeout(8000);
    await expect(page.locator(".dn-typing-dot")).not.toBeVisible({ timeout: 15000 });

    // Verify a reply appeared — message bubbles are rendered as divs with bg-navy-900 (user) or bg-cream (assistant)
    const replyBubbles = page.locator(".rounded-xl.p-3.text-sm");
    const count = await replyBubbles.count();
    expect(count).toBeGreaterThan(0);
  });

  test("FAB and slide-in are absent", async ({ page }) => {
    await page.goto(`${BASE}/login?redirect=/dashboard`);
    await page.locator("#email-pass").fill("proprio1@test.com");
    await page.locator("#password-pass").fill("Test123456!");
    await page.getByRole("button", { name: /accéder/i }).click();
    await page.waitForURL("**/dashboard");

    // No floating button
    await expect(page.locator("button", { hasText: /ouvrir diamant/i })).not.toBeAttached({ timeout: 5000 });

    // No slide-in aside
    await expect(page.locator("aside[aria-label='Copilot Diamant']")).not.toBeAttached();
  });
});
