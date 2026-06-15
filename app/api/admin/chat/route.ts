import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getBookingPriceCents } from "@/lib/utils";
import { requireAdmin, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Rate limiter ──────────────────────────────────────────────────────────────
const _rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = _rateMap.get(userId);
  if (!entry || now > entry.resetAt) {
    _rateMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    const userId = await requireAdmin(request);

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans une minute." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const admin = supabaseAdmin();
    const request_id = crypto.randomUUID();

    const body = await request.json();
    const { message, sessionid, history } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    const supabase = admin;

    // ─── CONTEXT GATHERING ───────────────────────────────────────────────────
    // Tout en parallèle pour éviter les waterfalls

    const [villasRes, bookingsRes, tasksRes, submissionsRes, otaLogsRes] =
      await Promise.all([
        supabase
          .from("villas")
          .select(
            "id, name, is_published, price_per_night, capacity, location, owner_id"
          ),
        supabase
          .from("bookings")
          .select(
            "id, villa_id, start_date, end_date, status, payment_status, guest_name, price, total_price_cents, created_at"
          )
          .order("start_date", { ascending: true })
          .limit(200),
        supabase
          .from("tasks")
          .select("id, villa_id, title, status, due_date, type")
          .limit(100),
        supabase
          .from("villa_submissions")
          .select("id, status, owner_name, villa_name, created_at, has_photos")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("ota_sync_logs")
          .select("id, villa_id, source, error, inserted, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

    const villas = villasRes.data || [];
    const bookings = bookingsRes.data || [];
    const tasks = tasksRes.data || [];
    const submissions = submissionsRes.data || [];
    const otaLogs = otaLogsRes.data || [];

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const in48h = new Date(Date.now() + 48 * 3_600_000);
    const in7d = new Date(Date.now() + 7 * 24 * 3_600_000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Revenus des 6 derniers mois
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      };
    }).reverse();

    const monthlyRevenue = last6Months.map((m) => ({
      month: m.label,
      revenue: bookings
        .filter(
          (b) =>
            b.payment_status === "paid" &&
            (b.created_at as string)?.startsWith(m.key)
        )
        .reduce((s: number, b) => s + (getBookingPriceCents(b) / 100), 0),
    }));

    // ─── CONTEXTE COMPLET ────────────────────────────────────────────────────
    const contextData = {
      current_date: today.toISOString(),
      today_str: todayStr,

      villas_summary: {
        total: villas.length,
        published: villas.filter((v) => v.is_published).length,
        draft: villas.filter((v) => !v.is_published).length,
      },

      bookings_summary: {
        total: bookings.length,
        confirmed: bookings.filter((b) => b.status === "confirmed").length,
        pending: bookings.filter((b) => b.status === "pending").length,
        checkins_today: bookings.filter((b) => b.start_date === todayStr).length,
        checkins_48h: bookings.filter(
          (b) =>
            new Date(b.start_date) <= in48h && new Date(b.start_date) >= today
        ).length,
        checkins_7d: bookings.filter(
          (b) => new Date(b.start_date) <= in7d && new Date(b.start_date) >= today
        ).length,
        checkouts_today: bookings.filter((b) => b.end_date === todayStr).length,
      },

      // Finances
      finances: {
        revenue_total: bookings
          .filter((b) => b.payment_status === "paid")
          .reduce((s: number, b) => s + (getBookingPriceCents(b) / 100), 0),
        revenue_this_month: bookings
          .filter(
            (b) =>
              b.payment_status === "paid" &&
              new Date(b.created_at) >= startOfMonth
          )
          .reduce((s: number, b) => s + (getBookingPriceCents(b) / 100), 0),
        revenue_last_month: bookings
          .filter(
            (b) =>
              b.payment_status === "paid" &&
              new Date(b.created_at) >= startOfLastMonth &&
              new Date(b.created_at) <= endOfLastMonth
          )
          .reduce((s: number, b) => s + (getBookingPriceCents(b) / 100), 0),
        pending_payments: bookings.filter(
          (b) => b.payment_status !== "paid" && b.status === "confirmed"
        ).length,
        revenue_by_villa: villas.map((v) => ({
          villa_name: v.name,
          revenue: bookings
            .filter((b) => b.villa_id === v.id && b.payment_status === "paid")
            .reduce((s: number, b) => s + (getBookingPriceCents(b) / 100), 0),
          bookings_count: bookings.filter((b) => b.villa_id === v.id).length,
        })),
        monthly_revenue: monthlyRevenue,
      },

      tasks_summary: {
        total: tasks.length,
        overdue: tasks.filter(
          (t) =>
            t.status !== "done" && t.due_date && new Date(t.due_date) < today
        ).length,
        due_today: tasks.filter(
          (t) => t.status !== "done" && t.due_date === todayStr
        ).length,
        pending: tasks.filter((t) => t.status === "pending").length,
        in_progress: tasks.filter((t) => t.status === "in_progress").length,
      },

      submissions_summary: {
        total: submissions.length,
        received: submissions.filter((s) => s.status === "received").length,
        in_progress: submissions.filter((s) =>
          ["examining", "visit", "contract"].includes(s.status)
        ).length,
        approved: submissions.filter((s) => s.status === "approved").length,
        needs_photos: submissions.filter((s) => s.has_photos === false).length,
      },

      // Santé OTA
      ota_health: {
        last_sync: otaLogs[0]?.created_at || null,
        recent_errors: otaLogs
          .filter((l) => l.error)
          .slice(0, 5)
          .map((l) => ({
            villa_id: l.villa_id,
            source: l.source,
            error: l.error,
            synced_at: l.created_at,
          })),
        total_imported_last_sync: otaLogs
          .filter((l) => !l.error)
          .slice(0, 10)
          .reduce((s: number, l) => s + (l.inserted || 0), 0),
        channels_with_errors: [
          ...new Set(otaLogs.filter((l) => l.error).map((l) => l.source)),
        ],
      },
    };

    // ─── WEBHOOK n8n ─────────────────────────────────────────────────────────
    const webhookURL =
      process.env.N8N_ADMIN_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

    if (!webhookURL) {
      return NextResponse.json({
        success: true,
        response: `[MODE DÉMO] ${villas.length} villas · ${tasks.length} tâches · ${bookings.filter((b) => b.start_date === todayStr).length} check-ins aujourd'hui.`,
        action: "SHOW_STATS",
        action_data: contextData,
        suggested_prompts: [
          "Quel est mon taux d'occupation ce mois ?",
          "Quels check-ins sont prévus cette semaine ?",
          "Y a-t-il des tâches en retard ?",
        ],
        request_id,
      });
    }

    // ── Appel n8n avec timeout + fallback ──
    let webhookRes: Response;
    try {
      webhookRes = await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          sessionid,
          history: history || [],
          role: "admin",
          request_id,
          context: contextData,
          source: "admin_dashboard",
        }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch (fetchErr) {
      console.error("[admin-chat] webhook fetch error", fetchErr);
      return NextResponse.json({
        success: true,
        response: `[Fallback] Mon analyse est temporairement indisponible.\n\nVoici votre snapshot : ${villas.length} villas, ${bookings.filter((b) => b.start_date === todayStr).length} check-ins aujourd'hui, ${tasks.filter((t) => t.status !== "done" && t.due_date && new Date(t.due_date) < today).length} tâches en retard.`,
        action: "SHOW_STATS",
        action_data: contextData,
        suggested_prompts: [
          "Quel est mon taux d'occupation ce mois ?",
          "Y a-t-il des tâches en retard ?",
        ],
        request_id,
        metadata: { source: "local", reason: "n8n_unreachable" },
      });
    }

    if (!webhookRes.ok) {
      console.error("[admin-chat] webhook status", webhookRes.status);
      return NextResponse.json({
        success: true,
        response: `[Fallback] n8n a rencontré une erreur (${webhookRes.status}).\n\nVoici votre snapshot : ${villas.length} villas, ${bookings.filter((b) => b.start_date === todayStr).length} check-ins aujourd'hui.`,
        action: "SHOW_STATS",
        action_data: contextData,
        suggested_prompts: [
          "Quel est mon taux d'occupation ce mois ?",
        ],
        request_id,
        metadata: { source: "local", reason: `n8n_status_${webhookRes.status}` },
      });
    }

    const data = await webhookRes.json().catch(() => ({}));

    // ─── ACTION HANDLERS (l'IA qui agit) ─────────────────────────────────────
    const action = data.action || null;
    const actionData = data.action_data || {};
    let actionResult = null;

    if (action === "CREATE_TASK" && actionData.task) {
      const { error } = await supabase.from("tasks").insert({
        villa_id: actionData.task.villa_id,
        title: actionData.task.title,
        type: actionData.task.type || "other",
        status: "todo",
        due_date: actionData.task.due_date || null,
        assigned_to: actionData.task.assigned_to || null,
      });
      actionResult = { success: !error, error: error?.message };
    }

    if (action === "UPDATE_TASK_STATUS" && actionData.task_id) {
      const { error } = await supabase
        .from("tasks")
        .update({ status: actionData.status })
        .eq("id", actionData.task_id);
      actionResult = { success: !error };
    }

    if (action === "UPDATE_SUBMISSION_STATUS" && actionData.submission_id) {
      const { error } = await supabase
        .from("villa_submissions")
        .update({ status: actionData.status })
        .eq("id", actionData.submission_id);
      actionResult = { success: !error };
    }

    // Sauvegarder l'échange en base si la table existe
    try {
      await supabase.from("admin_chat_logs").insert([
        { role: "user", content: message.trim(), session_id: sessionid },
        {
          role: "assistant",
          content: data.response || "",
          session_id: sessionid,
          action,
        },
      ]);
    } catch {
      // Table peut ne pas encore exister — non bloquant
    }

    return NextResponse.json({
      success: true,
      response:
        data.response ||
        (typeof data === "string" ? data : JSON.stringify(data)),
      action,
      action_data: { ...actionData, context: contextData },
      action_result: actionResult,
      suggested_prompts: data.suggested_prompts || [],
      strategic_alert: data.strategic_alert || null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Admin Chat Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
