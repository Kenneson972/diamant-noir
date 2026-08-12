import { describe, expect, it } from "vitest";
import {
  EXPERIENCE_SLUGS,
  EXPERIENCE_DETAILS,
  isExperienceSlug,
} from "./experiences";

describe("EXPERIENCE_SLUGS", () => {
  it("contient exactement les 4 prestations à venir", () => {
    expect([...EXPERIENCE_SLUGS]).toEqual([
      "masseur",
      "chef-cuisinier",
      "excursions",
      "garde-enfants",
    ]);
  });

  it("n'a aucun doublon", () => {
    expect(new Set(EXPERIENCE_SLUGS).size).toBe(EXPERIENCE_SLUGS.length);
  });
});

describe("isExperienceSlug", () => {
  it("accepte un slug connu", () => {
    expect(isExperienceSlug("chef-cuisinier")).toBe(true);
  });

  it("refuse un slug inconnu", () => {
    expect(isExperienceSlug("marketing")).toBe(false);
    expect(isExperienceSlug("")).toBe(false);
  });
});

describe("EXPERIENCE_DETAILS", () => {
  it("expose une entrée par slug, cohérente avec sa clé", () => {
    for (const slug of EXPERIENCE_SLUGS) {
      expect(EXPERIENCE_DETAILS[slug]).toBeDefined();
      expect(EXPERIENCE_DETAILS[slug].slug).toBe(slug);
    }
  });

  it("déclare trois chemins d'images absolus par prestation", () => {
    for (const slug of EXPERIENCE_SLUGS) {
      const d = EXPERIENCE_DETAILS[slug];
      for (const src of [d.hero, d.images.intro, d.images.included]) {
        expect(src.startsWith("/")).toBe(true);
      }
    }
  });
});
