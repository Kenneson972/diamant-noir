import { describe, it, expect } from "vitest";
import { computeRevenueDelta, buildWeeklyRecap, buildWeeklyRecapNotificationBody } from "@/lib/proactive/weekly-recap";

describe("computeRevenueDelta", () => {
  it("flag si baisse > 30%", () => {
    expect(computeRevenueDelta(600, 1000).dropOver30).toBe(true); // -40%
  });
  it("pas de flag si baisse exactement 30%", () => {
    expect(computeRevenueDelta(700, 1000).dropOver30).toBe(false); // -30% pile
  });
  it("pas de flag si base 0 (pas de référence)", () => {
    expect(computeRevenueDelta(500, 0).dropOver30).toBe(false);
  });
  it("pas de flag si hausse", () => {
    expect(computeRevenueDelta(1200, 1000).dropOver30).toBe(false);
  });
  it("delta correct", () => {
    expect(computeRevenueDelta(800, 1000).delta).toBe(-200);
  });
});

describe("buildWeeklyRecapNotificationBody", () => {
  it("inclut l'alerte de baisse de CA si anomalyFlag", () => {
    const recap = buildWeeklyRecap({
      revenueCents: { thisWeek: 600, lastWeek: 1000 },
      inactiveOwners: [],
      topVillas: [],
      convertedLeads: [],
      trends: ["Réservations ce mois : 5 vs 3 le mois dernier"],
    });
    const body = buildWeeklyRecapNotificationBody(recap);
    expect(body).toContain("Baisse de CA de plus de 30% cette semaine");
    expect(body).toContain("Réservations ce mois : 5 vs 3 le mois dernier");
  });

  it("omet les sections vides", () => {
    const recap = buildWeeklyRecap({
      revenueCents: { thisWeek: 1000, lastWeek: 1000 },
      inactiveOwners: [],
      topVillas: [],
      convertedLeads: [],
      trends: [],
    });
    expect(buildWeeklyRecapNotificationBody(recap)).toBe("");
  });
});
