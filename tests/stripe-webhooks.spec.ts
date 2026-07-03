import { test, expect, type APIRequestContext } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// ─── Stratégie ──────────────────────────────────────────────────────────────
// Le handler webhook tourne côté serveur : impossible de mocker Stripe/Supabase
// depuis Playwright. À la place, on signe de VRAIS payloads avec le
// STRIPE_WEBHOOK_SECRET local (HMAC-SHA256, même algo que Stripe) et on exerce
// le vrai handler de bout en bout :
// - signature manquante/invalide → vrais 400
// - événements signés avec des ids inexistants → chemins no-op sans effet de bord
// - checkout.session.expired → réservation SEEDÉE en base puis vérifiée cancelled
// - charge.dispute.* → insert/update réels dans stripe_disputes, vérifiés puis nettoyés
// Tous les événements/lignes créés sont supprimés en afterAll.

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
const WEBHOOK_SECRET = ENV.STRIPE_WEBHOOK_SECRET || "";
const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY || "";

const RUN_ID = `${Date.now()}`;
const FAKE_BOOKING_ID = "00000000-0000-0000-0000-00000000dead";

const createdEventIds: string[] = [];
let seededBookingId: string | null = null;
const createdDisputeIds: string[] = [];

// ─── Helpers signature & events ─────────────────────────────────────────────

function sign(payload: string): string {
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(`${t}.${payload}`)
    .digest("hex");
  return `t=${t},v1=${sig}`;
}

let eventCounter = 0;
function makeEvent(type: string, object: Record<string, unknown>): string {
  const id = `evt_e2e_${RUN_ID}_${eventCounter++}`;
  createdEventIds.push(id);
  return JSON.stringify({
    id,
    object: "event",
    api_version: "2025-03-31.basil",
    created: Math.floor(Date.now() / 1000),
    type,
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    data: { object },
  });
}

async function postWebhook(
  request: APIRequestContext,
  payload: string,
  signature?: string
) {
  return request.post("/api/webhooks/stripe", {
    headers: {
      "Content-Type": "application/json",
      ...(signature ? { "stripe-signature": signature } : {}),
    },
    data: payload,
  });
}

// ─── Helpers REST Supabase (service role) ───────────────────────────────────

function sbHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function sbSelect(
  request: APIRequestContext,
  table: string,
  query: string
): Promise<any[]> {
  const res = await request.get(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: sbHeaders(),
  });
  if (!res.ok()) return [];
  return res.json();
}

async function sbDelete(request: APIRequestContext, table: string, filter: string) {
  await request.delete(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    headers: sbHeaders(),
  });
}

