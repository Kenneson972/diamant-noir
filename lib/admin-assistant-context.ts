// lib/admin-assistant-context.ts
// Analytique copilot admin (socle) : occupation, score santé, alertes actionnables, briefing.
// Fonctions pures — la route fournit les données déjà fetchées.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getBookingPriceCents } from "@/lib/utils";
import { faqForPrompt } from "@/lib/chatbot/faq";
import { buildAdminSystemPrompt } from "@/lib/admin-assistant-system-prompt";

export type AdminAnalyticsInput = {
  today: string;
  villas: { id: string; name?: string }[];
  bookings: { villa_id: string; start_date: string; end_date: string; status?: string; payment_status?: string }[];
  blocks: { villa_id: string; start_date: string; end_date: string }[];
  tasks: { id: string; villa_id: string; status?: string; due_date?: string | null }[];
  reviews: { villa_id: string; rating: number; status?: string }[];
  submissions: { id: string; status?: string; created_at: string; owner_name?: string; villa_name?: string }[];
  revenueByVilla: Record<string, number>;
  revenueLastMonthByVilla: Record<string, number>;
};

const ACTIVE = (s?: string) => s !== "cancelled" && s !== "rejected";

function addDays(d: string, n: number): string {
  return new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10);
}

/** Nuits occupées sur les 30 prochains jours, ramenées à un % (0-100). */
export function computeOccupancyByVilla(input: AdminAnalyticsInput): Record<string, number> {
  const { today, villas, bookings } = input;
  const horizon = addDays(today, 30);
  const out: Record<string, number> = {};
  for (const v of villas) {
    const days = new Set<string>();
    for (const b of bookings.filter((b) => b.villa_id === v.id && ACTIVE(b.status))) {
      let cur = b.start_date < today ? today : b.start_date;
      while (cur < b.end_date && cur < horizon) {
        days.add(cur);
        cur = addDays(cur, 1);
      }
    }
    out[v.id] = Math.round((days.size / 30) * 100);
  }
  return out;
}

export type HealthScore = { score: number; flagged: boolean; breakdown: Record<string, number> };

const HEALTH_THRESHOLD = 50;

/** Score 0-100 : occupation 40 + tendance revenu 20 + tâches 20 + satisfaction 20. */
export function computeHealthScores(input: AdminAnalyticsInput): Record<string, HealthScore> {
  const occ = computeOccupancyByVilla(input);
  const { villas, tasks, reviews, revenueByVilla, revenueLastMonthByVilla, today } = input;
  const out: Record<string, HealthScore> = {};

  for (const v of villas) {
    const occupationPts = Math.round((occ[v.id] ?? 0) * 0.4);

    const cur = revenueByVilla[v.id] ?? 0;
    const prev = revenueLastMonthByVilla[v.id] ?? 0;
    let revenuePts = 10;
    if (prev > 0) {
      const pct = (cur - prev) / prev;
      revenuePts = Math.max(0, Math.min(20, Math.round(10 + pct * 50)));
    } else if (cur > 0) {
      revenuePts = 15;
    }

    const overdue = tasks.filter(
      (t) => t.villa_id === v.id && t.status !== "done" && t.due_date && t.due_date < today
    ).length;
    const tasksPts = Math.max(0, 20 - overdue * 5);

    const vr = reviews.filter((r) => r.villa_id === v.id && r.status === "approved");
    const avg = vr.length ? vr.reduce((s, r) => s + r.rating, 0) / vr.length : 0;
    const satisfactionPts = vr.length ? Math.round((avg / 5) * 20) : 10;

    const score = occupationPts + revenuePts + tasksPts + satisfactionPts;
    out[v.id] = {
      score,
      flagged: score < HEALTH_THRESHOLD,
      breakdown: { occupationPts, revenuePts, tasksPts, satisfactionPts },
    };
  }
  return out;
}

export type AdminAlert = {
  type: "submission_pending" | "booking_conflict";
  severity: "high" | "medium";
  label: string;
  body: string | null;
  entity_id: string | null;
  suggested_action: "UPDATE_SUBMISSION_STATUS" | "UPDATE_BOOKING" | null;
};

const SUBMISSION_STALE_DAYS = 5;

