/**
 * Types partagés pour l’import d’annonce (HTML → champs villa).
 */

export type ListingFieldSource = "parser" | "ai" | "n8n";

export type ListingImportResult = {
  name?: string | null;
  description?: string | null;
  location?: string | null;
  capacity?: number | null;
  price_per_night?: number | null;
  bathrooms_count?: number | null;
  surface_m2?: number | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  house_rules?: string | null;
  cancellation_policy?: string | null;
  safety_info?: string | null;
  environment?: string | null;
  nearby_points?: string[] | null;
  /** Liste brute (badges / équipements) — fusionnée avec le formulaire */
  amenities?: string[] | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  warnings?: string[];
  /** Ex. airbnb | booking | unknown */
  source?: string | null;
  partial?: boolean;
};

export type ListingImportApiResponse = ListingImportResult & {
  field_sources?: Partial<Record<string, ListingFieldSource>>;
  ai_used?: boolean;
  ai_note?: string | null;
};
