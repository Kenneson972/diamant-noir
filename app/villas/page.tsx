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

const FALLBACK_VILLAS: VillaMapItem[] = [
  { id: "1", name: "Villa Diamant Noir", location: "Le Diamant, Martinique", price: 1000, image: "/villa-hero.jpg", coords: [14.4750, -61.0247] },
  { id: "2", name: "Villa Horizon", location: "Les Anses-d'Arlet, Martinique", price: 1200, image: "/villa-hero.jpg", coords: [14.4917, -61.0650] },
  { id: "3", name: "Villa Émeraude", location: "Trois-Îlets, Martinique", price: 900, image: "/villa-hero.jpg", coords: [14.5361, -61.0261] },
];

function formatIsoDateFr(d: string) {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export default async function VillasListingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  noStore();
  const sp = await searchParams;
  const qCheckin = typeof sp.checkin === "string" ? sp.checkin : "";
  const qCheckout = typeof sp.checkout === "string" ? sp.checkout : "";
  const qGuests = typeof sp.guests === "string" ? sp.guests : "";
  const dateIntent = Boolean(qCheckin && qCheckout);
  let villas: VillaMapItem[] = FALLBACK_VILLAS;

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

        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-10 xs:pt-32 xs:pb-12 md:pt-40 md:pb-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="space-y-5 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
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
              <p className="text-white/65 text-lg font-light leading-relaxed max-w-md">
                Une collection confidentielle de résidences d'exception,
                choisies pour leur caractère unique et leur environnement hors du commun.
              </p>
            </div>
            <div className="flex items-end gap-3 md:pb-2 animate-in fade-in duration-700 delay-300">
              <span className="font-display text-7xl md:text-8xl text-white/10 leading-none select-none">
                {String(villas.length).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/45 mb-4">
                propriétés
              </span>
            </div>
          </div>
        </div>
      </section>

      {dateIntent && (
        <div className="border-b border-navy/10 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-navy">
              <span className="font-bold uppercase tracking-[0.2em] text-navy/45">Dates</span>{" "}
              du {formatIsoDateFr(qCheckin)} au {formatIsoDateFr(qCheckout)}
              {qGuests ? ` · ${qGuests} voyageur${parseInt(qGuests, 10) > 1 ? "s" : ""}` : ""}
            </p>
            <p className="text-xs text-navy/50">
              Ouvrez une villa pour vérifier les disponibilités et finaliser sur la fiche.
            </p>
          </div>
        </div>
      )}

      {/* ── Split view: list + map (catalogue unique) ── */}
      <div id="catalogue" className="scroll-mt-24">
        <VillasMapView villas={villas} />
      </div>
    </main>
  );
}
