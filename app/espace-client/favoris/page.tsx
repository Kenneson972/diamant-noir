"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWishlist } from "@/contexts/WishlistContext";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Heart, MapPin, ArrowRight } from "lucide-react";
import { PageTopbar } from "@/components/espace-client/PageTopbar";
import { linkAsButtonClasses, Spinner } from "@/components/espace-client/tenant-ui";

interface Villa {
  id: string;
  name: string;
  location: string | null;
  image_url: string | null;
  capacity: number;
  price_per_night: number;
}

export default function FavorisPage() {
  const supabase = getSupabaseBrowser();
  const { ids, toggle } = useWishlist();
  const [villas, setVillas] = useState<Villa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    if (ids.size === 0) { setVillas([]); setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("villas")
        .select("id, name, location, image_url, capacity, price_per_night")
        .in("id", Array.from(ids))
        .eq("is_published", true);
      setVillas((data ?? []) as Villa[]);
      setLoading(false);
    })();
  }, [supabase, ids]);

  return (
    <>
      <PageTopbar title="Mes favoris" />
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl text-navy">Mes favoris</h1>
          <p className="text-sm text-navy/50 mt-1">
            {ids.size > 0
              ? `${ids.size} villa${ids.size > 1 ? "s" : ""} enregistrée${ids.size > 1 ? "s" : ""}`
              : "Retrouvez ici les villas que vous avez aimées"}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-gold" />
          </div>
        ) : villas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 border border-navy/10 bg-white">
            <Heart size={32} className="text-navy/15" />
            <p className="text-sm text-navy/55">Aucune villa favorite</p>
            <p className="text-[11px] text-navy/30">
              Explorez nos villas et cliquez sur le cœur pour les ajouter ici.
            </p>
            <Link
              href="/villas"
              className={linkAsButtonClasses("primary", "md", "rounded-none uppercase no-underline mt-2")}
            >
              Découvrir nos villas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {villas.map((v) => (
              <div key={v.id} className="group border border-navy/10 bg-white overflow-hidden">
                <div className="aspect-[16/7] bg-navy/5 overflow-hidden relative">
                  {v.image_url ? (
                    <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-navy/15">
                      <Heart size={32} />
                    </div>
                  )}
                  <button
                    onClick={() => toggle(v.id)}
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 hover:bg-white transition-colors shadow-sm"
                    aria-label="Retirer des favoris"
                  >
                    <Heart size={14} fill="currentColor" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base text-navy">{v.name}</h3>
                      {v.location && (
                        <p className="flex items-center gap-1 text-[11px] text-navy/55 mt-0.5">
                          <MapPin size={10} /> {v.location}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-navy shrink-0">
                      {v.price_per_night}€<span className="text-[10px] font-normal text-navy/55">/nuit</span>
                    </p>
                  </div>
                  <Link
                    href={`/villas/${v.id}`}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gold hover:text-navy transition-colors mt-3"
                  >
                    Voir la villa <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
