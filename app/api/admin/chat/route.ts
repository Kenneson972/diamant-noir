import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getBookingPriceCents } from "@/lib/utils";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { requiresConfirmation, buildConfirmationPrompt } from "@/lib/admin-confirm";
import {
  computeOccupancyByVilla, computeHealthScores, computeAdminAlerts, buildDailyBriefing,
  type AdminAnalyticsInput,
} from "@/lib/admin-assistant-context";

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

// ─── Mode démo intelligent — analyse la question et répond avec les données réelles ──
function buildAdminDemoReply(message: string, ctx: Record<string, any>): {
  text: string;
  action?: string;
  suggestions?: string[];
} {
  const msg = message.toLowerCase();
  const vs = ctx.villas_summary || {};
  const bs = ctx.bookings_summary || {};
  const ts = ctx.tasks_summary || {};
  const fin = ctx.finances || {};
  const sub = ctx.submissions_summary || {};
  const ota = ctx.ota_health || {};

  // ── Revenus / Finances ──
  if (/revenu|chiffre|argent|financ|encaiss|mois|€|euro/.test(msg)) {
    const monthly = (fin.monthly_revenue as any[] || []).map((m: any) =>
      `• ${m.month} : ${m.revenue.toLocaleString("fr-FR")} €`
    ).join("\n");
    return {
      text: `💰 **Revenus**\n\nTotal encaissé : **${fin.revenue_total?.toLocaleString("fr-FR") || 0} €**\nCe mois : **${fin.revenue_this_month?.toLocaleString("fr-FR") || 0} €**\nLe mois dernier : ${fin.revenue_last_month?.toLocaleString("fr-FR") || 0} €\n\n📊 **6 derniers mois :**\n${monthly}`,
      action: "SHOW_FINANCES",
      suggestions: ["Taux d'occupation ce mois ?", "Top 3 villas par revenu ?", "Check-ins de la semaine ?"],
    };
  }

  // ── Réservations / Check-ins ──
  if (/réservation|booking|check.?in|arrivée|client|séjour/.test(msg)) {
    return {
      text: `📅 **Réservations**\n\n✅ Confirmées : ${bs.confirmed}\n⏳ En attente : ${bs.pending}\n🟢 Check-ins aujourd'hui : **${bs.checkins_today}**\n📅 Check-ins sous 48h : ${bs.checkins_48h}\n📅 Check-ins sous 7 jours : ${bs.checkins_7d}\n🔴 Check-outs aujourd'hui : ${bs.checkouts_today}`,
      action: "SHOW_BOOKINGS",
      suggestions: ["Check-ins de demain ?", "Réservations en attente ?", "Taux de remplissage ?"],
    };
  }

  // ── Tâches ──
  if (/tâche|tache|todo|urgent|retard|maintenance|en cours/.test(msg)) {
    return {
      text: `📋 **Tâches**\n\n📊 Total : ${ts.total}\n🔴 En retard : **${ts.overdue}**\n🟡 À faire aujourd'hui : ${ts.due_today}\n⏳ En attente : ${ts.pending}\n🔄 En cours : ${ts.in_progress}`,
      action: "SHOW_TASKS",
      suggestions: ["Tâches urgentes ?", "Créer une tâche", "Check-ins du jour ?"],
    };
  }

  // ── Villas ──
  if (/villa|propriété|parc|catalogue|publi/.test(msg)) {
    return {
      text: `🏠 **Villas**\n\n📊 ${vs.total} villa(s) au total\n✅ ${vs.published} publiée(s)\n🔒 ${vs.draft} brouillon(s)`,
      action: "SHOW_VILLAS",
      suggestions: ["Ajouter une villa", "Villas non publiées ?", "Revenus par villa ?"],
    };
  }

  // ── Soumissions ──
  if (/soumission|candidat|proprio|propriétaire/.test(msg)) {
    return {
      text: `📬 **Soumissions**\n\n📊 ${sub.total} soumission(s)\n🆕 Reçues : ${sub.received}\n🔍 En cours : ${sub.in_progress}\n✅ Approuvées : ${sub.approved}\n📸 Besoin de photos : ${sub.needs_photos}`,
      action: "SHOW_SUBMISSIONS",
      suggestions: ["Soumissions récentes ?", "Soumissions en cours ?"],
    };
  }

  // ── OTA / Sync ──
  if (/ota|sync|airbnb|booking|synchro|ical|erreur/.test(msg)) {
    const last = ota.last_sync ? new Date(ota.last_sync).toLocaleString("fr-FR") : "jamais";
    return {
      text: `🔄 **Synchronisation OTA**\n\nDernière synchro : ${last}\nCanaux avec erreurs : ${ota.channels_with_errors?.length || 0}\nImportés : ${ota.total_imported_last_sync || 0}`,
      action: "SHOW_OTA_HEALTH",
      suggestions: ["Détail des erreurs ?", "Forcer une synchro ?"],
    };
  }

  // ── Santé / comparaison villas ──
  if (/santé|sante|score|comparer|comparaison|occupation|performance|meilleure|pire/.test(msg)) {
    return {
      text: `📊 Demande la vue détaillée dans le tableau de bord : occupation et score de santé par villa sont calculés en direct.`,
      action: "SHOW_VILLAS",
      suggestions: ["Quelle villa est la plus occupée ?", "Quelles villas sont à risque ?"],
    };
  }

  // ── Par défaut : résumé général ──
  return {
    text: `👋 Voici votre tableau de bord :\n\n🏠 **${vs.total} villa(s)** (${vs.published} publiée(s))\n📅 **${bs.checkins_today} check-in(s)** aujourd'hui — ${bs.confirmed + bs.pending} résas\n📋 **${ts.overdue} tâche(s)** en retard sur ${ts.total}\n💰 **${fin.revenue_this_month?.toLocaleString("fr-FR") || 0} €** ce mois-ci\n📬 **${sub.received} soumission(s)** en attente\n🔄 Dernière synchro OTA : ${ota.last_sync ? new Date(ota.last_sync).toLocaleDateString("fr-FR") : "jamais"}\n\nQue puis-je faire pour vous ?`,
    action: "SHOW_STATS",
    suggestions: ["Check-ins de la semaine ?", "Tâches urgentes ?", "Revenus par villa ?"],
  };
}

// ─── DATA GATHERING HELPER ────────────────────────────────────────────────────
async function gatherAdminContext(supabase: ReturnType<typeof supabaseAdmin>) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const in48h = new Date(Date.now() + 48 * 3_600_000);
  const in7d = new Date(Date.now() + 7 * 24 * 3_600_000);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

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
          new Date(b.created_at) >= startOfMonth
      )
      .reduce((s: number, b) => s + getBookingPriceCents(b) / 100, 0);
    revenueLastMonthByVilla[String(v.id)] = bookings
      .filter(
        (b) =>
          b.villa_id === v.id &&
          b.payment_status === "paid" &&
          new Date(b.created_at) >= startOfLastMonth &&
          new Date(b.created_at) <= endOfLastMonth
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

    // ─── WEBHOOK n8n ─────────────────────────────────────────────────────────
    const webhookURL =
      process.env.N8N_ADMIN_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

    if (!webhookURL) {
      // Mode démo intelligent — répond en français avec les vraies données
      const demoResponse = buildAdminDemoReply(message.trim(), contextData);
      return NextResponse.json({
        success: true,
        response: demoResponse.text,
        action: demoResponse.action || "SHOW_STATS",
        action_data: contextData,
        suggested_prompts: demoResponse.suggestions || [
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
