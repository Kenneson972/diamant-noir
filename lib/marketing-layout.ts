/**
 * Mise en page « landing » pour les pages marketing.
 * Fallback : définir NEXT_PUBLIC_MARKETING_SIMPLE_LEGAL=1 pour des pages légales en une colonne simple
 * (sans sections alternées). Les pages About / Prestations / Contact restent en mode landing.
 */
export const marketingSimpleLegal =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_MARKETING_SIMPLE_LEGAL === "1";
