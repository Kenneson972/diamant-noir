"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Map, LayoutGrid } from "lucide-react";
import type { VillaMapItem } from "./VillaLeafletMap";
import type { LatLngBounds } from "leaflet";
import VillaFilterBar, {
  DEFAULT_FILTERS,
  filterVillas,
  isFilterActive,
} from "./VillaFilterBar";
import type { FilterState } from "./VillaFilterBar";
import VillaQuickView from "./VillaQuickView";

const VillaLeafletMap = dynamic(() => import("./VillaLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-navy/5 flex items-center justify-center">
      <span className="text-navy/20 text-sm tracking-widest uppercase font-bold animate-pulse">
        Chargement de la carte…
      </span>
    </div>
  ),
});

interface Props {
  villas: VillaMapItem[];
}

export default function VillasMapView({ villas }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(true);
  const [activeFilters, setActiveFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);

  // Stable callbacks
  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    setMapBounds(bounds);
  }, []);

  const handleSelect = useCallback((id: string) => {
    setQuickViewId(id);
  }, []);

  // Filtrage cumulatif : chips ∩ bounds
  const chipsActive = isFilterActive(activeFilters);
  const filteredSet = filterVillas(villas, activeFilters);

  const villasDisplay = villas.map((v) => {
    const passesChips = !chipsActive || filteredSet.has(v.id);
    const passesViewport =
      !mapBounds || mapBounds.contains(v.coords as [number, number]);
    return { ...v, dimmed: !passesChips || !passesViewport };
  });

  const passCount = villasDisplay.filter((v) => !v.dimmed).length;
  const viewportCount = mapBounds
    ? villas.filter((v) => mapBounds.contains(v.coords as [number, number])).length
    : null;

  const quickViewVilla = villas.find((v) => v.id === quickViewId) ?? null;

  return (
    <div className="relative">
      {/* ── Toolbar ── */}
      <div className="sticky top-[calc(72px+env(safe-area-inset-top,0px))] z-20 border-b border-navy/8 bg-offwhite/95 backdrop-blur-none md:backdrop-blur-sm px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/40">
            {villas.length} propriété{villas.length > 1 ? "s" : ""}
          </p>
          {viewportCount !== null && viewportCount < villas.length && (
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/80">
              · {viewportCount} dans la vue
            </p>
          )}
        </div>
        <button
          onClick={() => setMapVisible((v) => !v)}
          className="tap-target flex items-center gap-2 rounded-none border border-navy/15 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-navy transition-all duration-200 hover:bg-navy hover:text-white hover:border-navy"
        >
          {mapVisible ? (
            <>
              <LayoutGrid size={13} />
              Masquer la carte
            </>
          ) : (
            <>
              <Map size={13} />
              Afficher la carte
            </>
          )}
        </button>
      </div>

      {/* ── Filter bar ── */}
      <VillaFilterBar
        filters={activeFilters}
        onChange={setActiveFilters}
        passCount={passCount}
        total={villas.length}
      />

      {/* ── Split layout ── */}
      <div
        className={`flex transition-all duration-300 ${
          mapVisible ? "items-start" : ""
        }`}
      >
        {/* ── List panel ── */}
        <div
          className={`overflow-y-auto transition-all duration-300 ${
            mapVisible
              ? "w-full md:w-[58%] lg:w-[62%]"
              : "w-full"
          }`}
        >
          <div
            className={`p-6 transition-all duration-300 ${
              mapVisible
                ? "grid grid-cols-1 sm:grid-cols-2 gap-5"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto"
            }`}
          >
            {villasDisplay.map((villa) => (
              <div
                key={villa.id}
                data-villa={villa.id}
                onMouseEnter={() => setHoveredId(villa.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative overflow-hidden rounded-none border border-transparent transition-all duration-200 ${
                  villa.dimmed ? "opacity-40" : ""
                } ${
                  hoveredId === villa.id
                    ? "border-navy/15 shadow-[0_12px_40px_rgba(0,0,0,0.08)] -translate-y-px"
                    : "hover:border-navy/10 hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)] hover:-translate-y-px"
                }`}
              >
                {/* Image portrait — 3/4 — lien vers la fiche */}
                <Link
                  href={`/villas/${villa.id}`}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite"
                  tabIndex={villa.dimmed ? -1 : 0}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-none">
                    <Image
                      src={villa.image || "/villa-hero.jpg"}
                      alt={villa.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    {/* Tier badge */}
                    {villa.tier && (
                      <div className="absolute top-4 left-4">
                        <span className="rounded-none border border-gold/40 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-gold backdrop-blur-sm">
                          {villa.tier}
                        </span>
                      </div>
                    )}
                    {/* Overlay gradient bottom — prix visible au hover */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent pb-5 pt-14 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">
                        À partir de
                      </p>
                      <p className="font-display text-lg text-white leading-none mt-0.5">
                        {villa.price.toLocaleString("fr-FR")} €
                        <span className="text-xs font-sans font-normal text-white/50">
                          {" "}/ nuit
                        </span>
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Info sous l'image */}
                <div className="pt-3 space-y-1 px-1 pb-2">
                  <p className="font-display font-normal text-lg text-navy leading-snug">
                    {villa.name}
                  </p>
                  {villa.location && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40">
                      {villa.location}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-0.5">
                    <p className="text-xs text-navy/55">
                      {villa.price.toLocaleString("fr-FR")} €
                      <span className="text-navy/35"> / nuit</span>
                    </p>
                    {/* Aperçu rapide — desktop: hover / mobile: toujours visible */}
                    <button
                      type="button"
                      onClick={() => setQuickViewId(villa.id)}
                      aria-label={`Aperçu rapide — ${villa.name}`}
                      className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 border border-navy/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy/55 hover:border-gold hover:text-gold min-h-[44px] flex items-center"
                    >
                      Aperçu
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Map panel ── */}
        {mapVisible && (
          <div className="hidden md:block md:w-[42%] lg:w-[38%] shrink-0 sticky top-[120px] h-[calc(100dvh-120px)] min-h-[280px]">
            <VillaLeafletMap
              villas={villas}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onSelect={handleSelect}
              onBoundsChange={handleBoundsChange}
            />
          </div>
        )}
      </div>

      {/* ── Quick View drawer ── */}
      <VillaQuickView
        villa={quickViewVilla}
        open={quickViewId !== null}
        onClose={() => setQuickViewId(null)}
      />
    </div>
  );
}
