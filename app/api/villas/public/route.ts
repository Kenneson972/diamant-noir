import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Champs publics uniquement — aucune donnée propriétaire/sensible
const SAFE_FIELDS =
  "id, name, slug, description, price_per_night, capacity, location, image_url, image_urls, amenities, bathrooms_count, surface_m2, collection_tier, latitude, longitude";

/**
 * Catalogue villas public — consommé par l'Agent A (chatbot visiteur n8n).
 * Aucune authentification : ne renvoie que les villas publiées et des champs non sensibles.
 * `?search=` filtre sur nom / localisation / description.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Neutralise les caractères qui casseraient la syntaxe du filtre `.or()`
    const search = (searchParams.get("search") || "").replace(/[,()]/g, " ").trim();

    const supabase = supabaseAdmin();
    let query = supabase
      .from("villas")
      .select(SAFE_FIELDS)
      .eq("is_published", true)
      .order("price_per_night", { ascending: true });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,location.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error("[villas/public] query failed", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json(
      { villas: data ?? [], count: data?.length ?? 0 },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[villas/public] error", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
