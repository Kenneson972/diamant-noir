import { NextResponse } from "next/server";
import { enrichListingWithAi } from "@/lib/listing-import-ai";
import {
  fetchListingForImport,
  isAllowedListingUrl,
  parseListingFromHtml,
} from "@/lib/listing-import";
import type { ListingFieldSource, ListingImportApiResponse } from "@/lib/listing-import-types";
import { normalizeImportedAmenities } from "@/lib/amenity-import-normalize";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string; useAi?: boolean };
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const useAi = Boolean(body.useAi);

    if (!url) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    if (!isAllowedListingUrl(url)) {
      return NextResponse.json(
        {
          error:
            "URL non autorisée pour l’import. Utilisez un lien d’annonce pris en charge (ex. Airbnb, Booking…), ou configurez LISTING_IMPORT_ALLOW_ANY_PUBLIC_URL avec précaution.",
        },
        { status: 400 }
      );
    }

    const html = await fetchListingForImport(url);
    const parsed = parseListingFromHtml(html, url);

    const enrichment = await enrichListingWithAi(parsed, url, html, { useAi });
    const merged = enrichment.merged;

    const amenitiesNormalized =
      Array.isArray(merged.amenities) && merged.amenities.length > 0
        ? normalizeImportedAmenities(merged.amenities)
        : merged.amenities;

    function sourceable(
      row: typeof merged,
      k: keyof typeof merged
    ): boolean {
      const v = row[k];
      if (v == null) return false;
      if (typeof v === "string") return v.trim() !== "";
      if (typeof v === "number") return Number.isFinite(v);
      if (Array.isArray(v)) return v.length > 0;
      return false;
    }

    const tracked: (keyof typeof merged)[] = [
      "name",
      "description",
      "location",
      "capacity",
      "price_per_night",
      "bathrooms_count",
      "surface_m2",
      "check_in_time",
      "check_out_time",
      "latitude",
      "longitude",
      "house_rules",
      "cancellation_policy",
      "safety_info",
      "environment",
      "nearby_points",
      "amenities",
      "image_url",
      "image_urls",
    ];

    const field_sources: Partial<Record<string, ListingFieldSource>> = {};
    for (const k of tracked) {
      if (enrichment.field_sources[k as string]) {
        field_sources[k as string] = enrichment.field_sources[k as string]!;
      } else if (sourceable(merged, k)) {
        field_sources[k as string] = "parser";
      }
    }

    const payload: ListingImportApiResponse = {
      ...merged,
      amenities: amenitiesNormalized ?? merged.amenities,
      image_url: merged.image_url ?? parsed.image_url,
      image_urls:
        merged.image_urls?.length ? merged.image_urls : parsed.image_urls,
      field_sources,
      ai_used: enrichment.ai_used,
      ai_note: enrichment.ai_note ?? null,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("import-airbnb:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
