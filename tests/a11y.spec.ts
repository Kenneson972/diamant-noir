import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  { path: "/", name: "Home" },
  { path: "/villas", name: "Villas catalog" },
  { path: "/prestations", name: "Prestations" },
  { path: "/contact", name: "Contact" },
  { path: "/login", name: "Login" },
  { path: "/faq", name: "FAQ" },
  { path: "/qui-sommes-nous", name: "About" },
  { path: "/soumettre-ma-villa", name: "Submit villa" },
];

test.describe("Accessibility — WCAG AA", () => {
  for (const { path, name } of PAGES) {
    test(`${name} (${path}) should have no critical a11y violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      // Only fail on critical/serious violations
      const violations = results.violations.filter((v) =>
        ["critical", "serious"].includes(v.impact ?? "")
      );

      if (violations.length > 0) {
        console.log(`A11y violations on ${name}:`, JSON.stringify(violations, null, 2));
      }

      expect(violations.length).toBe(0);
    });
  }

  test("Villa detail page should have no critical a11y violations", async ({ page }) => {
    // Visit any villa — test the component structure, not specific data
    await page.goto("/villas");
    await page.waitForLoadState("networkidle");

    // Click first villa link
    const villaLink = page.locator("a[href*='/villas/']").first();
    if (await villaLink.isVisible()) {
      await villaLink.click();
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const violations = results.violations.filter((v) =>
        v.impact === "critical" || v.impact === "serious"
      );
      expect(violations.length).toBe(0);
    }
  });

  test("Checkout page should have no critical a11y violations", async ({ page }) => {
    await page.goto("/villas");
    await page.waitForLoadState("networkidle");

    // Navigate to a villa, then to book
    const villaLink = page.locator("a[href*='/villas/']").first();
    if (await villaLink.isVisible()) {
      await villaLink.click();
      await page.waitForLoadState("networkidle");
    }

    const bookLink = page.locator("a[href*='/book'], button:has-text('Réserver')").first();
    if (await bookLink.isVisible()) {
      await bookLink.click();
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const violations = results.violations.filter((v) =>
        v.impact === "critical" || v.impact === "serious"
      );
      expect(violations.length).toBe(0);
    }
  });
});

test.describe("Accessibility — Landmarks & Navigation", () => {
  test("Home page should have proper landmarks", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should have main landmark
    const main = page.locator("main").first();
    await expect(main).toBeVisible();

    // Should have navigation
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();
  });

  test("Should have visible focus indicators on interactive elements", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator("input[type='email'], input[name='email']").first();
    await emailInput.focus();

    // Verify focus is visible (ring or outline)
    const focusedStyle = await emailInput.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.outlineStyle !== "none" || style.boxShadow !== "none";
    });
    expect(focusedStyle).toBe(true);
  });
});
