// ============================================================
// Diamant Noir — Récupération et normalisation du contexte villas
// Seules les données publiées et sûres sont exposées au chatbot
// ============================================================

import { supabaseAdmin } from "@/lib/supabase";
import type { VillaContextItem } from "@/types/chatbot";

// Champs sûrs à exposer dans le contexte chatbot (jamais ical_url, access_token)
const SAFE_VILLA_FIELDS =
  "id, name, description, price_per_night, capacity, location, amenities, image_url" as const;

/**
 * Récupère les villas publiées depuis Supabase.
 * Retourne uniquement les champs sûrs pour le chatbot.
 * En cas d'erreur, retourne un tableau vide — jamais d'exception non gérée.
 */
export async function getPublishedVillasForChatbot(): Promise<VillaContextItem[]> {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("villas")
      .select(SAFE_VILLA_FIELDS)
      .eq("is_published", true)
      .order("name");

    if (error) {
      console.error("[chatbot/villa-context] Supabase error:", error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map(normalizeVilla);
  } catch (err) {
    console.error("[chatbot/villa-context] Unexpected error:", err);
    return [];
  }
}

function normalizeVilla(raw: Record<string, unknown>): VillaContextItem {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    description: raw.description ? String(raw.description) : null,
    price_per_night: Number(raw.price_per_night ?? 0),
    capacity: Number(raw.capacity ?? 0),
    location: raw.location ? String(raw.location) : null,
    amenities: Array.isArray(raw.amenities) ? raw.amenities.map(String) : [],
    image_url: raw.image_url ? String(raw.image_url) : null,
  };
}

/**
 * Extrait la liste unique des équipements de toutes les villas.
 */
export function extractUniqueAmenities(villas: VillaContextItem[]): string[] {
  const all = villas.flatMap((v) => v.amenities);
  return Array.from(new Set(all));
}
