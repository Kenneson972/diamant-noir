import { describe, it, expect } from "vitest";
import { decideGhostVillas, buildGhostVillaNotification } from "@/lib/proactive/ghost-villas";

const now = new Date("2026-06-21T12:00:00Z");

describe("decideGhostVillas", () => {
  it("garde villa non publiée >30j", () => {
    const rows = [{ id: "1", name: "Azur", is_published: false, ical_url: null, created_at: "2026-01-01T00:00:00Z" }];
    const out = decideGhostVillas(rows, now);
    expect(out).toHaveLength(1);
    expect(out[0].reason).toBe("Non publiée");
  });
  it("garde villa publiée mais sans iCal >30j", () => {
    const rows = [{ id: "2", name: "Corail", is_published: true, ical_url: null, created_at: "2025-12-01T00:00:00Z" }];
    const out = decideGhostVillas(rows, now);
    expect(out).toHaveLength(1);
    expect(out[0].reason).toBe("Pas de calendrier iCal");
  });
  it("exclut villa publiée avec iCal même >30j", () => {
    const rows = [{ id: "3", name: "OK", is_published: true, ical_url: "https://ical.url", created_at: "2025-12-01T00:00:00Z" }];
    expect(decideGhostVillas(rows, now)).toEqual([]);
  });
  it("exclut villa non publiée mais <30j", () => {
    const rows = [{ id: "4", name: "Récente", is_published: false, ical_url: null, created_at: "2026-06-01T00:00:00Z" }];
    expect(decideGhostVillas(rows, now)).toEqual([]);
  });
});

describe("buildGhostVillaNotification", () => {
  it("construit la notification avec le bon type et body", () => {
    const notif = buildGhostVillaNotification({ name: "Azur", reason: "Non publiée" });
    expect(notif).toEqual({
      type: "ghost_villa",
      title: "Villa fantôme détectée",
      body: "Azur — Non publiée",
      action_url: "/admin/villas",
      user_id: null,
    });
  });
});
