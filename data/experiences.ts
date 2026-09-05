/**
 * Prestations « à venir » destinées aux VOYAGEURS (distinctes des 5 piliers
 * propriétaires de `data/prestations-service-details.ts`).
 *
 * Ce fichier ne porte AUCUN texte : titres, descriptions et textes alternatifs
 * vivent dans `lib/i18n.ts` sous les clés `experiences.<slug>.*`.
 *
 * Visuels définitifs dans `public/experiences/` (générés 2026-09-05).
 *
 * ⚠️ `chef-intro` et `chef-inclus` ont été rendus en 16:9 alors que leurs
 * emplacements sont en `aspect-[4/3]` : ils sont donc recadrés d'environ un
 * quart en haut et en bas par `object-cover`. Vérifié visuellement, le sujet
 * reste centré dans les deux cas.
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
    hero: "/experiences/masseur-hero.webp",
    // La table de massage occupe la bande centrale : elle doit rester entière
    // dans le recadrage 4:5 des cartes de la home.
    heroPosition: "center 55%",
    images: {
      intro: "/experiences/masseur-intro.webp",
      included: "/experiences/masseur-inclus.webp",
    },
  },
  "chef-cuisinier": {
    slug: "chef-cuisinier",
    icon: "chef",
    hero: "/experiences/chef-hero.webp",
    // Les deux chefs sont dans le tiers supérieur, au-dessus de la table.
    heroPosition: "center 40%",
    images: {
      intro: "/experiences/chef-intro.webp",
      included: "/experiences/chef-inclus.webp",
    },
  },
  excursions: {
    slug: "excursions",
    icon: "compass",
    hero: "/experiences/excursions-hero.webp",
    // Le Rocher du Diamant est posé sur la ligne d'horizon, à mi-hauteur.
    heroPosition: "center 45%",
    images: {
      intro: "/experiences/excursions-intro.webp",
      included: "/experiences/excursions-inclus.webp",
    },
  },
  "garde-enfants": {
    slug: "garde-enfants",
    icon: "users",
    hero: "/experiences/garde-enfants-hero.webp",
    // Les enfants sont assis au sol, dans la moitié basse du cadre.
    heroPosition: "center 60%",
    images: {
      intro: "/experiences/garde-enfants-intro.webp",
      included: "/experiences/garde-enfants-inclus.webp",
    },
  },
};
