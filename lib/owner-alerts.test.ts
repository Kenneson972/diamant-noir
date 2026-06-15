// lib/owner-alerts.test.ts
import { describe, it, expect } from "vitest";
import { computeOwnerAlerts, type AlertsInput } from "./owner-alerts";

const base: AlertsInput = {
  today: "2026-07-01",
  villas: [{ id: "v1", name: "Corail" }],
  bookings: [],
  blocks: [],
  tasks: [],
  otaLogs: [],
  revenueCurrentMonth: 0,
  revenueLastMonth: 0,
};

describe("computeOwnerAlerts", () => {
  it("détecte un trou calendrier ≥ 3 nuits dans les 30 j", () => {
    const alerts = computeOwnerAlerts({
      ...base,
      bookings: [
        { villa_id: "v1", start_date: "2026-07-01", end_date: "2026-07-03", status: "confirmed" },
        { villa_id: "v1", start_date: "2026-07-20", end_date: "2026-07-25", status: "confirmed" },
      ],
    });
    expect(alerts.some((a) => a.type === "calendar_gap" && a.villa_id === "v1")).toBe(true);
  });

  it("détecte une tâche en retard (due_date < today)", () => {
    const alerts = computeOwnerAlerts({
      ...base,
      tasks: [{ id: "t1", villa_id: "v1", status: "pending", due_date: "2026-06-20" }],
    });
    expect(alerts.some((a) => a.type === "overdue_task" && a.severity === "high")).toBe(true);
  });

  it("détecte un conflit de réservation (chevauchement)", () => {
    const alerts = computeOwnerAlerts({
      ...base,
      bookings: [
        { villa_id: "v1", start_date: "2026-07-10", end_date: "2026-07-15", status: "confirmed" },
        { villa_id: "v1", start_date: "2026-07-14", end_date: "2026-07-18", status: "confirmed" },
      ],
    });
    expect(alerts.some((a) => a.type === "booking_conflict" && a.severity === "high")).toBe(true);
  });

  it("détecte une variation de revenu vs mois précédent", () => {
    const alerts = computeOwnerAlerts({ ...base, revenueCurrentMonth: 5600, revenueLastMonth: 5000 });
    const a = alerts.find((x) => x.type === "revenue_delta");
    expect(a).toBeDefined();
    expect(a!.title).toContain("+12");
  });

  it("détecte une désync OTA > 48h", () => {
    const alerts = computeOwnerAlerts({
      ...base,
      otaLogs: [{ villa_id: "v1", created_at: "2026-06-25T00:00:00Z", error: null }],
    });
    expect(alerts.some((a) => a.type === "ota_desync")).toBe(true);
  });

  it("ne crée pas d'alerte conflit pour des bookings annulés", () => {
    const alerts = computeOwnerAlerts({
      ...base,
      bookings: [
        { villa_id: "v1", start_date: "2026-07-10", end_date: "2026-07-15", status: "cancelled" },
        { villa_id: "v1", start_date: "2026-07-14", end_date: "2026-07-18", status: "cancelled" },
      ],
    });
    expect(alerts.some((a) => a.type === "booking_conflict")).toBe(false);
  });
});
