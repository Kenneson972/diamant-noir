import { describe, expect, it } from "vitest";
import {
  EXPERIENCE_SLUGS,
  EXPERIENCE_DETAILS,
  isExperienceSlug,
} from "./experiences";
import { SUPPORTED_LOCALES, t } from "@/lib/i18n";

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

const PER_SLUG_KEYS = [
  "title",
  "eyebrow",
  "tagline",
  "meta_description",
  "intro",
  "item_1_title",
  "item_1_desc",
  "item_2_title",
  "item_2_desc",
  "item_3_title",
  "item_3_desc",
  "item_4_title",
  "item_4_desc",
  "step_1_title",
  "step_1_desc",
  "step_2_title",
  "step_2_desc",
  "step_3_title",
  "step_3_desc",
  "image_alt",
  "image_intro_alt",
  "image_included_alt",
];

const SHARED_KEYS = [
  "experiences.badge_soon",
  "experiences.badge_soon_short",
  "experiences.breadcrumb_root",
  "experiences.breadcrumb_aria",
  "experiences.approach_eyebrow",
  "experiences.included_eyebrow",
  "experiences.included_title",
  "experiences.how_eyebrow",
  "experiences.how_title",
  "experiences.soon_band_title",
  "experiences.soon_band_text",
  "experiences.soon_band_cta",
  "experiences.other_experiences",
  "experiences.meta_suffix",
  "home.upcoming_eyebrow",
  "home.upcoming_title",
  "home.upcoming_subtitle",
  "home.upcoming_card_aria",
  "footer.upcoming",
];

function allKeys(): string[] {
  const perSlug = EXPERIENCE_SLUGS.flatMap((slug) =>
    PER_SLUG_KEYS.map((k) => `experiences.${slug}.${k}`)
  );
  return [...perSlug, ...SHARED_KEYS];
}

describe("i18n des prestations à venir", () => {
  it("définit chaque clé dans les 3 locales", () => {
    const missing: string[] = [];
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of allKeys()) {
        const value = t(locale, key);
        // `t` retourne la clé elle-même quand la traduction est absente,
        // et retombe sur le français : on exige une valeur propre à la locale.
        if (value === key || value.trim() === "") missing.push(`${locale}:${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("n'emploie jamais « à domicile » ni ses équivalents proscrits", () => {
    const banned = [/à domicile/i, /a domicilio/i, /to your door/i];
    const offenders: string[] = [];
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of allKeys()) {
        const value = t(locale, key);
        if (banned.some((re) => re.test(value))) offenders.push(`${locale}:${key}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
