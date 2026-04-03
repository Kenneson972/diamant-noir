"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Filter, Star, Map as MapIcon, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { VillaSelectionCard } from "@/components/booking/VillaSelectionCard";

type SortOption = "default" | "price_asc" | "price_desc" | "rating";
type GuestFilter = "all" | "2+" | "4+" | "8+";

interface SearchResultsProps {
  initialVillas: any[];
  checkin?: string;
  checkout?: string;
  guests?: number;
}

export function SearchResults({ initialVillas, checkin, checkout, guests }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [guestFilter, setGuestFilter] = useState<GuestFilter>("all");
  const [sort, setSort] = useState<SortOption>("default");

  const filteredAndSorted = useMemo(() => {
    let result = [...initialVillas];

    // Guest filter
    if (guestFilter === "2+") result = result.filter((v) => v.guests >= 2);
    else if (guestFilter === "4+") result = result.filter((v) => v.guests >= 4);
    else if (guestFilter === "8+") result = result.filter((v) => v.guests >= 8);

    // Also filter by selected guests from search
    if (guests && guests > 1) {
      result = result.filter((v) => !v.guests || v.guests >= guests);
    }

    // Sort
    if (sort === "price_asc") result.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") result.sort((a, b) => b.price - a.price);
    else if (sort === "rating") result.sort((a, b) => (b.rating ?? 4.9) - (a.rating ?? 4.9));

    return result;
  }, [initialVillas, guestFilter, sort, guests]);

  const chip =
    "tap-target shrink-0 inline-flex items-center gap-2 border border-black/10 bg-white px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-navy/70 transition-colors hover:border-navy/25 hover:bg-black/[0.02] whitespace-nowrap";
  const chipActive =
    "border-navy bg-navy text-white hover:bg-navy hover:border-navy hover:text-white";

  const guestFilters: { label: string; value: GuestFilter }[] = [
    { label: "Tous", value: "all" },
    { label: "2+ voyageurs", value: "2+" },
    { label: "4+ voyageurs", value: "4+" },
    { label: "8+ voyageurs", value: "8+" },
  ];

  return (
    <div className="space-y-10 md:space-y-12">
      {/* Barre de filtres */}
      <div className="flex flex-col gap-4 border border-black/8 bg-white p-4 md:flex-row md:items-center md:justify-between md:p-5">
        {/* Filtre capacité */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar md:pb-0">
          <SlidersHorizontal size={14} strokeWidth={1.25} className="shrink-0 text-navy/30" aria-hidden />
          {guestFilters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setGuestFilter(f.value)}
              className={`${chip} ${guestFilter === f.value ? chipActive : ""}`}
              aria-pressed={guestFilter === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-black/6 pt-3 md:border-t-0 md:pt-0">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} strokeWidth={1.25} className="text-navy/30 shrink-0" aria-hidden />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none bg-transparent py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-navy/60 focus:outline-none cursor-pointer hover:text-navy transition-colors"
              aria-label="Trier les villas"
            >
              <option value="default">Tri par défaut</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="rating">Mieux noté</option>
            </select>
          </div>

          {/* View toggle + map */}
          <div className="flex items-center gap-2">
            <div className="flex border border-black/10 p-0.5">
              {(["list", "grid"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  aria-pressed={viewMode === mode}
                  className={`px-3 py-3 min-h-[44px] text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                    viewMode === mode ? "bg-navy text-white" : "text-navy/45 hover:text-navy"
                  }`}
                >
                  {mode === "list" ? "Liste" : "Grille"}
                </button>
              ))}
            </div>
            <Link
              href="/villas"
              className="tap-target flex h-10 w-10 items-center justify-center border border-black/10 text-navy transition-colors hover:bg-black/[0.04]"
              aria-label="Voir la carte des villas"
            >
              <MapIcon size={16} strokeWidth={1.25} />
            </Link>
          </div>
        </div>
      </div>

      {/* Résultat count */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy/40">
          {filteredAndSorted.length} villa{filteredAndSorted.length !== 1 ? "s" : ""}
          {checkin && checkout ? (
            <span className="ml-1 text-navy/30">
              · {new Date(checkin + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              {" – "}
              {new Date(checkout + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </span>
          ) : null}
          {guests && guests > 1 ? (
            <span className="ml-1 text-navy/30">· {guests} voyageurs</span>
          ) : null}
        </p>
        {(guestFilter !== "all" || sort !== "default") && (
          <button
            type="button"
            onClick={() => { setGuestFilter("all"); setSort("default"); }}
            className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy/40 underline underline-offset-4 hover:text-navy transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Grid ou liste */}
      {filteredAndSorted.length === 0 ? (
        <div className="border border-navy/10 bg-white px-8 py-16 text-center">
          <Filter size={32} className="mx-auto mb-4 text-navy/15" strokeWidth={1} />
          <p className="font-display text-lg text-navy">Aucune villa disponible</p>
          <p className="mt-2 text-sm text-navy/50">Essayez de modifier vos filtres ou vos dates.</p>
          <button
            type="button"
            onClick={() => { setGuestFilter("all"); setSort("default"); }}
            className="mt-6 inline-flex items-center gap-2 border border-navy/20 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy transition-colors hover:bg-navy hover:text-white"
          >
            Voir toutes les villas
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
              : "space-y-8 md:space-y-10"
          }
        >
          {filteredAndSorted.map((villa) =>
            viewMode === "grid" ? (
              <Link
                key={villa.id}
                href={`/villas/${villa.id}${checkin ? `?checkin=${checkin}&checkout=${checkout}&guests=${guests}` : ""}`}
                className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-navy/5">
                  <Image
                    src={villa.image || "/villa-hero.jpg"}
                    alt={villa.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100"
                  />
                  <div className="absolute right-3 top-3 border border-white/40 bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy backdrop-blur-sm">
                    {villa.price.toLocaleString("fr-FR")} €{" "}
                    <span className="font-normal text-navy/50">/ nuit</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2 px-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy line-clamp-1">
                      {villa.name}
                    </h3>
                    <div className="flex shrink-0 items-center gap-1 text-xs text-navy">
                      <Star size={12} className="fill-navy text-navy" strokeWidth={0} aria-hidden />
                      <span className="font-medium tabular-nums">{(villa.rating || 4.9).toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-navy/45">{villa.location || "Martinique"}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-navy/35">
                    {villa.guests} voyageurs · {villa.rooms} chambres
                  </p>
                </div>
              </Link>
            ) : (
              <VillaSelectionCard
                key={villa.id}
                villa={villa}
                checkin={checkin}
                checkout={checkout}
                guests={guests}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

