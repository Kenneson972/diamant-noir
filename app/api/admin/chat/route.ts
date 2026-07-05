import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getBookingPriceCents } from "@/lib/utils";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { requiresConfirmation, buildConfirmationPrompt } from "@/lib/admin-confirm";
import {
  computeOccupancyByVilla, computeHealthScores, computeAdminAlerts, buildDailyBriefing, computeAdminInsights,
  type AdminAnalyticsInput,
} from "@/lib/admin-assistant-context";
import { getSupabaseServer } from "@/lib/supabase-server";
import { buildAdminFallbackReply, parseAdminCommand, type AdminFallbackContext } from "@/lib/admin-chat-fallback";
import { logChatbotFeedback } from "@/lib/chatbot/feedback";

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


// ─── DATA GATHERING HELPER ────────────────────────────────────────────────────

/** Ajoute n jours à une date string UTC YYYY-MM-DD. */
function addDays(d: string, n: number): string {
  return new Date(Date.parse(d + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);
}

async function gatherAdminContext(supabase: ReturnType<typeof supabaseAdmin>) {
  // Tous les calculs en string UTC — cohérent avec todayStr et les colonnes date/timestamptz
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTs = Date.parse(todayStr + "T00:00:00Z");
  const today = new Date(todayTs);
  const in48h = new Date(todayTs + 48 * 3_600_000);
  const in7d = new Date(todayTs + 7 * 24 * 3_600_000);

  // startOfMonth = YYYY-MM-01 (UTC)
  const startOfMonthStr = todayStr.slice(0, 8) + "01";
  // startOfLastMonth = mois précédent, jour 01
  const [y, m] = todayStr.split("-").map(Number);
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  const startOfLastMonthStr = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
  // endOfLastMonth = startOfMonthStr - 1 jour
  const endOfLastMonthStr = addDays(startOfMonthStr, -1);

  const [villasRes, bookingsRes, tasksRes, submissionsRes, otaLogsRes, blocksRes, reviewsRes] =
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
      supabase
        .from("villa_date_blocks")
        .select("villa_id, start_date, end_date"),
      supabase
        .from("reviews")
        .select("villa_id, rating, status"),
    ]);

  const villas = villasRes.data || [];
  const bookings = bookingsRes.data || [];
  const tasks = tasksRes.data || [];
  const submissions = submissionsRes.data || [];
  const otaLogs = otaLogsRes.data || [];
  const blocks = blocksRes.data || [];
  const reviews = reviewsRes.data || [];

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

  // Revenue maps pour AdminAnalyticsInput
  const revenueByVilla: Record<string, number> = {};
  const revenueLastMonthByVilla: Record<string, number> = {};
  for (const v of villas) {
    revenueByVilla[String(v.id)] = bookings
      .filter(
        (b) =>
          b.villa_id === v.id &&
          b.payment_status === "paid" &&
          (b.created_at as string).slice(0, 10) >= startOfMonthStr
      )
      .reduce((s: number, b) => s + getBookingPriceCents(b) / 100, 0);
    revenueLastMonthByVilla[String(v.id)] = bookings
      .filter(
        (b) =>
          b.villa_id === v.id &&
          b.payment_status === "paid" &&
          (b.created_at as string).slice(0, 10) >= startOfLastMonthStr &&
          (b.created_at as string).slice(0, 10) <= endOfLastMonthStr
      )
      .reduce((s: number, b) => s + getBookingPriceCents(b) / 100, 0);
  }

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
          b.start_date >= todayStr && b.start_date <= addDays(todayStr, 2)
      ).length,
      checkins_7d: bookings.filter(
        (b) => b.start_date >= todayStr && b.start_date <= addDays(todayStr, 7)
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
            (b.created_at as string).slice(0, 10) >= startOfMonthStr
        )
        .reduce((s: number, b) => s + (getBookingPriceCents(b) / 100), 0),
      revenue_last_month: bookings
        .filter(
          (b) =>
            b.payment_status === "paid" &&
            (b.created_at as string).slice(0, 10) >= startOfLastMonthStr &&
            (b.created_at as string).slice(0, 10) <= endOfLastMonthStr
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
          t.status !== "done" && t.due_date && t.due_date < todayStr
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

  return {
    contextData,
    villas,
    bookings,
    tasks,
    submissions,
    otaLogs,
    blocks,
    reviews,
    revenueByVilla,
    revenueLastMonthByVilla,
    today,
    todayStr,
  };
}

