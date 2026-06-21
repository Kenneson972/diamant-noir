import { describe, it, expect } from "vitest";
import { buildDailyRecap } from "@/lib/proactive/daily-recap";

describe("buildDailyRecap", () => {
  it("hasSignal false si tout est vide", () => {
    const r = buildDailyRecap({ submissions: [], leads: [], bookings: [], icalErrors: [] });
    expect(r.hasSignal).toBe(false);
  });
  it("hasSignal true si au moins une section non vide", () => {
    const r = buildDailyRecap({ submissions: ["Villa X"], leads: [], bookings: [], icalErrors: [] });
    expect(r.hasSignal).toBe(true);
    expect(r.sections[0].lines).toEqual(["Villa X"]);
  });
  it("toutes les sections sont présentes", () => {
    const r = buildDailyRecap({ submissions: ["S"], leads: ["L"], bookings: ["B"], icalErrors: ["E"] });
    expect(r.sections.map((s) => s.title)).toEqual([
      "Nouvelles soumissions villa",
      "Nouveaux leads",
      "Réservations du jour",
      "Erreurs iCal",
    ]);
  });
});
