// lib/admin-assistant-context.test.ts
import { describe, it, expect } from "vitest";
import {
  computeOccupancyByVilla,
  computeHealthScores,
  computeAdminAlerts,
  buildDailyBriefing,
  type AdminAnalyticsInput,
} from "./admin-assistant-context";

const today = "2026-07-01";
const villas = [{ id: "v1", name: "Corail" }, { id: "v2", name: "Azur" }];

const input: AdminAnalyticsInput = {
  today,
  villas,
  bookings: [
    { villa_id: "v1", start_date: "2026-07-01", end_date: "2026-07-26", status: "confirmed", payment_status: "paid" },
    { villa_id: "v2", start_date: "2026-07-01", end_date: "2026-07-11", status: "confirmed", payment_status: "paid" },
  ],
  blocks: [],
  tasks: [{ id: "t1", villa_id: "v2", status: "pending", due_date: "2026-06-20" }],
  reviews: [
    { villa_id: "v1", rating: 5, status: "approved" },
    { villa_id: "v2", rating: 3, status: "approved" },
  ],
  submissions: [{ id: "s1", status: "received", created_at: "2026-06-20T00:00:00Z", owner_name: "Jean", villa_name: "Lagon" }],
  revenueByVilla: { v1: 8000, v2: 3000 },
  revenueLastMonthByVilla: { v1: 6000, v2: 4000 },
};

describe("computeOccupancyByVilla", () => {
  it("calcule un taux 0-100 sur 30 jours", () => {
    const occ = computeOccupancyByVilla(input);
    expect(occ.v1).toBeGreaterThan(occ.v2);
    expect(occ.v1).toBeLessThanOrEqual(100);
  });
});

describe("computeHealthScores", () => {
  it("retourne un score 0-100 par villa, Corail > Azur", () => {
    const scores = computeHealthScores(input);
    expect(scores.v1.score).toBeGreaterThan(scores.v2.score);
    expect(scores.v1.score).toBeGreaterThanOrEqual(0);
    expect(scores.v1.score).toBeLessThanOrEqual(100);
  });
  it("flag les villas sous le seuil", () => {
    const scores = computeHealthScores(input);
    expect(typeof scores.v2.flagged).toBe("boolean");
  });
});

describe("computeAdminAlerts", () => {
  it("alerte les soumissions en attente > 5 jours avec recommandation actionnable", () => {
    const alerts = computeAdminAlerts(input);
    const sub = alerts.find((a) => a.type === "submission_pending");
    expect(sub).toBeDefined();
    expect(sub!.suggested_action).toBe("UPDATE_SUBMISSION_STATUS");
    expect(sub!.label).toContain("Jean");
  });
});

describe("buildDailyBriefing", () => {
  it("résume check-ins/outs du jour et soumissions", () => {
    const b = buildDailyBriefing(input);
    expect(b.checkins_today).toBe(2);
    expect(b.submissions_pending).toBe(1);
    expect(Array.isArray(b.highlights)).toBe(true);
  });
});