export async function POST(request: Request) {
  try {
    const userId = await requireAdmin(request);

    // Token Supabase pour l'auth du bot n8n (Fetch Admin Context) — P0 audit :
    // sans lui, le workflow reçoit Bearer vide → 401 → jamais de LLM.
    let n8nToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (!n8nToken) {
      try {
        const supaSrv = await getSupabaseServer();
        const { data: { session } } = await supaSrv.auth.getSession();
        n8nToken = session?.access_token ?? "";
      } catch { /* cookie session absente — on envoie vide, le bot répondra 401 */ }
    }

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
    const { contextData, villas, bookings, tasks, submissions, otaLogs, today, todayStr } =
      await gatherAdminContext(supabase);

    // ── Analytics + insights pour fallback/démo (fonctions pures) ────────────
    const profilesRes = await supabase
      .from("profiles")
      .select("id, full_name, role, stripe_connect_onboarding_completed")
      .limit(200);
    const profiles = profilesRes.data ?? [];

    const villasFullRes = await supabase
      .from("villas")
      .select("id, name, is_published, image_url, image_urls")
      .limit(200);
    const villasFull = villasFullRes.data ?? [];

    const analyticsInput = {
      today: todayStr,
      villas: villas.map((v: any) => ({ id: String(v.id), name: String(v.name ?? "Villa") })),
      bookings: bookings.map((b: any) => ({
        villa_id: String(b.villa_id), start_date: String(b.start_date), end_date: String(b.end_date),
        status: String(b.status ?? ""), payment_status: String(b.payment_status ?? ""),
      })),
      blocks: [],
      tasks: tasks.map((t: any) => ({ id: String(t.id), villa_id: String(t.villa_id), status: String(t.status ?? ""), due_date: t.due_date ?? null })),
      reviews: [],
      submissions: submissions.map((s: any) => ({ id: String(s.id), status: String(s.status ?? ""), created_at: String(s.created_at), owner_name: s.owner_name, villa_name: s.villa_name })),
      revenueByVilla: {},
      revenueLastMonthByVilla: {},
    };

    const insights = computeAdminInsights({
      revenue_this_month: (contextData.finances as any).revenue_this_month ?? 0,
      revenue_last_month: (contextData.finances as any).revenue_last_month ?? 0,
      villas: villasFull.map((v: any) => ({
        id: String(v.id), name: String(v.name ?? "Villa"),
        is_published: !!v.is_published,
        has_photo: !!v.image_url || (Array.isArray(v.image_urls) && v.image_urls.length > 0),
      })),
      owners: profiles
        .filter((p: any) => ["owner", "proprietaire", "proprio"].includes(String(p.role)))
        .map((p: any) => ({ id: String(p.id), full_name: p.full_name ?? null, connect_completed: !!p.stripe_connect_onboarding_completed })),
      overdue_tasks: (contextData.tasks_summary as any).overdue ?? 0,
      submissions_received: (contextData.submissions_summary as any).received ?? 0,
      ota_channels_with_errors: ((contextData.ota_health as any).channels_with_errors as string[]) ?? [],
    });

    // Insights envoyés aussi à n8n via contextData
    (contextData as any).insights = insights;

    const villaNames: Record<string, string> = Object.fromEntries(
      villas.map((v: any) => [String(v.id), String(v.name ?? "Villa")])
    );

    const fallbackCtx: AdminFallbackContext = {
      contextData,
      occupancy: computeOccupancyByVilla(analyticsInput),
      villaNames,
      alerts: computeAdminAlerts(analyticsInput).map((a) => ({ severity: a.severity, label: a.label })),
      briefing: buildDailyBriefing(analyticsInput),
      insights,
      checkins7d: bookings
        .filter((b: any) => b.start_date >= todayStr && b.start_date <= addDays(todayStr, 7) && b.status !== "cancelled")
        .map((b: any) => ({
          guest_name: b.guest_name ?? null,
          villa_name: villaNames[String(b.villa_id)] ?? "Villa",
          start_date: String(b.start_date),
        })),
    };

    // Réponse locale unifiée (mode démo ET panne n8n) — actions locales incluses
    async function localReply(reason: string) {
      const cmd = parseAdminCommand(message.trim(), todayStr);
      if (cmd?.type === "create_task") {
        const { data: created, error } = await supabase.from("tasks").insert({
          title: cmd.title, type: "other", status: "pending", due_date: cmd.dueDate,
        }).select("id").single();
        return NextResponse.json({
          success: true,
          response: error
            ? `Impossible de créer la tâche : ${error.message}`
            : `Tâche créée : « ${cmd.title} »${cmd.dueDate ? ` (échéance ${cmd.dueDate})` : ""} — #${created?.id}`,
          action: "SHOW_TASKS", action_data: contextData,
          suggested_prompts: ["Mes tâches en retard ?", "Briefing du jour ?"],
          request_id, metadata: { source: "local", reason },
        });
      }
      if (cmd?.type === "complete_task") {
        const { error, count } = await supabase.from("tasks")
          .update({ status: "done", completed_at: new Date().toISOString() }, { count: "exact" })
          .eq("id", cmd.taskRef);
        return NextResponse.json({
          success: true,
          response: error || !count
            ? `Tâche #${cmd.taskRef} introuvable ou non modifiable.`
            : `Tâche #${cmd.taskRef} marquée comme faite.`,
          action: "SHOW_TASKS", action_data: contextData,
          suggested_prompts: ["Tâches restantes ?", "Briefing du jour ?"],
          request_id, metadata: { source: "local", reason },
        });
      }
      if (cmd?.type === "note_client") {
        const { error } = await supabase.from("tasks").insert({
          title: `Note — ${cmd.client} : ${cmd.note}`.slice(0, 200),
          type: "other", status: "pending",
        });
        return NextResponse.json({
          success: true,
          response: error
            ? `Impossible d'enregistrer la note : ${error.message}`
            : `Note enregistrée sur ${cmd.client} (visible dans les tâches).`,
          action: "SHOW_TASKS", action_data: contextData,
          suggested_prompts: ["Voir les tâches ?"],
          request_id, metadata: { source: "local", reason },
        });
      }

      const local = buildAdminFallbackReply(message.trim(), fallbackCtx);
      void logChatbotFeedback({
        agent: "admin", sessionId: sessionid ?? null,
        question: message.trim(), matched: local.matchedFaqId !== null,
      });
      return NextResponse.json({
        success: true,
        response: local.text,
        action: local.action, action_data: contextData,
        suggested_prompts: local.suggestions,
        request_id, metadata: { source: "local", reason },
      });
    }

    // ─── WEBHOOK n8n ─────────────────────────────────────────────────────────
    const webhookURL =
      process.env.N8N_ADMIN_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

    if (!webhookURL) return localReply("no_webhook");

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
          token: n8nToken,
        }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch (fetchErr) {
      console.error("[admin-chat] webhook fetch error", fetchErr);
      return localReply("n8n_unreachable");
    }

    if (!webhookRes.ok) {
      console.error("[admin-chat] webhook status", webhookRes.status);
      return localReply(`n8n_status_${webhookRes.status}`);
    }

    const data = await webhookRes.json().catch(() => ({}));

    // ─── ACTION HANDLERS (l'IA qui agit) ─────────────────────────────────────
    const action = data.action || null;
    const actionData = data.action_data || {};
    let actionResult = null;

    // Garde-fou : actions destructives → confirmation explicite obligatoire
    if (action && requiresConfirmation(action, actionData)) {
      return NextResponse.json({
        success: true,
        response: data.response || buildConfirmationPrompt(action, actionData),
        action,
        action_data: { ...actionData, context: contextData },
        requires_confirmation: true,
        confirmation_prompt: buildConfirmationPrompt(action, actionData),
        suggested_prompts: ["Oui, confirmer", "Annuler"],
      });
    }

    if (action === "CREATE_TASK" && actionData.task) {
      const { error } = await supabase.from("tasks").insert({
        villa_id: actionData.task.villa_id,
        title: actionData.task.title,
        type: actionData.task.type || "other",
        status: "pending",
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

    if (action === "COMPLETE_TASK" && actionData.task_id) {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", actionData.task_id);
      actionResult = { success: !error, error: error?.message };
    }

    if (action === "BLOCK_DATE" && actionData.block) {
      const block = actionData.block as {
        villa_id?: string; start_date?: string; end_date?: string;
        reason?: string;
      };
      if (block.villa_id && block.start_date && block.end_date) {
        // L'admin crée avec origin "Kayvila"
        const { data: created, error } = await supabase.from("villa_date_blocks").insert({
          villa_id: block.villa_id,
          start_date: block.start_date,
          end_date: block.end_date,
          reason: block.reason || "Blocage via Admin Chat",
          origin: "Kayvila",
          created_by: userId,
        }).select("id").single();
        actionResult = { success: !error, block_id: created?.id, error: error?.message };
      }
    }

    if (action === "UPDATE_BOOKING" && actionData.booking_id) {
      const updates: Record<string, unknown> = {};
      if (actionData.status) updates.status = actionData.status;
      if (actionData.payment_status) updates.payment_status = actionData.payment_status;
      if (actionData.guest_name) updates.guest_name = actionData.guest_name;
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("bookings")
          .update(updates)
          .eq("id", actionData.booking_id);
        actionResult = { success: !error, error: error?.message };
      }
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

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = supabaseAdmin();
    const ctx = await gatherAdminContext(supabase);
    const today = new Date().toISOString().slice(0, 10);

    const analytics: AdminAnalyticsInput = {
      today,
      villas: ctx.villas.map((v: any) => ({ id: String(v.id), name: String(v.name ?? "Villa") })),
      bookings: ctx.bookings.map((b: any) => ({
        villa_id: String(b.villa_id), start_date: String(b.start_date), end_date: String(b.end_date),
        status: String(b.status ?? ""), payment_status: String(b.payment_status ?? ""),
      })),
      blocks: (ctx.blocks ?? []).map((b: any) => ({
        villa_id: String(b.villa_id), start_date: String(b.start_date), end_date: String(b.end_date),
      })),
      tasks: ctx.tasks.map((t: any) => ({ id: String(t.id), villa_id: String(t.villa_id), status: String(t.status ?? ""), due_date: t.due_date ?? null })),
      reviews: (ctx.reviews ?? []).map((r: any) => ({ villa_id: String(r.villa_id), rating: Number(r.rating ?? 0), status: String(r.status ?? "") })),
      submissions: ctx.submissions.map((s: any) => ({ id: String(s.id), status: String(s.status ?? ""), created_at: String(s.created_at), owner_name: s.owner_name, villa_name: s.villa_name })),
      revenueByVilla: ctx.revenueByVilla ?? {},
      revenueLastMonthByVilla: ctx.revenueLastMonthByVilla ?? {},
    };

    return NextResponse.json({
      success: true,
      daily_briefing: buildDailyBriefing(analytics),
      occupancy_by_villa: computeOccupancyByVilla(analytics),
      health_score_by_villa: computeHealthScores(analytics),
      admin_alerts: computeAdminAlerts(analytics),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Admin Chat GET Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
