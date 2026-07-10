/**
 * Bornes frames (séquence WebP ~15fps extraite de LANDINGPAGE.mp4).
 *
 * **Finance** : le plan « café + tablette » sur le marbre arrive plus tard que l’entrée
 * dans la cuisine (travelling / plan large). On n’affiche la carte Finance qu’à partir
 * de ~505 ; les frames 421–504 restent sans popup.
 * Ajuster avec `window.__PVSH_LOG_FRAMES = true` en dev si la source change.
 */
/**
 * Copie textuelle (title/tagline/items) déplacée vers `lib/i18n.ts` sous les clés
 * `services.<id>.title` / `services.<id>.tagline` / `services.<id>.item_N` — cette
 * structure ne porte plus que les données non textuelles (timing, mise en page).
 * Source de vérité unique consommée par `HomeServicesSection.tsx` (Task 1) et
 * `PrestationsPageClient.tsx`/`app/prestations/services/[slug]/page.tsx` (Task 3).
 */
export type ScrollSection = {
  id: string;
  label: string;
  scene: string;
  startFrame: number;
  endFrame: number;
  position: "left" | "right";
  vertical?: "center" | "upper" | "lower";
  /** Nombre d'items dans `services.<id>.item_1` … `services.<id>.item_N` (voir lib/i18n.ts) */
  itemCount: number;
};

export const SCROLL_SECTIONS: ScrollSection[] = [
  {
    id: "marketing",
    label: "01",
    scene: "Extérieur · Piscine",
    startFrame: 0,
    endFrame: 88,
    position: "left",
    vertical: "lower",
    itemCount: 4,
  },
  // gap 89-114 : transition extérieur → salon (marketing fade-out complet avant l'apparition operations)
  {
    id: "operations",
    label: "02",
    scene: "Salon · Vue Mer",
    startFrame: 112,
    endFrame: 200,
    position: "right",
    vertical: "upper",
    itemCount: 4,
  },
  // gap 224-247 : couloir vitré → chambre (operations fade-out complet avant voyageurs)
  {
    id: "voyageurs",
    label: "03",
    scene: "Chambre · Balcon Océan",
    startFrame: 248,
    endFrame: 313,
    position: "left",
    vertical: "upper",
    itemCount: 4,
  },
  // gap 337-356 : chambre → escalier (voyageurs fade-out complet avant menage)
  {
    id: "menage",
    label: "04",
    scene: "Escalier · Hall Intérieur",
    startFrame: 357,
    endFrame: 397,
    position: "right",
    vertical: "upper",
    itemCount: 5,
  },
  // gap 421-423 : escalier → cuisine (menage fade-out)
  // Finance démarre dans la cuisine (îlot marbre, expresso, épices = pack démarrage visible) jusqu'à la fin
  {
    id: "finance",
    label: "05",
    scene: "Cuisine · Plan de Travail Marbre",
    startFrame: 424,
    endFrame: 560,
    position: "left",
    vertical: "upper",
    itemCount: 4,
  },
];
