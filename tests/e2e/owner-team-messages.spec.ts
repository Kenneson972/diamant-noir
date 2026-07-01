// tests/e2e/owner-team-messages.spec.ts
import { test, expect, type Page } from "@playwright/test";

const OWNER_EMAIL = process.env.TEST_OWNER_EMAIL || "owner@kayvila.com";
const OWNER_PASSWORD = process.env.TEST_OWNER_PASSWORD || "owner123";
const ADMIN_EMAIL = process.env.ADMIN_E2E_EMAIL || "admin@diamantnoir.com";
const ADMIN_PASSWORD = process.env.ADMIN_E2E_PASSWORD || "Admin123!";

async function loginAsOwner(page: Page): Promise<void> {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.locator("input[type='email'], input[name='email']").first().fill(OWNER_EMAIL);
  await page.locator("input[type='password']").first().fill(OWNER_PASSWORD);
  await page.locator("button[type='submit']").first().click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
}

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/login?redirect=/admin/messages");
  await page.locator("#email-pass").fill(ADMIN_EMAIL);
  await page.locator("#password-pass").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /accéder/i }).click();
  await page.waitForURL("**/admin/messages", { timeout: 15_000 });
}

test.describe("Mon concierge — Notre équipe / admin Messages", () => {
  test.skip(!!process.env.PLAYWRIGHT_SKIP_DB_TESTS, "Needs local Supabase");

  test("quick actions pre-fill the subject selector", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/dashboard/concierge");
    await page.waitForLoadState("networkidle");

    await page.getByRole("tab", { name: /Notre équipe/i }).click();
    await page.getByRole("button", { name: /Disponibilités/i }).click();

    const subjectSelect = page.locator("select").first();
    await expect(subjectSelect).toHaveValue("disponibilites");
  });

  test("owner sends a message and it appears in the admin Propriétaires tab", async ({
    page,
    browser,
  }) => {
    const messageText = `Test E2E ${Date.now()}`;

    await loginAsOwner(page);
    await page.goto("/dashboard/concierge");
    await page.waitForLoadState("networkidle");
    await page.getByRole("tab", { name: /Notre équipe/i }).click();

    await page.locator("textarea").fill(messageText);
    await page.locator("button:has(svg)").last().click();

    await expect(page.getByText(messageText)).toBeVisible({ timeout: 10_000 });

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAsAdmin(adminPage);
    await adminPage.getByRole("tab", { name: "Propriétaires" }).click();
    await expect(adminPage.getByText(messageText)).toBeVisible({ timeout: 10_000 });
    await adminContext.close();
  });

  test("admin reply flips owner message status to Répondu and shows an unread badge", async ({
    page,
    browser,
  }) => {
    const ownerMessage = `Statut E2E ${Date.now()}`;
    const adminReply = `Réponse E2E ${Date.now()}`;

    await loginAsOwner(page);
    await page.goto("/dashboard/concierge");
    await page.waitForLoadState("networkidle");
    await page.getByRole("tab", { name: /Notre équipe/i }).click();
    await page.locator("textarea").fill(ownerMessage);
    await page.locator("button:has(svg)").last().click();
    await expect(page.getByText(ownerMessage)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("🟡 Envoyé")).toBeVisible({ timeout: 10_000 });

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAsAdmin(adminPage);
    await adminPage.getByRole("tab", { name: "Propriétaires" }).click();
    await expect(adminPage.getByText(ownerMessage)).toBeVisible({ timeout: 10_000 });
    await adminPage.locator("input[placeholder='Répondre au propriétaire…']").fill(adminReply);
    await adminPage.getByRole("button", { name: /Envoyer/i }).click();
    await expect(adminPage.getByText(adminReply)).toBeVisible({ timeout: 10_000 });
    await adminContext.close();

    // Sans reload : le statut passe à "Répondu" via Realtime
    await expect(page.getByText("✅ Répondu")).toBeVisible({ timeout: 10_000 });

    // Recharger et rouvrir l'onglet IA puis Notre équipe : le point non-lu doit apparaître
    // avant d'ouvrir l'onglet (le badge se pose au chargement de la page)
    await page.reload();
    await page.waitForLoadState("networkidle");
    const teamTab = page.getByRole("tab", { name: /Notre équipe/i });
    await expect(teamTab.locator(".bg-gold")).toBeVisible({ timeout: 10_000 });
  });
});
