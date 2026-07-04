import { describe, it, expect } from "vitest";
import { parseDateOnly, formatDate } from "./utils";

describe("parseDateOnly", () => {
  it("ancre une date-only (YYYY-MM-DD) à minuit local, pas UTC", () => {
    const d = parseDateOnly("2026-08-15");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7); // août = index 7
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it("laisse un timestamp complet (avec heure/zone) inchangé", () => {
    const iso = "2026-08-15T23:30:00.000Z";
    expect(parseDateOnly(iso).toISOString()).toBe(iso);
  });

  it("gère les dates de fin/début de mois sans décalage", () => {
    expect(parseDateOnly("2026-01-01").getDate()).toBe(1);
    expect(parseDateOnly("2026-01-01").getMonth()).toBe(0);
    expect(parseDateOnly("2026-12-31").getDate()).toBe(31);
    expect(parseDateOnly("2026-12-31").getMonth()).toBe(11);
  });
});

describe("formatDate", () => {
  it("formate une date-only avec le jour exact, quel que soit le fuseau d'exécution", () => {
    expect(
      formatDate("2026-08-15", { day: "2-digit", month: "2-digit", year: "numeric" })
    ).toBe("15/08/2026");
  });

  it("accepte toujours un timestamp complet (comportement historique préservé)", () => {
    const label = formatDate("2026-01-15T10:00:00.000Z", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    expect(label).toMatch(/^\d{2}\/\d{2}\/2026$/);
  });

  it("fonctionne sans options (comportement par défaut)", () => {
    expect(formatDate("2026-03-05")).toBe(new Date(2026, 2, 5).toLocaleDateString("fr-FR"));
  });
});
