"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Scale, Maximize2, X, Waves } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { useCompare } from "@/contexts/CompareContext";
import { KayvilaEmptyState, KayvilaNumberValue } from "@/components/ui/pro";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useLocale } from "@/contexts/LocaleContext";

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
  const { t } = useLocale();
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
          icon={<Scale size={24} strokeWidth={1.5} />}
          title={t("villas.compare_empty_title")}
          description={t("villas.compare_empty_desc")}
          actionLabel={t("villas.compare_empty_cta")}
          actionHref="/villas"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-24">
      <h1 className="font-display text-3xl text-navy mb-2">{t("villas.compare_title")}</h1>
      <p className="text-sm text-navy/60 mb-8">
        {villas.length} {villas.length > 1 ? t("villas.compare_selected_plural") : t("villas.compare_selected")}
      </p>

      {loading ? (
        <p className="text-sm text-navy/60">{t("common.loading")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {villas.map((villa) => {
            const hasPool = (villa.amenities ?? []).some((a) => a.toLowerCase().includes("piscine"));
            return (
              <article key={villa.id} className="relative border border-navy/10 bg-white p-5">
                <button
                  type="button"
                  onClick={() => remove(villa.id)}
                  className="absolute right-4 top-4 text-navy/60 transition-colors hover:text-red-500"
                  aria-label={t("villas.compare_remove").replace("{{name}}", villa.name)}
                >
                  <X size={16} strokeWidth={1.5} />
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
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-navy/60">{villa.location}</p>
                ) : null}
                <div className="mt-4 space-y-2 text-sm text-navy/70">
                  <p className="flex items-center gap-2">
                    <KayvilaPngIcon name="users" size={18} alt="" className="text-gold shrink-0" />
                    {villa.capacity ?? "—"} {t("villas.traveler")}
                  </p>
                  <p className="flex items-center gap-2">
                    <Maximize2 size={16} strokeWidth={1.5} className="text-gold shrink-0" />
                    {villa.surface_m2 ?? "—"} m²
                  </p>
                  <p className="flex items-center gap-2">
                    <Waves size={16} strokeWidth={1.5} className="text-gold shrink-0" />
                    {hasPool ? t("villas.filter.pool") : t("villas.compare_no_pool")}
                  </p>
                </div>
                <p className="mt-4">
                  <KayvilaNumberValue value={villa.price_per_night} format="currency" className="font-sora font-semibold text-gold" />
                  <span className="text-sm text-navy/60"> {t("common.per_night")}</span>
                </p>
                <Link
                  href={`/villas/${villa.id}`}
                  className="mt-4 inline-block text-[10px] font-bold uppercase tracking-wider text-navy hover:text-gold"
                >
                  {t("villas.compare_view_sheet")} →
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
