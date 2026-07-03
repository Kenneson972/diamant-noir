import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Tests @live-stripe : vrais endpoints + vraie page Stripe Checkout (mode test).
// Cartes de test Stripe : 4242424242424242 (succès), 4000000000000002 (déclin).
// Prérequis : dev server lancé avec des clés Stripe TEST + villa publiée.
//
// Chaque test réserve sa PROPRE fenêtre de dates (les bookings pending créés
// par un test bloquent la disponibilité pour les suivants), et les résas de
// test (guest_email dédié) sont purgées avant/après via service-role.

const TEST_VILLA_ID =
  process.env.TEST_VILLA_ID || "4ce2e4f4-2101-485c-ba8a-0d76d4dcb99a";
const TEST_GUEST_EMAIL = "marie.test@kayvila.com";

function loadEnvLocal(): Record<string, string> {
  const envPath = path.resolve(__dirname, "../.env.local");
  const out: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

const ENV = loadEnvLocal();

function isoPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Purge les réservations de test futures (email dédié) pour libérer les fenêtres. */
async function cleanupTestBookings(request: APIRequestContext): Promise<void> {
  const supabaseUrl = ENV.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = ENV.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return;
  await request.delete(
    `${supabaseUrl}/rest/v1/bookings?guest_email=eq.${encodeURIComponent(TEST_GUEST_EMAIL)}&start_date=gte.${isoPlusDays(200)}`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );
}

/** /book direct → formulaire → vraie session Stripe → page checkout.stripe.com. */
async function goToStripeCheckout(page: Page, startOffset: number): Promise<void> {
  // Consentement cookies AVANT le premier goto (le banner intercepte les clics)
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "kayvila-cookie-consent",
      JSON.stringify({ necessary: true, analytics: false, marketing: false })
    );
  });
  // Fenêtre lointaine (~J+300) : minimise les collisions avec les résas réelles
  await page.goto(
    `/book?villaId=${TEST_VILLA_ID}&checkin=${isoPlusDays(startOffset)}&checkout=${isoPlusDays(startOffset + 7)}&guests=2`
  );

  const cgvCheckbox = page.locator('[data-testid="cgv-checkbox"]:visible');
  await cgvCheckbox.waitFor({ state: "visible", timeout: 20000 });

  await page.fill("#guestName", "Marie Test");
  await page.fill("#guestEmail", TEST_GUEST_EMAIL);
  await cgvCheckbox.check();

  const confirmButton = page
    .locator("button:visible", { hasText: /Confirmer|payer/i })
    .first();
  await confirmButton.scrollIntoViewIfNeeded();
  await confirmButton.click();

  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
}

/** Remplit la CB de test sur la page Stripe Checkout et clique Payer. */
async function fillCardAndPay(page: Page, cardNumber: string): Promise<void> {
  // Stripe Checkout liste les moyens de paiement en accordéon (Card /
  // Bancontact / EPS), parfois replié : attendre la ligne "Card", l'ouvrir si
  // les champs carte ne sont pas déjà visibles.
  const cardField = page.locator('[name="cardNumber"]');
  const cardItem = page.locator('[data-testid="card-accordion-item"]');
  await cardItem.waitFor({ state: "attached", timeout: 30000 });
  if (!(await cardField.isVisible().catch(() => false))) {
    await cardItem.click();
  }
  await cardField.waitFor({ state: "visible", timeout: 20000 });

  await page.fill('[name="cardNumber"]', cardNumber);
  await page.fill('[name="cardExpiry"]', "12/30");
  await page.fill('[name="cardCvc"]', "123");
  await page.fill('[name="billingName"]', "Marie Test");

  const payButton = page
    .locator('[data-testid="hosted-payment-submit-button"], button:has-text("Pay"), button:has-text("Payer")')
    .first();
  await payButton.click();
}

test.describe("@live-stripe Flow Stripe", () => {
  test.beforeEach(async ({ request }) => {
    await cleanupTestBookings(request);
  });

  test.afterAll(async ({ request }) => {
    await cleanupTestBookings(request);
  });

  test("booking → Stripe Checkout → paiement réussi → confirmation", async ({
    page,
  }) => {
    test.setTimeout(90000);

    await goToStripeCheckout(page, 300);
    await fillCardAndPay(page, "4242424242424242");

    // Redirection vers /success + confirmation
    await page.waitForURL("**/success?session_id=*", { timeout: 30000 });
    await expect(page.locator("text=Réservation confirmée")).toBeVisible({
      timeout: 20000,
    });
  });

  test("paiement refusé → message d'erreur Stripe, pas de /success", async ({
    page,
  }) => {
    test.setTimeout(90000);

    await goToStripeCheckout(page, 315);
    await fillCardAndPay(page, "4000000000000002");

    // Stripe affiche l'erreur de déclin inline — pas de redirection
    await expect(
      page.locator("text=/declined|refusée|refusé/i").first()
    ).toBeVisible({ timeout: 20000 });
    expect(page.url()).toContain("checkout.stripe.com");
    expect(page.url()).not.toContain("/success");

    // Le visiteur peut réessayer : le champ carte est toujours éditable
    await expect(page.locator('[name="cardNumber"]')).toBeEditable();
  });

  test("abandon du checkout → cancel_url redirige vers /villas?canceled=true", async ({
    page,
  }) => {
    test.setTimeout(90000);

    await goToStripeCheckout(page, 330);

    // Le lien retour de la page Stripe pointe vers la cancel_url de la session
    const backLink = page.locator('a[href*="canceled=true"]').first();
    await expect(backLink).toBeAttached({ timeout: 15000 });
    await backLink.click();

    await page.waitForURL(/\/villas\?canceled=true/, { timeout: 20000 });
    expect(page.url()).toContain("canceled=true");
    expect(page.url()).toContain("bookingId=");
  });
});
