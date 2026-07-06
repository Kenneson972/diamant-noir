export type AmenityCategoryInput = {
  interior: string[];
  exterior: string[];
  servicesHome: string[];
  servicesCollection: string[];
  aLaCarte: string[];
};

export type AmenitiesPreview = {
  preview: string[];
  total: number;
};

const PREVIEW_LIMIT = 10;

/**
 * Aperçu plat (façon Airbnb) des équipements d'une villa : jusqu'à 10 items
 * dédupliqués, priorité Intérieur > Extérieur > Services (domicile > collection > à la carte).
 * `total` counts all the items of all the categories (before dedup), used
 * for the button "Voir les N équipements".
 */
export function buildAmenitiesPreview(input: AmenityCategoryInput): AmenitiesPreview {
  const ordered = [
    ...input.interior,
    ...input.exterior,
    ...input.servicesHome,
    ...input.servicesCollection,
    ...input.aLaCarte,
  ];

  const total = ordered.length;

  const seen = new Set<string>();
  const preview: string[] = [];
  for (const item of ordered) {
    if (!item || seen.has(item)) continue;
    seen.add(item);
    preview.push(item);
    if (preview.length >= PREVIEW_LIMIT) break;
  }

  return { preview, total };
}
