import { describe, it, expect } from "vitest";
import { buildMonthlyDetails, type ConfirmedBookingInput, type VillaInfo } from "./monthly-detail";

const villas: VillaInfo[] = [
  { id: "v1", name: "Villa A" },
  { id: "v2", name: "Villa B" },
];

const confirmedBookings: ConfirmedBookingInput[] = [
  {
    id: "b1",
    villa_id: "v1",
    guest_name: "Jean Martin",
    start_date: "2026-07-01",
    end_date: "2026-07-08", // 7 nuits
    price: 1000,
    cleaning_fee: 100,
    service_fee: 50,
    total_price_cents: null,
    source: "direct",
  },
  {
    id: "b2",
    villa_id: "v1",
    guest_name: "Marie Dubois",
    start_date: "2026-07-10",
    end_date: "2026-07-12", // 2 nuits
    price: 300,
    cleaning_fee: 0,
    service_fee: 0,
    total_price_cents: null,
    source: "airbnb",
  },
  {
    id: "b3",
    villa_id: "v2",
    guest_name: "Paul Petit",
    start_date: "2026-07-05",
    end_date: "2026-07-10", // 5 nuits
    price: 500,
    cleaning_fee: 50,
    service_fee: 0,
    total_price_cents: null,
    source: null,
  },
];

function build(monthKeys = ["2026-06", "2026-07"]) {
  return buildMonthlyDetails({
    confirmedBookings,
    cancelledBookings: [],
    pendingBookings: [],
    villas,
    monthKeys,
  });
}

describe("buildMonthlyDetails — agrégats du mois", () => {
  it("matérialise un MonthDetail pour chaque monthKey demandé", () => {
    const { monthlyDetails } = build();
    expect(Object.keys(monthlyDetails).sort()).toEqual(["2026-06", "2026-07"]);
    expect(monthlyDetails["2026-07"].label).toBe("Juillet 2026");
  });

  it("un mois sans réservation a tous ses champs à 0", () => {
    const { monthlyDetails } = build();
    const june = monthlyDetails["2026-06"];
    expect(june.gross).toBe(0);
    expect(june.bookingCount).toBe(0);
    expect(june.byVilla).toEqual([]);
    expect(june.byChannel).toEqual([]);
    expect(june.bookings).toEqual([]);
  });

  it("calcule le CA brut, la commission décomposée et le reversement du mois", () => {
    const { monthlyDetails } = build();
    const july = monthlyDetails["2026-07"];
    // gross = (1000+100+50)€ + 300€ + (500+50)€ = 1150+300+550 = 2000€
    expect(july.gross).toBe(200000);
    expect(july.bookingCount).toBe(3);
    // commission sur nuitées : b1 22%*1000€=220€, b2 20%*300€=60€, b3 22%*500€=110€ → 390€
    expect(july.platformOnStay).toBe(39000);
    expect(july.platformCleaning).toBe(15000); // 100+0+50 €
    expect(july.platformService).toBe(5000); // 50+0+0 €
    expect(july.platformTotal).toBe(59000); // 390+150+50
    expect(july.ownerNet).toBe(141000); // 200000-59000
  });

  it("calcule les nuitées vendues et l'ADR (CA nuitées uniquement / nuitées)", () => {
    const { monthlyDetails } = build();
    const july = monthlyDetails["2026-07"];
    expect(july.nightsSold).toBe(14); // 7+2+5
    // stay only = 1000+300+500 = 1800€ / 14 nuits = 128.57€ → 12857 cents arrondi
    expect(july.adr).toBe(12857);
  });

  it("calcule le panier moyen", () => {
    const { monthlyDetails } = build();
    expect(monthlyDetails["2026-07"].avgBasket).toBe(66667); // 200000/3 arrondi
  });

  it("regroupe par villa avec sous-totaux et part du CA du mois", () => {
    const { monthlyDetails } = build();
    const byVilla = monthlyDetails["2026-07"].byVilla;
    expect(byVilla).toHaveLength(2);
    const v1 = byVilla.find((v) => v.villaId === "v1")!;
    expect(v1.gross).toBe(145000); // b1+b2 = 115000+30000
    expect(v1.bookingCount).toBe(2);
    expect(v1.shareOfMonthPct).toBe(73); // 145000/200000
    const v2 = byVilla.find((v) => v.villaId === "v2")!;
    expect(v2.gross).toBe(55000);
    expect(v2.shareOfMonthPct).toBe(28); // 55000/200000
  });

  it("regroupe par canal normalisé avec le taux de commission associé", () => {
    const { monthlyDetails } = build();
    const byChannel = monthlyDetails["2026-07"].byChannel;
    const direct = byChannel.find((c) => c.channel === "Direct")!;
    expect(direct.gross).toBe(170000); // b1(direct)+b3(null→Direct) = 115000+55000
    expect(direct.commissionRate).toBe(22);
    const airbnb = byChannel.find((c) => c.channel === "Airbnb")!;
    expect(airbnb.gross).toBe(30000);
    expect(airbnb.commissionRate).toBe(20);
  });

  it("liste les réservations du mois triées par date d'arrivée", () => {
    const { monthlyDetails } = build();
    const ids = monthlyDetails["2026-07"].bookings.map((b) => b.id);
    expect(ids).toEqual(["b1", "b3", "b2"]); // 07-01, 07-05, 07-10
  });

  it("alimente monthlyGrossHistory même pour des mois hors fenêtre affichée", () => {
    // Fenêtre affichée = seulement août : juillet est hors fenêtre (pas de
    // MonthDetail matérialisé) mais doit quand même apparaître dans l'historique
    // complet du CA, utilisé pour les comparaisons N-1/N-12.
    const { monthlyDetails, monthlyGrossHistory } = buildMonthlyDetails({
      confirmedBookings,
      cancelledBookings: [],
      pendingBookings: [],
      villas,
      monthKeys: ["2026-08"],
    });
    expect(monthlyDetails["2026-07"]).toBeUndefined();
    expect(monthlyGrossHistory["2026-07"]).toBe(200000);
  });

  it("cancelled/pending restent à zéro pour les résas confirmées et sont bien remplis quand fournis", () => {
    const { monthlyDetails } = build();
    const july = monthlyDetails["2026-07"];
    expect(july.cancelled).toEqual({ count: 0, lostGross: 0 });
    expect(july.pending).toEqual({ count: 0, potentialGross: 0 });
    expect(july.occupancyRate).toBe(0);
  });
});

