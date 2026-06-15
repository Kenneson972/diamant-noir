// lib/admin-assistant-context.ts
// Analytique copilot admin (socle) : occupation, score santé, alertes actionnables, briefing.
// Fonctions pures — la route fournit les données déjà fetchées.

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
