import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_E2E_EMAIL || "admin@diamantnoir.com";
const ADMIN_PASSWORD = process.env.ADMIN_E2E_PASSWORD || "Admin123!";

test("admin concierge shows rich copilot and proposes SET_PRICE with confirm", async ({ page }) => {
  await page.goto(`${BASE}/login?redirect=/admin/concierge`);
  await page.locator("#email-pass").fill(ADMIN_EMAIL);
  await page.locator("#password-pass").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /accéder/i }).click();
  await page.waitForURL("**/admin/concierge", { timeout: 15000 });

  // Rich copilot (not the old read-only AgentChat)
  await expect(page.getByText("Concierge IA — Admin")).toBeVisible({ timeout: 10000 });

  const input = page.locator('input[placeholder="Posez votre question..."]');
  await input.fill("Passe la première villa à 1900 euros la nuit");
  await input.press("Enter");

  // A confirmation card appears — the write action is proposed, NOT executed
  await expect(page.getByText("Confirmer cette action ?")).toBeVisible({ timeout: 35000 });
});
