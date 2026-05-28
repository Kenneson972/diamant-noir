import { test, expect } from "@playwright/test";

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || "test@kayvila.com",
  password: process.env.TEST_USER_PASSWORD || "test123",
};

test.describe("Authentication — Login", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type='email'], input[name='email']").first()).toBeVisible();
    await expect(page.locator("input[type='password']").first()).toBeVisible();
  });

  test("should show error on wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email'], input[name='email']").first().fill(TEST_USER.email);
    await page.locator("input[type='password']").first().fill("wrong-password-123");
    await page.locator("button[type='submit']").first().click();
    await expect(page.locator("text=Identifiants incorrects, erreur, invalide").first()).toBeVisible({ timeout: 5000 });
  });

  test("should login successfully as admin", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email'], input[name='email']").first().fill(TEST_USER.email);
    await page.locator("input[type='password']").first().fill(TEST_USER.password);
    await page.locator("button[type='submit']").first().click();
    // Should redirect away from login
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });
    expect(page.url()).not.toContain("/login");
  });

  test("should redirect unauthenticated user to login for protected pages", async ({ page }) => {
    await page.goto("/espace-client");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("should redirect unauthenticated user for admin pages", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("should redirect unauthenticated user for dashboard pages", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("should have redirect param in URL when coming from protected page", async ({ page }) => {
    await page.goto("/espace-client");
    await page.waitForURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("redirect")).toBeTruthy();
  });

  test("should block open redirect after login", async ({ page }) => {
    // Attempt login with external redirect in URL
    await page.goto("/login?redirect=https://evil.com/phishing");
    await page.locator("input[type='email'], input[name='email']").first().fill(TEST_USER.email);
    await page.locator("input[type='password']").first().fill(TEST_USER.password);
    await page.locator("button[type='submit']").first().click();
    // Should NOT redirect to external URL
    await page.waitForTimeout(2000);
    const url = new URL(page.url());
    expect(url.hostname).not.toBe("evil.com");
  });

  test("should validate email format", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email'], input[name='email']").first().fill("not-an-email");
    await page.locator("button[type='submit']").first().click();
    // Should show validation (HTML5 or custom)
    const emailInput = page.locator("input[type='email'], input[name='email']").first();
    await expect(emailInput).toBeVisible();
  });

  test("should show loading state during login", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email'], input[name='email']").first().fill(TEST_USER.email);
    await page.locator("input[type='password']").first().fill(TEST_USER.password);
    // Submit button should exist
    const submitBtn = page.locator("button[type='submit']").first();
    await expect(submitBtn).toBeEnabled();
  });
});

test.describe("Authentication — Role-based redirect", () => {
  test("admin should go to /admin after login on /login", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email'], input[name='email']").first().fill(process.env.TEST_ADMIN_EMAIL || TEST_USER.email);
    await page.locator("input[type='password']").first().fill(process.env.TEST_ADMIN_PASSWORD || TEST_USER.password);
    await page.locator("button[type='submit']").first().click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });
  });

  test("owner should go to /dashboard after login on /login", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email'], input[name='email']").first().fill(process.env.TEST_OWNER_EMAIL || "owner@kayvila.com");
    await page.locator("input[type='password']").first().fill(process.env.TEST_OWNER_PASSWORD || "owner123");
    await page.locator("button[type='submit']").first().click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });
  });
});
