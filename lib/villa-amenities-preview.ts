import type { KayvilaPngName } from "@/components/icons/KayvilaPngIcon";

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

  const total = ordered.filter((item) => item !== "").length;

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

/**
 * Associe un label d'équipement libre à une icône Kayvila. Fonction pure,
 * partagée entre le composant client (aperçu + modale) et la page serveur
 * (sous-liste "Services à la carte") — ne doit jamais vivre dans un module
 * "use client", sous peine d'erreur RSC "client function called from server".
 */
export const getEquipmentIcon = (label: string): KayvilaPngName => {
  const a = label.toLowerCase();
  if (a.includes("wifi")) return "wifi";
  if (a.includes("climatisation") || a.includes("clim")) return "ac";
  if (a.includes("piscine")) return "pool";
  if (a.includes("jacuzzi")) return "pool";
  if (a.includes("barbecue") || a.includes("bbq")) return "fireplace";
  if (a.includes("jardin") || a.includes("terrasse") || a.includes("extérieur")) return "tree";
  if (a.includes("parking") || a.includes("garage")) return "car";
  if (a.includes("cuisine") || a.includes("réfrigérateur")) return "kitchen";
  if (a.includes("tv") || a.includes("télé") || a.includes("écran")) return "tv";
  if (a.includes("machine à laver") || a.includes("lave-linge")) return "wash";
  if (a.includes("chef") || a.includes("restauration")) return "chef";
  if (a.includes("bateau") || a.includes("nautique") || a.includes("mer") || a.includes("vue") || a.includes("plage")) return "boat";
  if (a.includes("massage") || a.includes("spa") || a.includes("bien-être")) return "heart";
  if (a.includes("concierge") || a.includes("accueil") || a.includes("dédié")) return "users";
  if (a.includes("ménage") || a.includes("draps") || a.includes("serviettes") || a.includes("linge")) return "bed";
  if (a.includes("borne") || a.includes("ev") || a.includes("électrique")) return "car";
  if (a.includes("salle de sport") || a.includes("fitness") || a.includes("gym")) return "gym";
  if (a.includes("sécurité") || a.includes("alarme") || a.includes("caméra")) return "shield-check";
  if (a.includes("clé") || a.includes("autonome") || a.includes("self")) return "key";
  if (a.includes("transfert") || a.includes("navette") || a.includes("transport")) return "plane";
  return "check-circle";
};
