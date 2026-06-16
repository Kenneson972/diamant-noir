import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { getBookingPriceCents } from "@/lib/utils";
import {
  computeOccupancyByVilla,
  computeHealthScores,
  computeAdminAlerts,
  buildDailyBriefing,
  type AdminAnalyticsInput,
} from "@/lib/admin-assistant-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function addDays(d: string, n: number): string {
  return new Date(Date.parse(d + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);
}

async function gatherAdminContext(supabase: ReturnType<typeof supabaseAdmin>) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Arithmétique string UTC cohérente — pas de Date() local
  const startOfMonthStr = todayStr.slice(0, 8) + "01";
  const [y, m] = todayStr.split("-").map(Number);
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  const startOfLastMonthStr = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
  const endOfLastMonthStr = addDays(startOfMonthStr, -1);

  const [
    villasRes, bookingsRes, blocksRes, tasksRes, submissionsRes, otaRes, reviewsRes,
  ] = await Promise.all([
    supabase.from("villas").select("id,name,price_per_night,seasonal_prices,owner_id,status,cancellation_policy,currency").order("name"),
    supabase.from("bookings").select("*").order("start_date", { ascending: false }).limit(200),
    supabase.from("villa_date_blocks").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("villa_submissions").select("*").order("created_at", { ascending: false }),
    supabase.from("ota_sync_logs").select("*").order("created_at", { ascending: false }).limit(30),
    supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(200),
  ]);

  const villas = villasRes.data ?? [];
  const bookings = bookingsRes.data ?? [];
  const blocks = blocksRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const submissions = submissionsRes.data ?? [];
  const otaLogs = otaRes.data ?? [];
  const reviews = reviewsRes.data ?? [];

  const revenueByVilla: Record<string, number> = {};
  const revenueLastMonthByVilla: Record<string, number> = {};

  for (const v of villas) {
    const bPaid = bookings.filter((b: any) => b.villa_id === v.id && b.payment_status === "paid");
    revenueByVilla[v.id] = bPaid.reduce((s: number, b: any) => s + (getBookingPriceCents(b) / 100), 0);
    revenueLastMonthByVilla[v.id] = bPaid
      .filter((b: any) => {
        const d = (b.created_at as string).slice(0, 10);
        return d >= startOfLastMonthStr && d <= endOfLastMonthStr;
      })
      .reduce((s: number, b: any) => s + (getBookingPriceCents(b) / 100), 0);
  }

  const monthlyRevenue: any[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.parse(startOfMonthStr));
    d.setMonth(d.getMonth() - i);
    const m = d.toISOString().slice(0, 7);
    const rev = bookings
      .filter((b: any) => b.payment_status === "paid" && (b.created_at as string).slice(0, 7) === m)
      .reduce((s: number, b: any) => s + (getBookingPriceCents(b) / 100), 0);
    monthlyRevenue.push({ month: m, revenue: Math.round(rev * 100) / 100 });
  }

  const today = todayStr; // alias pour compatibilité (ctx.today)
  return {
    villas, bookings, blocks, tasks, submissions, otaLogs, reviews,
    revenueByVilla, revenueLastMonthByVilla, monthlyRevenue,
    today, todayStr, startOfMonthStr, startOfLastMonthStr, endOfLastMonthStr,
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = supabaseAdmin();
    const ctx = await gatherAdminContext(supabase);

    const analytics: AdminAnalyticsInput = {
      today: ctx.today,
      villas: ctx.villas.map((v: any) => ({ id: String(v.id), name: String(v.name ?? "Villa") })),
      bookings: ctx.bookings.map((b: any) => ({
        villa_id: String(b.villa_id), start_date: String(b.start_date), end_date: String(b.end_date),
        status: String(b.status ?? ""), payment_status: String(b.payment_status ?? ""),
      })),
      blocks: ctx.blocks.map((b: any) => ({
        villa_id: String(b.villa_id), start_date: String(b.start_date), end_date: String(b.end_date),
      })),
      tasks: ctx.tasks.map((t: any) => ({ id: String(t.id), villa_id: String(t.villa_id), status: String(t.status ?? ""), due_date: t.due_date ?? null })),
      reviews: ctx.reviews.map((r: any) => ({ villa_id: String(r.villa_id), rating: Number(r.rating ?? 0), status: String(r.status ?? "") })),
      submissions: ctx.submissions.map((s: any) => ({ id: String(s.id), status: String(s.status ?? ""), created_at: String(s.created_at), owner_name: s.owner_name, villa_name: s.villa_name })),
      revenueByVilla: ctx.revenueByVilla,
      revenueLastMonthByVilla: ctx.revenueLastMonthByVilla,
    };

    const contextData = {
      villas_summary: ctx.villas.map((v: any) => ({
        id: v.id, name: v.name, status: v.status, price_per_night: v.price_per_night,
      })),
      bookings_summary: {
        total: ctx.bookings.length,
        active: ctx.bookings.filter((b: any) => b.status === "confirmed" && b.payment_status === "paid").length,
        pending: ctx.bookings.filter((b: any) => b.status === "confirmed" && b.payment_status !== "paid").length,
        checkins_today: ctx.bookings.filter((b: any) => b.start_date === ctx.todayStr).length,
        checkins_48h: ctx.bookings.filter((b: any) => b.start_date >= ctx.todayStr && b.start_date <= addDays(ctx.todayStr, 2)).length,
        checkouts_today: ctx.bookings.filter((b: any) => b.end_date === ctx.todayStr).length,
      },
      finances: {
        revenue_total: ctx.bookings.filter((b: any) => b.payment_status === "paid").reduce((s: number, b: any) => s + (getBookingPriceCents(b) / 100), 0),
        revenue_this_month: ctx.bookings.filter((b: any) => b.payment_status === "paid" && (b.created_at as string).slice(0, 10) >= ctx.startOfMonthStr).reduce((s: number, b: any) => s + (getBookingPriceCents(b) / 100), 0),
        revenue_last_month: ctx.bookings.filter((b: any) => b.payment_status === "paid" && (b.created_at as string).slice(0, 10) >= ctx.startOfLastMonthStr && (b.created_at as string).slice(0, 10) <= ctx.endOfLastMonthStr).reduce((s: number, b: any) => s + (getBookingPriceCents(b) / 100), 0),
        pending_payments: ctx.bookings.filter((b: any) => b.payment_status !== "paid" && b.status === "confirmed").length,
        monthly_revenue: ctx.monthlyRevenue,
      },
      tasks_summary: {
        total: ctx.tasks.length,
        overdue: ctx.tasks.filter((t: any) => t.status !== "done" && t.due_date && t.due_date < ctx.todayStr).length,
        due_today: ctx.tasks.filter((t: any) => t.status !== "done" && t.due_date === ctx.todayStr).length,
        pending: ctx.tasks.filter((t: any) => t.status === "pending").length,
        in_progress: ctx.tasks.filter((t: any) => t.status === "in_progress").length,
      },
      submissions_summary: {
        total: ctx.submissions.length,
        received: ctx.submissions.filter((s: any) => s.status === "received").length,
        in_progress: ctx.submissions.filter((s: any) => ["examining", "visit", "contract"].includes(s.status)).length,
        approved: ctx.submissions.filter((s: any) => s.status === "approved").length,
      },
      ota_health: {
        last_sync: ctx.otaLogs[0]?.created_at || null,
        recent_errors: ctx.otaLogs.filter((l: any) => l.error).slice(0, 5).map((l: any) => ({
          villa_id: l.villa_id, source: l.source, error: l.error, synced_at: l.created_at,
        })),
        channels_with_errors: [...new Set(ctx.otaLogs.filter((l: any) => l.error).map((l: any) => l.source))],
      },
    };

    return NextResponse.json({
      context: contextData,
      analytics: {
        daily_briefing: buildDailyBriefing(analytics),
        occupancy_by_villa: computeOccupancyByVilla(analytics),
        health_score_by_villa: computeHealthScores(analytics),
        admin_alerts: computeAdminAlerts(analytics),
      },
      systemPrompt: `Tu es Kayvibot Admin, le copilote intelligent de l'équipe Kayvila. Tu parles français, tu es stratégique, proactif et orienté action.

TON RÔLE
- Analyser la performance globale (occupation, revenus, santé OTA)
- Détecter les anomalies et problèmes urgents
- Proposer des actions concrètes (blocage dates, création tâches, relance soumissions)
- Comparer les villas entre elles (benchmark interne)
- Générer des briefings quotidiens actionnables

RÈGLES
- Répondre en JSON : { "response": "...", "action": "SHOW_STATS"|"CREATE_TASK"|"BLOCK_DATE"|"UPDATE_TASK_STATUS"|"UPDATE_SUBMISSION_STATUS"|"COMPLETE_TASK"|"UPDATE_BOOKING", "action_data": {...}, "suggested_prompts": [...] }
- Pour les actions destructives (BLOCK_DATE, UPDATE_BOOKING), TOUJOURS demander confirmation explicite avant exécution
- Utiliser UNIQUEMENT les données du contexte — ne rien inventer
- Prioriser les alertes par criticité : OTA désynchronisé > tâches en retard > sous-performance
- Toujours proposer 3-5 suggested_prompts actionnables`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Agent Admin Context Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
