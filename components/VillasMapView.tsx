"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Map, LayoutGrid } from "lucide-react";
import { VillaListingCard } from "@/components/villas/VillaListingCard";
import type { VillaMapItem } from "./VillaLeafletMap";
import VillaFilterBar, {
  DEFAULT_FILTERS,
  filterVillas,
  isFilterActive,
} from "./VillaFilterBar";
import type { FilterState } from "./VillaFilterBar";
import VillaQuickView from "./VillaQuickView";
import { useLocale } from "@/contexts/LocaleContext";

const VillaLeafletMap = dynamic(() => import("./VillaLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-navy/5">
      <span className="animate-pulse text-sm font-bold uppercase tracking-widest text-navy/20">
        Chargement de la carte…
      </span>
    </div>
  ),
});

interface Props {
  villas: VillaMapItem[];
  dateQuery?: { checkin: string; checkout: string; guests?: string };
}

export default function VillasMapView({ villas, dateQuery }: Props) {
  const { t, formatPrice } = useLocale();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(true);
  const minGuests = dateQuery?.guests ? Number.parseInt(dateQuery.guests, 10) : null;
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    minGuests: minGuests && minGuests > 0 ? minGuests : null,
  });
  const [quickViewId, setQuickViewId] = useState<string | null>(null);

  const chipsActive = isFilterActive(activeFilters);
  const filteredSet = filterVillas(villas, activeFilters);

  const villasDisplay = villas.map((v) => {
    const passesChips = !chipsActive || filteredSet.has(v.id);
    return { ...v, dimmed: !passesChips };
  });

  const passCount = villasDisplay.filter((v) => !v.dimmed).length;

  const quickViewVilla = villas.find((v) => v.id === quickViewId) ?? null;

  const handleSelect = useCallback((id: string) => {
    setQuickViewId(id);
  }, []);

  return (
    <div className="relative">
      {/* ── Toolbar ── */}
      <div className="sticky top-[calc(72px+env(safe-area-inset-top,0px))] z-20 border-b border-navy/8 bg-offwhite/95 backdrop-blur-none md:backdrop-blur-sm px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/55">
            {villas.length} propriété{villas.length > 1 ? "s" : ""}
          </p>
          {chipsActive && passCount < villas.length && (
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/80">
              · {passCount} {t("villas.filter.results")}
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
              {t("villas.hide_map")}
            </>
          ) : (
            <>
              <Map size={13} />
              {t("villas.show_map")}
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
            {villasDisplay.map((villa) => {
              const dateIntent = dateQuery?.checkin && dateQuery?.checkout;
              const qs = dateIntent
                ? `?checkin=${dateQuery.checkin}&checkout=${dateQuery.checkout}${dateQuery.guests ? `&guests=${dateQuery.guests}` : ""}`
                : "";
              return (
                <VillaListingCard
                  key={villa.id}
                  villa={villa}
                  href={`/villas/${villa.id}${qs}`}
                  formatPrice={formatPrice}
                  previewLabel={t("common.preview")}
                  isHovered={hoveredId === villa.id}
                  onHover={setHoveredId}
                  onQuickView={setQuickViewId}
                />
              );
            })}
          </div>
        </div>

        {/* ── Map panel desktop ── */}
        {mapVisible && (
          <div className="hidden md:block md:w-[42%] lg:w-[38%] shrink-0 sticky top-[120px] h-[calc(100dvh-120px)] min-h-[280px]">
            <VillaLeafletMap
              villas={villas}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onSelect={handleSelect}
            />
          </div>
        )}
      </div>

      {/* ── Map panel mobile (sous la liste) ── */}
      {mapVisible && (
        <div className="h-[60dvh] min-h-[320px] w-full border-t border-navy/10 md:hidden">
          <VillaLeafletMap
            villas={villas}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onSelect={handleSelect}
          />
        </div>
      )}

      {/* ── Quick View drawer ── */}
      <VillaQuickView
        villa={quickViewVilla}
        open={quickViewId !== null}
        onClose={() => setQuickViewId(null)}
      />
    </div>
  );
}
