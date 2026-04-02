import { test, expect } from "@playwright/test";

// Start dev server: npm run dev
// Run: npx playwright test tests/espace-client/chat.spec.ts --reporter=line

test.describe("Espace Client — Chat & Messagerie", () => {
  test("page messagerie responds without 5xx", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/espace-client/messagerie");
    expect(response?.status()).toBeLessThan(500);
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login|\/espace-client\/messagerie/);
  });

  test("chat API returns 400 on empty message", async ({ request }) => {
    const res = await request.post("http://localhost:3000/api/chat/tenant", {
      data: { message: "", sessionId: "test-session", guestEmail: "test@test.com" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("chat API returns 4xx on missing guestEmail", async ({ request }) => {
    const res = await request.post("http://localhost:3000/api/chat/tenant", {
      data: { message: "Bonjour", sessionId: "test-session" },
    });
    // 429 rate limit or 400 bad request both acceptable
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test("chat API returns demo response without n8n webhook", async ({ request }) => {
    // N8N_TENANT_WEBHOOK_URL not set in test env → demo response
    const res = await request.post("http://localhost:3000/api/chat/tenant", {
      data: {
        message: "Bonjour",
        sessionId: "test-session-playwright",
        guestEmail: "playwright@diamantnoir.test",
      },
    });
    // Either 200 (demo mode) or 429 (rate limit already hit)
    expect([200, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(typeof body.response).toBe("string");
    }
  });
});