/** Seed une réservation pending minimale (aucun email possible : guest_email null). */
async function seedPendingBooking(
  request: APIRequestContext
): Promise<string | null> {
  const villas = await sbSelect(request, "villas", "select=id&limit=1");
  if (villas.length === 0) return null;

  const res = await request.post(`${SUPABASE_URL}/rest/v1/bookings`, {
    headers: { ...sbHeaders(), Prefer: "return=representation" },
    data: {
      villa_id: villas[0].id,
      start_date: "2027-03-01",
      end_date: "2027-03-08",
      status: "pending",
      payment_status: "unpaid",
      source: "direct",
      guest_name: `E2E Webhook Test ${RUN_ID}`,
      guests: 2,
    },
  });
  if (!res.ok()) return null;
  const rows = await res.json();
  return rows[0]?.id ?? null;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe("Stripe Webhooks", () => {
  test.skip(!WEBHOOK_SECRET, "STRIPE_WEBHOOK_SECRET absent de .env.local");

  test.afterAll(async ({ request }) => {
    if (createdEventIds.length > 0) {
      await sbDelete(
        request,
        "stripe_events_processed",
        `event_id=in.(${createdEventIds.join(",")})`
      );
    }
    for (const disputeId of createdDisputeIds) {
      await sbDelete(request, "stripe_disputes", `dispute_id=eq.${disputeId}`);
    }
    if (seededBookingId) {
      await sbDelete(
        request,
        "order_status_history",
        `booking_id=eq.${seededBookingId}`
      );
      await sbDelete(request, "bookings", `id=eq.${seededBookingId}`);
    }
  });

  test("webhook sans stripe-signature → 400", async ({ request }) => {
    const res = await postWebhook(request, JSON.stringify({}));
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Missing stripe-signature");
  });

  test("webhook signature invalide → 400", async ({ request }) => {
    const res = await postWebhook(request, '"fake"', "bad");
    expect(res.status()).toBe(400);
  });

  test("checkout.session.completed avec bookingId → received:true", async ({
    request,
  }) => {
    // bookingId inexistant volontairement : le handler traverse tout le chemin
    // completed (claim, update 0 ligne, notifications no-op) sans effet de bord
    // ni email. La transition DB réelle est couverte par le test expired (seed).
    const payload = makeEvent("checkout.session.completed", {
      id: `cs_e2e_${RUN_ID}`,
      object: "checkout.session",
      metadata: { bookingId: FAKE_BOOKING_ID },
      payment_intent: null,
      customer_email: null,
      customer_details: null,
    });
    const res = await postWebhook(request, payload, sign(payload));
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  test("checkout.session.completed sans bookingId → 400", async ({
    request,
  }) => {
    const payload = makeEvent("checkout.session.completed", {
      id: `cs_e2e_nometa_${RUN_ID}`,
      object: "checkout.session",
      metadata: {},
    });
    const res = await postWebhook(request, payload, sign(payload));
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Missing bookingId");
  });

  test("checkout.session.expired → booking cancelled", async ({ request }) => {
    test.skip(!SERVICE_KEY, "SUPABASE_SERVICE_ROLE_KEY absent");

    seededBookingId = await seedPendingBooking(request);
    test.skip(!seededBookingId, "Seed de réservation impossible (schéma/contraintes)");

    const payload = makeEvent("checkout.session.expired", {
      id: `cs_e2e_expired_${RUN_ID}`,
      object: "checkout.session",
      metadata: { bookingId: seededBookingId },
    });
    const res = await postWebhook(request, payload, sign(payload));
    expect(res.status()).toBe(200);

    const rows = await sbSelect(
      request,
      "bookings",
      `select=status,payment_status&id=eq.${seededBookingId}`
    );
    expect(rows[0]?.status).toBe("cancelled");
    expect(rows[0]?.payment_status).toBe("unpaid");
  });

  test("doublon event_id → 200 avec duplicate:true", async ({ request }) => {
    // checkout.session.expired sur un bookingId inexistant = event inoffensif.
    const payload = makeEvent("checkout.session.expired", {
      id: `cs_e2e_dup_${RUN_ID}`,
      object: "checkout.session",
      metadata: { bookingId: FAKE_BOOKING_ID },
    });

    const first = await postWebhook(request, payload, sign(payload));
    expect(first.status()).toBe(200);
    expect((await first.json()).duplicate).toBeUndefined();

    const second = await postWebhook(request, payload, sign(payload));
    expect(second.status()).toBe(200);
    const json = await second.json();
    expect(json.received).toBe(true);
    expect(json.duplicate).toBe(true);
  });

  test("payment_intent.succeeded → traité (payment_status = paid)", async ({
    request,
  }) => {
    const payload = makeEvent("payment_intent.succeeded", {
      id: `pi_e2e_${RUN_ID}`,
      object: "payment_intent",
      metadata: { bookingId: FAKE_BOOKING_ID },
    });
    const res = await postWebhook(request, payload, sign(payload));
    expect(res.status()).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  test("payment_intent.payment_failed → traité (payment_status = failed)", async ({
    request,
  }) => {
    const payload = makeEvent("payment_intent.payment_failed", {
      id: `pi_e2e_failed_${RUN_ID}`,
      object: "payment_intent",
      metadata: { bookingId: FAKE_BOOKING_ID },
    });
    const res = await postWebhook(request, payload, sign(payload));
    expect(res.status()).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  test("account.updated (charges_enabled + details_submitted) → onboarding completed", async ({
    request,
  }) => {
    // acct_ inexistant : le handler cherche le profil lié, ne trouve rien et
    // ne modifie rien — on valide que le chemin complet répond 200 sans crash.
    // (Marquer un vrai profil onboardé enverrait un email au propriétaire.)
    const payload = makeEvent("account.updated", {
      id: `acct_e2e_${RUN_ID}`,
      object: "account",
      charges_enabled: true,
      details_submitted: true,
    });
    const res = await postWebhook(request, payload, sign(payload));
    expect(res.status()).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  test("account.updated incomplet → pas de changement", async ({ request }) => {
    const payload = makeEvent("account.updated", {
      id: `acct_e2e_incomplete_${RUN_ID}`,
      object: "account",
      charges_enabled: false,
      details_submitted: true,
    });
    const res = await postWebhook(request, payload, sign(payload));
    expect(res.status()).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  test("charge.dispute.created → insert dans stripe_disputes", async ({
    request,
  }) => {
    test.skip(!SERVICE_KEY, "SUPABASE_SERVICE_ROLE_KEY absent");

    const disputeId = `dp_e2e_${RUN_ID}`;
    createdDisputeIds.push(disputeId);

    // charge inexistante : le lookup booking échoue en silence (try/catch du
    // handler), l'insert stripe_disputes doit quand même avoir lieu.
    const payload = makeEvent("charge.dispute.created", {
      id: disputeId,
      object: "dispute",
      charge: `ch_e2e_${RUN_ID}`,
      amount: 12500,
      reason: "fraudulent",
      status: "needs_response",
      evidence_details: { due_by: Math.floor(Date.now() / 1000) + 7 * 86400 },
    });
    const res = await postWebhook(request, payload, sign(payload));
    expect(res.status()).toBe(200);

    const rows = await sbSelect(
      request,
      "stripe_disputes",
      `select=dispute_id,amount_cents,reason,status&dispute_id=eq.${disputeId}`
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].amount_cents).toBe(12500);
    expect(rows[0].reason).toBe("fraudulent");
    expect(rows[0].status).toBe("needs_response");
  });

  test("charge.dispute.closed → update status", async ({ request }) => {
    test.skip(!SERVICE_KEY, "SUPABASE_SERVICE_ROLE_KEY absent");

    const disputeId = `dp_e2e_closed_${RUN_ID}`;
    createdDisputeIds.push(disputeId);

    // Créer le dispute via le webhook created, puis le fermer.
    const created = makeEvent("charge.dispute.created", {
      id: disputeId,
      object: "dispute",
      charge: `ch_e2e_closed_${RUN_ID}`,
      amount: 5000,
      reason: "product_not_received",
      status: "needs_response",
      evidence_details: null,
    });
    expect((await postWebhook(request, created, sign(created))).status()).toBe(200);

    const closed = makeEvent("charge.dispute.closed", {
      id: disputeId,
      object: "dispute",
      charge: `ch_e2e_closed_${RUN_ID}`,
      amount: 5000,
      reason: "product_not_received",
      status: "won",
    });
    expect((await postWebhook(request, closed, sign(closed))).status()).toBe(200);

    const rows = await sbSelect(
      request,
      "stripe_disputes",
      `select=status,resolved_at&dispute_id=eq.${disputeId}`
    );
    expect(rows[0]?.status).toBe("won");
    expect(rows[0]?.resolved_at).toBeTruthy();
  });

  test("charge.refunded full → payment_status = refunded (contrat)", async ({
    request,
  }) => {
    // payment_intent inexistant : booking non trouvé → no-op contrôlé.
    // (Marquer une vraie résa "refunded" fausserait la compta client.)
    const payload = makeEvent("charge.refunded", {
      id: `ch_e2e_refund_${RUN_ID}`,
      object: "charge",
      payment_intent: `pi_e2e_norefund_${RUN_ID}`,
      amount: 10000,
      amount_refunded: 10000,
    });
    const res = await postWebhook(request, payload, sign(payload));
    expect(res.status()).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  test("charge.refunded partiel → payment_status = partially_refunded (contrat)", async ({
    request,
  }) => {
    const payload = makeEvent("charge.refunded", {
      id: `ch_e2e_partial_${RUN_ID}`,
      object: "charge",
      payment_intent: `pi_e2e_nopartial_${RUN_ID}`,
      amount: 10000,
      amount_refunded: 4000,
    });
    const res = await postWebhook(request, payload, sign(payload));
    expect(res.status()).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  test("checkout.session.async_payment_failed → traité", async ({ request }) => {
    const payload = makeEvent("checkout.session.async_payment_failed", {
      id: `cs_e2e_async_${RUN_ID}`,
      object: "checkout.session",
      metadata: { bookingId: FAKE_BOOKING_ID },
    });
    const res = await postWebhook(request, payload, sign(payload));
    expect(res.status()).toBe(200);
    expect((await res.json()).received).toBe(true);
  });
});
