// lib/proprietaires-data.ts

type EditorialQuote = { quote: string; author: string; place: string };

/**
 * Visuels dédiés `/proprietaires` — déposer les fichiers dans `public/proprietaires/`
 * puis remplacer les chemins (ex. `/proprietaires/pourquoi.jpg`).
 * Tant que les fichiers n’existent pas, les fallbacks pointent vers `/villa-hero.jpg`.
 */
export const PROPRIO_LANDING_IMAGES = {
  splitPourquoi: "/villa-hero.jpg",
  splitInclusions: "/villa-hero.jpg",
  fondTemoignage: "/villa-hero.jpg",
} as const;

export const PROPRIO_LANDING_IMAGE_ALTS = {
  splitPourquoi: "Villa de prestige en Martinique",
  splitInclusions: "Intérieur et standing — gestion clé en main",
  fondTemoignage: "",
} as const;

export const INCLUSIONS = [
  "Estimation de valeur locative",
  "Check-in / Check-out",
  "Prise de photos professionnelles",
  "Rédaction et diffusion d'annonces de location sur différentes plateformes ou optimisation d'une annonce existante par notre conciergerie",
  "Contrôles qualité",
  "Pilotage des réservations",
  "Échanges avec les locataires",
  "Organisation des ménages, de petites réparations et suivi des différents intervenants",
  "Entretien et mise en place du linge de maison",
  "Réassort des consommables de bienvenue (à nos frais)",
  "Encaissement et reversement des loyers",
  "Suivi des commentaires et valorisation de ceux-ci",
  "Gestion dynamique des prix",
] as const;

const MID_INCLUSIONS = Math.ceil(INCLUSIONS.length / 2);
export const INCLUSIONS_COL_A = INCLUSIONS.slice(0, MID_INCLUSIONS);
export const INCLUSIONS_COL_B = INCLUSIONS.slice(MID_INCLUSIONS);

/** Affichage initial sur la landing proprio ; le reste est dans un `<details>`. */
export const INCLUSIONS_HIGHLIGHT_COUNT = 4;
export const INCLUSIONS_HIGHLIGHTS = INCLUSIONS.slice(0, INCLUSIONS_HIGHLIGHT_COUNT);
const INCLUSIONS_REMAINING = INCLUSIONS.slice(INCLUSIONS_HIGHLIGHT_COUNT);
const MID_REST = Math.ceil(INCLUSIONS_REMAINING.length / 2);
export const INCLUSIONS_REST_COL_A = INCLUSIONS_REMAINING.slice(0, MID_REST);
export const INCLUSIONS_REST_COL_B = INCLUSIONS_REMAINING.slice(MID_REST);

/** Piliers : ligne courte au-dessus, détail dans « En savoir plus ». */
export const WHY_PILLARS = [
  {
    title: "Visibilité & revenue",
    short: "Positionnement luxe et diffusion ciblée haut de gamme.",
    detail:
      "Positionnement luxe, pricing et diffusion alignés sur une clientèle haut de gamme.",
  },
  {
    title: "Conciergerie 24/7",
    short: "Accueil, entretien et demandes voyageurs, équipe sur le terrain.",
    detail:
      "Accueil, housekeeping, demandes voyageurs : une équipe dédiée sur le terrain.",
  },
  {
    title: "Sérénité propriétaire",
    short: "Suivi transparent et relation de confiance dans la durée.",
    detail:
      "Suivi transparent, standards élevés et relation de confiance sur la durée.",
  },
] as const;

export const COMMISSION_CAPTION_BRIEF =
  "TTC sur le montant net des nuitées collectées.";

export const COMMISSION_CAPTION_FULL =
  "Frais de ménage et blanchisserie facturés aux voyageurs, hors commission.";

export const PREMIERE_LOCATION_SUPPLEMENT =
  "En supplément — uniquement pour la première location réalisée par notre conciergerie — un pack de démarrage vous sera facturé (sucre, café, eau, poivre, huile, épices, papier toilette, savon, boîte à clefs, inventaire).";

export const TEMOIGNAGE_PROPRIO: EditorialQuote = {
  quote:
    "Au-delà de la location, c'est un partenaire qui sécurise le bien, les réservations et la relation voyageurs. Une vraie tranquillité pour un propriétaire exigeant.",
  author: "M. R.",
  place: "Propriétaire — Sud Martinique",
};