export function computeAdminAlerts(input: AdminAnalyticsInput): AdminAlert[] {
  const { today, submissions, bookings, villas } = input;
  const alerts: AdminAlert[] = [];
  const staleBefore = addDays(today, -SUBMISSION_STALE_DAYS);
  const nameOf = (id: string) => villas.find((v) => v.id === id)?.name ?? "Villa";

  for (const s of submissions.filter((s) => s.status === "received" && s.created_at.slice(0, 10) <= staleBefore)) {
    alerts.push({
      type: "submission_pending", severity: "medium",
      label: `Soumission ${s.owner_name ?? "?"} (${s.villa_name ?? "villa"}) en attente > ${SUBMISSION_STALE_DAYS} j`,
      body: "Veux-tu l'approuver, demander des photos, ou refuser ?",
      entity_id: s.id, suggested_action: "UPDATE_SUBMISSION_STATUS",
    });
  }

  for (const v of villas) {
    const vb = bookings
      .filter((b) => b.villa_id === v.id && ACTIVE(b.status))
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    for (let i = 1; i < vb.length; i++) {
      if (vb[i].start_date < vb[i - 1].end_date) {
        alerts.push({
          type: "booking_conflict", severity: "high",
          label: `Conflit de réservation sur ${nameOf(v.id)}`,
          body: `Chevauchement autour du ${vb[i].start_date}.`,
          entity_id: v.id, suggested_action: "UPDATE_BOOKING",
        });
        break;
      }
    }
  }
  return alerts;
}

export type DailyBriefing = {
  checkins_today: number;
  checkouts_today: number;
  submissions_pending: number;
  highlights: string[];
};

export function buildDailyBriefing(input: AdminAnalyticsInput): DailyBriefing {
  const { today, bookings, submissions } = input;
  const checkins_today = bookings.filter((b) => b.start_date === today && ACTIVE(b.status)).length;
  const checkouts_today = bookings.filter((b) => b.end_date === today && ACTIVE(b.status)).length;
  const submissions_pending = submissions.filter((s) => s.status === "received").length;

  const highlights: string[] = [];
  if (checkins_today) highlights.push(`${checkins_today} check-in(s) aujourd'hui`);
  if (checkouts_today) highlights.push(`${checkouts_today} check-out(s) aujourd'hui`);
  if (submissions_pending) highlights.push(`${submissions_pending} soumission(s) en attente`);

  return { checkins_today, checkouts_today, submissions_pending, highlights };
}

// ─── Insights proactifs (Task 8) ─────────────────────────────────────────────

export type AdminInsightsInput = {
  revenue_this_month: number;
  revenue_last_month: number;
  villas: { id: string; name: string; is_published: boolean; has_photo: boolean }[];
  owners: { id: string; full_name: string | null; connect_completed: boolean }[];
  overdue_tasks: number;
  submissions_received: number;
  ota_channels_with_errors: string[];
};

export type AdminInsights = {
  revenue_delta_pct: number | null;
  villas_without_photo: { id: string; name: string }[];
  owners_without_connect: { id: string; name: string | null }[];
  top_actions: string[];
};

export function computeAdminInsights(input: AdminInsightsInput): AdminInsights {
  const {
    revenue_this_month, revenue_last_month, villas, owners,
    overdue_tasks, submissions_received, ota_channels_with_errors,
  } = input;

  const revenue_delta_pct =
    revenue_last_month > 0
      ? Math.round(((revenue_this_month - revenue_last_month) / revenue_last_month) * 100)
      : null;

  const villas_without_photo = villas
    .filter((v) => v.is_published && !v.has_photo)
    .map((v) => ({ id: v.id, name: v.name }));

  const owners_without_connect = owners
    .filter((o) => !o.connect_completed)
    .map((o) => ({ id: o.id, name: o.full_name }));

  // Actions recommandées, par criticité : OTA > tâches en retard > soumissions > photos > Connect
  const actions: string[] = [];
  if (ota_channels_with_errors.length > 0)
    actions.push(`Vérifier la synchro OTA en erreur (${ota_channels_with_errors.join(", ")})`);
  if (overdue_tasks > 0)
    actions.push(`Traiter ${overdue_tasks} tâche(s) en retard`);
  if (submissions_received > 0)
    actions.push(`Répondre à ${submissions_received} soumission(s) de villa en attente`);
  if (villas_without_photo.length > 0)
    actions.push(`Ajouter des photos à ${villas_without_photo.map((v) => v.name).join(", ")}`);
  if (owners_without_connect.length > 0)
    actions.push(`Relancer l'onboarding Stripe Connect de ${owners_without_connect.length} propriétaire(s)`);

  return {
    revenue_delta_pct,
    villas_without_photo,
    owners_without_connect,
    top_actions: actions.slice(0, 3),
  };
}

// ─── Gathering + payload complet Agent C (Admin) ─────────────────────────────
// Utilisé par /api/agent/admin-context (n8n legacy/manuel) et /api/concierge/admin
// (in process, sans aller-retour n8n → kayvila.com).

