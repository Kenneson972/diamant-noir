import { SUGGESTED_AMENITY_LABELS, SUGGESTED_AMENITY_SET } from "@/lib/villa-amenities-suggested";

/** Chaîne de comparaison tolérante (accents, tirets, espaces). */
export function amenityNormalizeKey(input: string): string {
  return norm(input);
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[''\u2019]/g, "'")
    .replace(/[-–—/_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Synonymes / abréviations → libellé catalogue exact. */
const ALIAS_TO_CANONICAL: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  const add = (aliases: string[], canonical: string) => {
    for (const a of aliases) {
      m[norm(a)] = canonical;
    }
  };

  for (const label of SUGGESTED_AMENITY_LABELS) {
    m[norm(label)] = label;
  }

  add(["wifi", "wi fi", "wi-fi", "wireless", "internet", "internet sans fil"], "Wi-Fi");
  add(["clim", "air conditioning", "ac", "aire conditionne", "climatiseur"], "Climatisation");
  add(["pool", "swimming pool", "private pool"], "Piscine");
  add(["washer", "washing machine", "laundry", "machine a laver"], "Lave-linge");
  add(["dryer", "seche linge", "seche-linge"], "Sèche-linge");
  add(["free parking", "parking on premises", "stationnement", "stationnement gratuit"], "Parking gratuit");
  add(["sea view", "ocean view", "oceanfront", "waterfront", "vue sur mer", "vue ocean"], "Vue mer");
  add(["balcony", "terrace", "patio", "deck"], "Terrasse ou balcon");
  add(["backyard", "garden", "yard"], "Jardin");
  add(["bbq", "grill"], "Barbecue");
  add(["tv", "television", "cable tv", "smart tv"], "Télévision");
  add(["bathtub", "hot tub separate"], "Baignoire");
  add(["hot water"], "Eau chaude");
  add(["smoke alarm", "smoke detector", "detecteur de fumee"], "Détecteur de fumée");
  add(["fire extinguisher"], "Extincteur");
  add(["coffee maker", "coffee machine", "nespresso", "cafe", "machine a cafe"], "Machine à café");
  add(["microwave"], "Micro-ondes");
  add(["dishwasher"], "Lave-vaisselle");
  add(["iron"], "Fer à repasser");
  add(["hangers"], "Cintres");
  add(["bed linens", "extra pillows", "sheets"], "Linge de lit");
  add(["private entrance", "entree publique"], "Entrée privée");
  add(["laptop friendly workspace", "office", "bureau"], "Espace de travail");
  add(["kitchen", "full kitchen", "cooking basics"], "Cuisine équipée");

  return m;
})();

type SubRule = { pattern: string; canonical: string };

/** Règles « contient » (ordre : du plus spécifique au plus large quand ça compte). */
const SUBSTRING_RULES: SubRule[] = [
  { pattern: "micro onde", canonical: "Micro-ondes" },
  { pattern: "micro-ondes", canonical: "Micro-ondes" },
  { pattern: "lave vaisselle", canonical: "Lave-vaisselle" },
  { pattern: "sèche linge", canonical: "Sèche-linge" },
  { pattern: "seche linge", canonical: "Sèche-linge" },
  { pattern: "lave linge", canonical: "Lave-linge" },
  { pattern: "linge de lit", canonical: "Linge de lit" },
  { pattern: "oreiller", canonical: "Linge de lit" },
  { pattern: "couverture supplementaire", canonical: "Linge de lit" },
  { pattern: "fer a repasser", canonical: "Fer à repasser" },
  { pattern: "detecteur de fumee", canonical: "Détecteur de fumée" },
  { pattern: "piscine", canonical: "Piscine" },
  { pattern: "climatisation", canonical: "Climatisation" },
  { pattern: "deshumidificateur", canonical: "Climatisation" },
  { pattern: "clim", canonical: "Climatisation" },
  { pattern: "stationnement gratuit", canonical: "Parking gratuit" },
  { pattern: "parking gratuit", canonical: "Parking gratuit" },
  { pattern: "stationnement", canonical: "Parking gratuit" },
  { pattern: "wifi", canonical: "Wi-Fi" },
  { pattern: "wi fi", canonical: "Wi-Fi" },
  { pattern: "internet", canonical: "Wi-Fi" },
  { pattern: "barbecue", canonical: "Barbecue" },
  { pattern: "bbq", canonical: "Barbecue" },
  { pattern: "terrasse", canonical: "Terrasse ou balcon" },
  { pattern: "balcon", canonical: "Terrasse ou balcon" },
  { pattern: "patio", canonical: "Terrasse ou balcon" },
  { pattern: "jardin", canonical: "Jardin" },
  { pattern: "baignoire", canonical: "Baignoire" },
  { pattern: "eau chaude", canonical: "Eau chaude" },
  { pattern: "extincteur", canonical: "Extincteur" },
  { pattern: "television", canonical: "Télévision" },
  { pattern: "télé", canonical: "Télévision" },
  { pattern: "smart tv", canonical: "Télévision" },
  { pattern: "cuisine", canonical: "Cuisine équipée" },
  { pattern: "equipements de cuisine", canonical: "Cuisine équipée" },
  { pattern: "refrigerateur", canonical: "Cuisine équipée" },
  { pattern: "refrigérateur", canonical: "Cuisine équipée" },
  { pattern: "four", canonical: "Cuisine équipée" },
  { pattern: "plaque de cuisson", canonical: "Cuisine équipée" },
  { pattern: "machine a cafe", canonical: "Machine à café" },
  { pattern: "café", canonical: "Machine à café" },
  { pattern: "vue mer", canonical: "Vue mer" },
  { pattern: "entree privée", canonical: "Entrée privée" },
  { pattern: "cintres", canonical: "Cintres" },
  { pattern: "espace de travail", canonical: "Espace de travail" },
  { pattern: "bureau", canonical: "Espace de travail" },
];

function matchCanonical(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (SUGGESTED_AMENITY_SET.has(trimmed)) return trimmed;

  const n = norm(trimmed);
  if (ALIAS_TO_CANONICAL[n]) return ALIAS_TO_CANONICAL[n];

  for (const { pattern, canonical } of SUBSTRING_RULES) {
    if (n.includes(norm(pattern))) return canonical;
  }

  return null;
}

/**
 * Déduplique et mappe les libellés OTA vers les pastilles catalogue quand c’est pertinent.
 * Les libellés non reconnus sont conservés tels quels (pastilles « personnalisées »).
 */
export function normalizeImportedAmenities(raw: (string | null | undefined)[] | null | undefined): string[] {
  if (!raw?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (item == null) continue;
    const t = String(item).trim();
    if (!t) continue;
    const canonical = matchCanonical(t) ?? t;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    out.push(canonical);
  }
  return out;
}
