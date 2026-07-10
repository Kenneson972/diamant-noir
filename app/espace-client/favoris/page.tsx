"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWishlist } from "@/contexts/WishlistContext";
import { getSupabaseBrowser } from "@/lib/supabase";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { Button } from "@heroui/react";
import { Spinner } from "@/components/espace-client/tenant-ui";
import { KayvilaEmptyState } from "@/components/ui/pro";
import { TenantSectionHeader } from "@/components/espace-client/TenantSectionHeader";
import { VillaCoverImage } from "@/components/ui/villa-cover-image";
import { pickVillaImageUrl } from "@/lib/villa-image";
import { useLocale } from "@/contexts/LocaleContext";

interface Villa {
  id: string;
  name: string;
  location: string | null;
  image_url: string | null;
  capacity: number;
  price_per_night: number;
}

export default function FavorisPage() {
  const { t } = useLocale();
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
      <div className="space-y-6">
        <TenantSectionHeader
          title={t("client.favoris_title")}
          description={
            ids.size > 0
              ? `${ids.size} ${t(ids.size > 1 ? "client.favoris_count_plural" : "client.favoris_count_singular")}`
              : t("client.favoris_empty_desc")
          }
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-gold" />
          </div>
        ) : villas.length === 0 ? (
          <KayvilaEmptyState
            icon={<KayvilaPngIcon name="heart" size={24} alt="" />}
            title={t("client.favoris_empty_title")}
            description={t("client.favoris_empty_state_desc")}
            actionLabel={t("client.dashboard_discover_villas")}
            actionHref="/villas"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {villas.map((v) => (
              <article
                key={v.id}
                className="group min-w-0 overflow-hidden border border-navy/10 bg-white transition-colors hover:border-gold/25"
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
                    aria-label={t("client.favoris_remove_aria").replace("{{villa}}", v.name)}
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
                          <KayvilaPngIcon name="location" size={16} alt="" className="shrink-0" />
                          <span className="truncate">{v.location}</span>
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-navy">
                      {v.price_per_night}€
                      <span className="text-[10px] font-normal text-navy/55">{t("client.favoris_per_night")}</span>
                    </p>
                  </div>
                  <Link
                    href={`/villas/${v.id}`}
                    className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold transition-colors hover:text-navy"
                  >
                    {t("client.favoris_view_villa")}
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
