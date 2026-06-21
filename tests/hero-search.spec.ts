import { test, expect } from "@playwright/test";

/**
 * Tests du bloc recherche Hero — régression overflow-hidden (Task 2).
 *
 * Flux réel : HeroSearchWidget n'apparaît que quand l'audience est "voyageur".
 * On active ce chemin via le paramètre URL ?pour=locataires (hydraté par
 * HomeAudienceContext → hydrateAudienceFromUrlIfNeeded), ce qui évite
 * de dépendre du clic sur la carte voyageur dans chaque test.
 */

const SEARCH_URL = "/?pour=locataires";

test.describe("Hero — bloc recherche", () => {
  test("le calendrier s'ouvre au clic sur Dates (desktop)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(SEARCH_URL);
    // Attendre que le formulaire soit monté (hydratation React)
    await expect(
      page.getByRole("button", { name: /choisir les dates/i })
    ).toBeVisible();
    await page.getByRole("button", { name: /choisir les dates/i }).click();
    // Le RangeCalendar HeroUI expose role="application" avec aria-label "Dates de séjour…"
    await expect(
      page.getByRole("application", { name: /dates de séjour/i })
    ).toBeVisible();
  });

  test("le calendrier n'est pas clippé (entièrement dans le viewport) — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(SEARCH_URL);
    await expect(
      page.getByRole("button", { name: /choisir les dates/i })
    ).toBeVisible();
    await page.getByRole("button", { name: /choisir les dates/i }).click();
    const cal = page.getByRole("application", { name: /dates de séjour/i });
    await expect(cal).toBeVisible();
    const box = await cal.boundingBox();
    const vp = page.viewportSize();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(100); // pas écrasé à 0
    // Le bas du calendrier doit rester dans le viewport (non clippé par overflow-hidden section)
    expect(box!.y + box!.height).toBeLessThanOrEqual(vp!.height + 1);
  });

  test("sélectionner une plage de dates met à jour le résumé", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(SEARCH_URL);
    await expect(
      page.getByRole("button", { name: /choisir les dates/i })
    ).toBeVisible();
    await page.getByRole("button", { name: /choisir les dates/i }).click();
    const enabledDays = page.locator(
      "[role='application'] [role='gridcell'] [role='button']:not([aria-disabled='true'])"
    );
    await enabledDays.nth(2).click();
    await enabledDays.nth(5).click();
    // Après sélection d'une plage, le badge "X nuit(s)" doit apparaître dans le bouton Dates
    await expect(page.getByText(/\d+\s*nuit/i)).toBeVisible();
  });

  test("le sélecteur de voyageurs incrémente/décrémente", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(SEARCH_URL);
    await expect(
      page.getByRole("button", { name: /voyageurs/i })
    ).toBeVisible();
    // Ouvrir le dropdown voyageurs (bouton affiche "2 voyageurs" par défaut)
    await page.getByRole("button", { name: /voyageurs/i }).click();
    // Le bouton "Augmenter" apparaît dans le dropdown fixé (aria-label="Augmenter")
    await page.getByRole("button", { name: /augmenter/i }).click();
    // Après incrément, le compteur passe à 3 voyageurs
    await expect(page.getByText(/3 voyageurs/i).first()).toBeVisible();
  });

  test("le calendrier est visible sur viewport mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SEARCH_URL);
    await expect(
      page.getByRole("button", { name: /choisir les dates/i })
    ).toBeVisible();
    await page.getByRole("button", { name: /choisir les dates/i }).click();
    const cal = page.getByRole("application", { name: /dates de séjour/i });
    await expect(cal).toBeVisible();
    const box = await cal.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(100);
  });

  test("Rechercher navigue vers /villas avec les paramètres", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(SEARCH_URL);
    await expect(
      page.getByRole("button", { name: /^rechercher$/i })
    ).toBeVisible();
    await page.getByRole("button", { name: /^rechercher$/i }).click();
    await page.waitForURL(/\/villas\?/);
    expect(page.url()).toContain("guests=");
  });
});
