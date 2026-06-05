"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Scale, Users, Maximize2, X, Waves } from "lucide-react";
import { useCompare } from "@/contexts/CompareContext";
import { KayvilaEmptyState, KayvilaNumberValue } from "@/components/ui/pro";
import { getSupabaseBrowser } from "@/lib/supabase";

type CompareVilla = {
  id: string;
  name: string;
  location: string | null;
  price_per_night: number;
  capacity: number | null;
  surface_m2: number | null;
  bathrooms_count: number | null;
  image_url: string | null;
  amenities: string[] | null;
};

export default function ComparePage() {
  const searchParams = useSearchParams();
  const { items, remove } = useCompare();
  const [villas, setVillas] = useState<CompareVilla[]>([]);
  const [loading, setLoading] = useState(true);

  const ids = useMemo(() => {
    const fromUrl = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
    if (fromUrl.length > 0) return fromUrl;
    return items.map((i) => i.id);
  }, [searchParams, items]);

  useEffect(() => {
    if (ids.length === 0) {
      setVillas([]);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from("villas")
        .select("id, name, location, price_per_night, capacity, surface_m2, bathrooms_count, image_url, amenities")
        .in("id", ids);
      setVillas((data ?? []) as CompareVilla[]);
      setLoading(false);
    })();
  }, [ids]);

  if (!loading && villas.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <KayvilaEmptyState
          icon={<Scale className="size-12" />}
          title="Aucune villa à comparer"
          description="Ajoutez jusqu'à 3 villas depuis la page de recherche."
          actionLabel="Voir les villas"
          actionHref="/villas"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-24">
      <h1 className="font-display text-3xl text-navy mb-2">Comparer les villas</h1>
      <p className="text-sm text-navy/55 mb-8">{villas.length} villa{villas.length > 1 ? "s" : ""} sélectionnée{villas.length > 1 ? "s" : ""}</p>

      {loading ? (
        <p className="text-sm text-navy/55">Chargement…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {villas.map((villa) => {
            const hasPool = (villa.amenities ?? []).some((a) => a.toLowerCase().includes("piscine"));
            return (
              <article key={villa.id} className="relative border border-navy/10 bg-white p-5">
                <button
                  type="button"
                  onClick={() => remove(villa.id)}
                  className="absolute right-4 top-4 text-navy/40 transition-colors hover:text-red-500"
                  aria-label={`Retirer ${villa.name}`}
                >
                  <X className="size-4" />
                </button>
                <div className="relative mb-4 aspect-[4/3] overflow-hidden">
                  <Image
                    src={villa.image_url ?? "/villa-hero.jpg"}
                    alt={villa.name}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                </div>
                <h2 className="font-display text-lg text-navy pr-8">{villa.name}</h2>
                {villa.location ? (
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-navy/45">{villa.location}</p>
                ) : null}
                <div className="mt-4 space-y-2 text-sm text-navy/70">
                  <p className="flex items-center gap-2">
                    <Users className="size-4 text-gold" />
                    {villa.capacity ?? "—"} voyageurs
                  </p>
                  <p className="flex items-center gap-2">
                    <Maximize2 className="size-4 text-gold" />
                    {villa.surface_m2 ?? "—"} m²
                  </p>
                  <p className="flex items-center gap-2">
                    <Waves className="size-4 text-gold" />
                    {hasPool ? "Piscine" : "Sans piscine"}
                  </p>
                </div>
                <p className="mt-4">
                  <KayvilaNumberValue value={villa.price_per_night} format="currency" className="font-sora font-semibold text-gold" />
                  <span className="text-sm text-navy/50"> / nuit</span>
                </p>
                <Link
                  href={`/villas/${villa.id}`}
                  className="mt-4 inline-block text-[10px] font-bold uppercase tracking-wider text-navy hover:text-gold"
                >
                  Voir la fiche →
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
