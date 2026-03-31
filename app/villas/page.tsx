import { getSupabaseServer } from "@/lib/supabase-server";
import { unstable_noStore as noStore } from "next/cache";
import VillasMapView from "@/components/VillasMapView";
import type { VillaMapItem } from "@/components/VillaLeafletMap";

export const dynamic = "force-dynamic";

// Coordonnées par défaut par zone Martinique (fallback si pas de lat/lng en base)
const COORD_FALLBACKS: Record<string, [number, number]> = {
  "diamant":       [14.4750, -61.0247],
  "le diamant":    [14.4750, -61.0247],
  "anses":         [14.4917, -61.0650],
  "anses-d'arlet": [14.4917, -61.0650],
  "anses d'arlet": [14.4917, -61.0650],
  "trois-ilets":   [14.5361, -61.0261],
  "trois ilets":   [14.5361, -61.0261],
  "marin":         [14.4722, -60.8739],
  "le marin":      [14.4722, -60.8739],
  "sainte-anne":   [14.4333, -60.8833],
  "sainte anne":   [14.4333, -60.8833],
  "francois":      [14.6167, -60.9000],
  "le françois":   [14.6167, -60.9000],
  "nord":          [14.7500, -61.0000],
  "martinique":    [14.6415, -61.0242],
};

function getCoordFallback(location: string | null): [number, number] {
  if (!location) return [14.6415, -61.0242]; // Centre Martinique par défaut
  const loc = location.toLowerCase();
  for (const [key, coords] of Object.entries(COORD_FALLBACKS)) {
    if (loc.includes(key)) return coords;
  }
  return [14.6415, -61.0242]; // Centre Martinique
}

export default async function VillasListingPage() {
  noStore();
  let villas: VillaMapItem[] = [];

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("villas")
      .select("id,name,location,price_per_night,image_url,image_urls,latitude,longitude")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      villas = data.map((villa) => ({
        id: villa.id,
        name: villa.name,
        location: villa.location || "Martinique",
        price: villa.price_per_night,
        image: villa.image_url || villa.image_urls?.[0] || "/villa-hero.jpg",
        coords:
          villa.latitude && villa.longitude
            ? [villa.latitude, villa.longitude] as [number, number]
            : getCoordFallback(villa.location),
      }));
    }
  } catch (err) {
    console.error("Supabase fetch error (villas):", err);
  }

  return (
    <main className="min-h-screen bg-offwhite">
      {/* ── Hero Header ── */}
      <section className="relative bg-navy overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 pt-40 pb-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="space-y-5 max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-gold" />
                <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold">
                  La Sélection
                </span>
              </div>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-white leading-[1.06]">
                Nos Villas
                <br />
                de Légende.
              </h1>
              <p className="text-white/45 text-lg font-light leading-relaxed max-w-md">
                Une collection confidentielle de résidences d'exception,
                choisies pour leur caractère unique et leur environnement hors du commun.
              </p>
            </div>
            <div className="flex items-end gap-3 md:pb-2">
              <span className="font-display text-7xl md:text-8xl text-white/10 leading-none select-none">
                {String(villas.length).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-4">
                propriétés
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Split view: list + map ── */}
      {villas.length === 0 ? (
        <section className="mx-auto max-w-4xl px-6 py-16">
          <div className="border border-navy/10 bg-white p-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-navy/35 mb-2">
              La Sélection
            </p>
            <h2 className="font-display text-2xl text-navy mb-3">
              Aucune villa publiée pour le moment
            </h2>
            <p className="text-sm text-navy/55 max-w-xl mx-auto">
              Publiez au moins une villa depuis le dashboard propriétaire pour alimenter cette page.
            </p>
          </div>
        </section>
      ) : (
        <VillasMapView villas={villas} />
      )}
    </main>
  );
}
