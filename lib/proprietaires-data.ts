// lib/proprietaires-data.ts

type EditorialQuote = { quote: string; author: string; place: string };

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

export const TEMOIGNAGE_PROPRIO: EditorialQuote = {
  quote:
    "Au-delà de la location, c'est un partenaire qui sécurise le bien, les réservations et la relation voyageurs. Une vraie tranquillité pour un propriétaire exigeant.",
  author: "M. R.",
  place: "Propriétaire — Sud Martinique",
};