describe("buildMonthlyDetails — annulé et pipeline", () => {
  it("compte les réservations annulées/remboursées du mois et le CA perdu associé", () => {
    const { monthlyDetails } = buildMonthlyDetails({
      confirmedBookings,
      cancelledBookings: [
        { villa_id: "v1", start_date: "2026-07-15", price: 200, cleaning_fee: 0, service_fee: 0, total_price_cents: null },
      ],
      pendingBookings: [],
      villas,
      monthKeys: ["2026-06", "2026-07"],
    });
    expect(monthlyDetails["2026-07"].cancelled).toEqual({ count: 1, lostGross: 20000 });
    expect(monthlyDetails["2026-06"].cancelled).toEqual({ count: 0, lostGross: 0 });
  });

  it("compte les réservations en attente (pipeline) du mois et le CA potentiel", () => {
    const { monthlyDetails } = buildMonthlyDetails({
      confirmedBookings,
      cancelledBookings: [],
      pendingBookings: [
        { villa_id: "v2", start_date: "2026-07-20", price: 400, cleaning_fee: 50, service_fee: 20, total_price_cents: null },
      ],
      villas,
      monthKeys: ["2026-07"],
    });
    expect(monthlyDetails["2026-07"].pending).toEqual({ count: 1, potentialGross: 47000 });
  });

  it("les annulations/pipeline ne sont jamais comptés dans le CA confirmé", () => {
    const { monthlyDetails } = buildMonthlyDetails({
      confirmedBookings,
      cancelledBookings: [
        { villa_id: "v1", start_date: "2026-07-01", price: 999, cleaning_fee: 0, service_fee: 0, total_price_cents: null },
      ],
      pendingBookings: [
        { villa_id: "v2", start_date: "2026-07-01", price: 888, cleaning_fee: 0, service_fee: 0, total_price_cents: null },
      ],
      villas,
      monthKeys: ["2026-07"],
    });
    const july = monthlyDetails["2026-07"];
    // Le CA confirmé ne doit PAS inclure les annulations ni le pipeline
    expect(july.gross).toBe(200000); // inchangé
    expect(july.bookingCount).toBe(3); // inchangé
  });
});
