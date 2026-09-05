/**
 * Prestations « à venir » destinées aux VOYAGEURS (distinctes des 5 piliers
 * propriétaires de `data/prestations-service-details.ts`).
 *
 * Ce fichier ne porte AUCUN texte : titres, descriptions et textes alternatifs
 * vivent dans `lib/i18n.ts` sous les clés `experiences.<slug>.*`.
 *
 * Les chemins d'images pointent temporairement vers des visuels existants du
 * site (placeholders). Ils seront remplacés par les fichiers de
 * `public/experiences/` une fois générés — voir la section « Images » de la spec
 * `docs/superpowers/specs/2026-08-11-experiences-a-venir-design.md`.
 */
import type { KayvilaPngName } from "@/components/icons/KayvilaPngIcon";

export const EXPERIENCE_SLUGS = [
  "masseur",
  "chef-cuisinier",
  "excursions",
  "garde-enfants",
] as const;

export type ExperienceSlug = (typeof EXPERIENCE_SLUGS)[number];

export function isExperienceSlug(value: string): value is ExperienceSlug {
  return (EXPERIENCE_SLUGS as readonly string[]).includes(value);
}

export type ExperienceDetail = {
  slug: ExperienceSlug;
  /** Icône monoline affichée dans le hero et dans le bandeau bas. */
  icon: KayvilaPngName;
  /** Image hero 16:9 — sert aussi de carte home (recadrée en 4:5) et d'image OpenGraph. */
  hero: string;
  /** `object-position` du hero, pour garder le sujet visible après recadrage. */
  heroPosition: string;
  images: {
    /** Bloc « intro » — 4:3 */
    intro: string;
    /** Bloc « ce qui est inclus » — 4:3 */
    included: string;
  };
};

export const EXPERIENCE_DETAILS: Record<ExperienceSlug, ExperienceDetail> = {
  masseur: {
    slug: "masseur",
    icon: "sparkle",
    hero: "/relation.webp",
    heroPosition: "center 45%",
    images: { intro: "/relation-old.webp", included: "/menage.webp" },
  },
  "chef-cuisinier": {
    slug: "chef-cuisinier",
    icon: "chef",
    hero: "/notregestion.webp",
    heroPosition: "center 40%",
    images: { intro: "/notregestion-old.webp", included: "/marketing.webp" },
  },
  excursions: {
    slug: "excursions",
    icon: "compass",
    hero: "/terrain.webp",
    heroPosition: "center 40%",
    images: { intro: "/terrain-old.webp", included: "/villas-hero.webp" },
  },
  "garde-enfants": {
    slug: "garde-enfants",
    icon: "users",
    hero: "/menage.webp",
    heroPosition: "center 45%",
    images: { intro: "/menage-old.webp", included: "/finance.webp" },
  },
};
