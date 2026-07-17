import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase";
import { updateSubmissionStatus } from "@/lib/submissions/update-status";
import { buildAdminAgentPayload } from "@/lib/admin-assistant-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Contexte désormais construit en process (plus d'aller-retour n8n → kayvila.com/api/agent/admin-context) — marge réduite
export const maxDuration = 25;

const READ_ACTIONS = new Set(["SHOW_STATS", "SHOW_BOOKING"]);
const WRITE_ACTIONS = new Set(["SET_PRICE", "BLOCK_DATE", "UPDATE_SUBMISSION_STATUS"]);

type ActionData = Record<string, unknown>;

async function execAction(
  adminId: string,
  action: string,
  actionData: ActionData,
): Promise<{ success: boolean; [key: string]: unknown }> {
  const admin = supabaseAdmin();
  let result: { success: boolean; [key: string]: unknown };

  if (action === "SET_PRICE") {
    const pd = (actionData.price ?? {}) as { villa_id?: string; price_per_night?: number };
    if (!pd.villa_id || typeof pd.price_per_night !== "number" || pd.price_per_night <= 0) {
      result = { success: false, error: "Villa ou prix invalide" };
    } else {
      const { data: before } = await admin.from("villas").select("name, price_per_night").eq("id", pd.villa_id).maybeSingle();
      const { data: updated, error } = await admin.from("villas").update({ price_per_night: pd.price_per_night }).eq("id", pd.villa_id).select("id, name, price_per_night").single();
      result = { success: !error, villa: updated, previous_price: before?.price_per_night ?? null, error: error?.message };
    }
  } else if (action === "BLOCK_DATE") {
    const b = (actionData.block ?? {}) as { villa_id?: string; start_date?: string; end_date?: string; reason?: string };
    if (!b.villa_id || !b.start_date || !b.end_date) {
      result = { success: false, error: "Villa ou dates invalides" };
    } else {
      const { data: created, error } = await admin.from("villa_date_blocks").insert({ villa_id: b.villa_id, start_date: b.start_date, end_date: b.end_date, reason: b.reason || "Blocage via Concierge Admin", origin: "Kayvila", created_by: adminId }).select("id").single();
      result = { success: !error, block_id: created?.id, error: error?.message };
    }
  } else if (action === "UPDATE_SUBMISSION_STATUS") {
    const s = (actionData.submission ?? {}) as { submission_id?: string; status?: "accepted" | "rejected"; reason?: string };
    if (!s.submission_id || (s.status !== "accepted" && s.status !== "rejected")) {
      result = { success: false, error: "Soumission ou statut invalide" };
    } else {
      const { submission, error } = await updateSubmissionStatus(admin, { id: s.submission_id, status: s.status, reason: s.reason });
      result = { success: !error, submission, error };
    }
  } else {
    result = { success: false, error: "Action inconnue" };
  }

  const { error: logError } = await admin.from("admin_action_log").insert({ admin_id: adminId, action, action_data: actionData, result });
  if (logError) console.error("[concierge-admin] audit log insert failed", logError);
  return result;
}

export async function POST(request: Request) {
  try {
    const adminId = await requireAdmin(request);
    const body = await request.json().catch(() => ({}));

    // ── Flux confirmation : exécuter une action déjà proposée ──
    if (body.confirm_action?.action) {
      const { action, action_data } = body.confirm_action as { action: string; action_data: ActionData };
      if (!WRITE_ACTIONS.has(action)) {
        return NextResponse.json({ error: "Action non confirmable" }, { status: 400 });
      }
      const action_result = await execAction(adminId, action, action_data ?? {});
      return NextResponse.json({ action_result });
    }

    // ── Flux normal : message → n8n ──
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return NextResponse.json({ error: "Message requis" }, { status: 400 });

    const webhookURL = process.env.N8N_ADMIN_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
    if (!webhookURL) {
      return NextResponse.json({ response: "Mode démo : configurez N8N_ADMIN_WEBHOOK_URL.", request_id: "demo" });
    }

    // Contexte + analytics + prompt système construits en process (admin déjà
    // authentifié via requireAdmin ci-dessus — au lieu d'un aller-retour n8n → kayvila.com)
    const agentPayload = await buildAdminAgentPayload(supabaseAdmin());

    // Secret partagé — le workflow n8n rejette (401) toute requête sans ce header,
    // sinon l'URL du webhook suffirait à interroger les données plateforme
    const n8nHeaders: Record<string, string> = { "Content-Type": "application/json" };
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
    if (webhookSecret) n8nHeaders["X-Webhook-Secret"] = webhookSecret;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 22_000);
    try {
      const res = await fetch(webhookURL, {
        method: "POST",
        headers: n8nHeaders,
        body: JSON.stringify({ message, ...agentPayload }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`n8n ${res.status}`);
      const data = await res.json();

      const reply =
        (typeof data.response === "string" && data.response) ||
        (typeof data.reply === "string" && data.reply) ||
        (typeof data.output === "string" && data.output) ||
        "Je n'ai pas pu générer de réponse.";
      const action = typeof data.action === "string" ? data.action : "SHOW_STATS";
      const actionData = (data.action_data ?? {}) as ActionData;

      if (WRITE_ACTIONS.has(action)) {
        // Ne pas exécuter — proposer pour confirmation
        return NextResponse.json({ response: reply, proposed_action: { action, action_data: actionData } });
      }
      if (action === "SHOW_BOOKING") {
        const admin = supabaseAdmin();
        const today = new Date().toISOString().split("T")[0];
        const villaId = ((actionData.booking ?? {}) as { villa_id?: string }).villa_id;
        let q = admin.from("bookings").select("id, guest_name, villa_id, start_date, end_date, status, total_price_cents").or(`start_date.gte.${today},and(start_date.lte.${today},end_date.gte.${today})`).order("start_date", { ascending: true }).limit(20);
        if (villaId) q = q.eq("villa_id", villaId);
        const { data: bookingsData } = await q;
        const list = bookingsData ?? [];
        return NextResponse.json({
          response: reply,
          action,
          action_result: { success: true, bookings: list, booking: list[0] ?? null },
        });
      }
      // SHOW_STATS / défaut
      return NextResponse.json({ response: reply, action, request_id: data.request_id ?? "n8n" });
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.error("[concierge-admin] n8n error", fetchErr);
      return NextResponse.json({ response: "Désolé, problème technique. Réessayez.", request_id: "fallback" });
    }
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    console.error("[concierge-admin] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
