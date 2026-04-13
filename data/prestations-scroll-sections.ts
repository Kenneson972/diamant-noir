/**
 * Bornes frames (séquence WebP ~15fps extraite de LANDINGPAGE.mp4).
 *
 * **Finance** : le plan « café + tablette » sur le marbre arrive plus tard que l’entrée
 * dans la cuisine (travelling / plan large). On n’affiche la carte Finance qu’à partir
 * de ~505 ; les frames 421–504 restent sans popup.
 * Ajuster avec `window.__PVSH_LOG_FRAMES = true` en dev si la source change.
 */
export type ScrollSection = {
  id: string;
  label: string;
  title: string;
  tagline: string;
  scene: string;
  startFrame: number;
  endFrame: number;
  position: "left" | "right";
  vertical?: "center" | "upper" | "lower";
  items: string[];
};

export const SCROLL_SECTIONS: ScrollSection[] = [
  {
    id: "marketing",
    label: "01",
    title: "Marketing & Visibilité",
    tagline: "Stratégie · Diffusion · Prix",
    scene: "Extérieur · Piscine",
    startFrame: 0,
    endFrame: 88,
    position: "left",
    vertical: "lower",
    items: [
      "Estimation de valeur locative",
      "Photos professionnelles",
      "Diffusion multi-plateformes",
      "Gestion dynamique des prix",
    ],
  },
  // gap 89-114 : transition extérieur → salon (marketing fade-out complet avant l'apparition operations)
  {
    id: "operations",
    label: "02",
    title: "Opérations & Terrain",
    tagline: "Check-in · Check-out · Zéro contrainte",
    scene: "Salon · Vue Mer",
    startFrame: 112,
    endFrame: 200,
    position: "right",
    vertical: "upper",
    items: [
      "Check-in / Check-out pris en charge",
      "Contrôles qualité entre chaque séjour",
      "Coordination ménages & réparations",
      "Entretien du linge de maison",
    ],
  },
  // gap 224-247 : couloir vitré → chambre (operations fade-out complet avant voyageurs)
  {
    id: "voyageurs",
    label: "03",
    title: "Relation Voyageurs",
    tagline: "7j/7 · Aucune sollicitation",
    scene: "Chambre · Balcon Océan",
    startFrame: 248,
    endFrame: 313,
    position: "left",
    vertical: "upper",
    items: [
      "Pilotage des réservations",
      "Échanges avec les locataires",
      "Suivi et réponse aux avis",
      "Zéro notification pour vous",
    ],
  },
  // gap 337-356 : chambre → escalier (voyageurs fade-out complet avant menage)
  {
    id: "menage",
    label: "04",
    title: "Ménage & Blanchisserie",
    tagline: "Facturés aux voyageurs · Hors commission",
    scene: "Escalier · Hall Intérieur",
    startFrame: 357,
    endFrame: 397,
    position: "right",
    vertical: "upper",
    items: [
      "Frais de ménage facturés aux voyageurs",
      "Blanchisserie incluse hors commission 20%",
      "Coordination complète des équipes",
      "Réassort consommables à nos frais",
    ],
  },
  // gap 421-423 : escalier → cuisine (menage fade-out)
  // Finance démarre dans la cuisine (îlot marbre, expresso, épices = pack démarrage visible) jusqu'à la fin
  {
    id: "finance",
    label: "05",
    title: "Finance & Reversements",
    tagline: "Encaissement · Reporting · Copilot",
    scene: "Cuisine · Plan de Travail Marbre",
    startFrame: 424,
    endFrame: 560,
    position: "left",
    vertical: "upper",
    items: [
      "Encaissement et reversement des loyers",
      "Pack démarrage 1ère location",
      "Reporting clair en ligne",
      "Accès exclusif Assistant Copilot Proprio",
    ],
  },
];
