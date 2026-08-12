import { test, expect } from "@playwright/test";

const SLUGS = ["masseur", "chef-cuisinier", "excursions", "garde-enfants"] as const;

test.describe("Prestations à venir", () => {
  test("la home affiche le bloc avec 4 cartes cliquables", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#prestations-a-venir");
    await expect(section).toBeVisible();

    const cards = section.locator('a[href^="/experiences/"]');
    await expect(cards).toHaveCount(4);

    // Le badge « Bientôt » est présent sur chaque carte.
    for (const slug of SLUGS) {
      await expect(section.locator(`a[href="/experiences/${slug}"]`)).toBeVisible();
    }
  });

  test("cliquer sur la première carte ouvre sa page", async ({ page }) => {
    await page.goto("/");
    await page.locator('#prestations-a-venir a[href="/experiences/masseur"]').click();
    await expect(page).toHaveURL(/\/experiences\/masseur$/);
    await expect(page.locator("h1")).toHaveCount(1);
  });

  for (const slug of SLUGS) {
    test(`la page /experiences/${slug} rend ses 5 blocs`, async ({ page }) => {
      const response = await page.goto(`/experiences/${slug}`);
      expect(response?.status()).toBe(200);

      // Un seul h1
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).not.toBeEmpty();

      // Fil d'ariane
      await expect(page.getByRole("navigation").first()).toBeVisible();

      // Trois images (hero + intro + inclus)
      expect(await page.locator("main img").count()).toBeGreaterThanOrEqual(3);

      // Les 4 items « ce qui est inclus » et les 3 étapes
      await expect(page.locator("ol > li")).toHaveCount(3);

      // CTA contact
      await expect(page.locator('main a[href="/contact"]').first()).toBeVisible();

      // Navigation vers les 3 autres prestations
      const others = SLUGS.filter((s) => s !== slug);
      for (const other of others) {
        await expect(
          page.locator(`main a[href="/experiences/${other}"]`).first()
        ).toBeVisible();
      }
    });
  }

  test("un slug inconnu affiche la page introuvable", async ({ page }) => {
    // En dev, Next.js renvoie un HTTP 200 pour notFound() tout en affichant la
    // page d'erreur (comportement préexistant, déjà vérifié à l'identique sur
    // /prestations/services/<slug inconnu>, non introduit par ce chantier).
    // On ne peut pas tester un build de production ici (interdiction de lancer
    // `npm run build`), donc on asserte sur le CONTENU affiché plutôt que sur
    // le statut HTTP.
    await page.goto("/experiences/inexistant");

    // app/not-found.tsx affiche un h1 "404" et le texte ci-dessous ; ni l'un
    // ni l'autre n'apparaissent sur une vraie page d'expérience, donc cette
    // assertion reste discriminante même sans vérifier le statut HTTP.
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByText(/Cette page n.existe pas/)).toBeVisible();
  });

  test("aucun débordement horizontal en mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ["/", "/experiences/chef-cuisinier"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      );
      expect(overflow, `débordement sur ${path}`).toBeLessThanOrEqual(1);
    }
  });
});
