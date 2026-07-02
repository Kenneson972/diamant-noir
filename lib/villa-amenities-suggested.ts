export const SUGGESTED_AMENITIES = {
  interior: [
    "Wi-Fi", "Climatisation", "Télévision", "Cuisine équipée", "Lave-linge",
    "Sèche-linge", "Baignoire", "Eau chaude", "Détecteur de fumée", "Machine à café",
    "Micro-ondes", "Lave-vaisselle", "Fer à repasser", "Cintres", "Espace de travail",
    "Entrée privée", "Système audio", "Home cinéma",
  ],
  exterior: [
    "Piscine", "Jardin", "Terrasse ou balcon", "Barbecue", "Parking gratuit",
    "Vue mer", "Transats", "Douche extérieure", "Piscine chauffée", "Pool house",
  ],
  servicesHome: [
    "Draps", "Serviettes", "Ménage fin de séjour", "Linges de maison",
    "Produits d'accueil", "Lit bébé", "Chaise haute",
  ],
  servicesCollection: [
    "Concierge dédié", "Accueil champagne", "Voiturier", "Chef à domicile",
    "Service voiture", "Transfert aéroport",
  ],
  aLaCarte: [
    "Chef privé", "Massage", "Location bateau", "Babysitter", "Visite guidée",
    "Transfert aéroport", "Location voiture", "Cours de plongée", "Petit-déjeuner",
  ],
} as const;

export type AmenityCategory = keyof typeof SUGGESTED_AMENITIES;

// Legacy flat set — rétrocompatibilité avec VillaAmenitiesEditor existant
export const SUGGESTED_AMENITY_SET = new Set(
  Object.values(SUGGESTED_AMENITIES).flat()
);

export const SUGGESTED_AMENITY_LABELS = Object.values(SUGGESTED_AMENITIES).flat();