function addDaysUTC(d: string, n: number): string {
  return new Date(Date.parse(d + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);
}

async function gatherAdminContext(supabase: SupabaseClient) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Arithmétique string UTC cohérente — pas de Date() local
  const startOfMonthStr = todayStr.slice(0, 8) + "01";
  const [y, m] = todayStr.split("-").map(Number);
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  const startOfLastMonthStr = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
  const endOfLastMonthStr = addDaysUTC(startOfMonthStr, -1);

  const sevenDaysAgoStr = addDaysUTC(todayStr, -7);

  const [
    villasRes, bookingsRes, blocksRes, tasksRes, submissionsRes, otaRes, reviewsRes, profilesRes, changesRes,
  ] = await Promise.all([
    supabase.from("villas").select("id,name,price_per_night,seasonal_prices,owner_id,status,cancellation_policy,currency,is_published,image_url,image_urls").order("name"),
    supabase.from("bookings").select("*").order("start_date", { ascending: false }).limit(200),
    supabase.from("villa_date_blocks").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("villa_submissions").select("*").order("created_at", { ascending: false }),
    supabase.from("ota_sync_logs").select("*").order("created_at", { ascending: false }).limit(30),
    supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("profiles").select("id,role,full_name,email,phone,stripe_connect_onboarding_completed").order("created_at", { ascending: false }),
    supabase.from("villa_changes").select("villa_id, owner_id, field, old_value, new_value, changed_at").gte("changed_at", sevenDaysAgoStr).order("changed_at", { ascending: false }).limit(50),
  ]);

  const villas = villasRes.data ?? [];
  const bookings = bookingsRes.data ?? [];
  const blocks = blocksRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const submissions = submissionsRes.data ?? [];
  const otaLogs = otaRes.data ?? [];
  const reviews = reviewsRes.data ?? [];
  const profiles = profilesRes.data ?? [];

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
    villas, bookings, blocks, tasks, submissions, otaLogs, reviews, profiles,
    recent_villa_changes: changesRes.data ?? [],
    revenueByVilla, revenueLastMonthByVilla, monthlyRevenue,
    today, todayStr, startOfMonthStr, startOfLastMonthStr, endOfLastMonthStr,
  };
}

/** Contexte + analytics + prompt complet Agent C — construits en une passe. */
export async function buildAdminAgentPayload(supabase: SupabaseClient) {
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

  const contextData: Record<string, unknown> = {
    villas_summary: ctx.villas.map((v: any) => ({
      id: v.id, name: v.name, status: v.status, price_per_night: v.price_per_night,
    })),
    bookings_summary: {
      total: ctx.bookings.length,
      active: ctx.bookings.filter((b: any) => b.status === "confirmed" && b.payment_status === "paid").length,
      pending: ctx.bookings.filter((b: any) => b.status === "confirmed" && b.payment_status !== "paid").length,
      checkins_today: ctx.bookings.filter((b: any) => b.start_date === ctx.todayStr).length,
      checkins_48h: ctx.bookings.filter((b: any) => b.start_date >= ctx.todayStr && b.start_date <= addDaysUTC(ctx.todayStr, 2)).length,
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
    users_summary: {
      total_profiles: ctx.profiles.length,
      owners: ctx.profiles.filter((p: any) => p.role === "owner" || p.role === "proprietaire" || p.role === "proprio").length,
      admins: ctx.profiles.filter((p: any) => p.role === "admin").length,
      recent_signups: ctx.profiles.slice(0, 10).map((p: any) => ({
        id: p.id, full_name: p.full_name, email: p.email, role: p.role,
      })),
    },
    recent_villa_changes: ctx.recent_villa_changes,
  };

  const insights = computeAdminInsights({
    revenue_this_month: (contextData.finances as any).revenue_this_month,
    revenue_last_month: (contextData.finances as any).revenue_last_month,
    villas: ctx.villas.map((v: any) => ({
      id: String(v.id), name: String(v.name ?? "Villa"),
      is_published: !!v.is_published,
      has_photo: !!v.image_url || (Array.isArray(v.image_urls) && v.image_urls.length > 0),
    })),
    owners: ctx.profiles
      .filter((p: any) => ["owner", "proprietaire", "proprio"].includes(String(p.role)))
      .map((p: any) => ({ id: String(p.id), full_name: p.full_name ?? null, connect_completed: !!p.stripe_connect_onboarding_completed })),
    overdue_tasks: (contextData.tasks_summary as any).overdue,
    submissions_received: (contextData.submissions_summary as any).received,
    ota_channels_with_errors: (contextData.ota_health as any).channels_with_errors as string[],
  });
  contextData.insights = insights;
  contextData.faq = faqForPrompt(["admin"]);

  return {
    context: contextData,
    analytics: {
      daily_briefing: buildDailyBriefing(analytics),
      occupancy_by_villa: computeOccupancyByVilla(analytics),
      health_score_by_villa: computeHealthScores(analytics),
      admin_alerts: computeAdminAlerts(analytics),
    },
    systemPrompt: buildAdminSystemPrompt(),
  };
}
