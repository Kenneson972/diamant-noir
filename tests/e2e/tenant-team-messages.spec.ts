// tests/e2e/tenant-team-messages.spec.ts
import { test, expect, type Page } from "@playwright/test";

const TENANT_EMAIL = process.env.TEST_TENANT_EMAIL || "voyageur@test.com";
const TENANT_PASSWORD = process.env.TEST_TENANT_PASSWORD || "Test123456!";
const ADMIN_EMAIL = process.env.ADMIN_E2E_EMAIL || "admin@diamantnoir.com";
const ADMIN_PASSWORD = process.env.ADMIN_E2E_PASSWORD || "Admin123!";

async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("vous@exemple.com").fill(email);
  await page.getByPlaceholder("••••••••").first().fill(password);
  await page.getByRole("button", { name: /accéder|connexion|se connecter/i }).first().click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
}

test.describe("Notre équipe locataire / admin Locataires", () => {
  test.skip(!!process.env.PLAYWRIGHT_SKIP_DB_TESTS, "Needs local Supabase");

  test("quick action pre-fills the subject selector", async ({ page }) => {
    await loginAs(page, TENANT_EMAIL, TENANT_PASSWORD);
    await page.goto("/espace-client/messagerie");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Mon séjour" }).click();
    const subjectSelect = page.locator("select").first();
    await expect(subjectSelect).toHaveValue("sejour");
  });

  test("tenant sends a message and it appears in the admin Locataires tab", async ({
    page,
    browser,
  }) => {
    const messageText = `Test E2E locataire ${Date.now()}`;

    await loginAs(page, TENANT_EMAIL, TENANT_PASSWORD);
    await page.goto("/espace-client/messagerie");
    await page.waitForLoadState("networkidle");
    await page.locator("textarea").fill(messageText);
    await page.locator("button:has(svg)").last().click();
    await expect(page.getByText(messageText)).toBeVisible({ timeout: 10_000 });

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto("/login?redirect=/admin/messages");
    await adminPage.locator("#email-pass").fill(ADMIN_EMAIL);
    await adminPage.locator("#password-pass").fill(ADMIN_PASSWORD);
    await adminPage.getByRole("button", { name: /accéder/i }).click();
    await adminPage.waitForURL("**/admin/messages", { timeout: 15_000 });
    await adminPage.getByRole("tab", { name: "Locataires" }).click();
    await expect(adminPage.getByText(messageText)).toBeVisible({ timeout: 10_000 });
    await adminContext.close();
  });
});
