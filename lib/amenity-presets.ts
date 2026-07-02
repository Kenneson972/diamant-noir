export type AmenityPreset = {
  label: string;
  interior: string[];
  exterior: string[];
  servicesHome: string[];
  servicesCollection: string[];
  aLaCarte: string[];
};

export const AMENITY_PRESETS: AmenityPreset[] = [
  {
    label: "Équipements famille",
    interior: ["Lit bébé", "Chaise haute", "Barrière de sécurité"],
    exterior: ["Barrière piscine", "Jeux extérieurs"],
    servicesHome: ["Baignoire bébé", "Protège-prises"],
    servicesCollection: [],
    aLaCarte: ["Babysitter"],
  },
  {
    label: "Villa de luxe",
    interior: ["Système audio", "Home cinéma", "Climatisation centralisée"],
    exterior: ["Piscine chauffée", "Pool house"],
    servicesHome: ["Draps en lin", "Peignoirs", "Produits d'accueil premium"],
    servicesCollection: ["Concierge dédié", "Accueil champagne", "Voiturier"],
    aLaCarte: ["Chef privé", "Massage", "Location bateau", "Transfert aéroport"],
  },
  {
    label: "Villa éco",
    interior: ["Panneaux solaires", "Récupération eau de pluie", "Produits d'entretien bio"],
    exterior: ["Compost", "Potager", "Station de recharge électrique"],
    servicesHome: ["Produits d'accueil bio", "Draps en coton bio"],
    servicesCollection: [],
    aLaCarte: ["Location vélo électrique"],
  },
];
