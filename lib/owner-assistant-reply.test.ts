import { describe, it, expect } from "vitest";
import { buildOwnerReply, buildOwnerFallbackText, ownerInsights } from "./owner-assistant-reply";
import type { OwnerContextPack } from "./owner-assistant-context";

const pack: OwnerContextPack = {
  current_date_iso: "2026-07-05T12:00:00.000Z",
  portfolio: {
    total_villas: 2, published_villas: 2,
    total_revenue_paid: 24000, revenue_current_month: 3000, revenue_last_month: 2500,
    upcoming_bookings_count: 2, pending_tasks_count: 1,
  },
  today: [
    { kind: "check_in", villa_id: "v1", villa_name: "Villa Azur", booking_id: "b1", guest_name: "M. Martin", start_date: "2026-07-05", end_date: "2026-07-10" },
  ],
  alerts: [],
  villas: [
    { id: "v1", name: "Villa Azur", is_published: true },
    { id: "v2", name: "Villa Corail", is_published: true },
  ],
  bookings: [
    { id: "b1", villa_id: "v1", start_date: "2026-07-05", end_date: "2026-07-10", status: "confirmed", payment_status: "paid", guest_name: "M. Martin" },
    { id: "b2", villa_id: "v2", start_date: "2026-07-12", end_date: "2026-07-15", status: "confirmed", payment_status: "paid", guest_name: "Mme Leroy" },
  ],
  tasks_open: [{ id: "t1", villa_id: "v1", content: "Vérifier climatisation" }],
};

describe("ownerInsights", () => {
  it("delta CA, prochaine arrivée, occupation", () => {
    const i = ownerInsights(pack);
    expect(i.revenue_delta_pct).toBe(20);
    expect(i.next_arrival?.villa_name).toBe("Villa Azur");
    expect(i.occupancy_30d).toBeGreaterThan(0);
  });
});

describe("buildOwnerReply", () => {
  it("revenus → chiffres réels + delta", () => {
    const r = buildOwnerReply(pack, "mes revenus ce mois ?");
    expect(r.text).toContain("3 000");
    expect(r.text).toContain("+20");
  });

  it("arrivées du jour → utilise kind check_in (fix bug e.type)", () => {
    const r = buildOwnerReply(pack, "qui arrive aujourd'hui ?");
    expect(r.text).toContain("Arrivee");
    expect(r.text).toContain("M. Martin");
  });

  it("question FAQ proprio → réponse 22/20", () => {
    const r = buildOwnerReply(pack, "quelle est votre commission déjà ?");
    expect(r.matchedFaqId).toBe("commission");
    expect(r.text).toContain("22 %");
    expect(r.text).toContain("20 %");
  });

  it("texte brut sans markdown ni emoji", () => {
    for (const q of ["mes revenus ?", "qui arrive ?", "mes villas ?", "peu importe"]) {
      const t = buildOwnerReply(pack, q).text;
      expect(t).not.toMatch(/\*\*|##|[\u{1F300}-\u{1FAFF}]/u);
    }
  });

  it("inconnu → vue d'ensemble, matchedFaqId null", () => {
    const r = buildOwnerReply(pack, "zzz question étrange");
    expect(r.matchedFaqId).toBeNull();
    expect(r.text).toContain("2 villa");
  });
});

describe("buildOwnerFallbackText", () => {
  it("snapshot utile en une phrase", () => {
    const t = buildOwnerFallbackText(pack);
    expect(t).toContain("2 villa");
    expect(t).toContain("1 tache");
  });
});
