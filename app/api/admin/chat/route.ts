import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdminChatAllowedUser } from "@/lib/admin-chat-allowlist";

export const runtime = "nodejs";

function getBearer(request: Request): string | null {
  const h = request.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

export async function POST(request: Request) {
  try {
    const token = getBearer(request);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized — Bearer requis (équipe / gérant uniquement)" },
        { status: 401 }
      );
    }

    const admin = supabaseAdmin();
    const { data: userData, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminChatAllowedUser(userData.user)) {
      return NextResponse.json(
        {
          error:
            "Forbidden — réservé à l'équipe. Les propriétaires utilisent le copilot espace propriétaire.",
        },
        { status: 403 }
      );
    }

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
        supabase.from("villas").select("*"),
        supabase
          .from("bookings")
          .select("*")
          .order("start_date", { ascending: true }),
        supabase.from("tasks").select("*"),
        supabase
          .from("villa_submissions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("ota_sync_logs")
          .select("*")
          .order("synced_at", { ascending: false })
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
        .reduce((s: number, b) => s + (Number(b.price) || 0), 0),
    }));

    // ─── CONTEXTE COMPLET ────────────────────────────────────────────────────
    const contextData = {
      current_date: today.toISOString(),
      today_str: todayStr,

      // Villas
      villas,
      villas_summary: {
        total: villas.length,
        published: villas.filter((v) => v.is_published).length,
        draft: villas.filter((v) => !v.is_published).length,
      },

      // Réservations
      bookings,
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
          .reduce((s: number, b) => s + (Number(b.price) || 0), 0),
        revenue_this_month: bookings
          .filter(
            (b) =>
              b.payment_status === "paid" &&
              new Date(b.created_at) >= startOfMonth
          )
          .reduce((s: number, b) => s + (Number(b.price) || 0), 0),
        revenue_last_month: bookings
          .filter(
            (b) =>
              b.payment_status === "paid" &&
              new Date(b.created_at) >= startOfLastMonth &&
              new Date(b.created_at) <= endOfLastMonth
          )
          .reduce((s: number, b) => s + (Number(b.price) || 0), 0),
        pending_payments: bookings.filter(
          (b) => b.payment_status !== "paid" && b.status === "confirmed"
        ).length,
        revenue_by_villa: villas.map((v) => ({
          villa_name: v.name,
          revenue: bookings
            .filter((b) => b.villa_id === v.id && b.payment_status === "paid")
            .reduce((s: number, b) => s + (Number(b.price) || 0), 0),
          bookings_count: bookings.filter((b) => b.villa_id === v.id).length,
        })),
        monthly_revenue: monthlyRevenue,
      },

      // Tâches
      tasks,
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

      // Soumissions propriétaires
      submissions,
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
        last_sync: otaLogs[0]?.synced_at || null,
        recent_errors: otaLogs
          .filter((l) => l.error)
          .slice(0, 5)
          .map((l) => ({
            villa_id: l.villa_id,
            source: l.source,
            error: l.error,
            synced_at: l.synced_at,
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
      // Mode démo sans webhook
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
      });
    }

    const webhookRes = await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message.trim(),
        sessionid,
        history: history || [],
        role: "admin",
        context: contextData,
        source: "admin_dashboard",
      }),
    });

    if (!webhookRes.ok) throw new Error(`Webhook error: ${webhookRes.status}`);

    const data = await webhookRes.json();

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
    console.error("Admin Chat Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
