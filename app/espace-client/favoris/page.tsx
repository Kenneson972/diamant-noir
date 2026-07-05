"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWishlist } from "@/contexts/WishlistContext";
import { getSupabaseBrowser } from "@/lib/supabase";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { Button } from "@heroui/react";
import { Spinner } from "@/components/espace-client/tenant-ui";
import { KayvilaEmptyState } from "@/components/ui/pro";
import { VillaCoverImage } from "@/components/ui/villa-cover-image";
import { pickVillaImageUrl } from "@/lib/villa-image";

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
    if (!supabase) {
      setLoading(false);
      return;
    }
    if (ids.size === 0) {
      setVillas([]);
      setLoading(false);
      return;
    }
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
      <h1 className="font-display text-2xl font-normal text-navy mb-6">Mes favoris</h1>
      <div className="space-y-6">
        <p className="text-sm text-navy/55">
          {ids.size > 0
            ? `${ids.size} villa${ids.size > 1 ? "s" : ""} enregistrée${ids.size > 1 ? "s" : ""}`
            : "Retrouvez ici les villas que vous avez aimées"}
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-gold" />
          </div>
        ) : villas.length === 0 ? (
          <KayvilaEmptyState
            icon={<KayvilaPngIcon name="heart" size={24} alt="" />}
            title="Aucune villa favorite"
            description="Explorez nos villas et cliquez sur le cœur pour les ajouter ici."
            actionLabel="Découvrir nos villas"
            actionHref="/villas"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {villas.map((v) => (
              <article
                key={v.id}
                className="group overflow-hidden border border-navy/10 bg-white transition-colors hover:border-gold/25"
              >
                <div className="relative aspect-[16/7] overflow-hidden bg-navy/5">
                  <VillaCoverImage
                    src={pickVillaImageUrl(v.image_url, null)}
                    alt={v.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  <Button
                    isIconOnly
                    variant="ghost"
                    aria-label={`Retirer ${v.name} des favoris`}
                    onPress={() => toggle(v.id)}
                    className="absolute right-3 top-3 min-h-[44px] min-w-[44px] rounded-full bg-white/90 text-red-500 shadow-sm data-[hover=true]:bg-white"
                  >
                    <KayvilaPngIcon name="heart" size={18} alt="" aria-hidden />
                  </Button>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-base text-navy">{v.name}</h2>
                      {v.location ? (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-navy/55">
                          <KayvilaPngIcon name="location" size={16} alt="" />
                          {v.location}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-navy">
                      {v.price_per_night}€
                      <span className="text-[10px] font-normal text-navy/55">/nuit</span>
                    </p>
                  </div>
                  <Link
                    href={`/villas/${v.id}`}
                    className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold transition-colors hover:text-navy"
                  >
                    Voir la villa
                    <KayvilaPngIcon name="arrow-right" size={18} alt="" aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
