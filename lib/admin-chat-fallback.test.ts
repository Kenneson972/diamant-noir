import { describe, it, expect } from "vitest";
import { parseAdminCommand, buildAdminFallbackReply, type AdminFallbackContext } from "./admin-chat-fallback";

describe("parseAdminCommand", () => {
  const today = "2026-07-05";

  it("créer une tâche (avec échéance demain)", () => {
    const c = parseAdminCommand("Crée une tâche vérifier la piscine pour demain", today);
    expect(c).toEqual({ type: "create_task", title: "vérifier la piscine", dueDate: "2026-07-06" });
  });

  it("créer une tâche sans échéance", () => {
    const c = parseAdminCommand("ajoute une tâche : rappeler le plombier", today);
    expect(c).toEqual({ type: "create_task", title: "rappeler le plombier", dueDate: null });
  });

  it("marquer une tâche faite par référence", () => {
    const c = parseAdminCommand("marque la tâche #123 comme faite", today);
    expect(c).toEqual({ type: "complete_task", taskRef: "123" });
  });

  it("note sur un client", () => {
    const c = parseAdminCommand("Ajoute une note sur le client Dupont : préfère arriver après 18h", today);
    expect(c).toEqual({ type: "note_client", client: "Dupont", note: "préfère arriver après 18h" });
  });

  it("question normale → null", () => {
    expect(parseAdminCommand("quel est le taux d'occupation ?", today)).toBeNull();
  });
});

const ctx: AdminFallbackContext = {
  contextData: {
    villas_summary: { total: 3, published: 2, draft: 1 },
    bookings_summary: { total: 10, confirmed: 7, pending: 2, checkins_today: 1, checkins_48h: 2, checkins_7d: 4, checkouts_today: 0 },
    tasks_summary: { total: 5, overdue: 2, due_today: 1, pending: 3, in_progress: 1 },
    finances: { revenue_total: 20000, revenue_this_month: 6000, revenue_last_month: 5000, pending_payments: 1, revenue_by_villa: [ { villa_name: "Villa Azur", revenue: 12000, bookings_count: 6 }, { villa_name: "Villa Corail", revenue: 8000, bookings_count: 4 } ], monthly_revenue: [] },
    submissions_summary: { total: 2, received: 1, in_progress: 1, approved: 0, needs_photos: 1 },
    ota_health: { last_sync: "2026-07-04T10:00:00Z", recent_errors: [{ villa_id: "v1", source: "airbnb", error: "404 ical", synced_at: "2026-07-04T10:00:00Z" }], channels_with_errors: ["airbnb"] },
  },
  occupancy: { v1: 80, v2: 40 },
  villaNames: { v1: "Villa Azur", v2: "Villa Corail" },
  alerts: [{ severity: "high", label: "Conflit de réservation sur Villa Azur" }],
  briefing: { checkins_today: 1, checkouts_today: 0, submissions_pending: 1, highlights: ["1 check-in(s) aujourd'hui"] },
  insights: { revenue_delta_pct: 20, villas_without_photo: [], owners_without_connect: [], top_actions: ["Vérifier la synchro OTA en erreur (airbnb)"] },
  checkins7d: [{ guest_name: "M. Martin", villa_name: "Villa Azur", start_date: "2026-07-07" }],
};

describe("buildAdminFallbackReply", () => {
  it("salutation → briefing du jour + alertes en tête", () => {
    const r = buildAdminFallbackReply("bonjour", ctx);
    expect(r.text).toContain("Conflit de réservation");
    expect(r.text).toContain("check-in");
    expect(r.matchedFaqId).toBe("briefing");
  });

  it("occupation → taux par villa", () => {
    const r = buildAdminFallbackReply("quel est le taux d'occupation ?", ctx);
    expect(r.text).toContain("Villa Azur");
    expect(r.text).toContain("80");
  });

  it("top villas → classement par revenu", () => {
    const r = buildAdminFallbackReply("quelles sont les meilleures villas ?", ctx);
    expect(r.text.indexOf("Villa Azur")).toBeLessThan(r.text.indexOf("Villa Corail"));
  });

  it("check-ins semaine → noms + villas", () => {
    const r = buildAdminFallbackReply("check-ins de la semaine ?", ctx);
    expect(r.text).toContain("M. Martin");
    expect(r.text).toContain("Villa Azur");
  });

  it("OTA → erreurs détaillées", () => {
    const r = buildAdminFallbackReply("des erreurs de sync ota ?", ctx);
    expect(r.text).toContain("airbnb");
    expect(r.text).toContain("404 ical");
  });

  it("revenus → CA + delta vs mois dernier", () => {
    const r = buildAdminFallbackReply("le chiffre du mois ?", ctx);
    expect(r.text).toContain("6");
    expect(r.text).toContain("+20");
  });

  it("texte brut : pas de markdown ni d'emoji", () => {
    for (const q of ["bonjour", "occupation ?", "revenus ?"]) {
      const t = buildAdminFallbackReply(q, ctx).text;
      expect(t).not.toMatch(/\*\*|##|[\u{1F300}-\u{1FAFF}]/u);
    }
  });

  it("question inconnue → résumé général, matchedFaqId null", () => {
    const r = buildAdminFallbackReply("blabla incompréhensible", ctx);
    expect(r.matchedFaqId).toBeNull();
    expect(r.text).toContain("3 villa");
  });
});
