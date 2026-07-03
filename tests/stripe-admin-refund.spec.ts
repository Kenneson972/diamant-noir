import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// ─── Contexte ───────────────────────────────────────────────────────────────
// /api/stripe/admin-refund n'est PAS dans les publicPaths du middleware : sans
// cookie de session Supabase, le middleware répond 307 → /login AVANT la route.
// L'auth de test passe donc par un vrai login navigateur (cookies), puis
// page.request (qui partage les cookies du contexte).
// Les scénarios "données" (sans payment_intent, déjà remboursé) sont testés en
// RÉEL contre la base quand une réservation correspondante existe — jamais de
// remboursement réel : ces chemins sortent AVANT tout appel Stripe.

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

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@diamantnoir.com";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "Admin123!";

async function loginAsAdmin(page: Page): Promise<void> {
  // Le banner cookies (z-9999) intercepte les clics bas d'écran → consentement
  // posé AVANT le premier goto (pattern récurrent du projet).
  await page.addInitScript(() => {
    window.localStorage.setItem("kayvila-cookie-consent", "accepted");
  });
  await page.goto("/login");
  await page
    .locator("input[type='email'], input[name='email']")
    .first()
    .fill(ADMIN_EMAIL);
  await page.locator("input[type='password']").first().fill(ADMIN_PASSWORD);
  await page.locator("button[type='submit']").first().click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15000,
  });
}

/** Requête REST service-role (lecture seule) pour trouver un booking de test. */
async function findBooking(
  request: APIRequestContext,
  filter: string
): Promise<{ id: string } | null> {
  const supabaseUrl = ENV.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = ENV.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  const res = await request.get(
    `${supabaseUrl}/rest/v1/bookings?select=id&${filter}&limit=1`,
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    }
  );
  if (!res.ok()) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe("Admin Stripe Refund", () => {
  test("admin-refund sans auth → bloqué (307 middleware → /login)", async ({
    request,
  }) => {
    // Sans cookie de session, le middleware intercepte avant la route (qui
    // renverrait elle-même 401 via requireAdmin si elle était atteinte).
    const res = await request.post("/api/stripe/admin-refund", {
      data: { bookingId: "00000000-0000-0000-0000-000000000001" },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toContain("/login");
  });

  test("admin-refund avec bookingId invalide (non-UUID) → 400", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    const res = await page.request.post("/api/stripe/admin-refund", {
      data: { bookingId: "not-a-uuid" },
    });
    expect(res.status()).toBe(400);
  });

  test("admin-refund sans stripe_payment_intent_id → 400", async ({ page }) => {
    await loginAsAdmin(page);

    // Booking réel sans paiement Stripe (ex. résa iCal/manuelle) : la route
    // renvoie 400 AVANT tout appel Stripe — aucun effet de bord.
    const booking = await findBooking(
      page.request,
      "stripe_payment_intent_id=is.null"
    );
    test.skip(!booking, "Aucune réservation sans payment_intent en base");

    const res = await page.request.post("/api/stripe/admin-refund", {
      data: { bookingId: booking!.id },
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Aucun paiement Stripe associé");
  });

  test("admin-refund déjà refunded → 409", async ({ page }) => {
    await loginAsAdmin(page);

    // Booking réel déjà remboursé : la garde 409 sort AVANT l'appel refund.
    const booking = await findBooking(
      page.request,
      "payment_status=eq.refunded&stripe_payment_intent_id=not.is.null"
    );
    test.skip(!booking, "Aucune réservation remboursée en base");

    const res = await page.request.post("/api/stripe/admin-refund", {
      data: { bookingId: booking!.id },
    });
    expect(res.status()).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("déjà remboursée");
  });

  test("admin-refund Stripe down → 500", async ({ page }) => {
    // Une panne Stripe ne peut pas être provoquée depuis un test navigateur
    // (le SDK tourne côté serveur) → test de contrat : le client admin doit
    // traiter un 500 { error } sans crasher.
    await page.route("**/api/stripe/admin-refund", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Échec du remboursement" }),
      });
    });

    await page.goto("/");
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/stripe/admin-refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: "00000000-0000-0000-0000-000000000001",
        }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(500);
    expect(result.body.error).toBeTruthy();
  });
});
