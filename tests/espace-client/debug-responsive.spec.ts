import { test, expect } from "@playwright/test";

// Debug visuel de l'espace client en mobile
// Run: npx playwright test tests/espace-client/debug-responsive.spec.ts --project=espace-client --reporter=list

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || "test@kayvila.com",
  password: process.env.TEST_USER_PASSWORD || "test123",
};

async function login(page: any) {
  await page.goto("http://localhost:3000/login?redirect=/espace-client");
  await page.waitForTimeout(1000);
  // Remplir le formulaire de connexion
  const emailInput = page.locator("input[type='email']").first();
  const passwordInput = page.locator("input[type='password']").first();
  if (await emailInput.isVisible()) {
    await emailInput.fill(TEST_USER.email);
    await passwordInput.fill(TEST_USER.password);
    // Cliquer sur le bouton de connexion
    const submitBtn = page.locator("button[type='submit']").first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }
  }
}

test.describe("Espace Client — Debug Responsive Mobile", () => {
  test("login + screenshot dashboard mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
    await login(page);
    await page.screenshot({ path: "test-results/espace-client-mobile-dashboard.png", fullPage: true });

    // Vérifier que la page ne crashe pas
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Vérifier les éléments critiques
    console.log("URL après login:", page.url());
  });

  test("check horizontal overflow on all espace-client routes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await page.waitForTimeout(2000);

    const routes = [
      "/espace-client",
      "/espace-client/messagerie",
      "/espace-client/livret",
      "/espace-client/profil",
      "/espace-client/demandes",
      "/espace-client/checklist",
      "/espace-client/favoris",
      "/espace-client/documents",
      "/espace-client/conciergerie",
    ];

    for (const route of routes) {
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForTimeout(1000);

      const overflow = await page.evaluate(() => {
        return {
          docW: document.documentElement.scrollWidth,
          winW: window.innerWidth,
          overflows: document.documentElement.scrollWidth > window.innerWidth + 2,
        };
      });

      console.log(`${route}: doc=${overflow.docW}px win=${overflow.winW}px overflow=${overflow.overflows}`);

      if (overflow.overflows) {
        // Prendre un screenshot pour debug
        const slug = route.replace(/\//g, "-").replace(/^-/, "");
        await page.screenshot({ path: `test-results/overflow-${slug}.png`, fullPage: true });
      }

      expect(overflow.overflows, `Overflow horizontal sur ${route}`).toBe(false);
    }
  });

  test("vérifier que le DashboardShell/Sidebar s'affiche correctement", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await page.waitForTimeout(2000);

    // Vérifier que le main content est visible
    const main = page.locator("#tenant-main");
    await expect(main).toBeVisible({ timeout: 5000 });

    // Vérifier la MobileBottomNav
    const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');
    const navVisible = await bottomNav.isVisible().catch(() => false);
    console.log("MobileBottomNav visible:", navVisible);

    // Vérifier qu'il n'y a pas d'erreur dans la console
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.reload();
    await page.waitForTimeout(2000);
    if (errors.length > 0) {
      console.log("Console errors:", errors.slice(0, 5));
    }
  });

  test("vérifier les touch targets sur le dashboard", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await page.waitForTimeout(2000);

    const smallTargets = await page.evaluate(() => {
      const targets: any[] = [];
      document.querySelectorAll('button, a, [role="button"], [onclick]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
          targets.push({
            tag: el.tagName,
            w: Math.round(rect.width),
            h: Math.round(rect.height),
            text: (el as HTMLElement).textContent?.trim().slice(0, 30) || "",
          });
        }
      });
      return targets;
    });

    if (smallTargets.length > 0) {
      console.log(`⚠️ ${smallTargets.length} touch targets < 44px:`);
      smallTargets.forEach((t: any) => console.log(`  <${t.tag}> ${t.w}×${t.h}px "${t.text}"`));
    } else {
      console.log("✅ Tous les touch targets ≥ 44px");
    }
  });

  test("vérifier les inputs iOS zoom triggers", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await page.waitForTimeout(2000);

    // Aller sur la page profil qui a des inputs
    await page.goto("http://localhost:3000/espace-client/profil");
    await page.waitForTimeout(1000);

    const triggers = await page.evaluate(() => {
      const t: any[] = [];
      document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach((el) => {
        const style = window.getComputedStyle(el);
        const size = parseFloat(style.fontSize);
        if (size > 0 && size < 16) {
          t.push({
            tag: el.tagName,
            size,
            placeholder: (el as HTMLInputElement).placeholder?.slice(0, 25) || "",
          });
        }
      });
      return t;
    });

    if (triggers.length > 0) {
      console.log(`⚠️ ${triggers.length} iOS zoom triggers:`);
      triggers.forEach((t: any) => console.log(`  <${t.tag}> ${t.size}px "${t.placeholder}"`));
    } else {
      console.log("✅ Aucun iOS zoom trigger");
    }
  });

  test("screenshot de toutes les pages espace-client en mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await page.waitForTimeout(2000);

    const pages = [
      "/espace-client",
      "/espace-client/messagerie",
      "/espace-client/livret",
      "/espace-client/profil",
    ];

    for (const p of pages) {
      await page.goto(`http://localhost:3000${p}`);
      await page.waitForTimeout(1000);
      const slug = p.replace(/\//g, "-").replace(/^-/, "");
      await page.screenshot({ path: `test-results/mobile${slug}.png`, fullPage: true });
    }
  });
});
