"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Filter, Star, Map as MapIcon } from "lucide-react";
import { VillaSelectionCard } from "@/components/booking/VillaSelectionCard";

export function SearchResults({ initialVillas }: { initialVillas: any[] }) {
  const [villas] = useState(initialVillas);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const chip =
    "tap-target inline-flex items-center gap-2 border border-black/10 bg-white px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-navy/70 transition-colors hover:border-navy/25 hover:bg-black/[0.02]";
  const chipActive =
    "border-navy bg-navy text-white hover:bg-navy hover:text-white";

  return (
    <div className="space-y-10 md:space-y-12">
      <div className="flex flex-col gap-6 border border-black/8 bg-white p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide md:flex-wrap md:pb-0">
          <button type="button" className={`${chip} ${chipActive}`} aria-pressed="true">
            <Filter size={14} strokeWidth={1.25} aria-hidden />
            Tous
          </button>
          <button type="button" className={chip}>
            Bord de mer
          </button>
          <button type="button" className={chip}>
            Piscine
          </button>
          <button type="button" className={chip}>
            Vue mer
          </button>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-black/6 pt-4 md:border-t-0 md:pt-0">
          <div className="flex border border-black/10 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                viewMode === "list"
                  ? "bg-navy text-white"
                  : "text-navy/45 hover:text-navy"
              }`}
            >
              Liste
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                viewMode === "grid"
                  ? "bg-navy text-white"
                  : "text-navy/45 hover:text-navy"
              }`}
            >
              Grille
            </button>
          </div>
          <Link
            href="/villas"
            className="tap-target flex h-11 w-11 items-center justify-center border border-black/10 text-navy transition-colors hover:bg-black/[0.04]"
            aria-label="Voir la carte des villas"
          >
            <MapIcon size={18} strokeWidth={1.25} />
          </Link>
        </div>
      </div>

      <div
        className={
          viewMode === "grid"
            ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
            : "space-y-8 md:space-y-10"
        }
      >
        {villas.map((villa) =>
          viewMode === "grid" ? (
            <Link
              key={villa.id}
              href={`/villas/${villa.id}`}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-navy/5">
                <Image
                  src={villa.image || "/villa-hero.jpg"}
                  alt={villa.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute right-3 top-3 border border-white/40 bg-white/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-navy backdrop-blur-sm">
                  {villa.price} € <span className="font-normal text-navy/50">/ nuit</span>
                </div>
              </div>
              <div className="mt-4 space-y-2 px-0.5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy">
                    {villa.name}
                  </h3>
                  <div className="flex shrink-0 items-center gap-1 text-xs text-navy">
                    <Star size={12} className="fill-navy text-navy" strokeWidth={0} />
                    <span className="font-medium">{(villa.rating || 4.9).toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-sm text-navy/45">{villa.location || "Martinique"}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-navy/35">
                  {villa.guests} voyageurs · {villa.rooms} chambres
                </p>
              </div>
            </Link>
          ) : (
            <VillaSelectionCard key={villa.id} villa={villa} />
          ),
        )}
      </div>
    </div>
  );
}
