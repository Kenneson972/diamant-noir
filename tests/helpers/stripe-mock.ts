// tests/helpers/stripe-mock.ts
import type { Page } from "@playwright/test";

const FAKE_SESSION_ID = "cs_test_mock_fake";

export async function setupStripeMock(page: Page): Promise<void> {
  // Intercepte POST /api/booking → retourne success_url sans Stripe réel
  await page.route("**/api/booking", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        url: `/success?session_id=${FAKE_SESSION_ID}`,
        bookingId: "00000000-0000-0000-0000-000000000001",
      }),
    });
  });

  // Intercepte GET /api/booking-session → booking confirmed
  await page.route(`**/api/booking-session?session_id=${FAKE_SESSION_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        booking: {
          id: "00000000-0000-0000-0000-000000000001",
          villa_id: "00000000-0000-0000-0000-000000000002",
          start_date: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
          end_date: new Date(Date.now() + 86400000 * 37).toISOString().slice(0, 10),
          status: "confirmed",
          payment_status: "paid",
          guest_name: "Marie Dupont",
          guest_email: "marie@test.com",
          guests: 2,
          total_price_cents: 25250,
        },
        villa: {
          id: "00000000-0000-0000-0000-000000000002",
          name: "Villa Test — Vue Mer",
          location: "Le Diamant",
          image_url: null,
        },
        pending: false,
      }),
    });
  });
}

export { FAKE_SESSION_ID };
