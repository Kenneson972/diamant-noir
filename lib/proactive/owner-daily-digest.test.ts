import { describe, it, expect } from "vitest";
import {
  buildOwnerDigestSignal,
  hasOwnerDigestSignal,
  buildOwnerDigestBody,
} from "@/lib/proactive/owner-daily-digest";
import type { OwnerContextPack } from "@/lib/owner-assistant-context";

function emptyPack(overrides: Partial<OwnerContextPack> = {}): OwnerContextPack {
  return {
    current_date_iso: "2026-07-05T12:00:00.000Z",
    portfolio: {
      total_villas: 1,
      published_villas: 1,
      total_revenue_paid: 0,
      revenue_current_month: 0,
      revenue_last_month: 0,
      upcoming_bookings_count: 0,
      pending_tasks_count: 0,
    },
    today: [],
    alerts: [],
    villas: [],
    bookings: [],
    tasks_open: [],
    ...overrides,
  };
}

describe("buildOwnerDigestSignal / hasOwnerDigestSignal", () => {
  it("aucun signal si tout est vide", () => {
    const signal = buildOwnerDigestSignal(emptyPack());
    expect(hasOwnerDigestSignal(signal)).toBe(false);
  });

  it("signal vrai si un check-in aujourd'hui", () => {
    const pack = emptyPack({
      today: [
        {
          kind: "check_in",
          villa_id: "v1",
          villa_name: "Villa Azur",
          booking_id: "b1",
          guest_name: "Jean Dupont",
          start_date: "2026-07-05",
          end_date: "2026-07-10",
        },
      ],
    });
    const signal = buildOwnerDigestSignal(pack);
    expect(hasOwnerDigestSignal(signal)).toBe(true);
    expect(signal.todayLines).toEqual(["Arrivée — Villa Azur (Jean Dupont)"]);
  });

  it("signal vrai si une alerte calculée est présente", () => {
    const pack = emptyPack({
      alerts: [
        {
          id: "a1",
          severity: "warning",
          title: "OTA sync en erreur",
          body: null,
          villa_id: "v1",
          created_at: "2026-07-05T00:00:00Z",
          read_at: null,
        },
      ],
    });
    const signal = buildOwnerDigestSignal(pack);
    expect(hasOwnerDigestSignal(signal)).toBe(true);
    expect(signal.alertLines).toEqual(["OTA sync en erreur"]);
  });
});

describe("buildOwnerDigestBody", () => {
  it("assemble les blocs non vides avec des sauts de ligne", () => {
    const body = buildOwnerDigestBody({
      todayLines: ["Arrivée — Villa Azur (Jean Dupont)"],
      alertLines: [],
      taskLines: ["Changer les draps"],
    });
    expect(body).toBe(
      "Aujourd'hui :\n- Arrivée — Villa Azur (Jean Dupont)\n\nTâches en attente :\n- Changer les draps"
    );
  });

  it("retourne chaîne vide si aucun signal", () => {
    expect(buildOwnerDigestBody({ todayLines: [], alertLines: [], taskLines: [] })).toBe("");
  });
});
