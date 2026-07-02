import { describe, it, expect } from "vitest";
import { EDITOR_SECTIONS, sectionsForRole } from "./villa-editor-sections";

describe("EDITOR_SECTIONS", () => {
  it("a des ids uniques", () => {
    const ids = EDITOR_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("chaque section a un label et une phrase d'aide non vides", () => {
    for (const s of EDITOR_SECTIONS) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.help.length).toBeGreaterThan(0);
    }
  });
});

describe("sectionsForRole", () => {
  it("proprio : aucun bloc admin, ical rangé en config", () => {
    const sections = sectionsForRole(false);
    expect(sections.every((s) => s.bloc !== "admin")).toBe(true);
    expect(sections.find((s) => s.id === "ical")?.bloc).toBe("config");
  });

  it("admin : la section admin existe et ical passe en bloc admin", () => {
    const sections = sectionsForRole(true);
    expect(sections.some((s) => s.id === "admin")).toBe(true);
    expect(sections.find((s) => s.id === "ical")?.bloc).toBe("admin");
  });

  it("les statusKey pointent vers des clés de sectionCompleteness", () => {
    const validKeys = ["infos", "photos", "equipments", "rooms", "pricing", "availability", "contacts", "services", "rules", "safety"];
    for (const s of EDITOR_SECTIONS) {
      if (s.statusKey !== null) expect(validKeys).toContain(s.statusKey);
    }
  });
});
