import { describe, it, expect } from "vitest";
import { computeMomChange, shiftMonthKey } from "./monthly-comparison";

describe("computeMomChange", () => {
  it("hausse : 1200 vs 1000 → +20", () => {
    expect(computeMomChange(1200, 1000)).toBe(20);
  });

  it("baisse : 800 vs 1000 → -20", () => {
    expect(computeMomChange(800, 1000)).toBe(-20);
  });

  it("mois précédent à 0 → null (pas de division par zéro)", () => {
    expect(computeMomChange(500, 0)).toBeNull();
  });

  it("les deux mois à 0 → null", () => {
    expect(computeMomChange(0, 0)).toBeNull();
  });

  it("valeur identique → 0", () => {
    expect(computeMomChange(1000, 1000)).toBe(0);
  });
});

describe("shiftMonthKey", () => {
  it("mois précédent dans la même année : 2026-07 → 2026-06", () => {
    expect(shiftMonthKey("2026-07", -1)).toBe("2026-06");
  });

  it("changement d'année : 2026-01 → 2025-12", () => {
    expect(shiftMonthKey("2026-01", -1)).toBe("2025-12");
  });

  it("un an en arrière : 2026-07 → 2025-07", () => {
    expect(shiftMonthKey("2026-07", -12)).toBe("2025-07");
  });

  it("décalage positif : 2025-11 → 2026-01", () => {
    expect(shiftMonthKey("2025-11", 2)).toBe("2026-01");
  });
});
