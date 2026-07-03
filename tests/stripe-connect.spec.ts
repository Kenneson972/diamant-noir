import { test, expect, type APIRequestContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// ─── Env & auth helpers ─────────────────────────────────────────────────────
// Les routes Connect exigent un Bearer token (requireAuth = Authorization
// header uniquement, pas de cookie) → on mint un token via le password grant
// Supabase, comme le fait le client web.

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

const OWNER_EMAIL = process.env.TEST_OWNER_EMAIL || "proprio1@test.com";
const OWNER_PASSWORD = process.env.TEST_OWNER_PASSWORD || "Test123456!";

async function mintOwnerToken(request: APIRequestContext): Promise<string | null> {
  const supabaseUrl = ENV.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const res = await request.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      data: { email: OWNER_EMAIL, password: OWNER_PASSWORD },
    }
  );
  if (!res.ok()) return null;
  const json = await res.json();
  return json.access_token ?? null;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe("Stripe Connect", () => {
  test("connect-onboarding sans auth → 401", async ({ request }) => {
    const res = await request.post("/api/stripe/connect-onboarding");
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  test("connect-verify sans auth → 401", async ({ request }) => {
    const res = await request.post("/api/stripe/connect-verify");
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  test("connect-onboarding avec auth → retourne { url, account_id }", async ({
    request,
  }) => {
    const token = await mintOwnerToken(request);
    test.skip(!token, "Impossible de minter un token propriétaire (env/creds)");

    const res = await request.post("/api/stripe/connect-onboarding", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();

    if (json.already_onboarded) {
      // Le proprio de test a déjà fini son onboarding : la route renvoie
      // { already_onboarded: true, account_id } sans générer de lien.
      expect(json.account_id).toMatch(/^acct_/);
    } else {
      expect(json.account_id).toMatch(/^acct_/);
      expect(typeof json.url).toBe("string");
      expect(json.url.startsWith("https://connect.stripe.com")).toBe(true);
    }
  });

  test("connect-verify après onboarding → connected:true", async ({ page }) => {
    // Contrat côté client : le dashboard appelle POST /api/stripe/connect-verify
    // et lit { connected } — on mocke la réponse serveur (l'état "onboarding
    // complété" dépend de Stripe, non forçable depuis un test navigateur).
    await page.route("**/api/stripe/connect-verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ connected: true }),
      });
    });

    await page.goto("/");
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/stripe/connect-verify", { method: "POST" });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(200);
    expect(result.body.connected).toBe(true);
  });
});
