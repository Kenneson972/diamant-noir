"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Map, LayoutGrid } from "lucide-react";
import type { VillaMapItem } from "./VillaLeafletMap";

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
  const listRef = useRef<HTMLDivElement>(null);

  const handleSelect = (id: string) => {
    const el = listRef.current?.querySelector(
      `[data-villa="${id}"]`
    ) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="relative">
      {/* ── Toolbar ── */}
      <div className="sticky top-[72px] z-20 bg-offwhite/95 backdrop-blur-sm border-b border-navy/8 px-6 py-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/40">
          {villas.length} propriété{villas.length > 1 ? "s" : ""}
        </p>
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

      {/* ── Split layout ── */}
      <div
        className={`flex transition-all duration-300 ${
          mapVisible ? "items-start" : ""
        }`}
      >
        {/* ── List panel ── */}
        <div
          ref={listRef}
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
            {villas.map((villa, index) => {
              const TIERS = ["Signature", "Prestige", "Exclusive"];
              const tier = TIERS[index % 3];
              return (
              <Link
                key={villa.id}
                href={`/villas/${villa.id}`}
                data-villa={villa.id}
                onMouseEnter={() => setHoveredId(villa.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group block overflow-hidden rounded-none border border-transparent transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite ${
                  hoveredId === villa.id
                    ? "border-navy/15 shadow-[0_12px_40px_rgba(0,0,0,0.08)] -translate-y-px"
                    : "hover:border-navy/10 hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)] hover:-translate-y-px"
                }`}
              >
                {/* Image portrait */}
                <div className="relative aspect-[4/3] sm:aspect-[3/4] overflow-hidden rounded-none">
                  <Image
                    src={villa.image || "/villa-hero.jpg"}
                    alt={villa.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  {/* Tier badge */}
                  <div className="absolute top-4 left-4">
                    <span className="rounded-none border border-gold/40 bg-black/30 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.3em] text-gold backdrop-blur-sm">
                      {tier}
                    </span>
                  </div>
                </div>

                {/* Info sous l'image */}
                <div className="pt-4 space-y-1.5 px-1 pb-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-gold">{tier}</p>
                  <p className="font-display font-normal text-xl text-navy leading-snug">
                    {villa.name}
                  </p>
                  {villa.location && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40">
                      {villa.location}
                    </p>
                  )}
                  <p className="text-sm font-bold text-navy pt-1">
                    {villa.price.toLocaleString("fr-FR")} €{" "}
                    <span className="font-normal text-navy/40 text-xs">/ nuit</span>
                  </p>
                </div>
              </Link>
              );
            })}
          </div>
        </div>

        {/* ── Map panel ── */}
        {mapVisible && (
          <div className="hidden md:block md:w-[42%] lg:w-[38%] shrink-0 sticky top-[120px] h-[calc(100vh-120px)]">
            <VillaLeafletMap
              villas={villas}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onSelect={handleSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
