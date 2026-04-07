/**
 * Pastilles « catalogue » toujours visibles dans l’éditeur propriétaire.
 * Les imports OTA ajoutent souvent des libellés différents → ils apparaissent en « personnalisés ».
 */
export const SUGGESTED_AMENITY_LABELS = [
  "Wi-Fi",
  "Climatisation",
  "Piscine",
  "Cuisine équipée",
  "Lave-linge",
  "Sèche-linge",
  "Parking gratuit",
  "Vue mer",
  "Terrasse ou balcon",
  "Jardin",
  "Barbecue",
  "Télévision",
  "Baignoire",
  "Eau chaude",
  "Détecteur de fumée",
  "Extincteur",
  "Machine à café",
  "Micro-ondes",
  "Lave-vaisselle",
  "Fer à repasser",
  "Cintres",
  "Linge de lit",
  "Entrée privée",
  "Espace de travail",
] as const;

export const SUGGESTED_AMENITY_SET = new Set<string>(SUGGESTED_AMENITY_LABELS as unknown as string[]);
