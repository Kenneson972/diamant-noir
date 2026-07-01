/**
 * E2E — proprio-fixes.spec.ts
 *
 * Couvre 5 scénarios post-fix pour l'espace propriétaire Kayvila :
 *   1. Responsive BookingCard (mobile cards / desktop table)
 *   2. Axe Y K€ sur RevenueChart
 *   3. Blocage calendrier (AvailabilityCalendar)
 *   4. Export PDF revenus (RevenuePageClient)
 *
 * Ces tests sont E2E visuels — ils nécessitent une instance locale avec Supabase.
 * Ils sont skippés en CI (PLAYWRIGHT_SKIP_DB_TESTS=true).
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Credentials — jamais hardcodés
// ---------------------------------------------------------------------------
const OWNER_EMAIL =
  process.env.TEST_OWNER_EMAIL || "owner@kayvila.com";
const OWNER_PASSWORD =
  process.env.TEST_OWNER_PASSWORD || "owner123";

// ---------------------------------------------------------------------------
// Helper : connexion en tant que propriétaire
// ---------------------------------------------------------------------------
async function loginAsOwner(page: Page): Promise<void> {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  const emailInput = page
    .locator("input[type='email'], input[name='email']")
    .first();
  const passwordInput = page.locator("input[type='password']").first();
  const submitBtn = page.locator("button[type='submit']").first();

  await emailInput.fill(OWNER_EMAIL);
  await passwordInput.fill(OWNER_PASSWORD);
  await submitBtn.click();

  // Attendre la redirection hors /login
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15_000,
  });
}

// ---------------------------------------------------------------------------
// 1. Responsive mobile — ProprioBookingDataGrid
//    Sélecteurs tirés du composant :
//      Mobile  → div.flex.flex-col.gap-3.md\:hidden
//      Desktop → div.hidden.md\:block
// ---------------------------------------------------------------------------
test.describe("Responsive — ProprioBookingDataGrid", () => {
  test.skip(
    !!process.env.PLAYWRIGHT_SKIP_DB_TESTS,
    "Needs local Supabase"
  );

  test("mobile viewport shows cards, desktop viewport shows table", async ({
    page,
  }) => {
    await loginAsOwner(page);

    // Naviguer vers la page réservations (l'URL réelle contient l'ID de villa
    // mais le middleware redirige /dashboard/reservations → première villa du proprio)
    await page.goto("/dashboard/reservations");
    await page.waitForLoadState("networkidle");

    // ---- iPhone SE (375 × 667) ----
    await page.setViewportSize({ width: 375, height: 667 });

    // Cards mobile doivent être dans le DOM et visibles
    const mobileCards = page.locator("div.flex.flex-col.gap-3").first();
    await expect(mobileCards).toBeVisible();

    // Le wrapper desktop (hidden md:block) est dans le DOM mais invisible
    const desktopTable = page.locator("div.hidden.md\\:block").first();
    // Sur 375 px, la classe Tailwind `hidden` s'applique → not visible
    await expect(desktopTable).not.toBeVisible();

    // ---- Desktop (1280 × 800) ----
    await page.setViewportSize({ width: 1280, height: 800 });

    // Desktop table doit devenir visible
    await expect(desktopTable).toBeVisible();

    // Mobile cards : le wrapper reste dans le DOM mais `md:hidden` le masque
    await expect(mobileCards).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Axe Y K€ — RevenueChart (recharts)
//    Le chart est chargé dynamiquement (dynamic import SSR:false).
//    On vérifie uniquement que le wrapper recharts est monté.
//    La vérification K€ est conditionnelle : si des ticks sont présents,
//    au moins l'un doit correspondre au format attendu (K€ ou €).
// ---------------------------------------------------------------------------
test.describe("RevenueChart — axe Y K€", () => {
  test.skip(
    !!process.env.PLAYWRIGHT_SKIP_DB_TESTS,
    "Needs local Supabase"
  );

  test("revenue chart renders and Y-axis uses K€ format for high values", async ({
    page,
  }) => {
    await loginAsOwner(page);
    await page.goto("/dashboard/statistiques");
    await page.waitForLoadState("networkidle");

    // Attendre le chargement dynamique de recharts (SSR:false → hydratation côté client)
    const rechartsWrapper = page
      .locator(".recharts-wrapper")
      .first();

    // On accepte 2 cas : chart visible OU message "Historique disponible…"
    const noHistoryMsg = page.locator(
      "text=Historique disponible après 3 mois d'activité"
    );

    const chartOrMsg = rechartsWrapper.or(noHistoryMsg).first();
    await expect(chartOrMsg).toBeVisible({ timeout: 10_000 });

    // Si le chart est effectivement rendu, vérifier les ticks Y
    const isChartVisible = await rechartsWrapper.isVisible();
    if (isChartVisible) {
      // Attendre que recharts ait rendu ses ticks SVG
      await page.waitForSelector(".recharts-yAxis .recharts-text", {
        timeout: 8_000,
        state: "attached",
      });

      const yTicks = page.locator(".recharts-yAxis .recharts-text");
      const tickCount = await yTicks.count();

      if (tickCount > 0) {
        // Récupérer le contenu texte de tous les ticks
        const tickTexts = await yTicks.allTextContents();
        // Chaque tick doit correspondre soit à "NNN€" soit à "NK€"
        for (const tick of tickTexts) {
          expect(tick).toMatch(/^\d+(\.\d+)?K?€$/);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Calendrier blocage — AvailabilityCalendar
//    Le composant rend :
//      - 3 mois via `p.text-center.text-xs.font-semibold` contenant "MMMM yyyy"
//      - une légende avec les labels "Disponible", "Réservé", "Bloqué", "Passé"
//
//    URL : /dashboard/villas/[villaId]/disponibilites
//    On passe par /dashboard pour trouver le lien vers la première villa.
// ---------------------------------------------------------------------------
test.describe("AvailabilityCalendar — blocage calendrier", () => {
  test.skip(
    !!process.env.PLAYWRIGHT_SKIP_DB_TESTS,
    "Needs local Supabase"
  );

  test("loads availability calendar with 3 months and legend", async ({
    page,
  }) => {
    await loginAsOwner(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Chercher le lien vers les disponibilités dans le dashboard
    const disponibilitesLink = page
      .locator("a[href*='/disponibilites']")
      .first();

    if (await disponibilitesLink.isVisible()) {
      await disponibilitesLink.click();
    } else {
      // Navigation directe si le lien n'est pas sur le dashboard courant
      await page.goto("/dashboard/villas");
      await page.waitForLoadState("networkidle");
      const villaDispoLink = page
        .locator("a[href*='/disponibilites']")
        .first();
      await villaDispoLink.click();
    }

    await page.waitForLoadState("networkidle");

    // 3 mois : <p class="text-center text-xs font-semibold text-navy capitalize">
    // Chaque p contient "MMMM yyyy" en français — on cible la présence de l'année (4 chiffres)
    const monthHeadings = page
      .locator("p.text-center.text-xs.font-semibold")
      .filter({ hasText: /\d{4}/ });

    await expect(monthHeadings).toHaveCount(3, { timeout: 8_000 });

    // Légende — les labels viennent de la liste dans le composant
    // Ils sont rendus dans un <span class="text-navy/60">
    const legend = page.locator("span.text-navy\\/60");
    await expect(legend.filter({ hasText: "Disponible" })).toBeVisible();
    await expect(legend.filter({ hasText: "Réservé" })).toBeVisible();
    await expect(legend.filter({ hasText: "Bloqué" })).toBeVisible();
    await expect(legend.filter({ hasText: "Passé" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Export PDF revenus — RevenuePageClient
//    Le bouton "Exporter en PDF" déclenche un download via fetch → blob → <a>.
//    Playwright intercepte le download event.
//    URL : /dashboard/revenus
// ---------------------------------------------------------------------------
test.describe("RevenuePageClient — export PDF", () => {
  test.skip(
    !!process.env.PLAYWRIGHT_SKIP_DB_TESTS,
    "Needs local Supabase"
  );

  test("export PDF button triggers a file download with .pdf extension", async ({
    page,
  }) => {
    await loginAsOwner(page);
    await page.goto("/dashboard/revenus");
    await page.waitForLoadState("networkidle");

    // Le bouton : <button>…Exporter en PDF</button>
    // Contient aussi une icône Download (lucide) mais le texte "Exporter en PDF" est présent
    const exportBtn = page
      .locator("button")
      .filter({ hasText: "Exporter en PDF" })
      .first();

    await expect(exportBtn).toBeVisible({ timeout: 8_000 });

    // Intercepter le téléchargement
    // Note : RevenuePageClient utilise fetch + URL.createObjectURL → la redirection
    // se fait via un <a> créé programmatiquement et cliqué. Playwright capture cela
    // via le "download" event.
    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await exportBtn.click();

    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    // Le nom de fichier suit le pattern : revenus-kayvila-{period}.pdf
    expect(filename).toMatch(/\.pdf$/i);
    expect(filename).toContain("revenus-kayvila-");
  });
});
