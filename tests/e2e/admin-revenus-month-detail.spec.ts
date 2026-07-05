import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_E2E_EMAIL || "admin@diamantnoir.com";
const ADMIN_PASSWORD = process.env.ADMIN_E2E_PASSWORD || "Admin123!";

test("admin revenus — sélection de mois affiche le panneau détail", async ({ page }) => {
  await page.goto(`${BASE}/login?redirect=/admin/revenus`);
  await page.locator("#email-pass").fill(ADMIN_EMAIL);
  await page.locator("#password-pass").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /accéder/i }).click();
  await page.waitForURL("**/admin/revenus", { timeout: 15000 });

  await expect(page.getByText("Détail — ", { exact: false })).toBeVisible({ timeout: 10000 });

  const monthSelect = page.getByLabel("Sélectionner un mois");
  const options = await monthSelect.locator("option").allTextContents();
  expect(options.length).toBe(12);

  const otherMonthLabel = options[0];
  await monthSelect.selectOption({ label: otherMonthLabel });
  await expect(page.getByText(`Détail — ${otherMonthLabel}`)).toBeVisible({ timeout: 10000 });

  // Répartition par canal et tableau villa présents seulement s'il y a des réservations ce mois
  const emptyState = page.getByText("Aucune réservation confirmée ce mois-ci.");
  const exportButton = page.getByRole("button", { name: "Exporter ce mois" });
  const isEmpty = await emptyState.isVisible().catch(() => false);

  if (isEmpty) {
    await expect(exportButton).not.toBeVisible();
  } else {
    await expect(page.getByRole("columnheader", { name: "Occupation" })).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await exportButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^revenus-\d{4}-\d{2}\.csv$/);
  }
});
