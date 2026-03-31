"use client";

import { useState } from "react";

const FILTERS = ["Prix", "Localisation"];

export function VillaFilters({ count }: { count: number }) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
      <div className="flex flex-col gap-2 mr-2">
        <span className="text-navy">Filtres</span>
        <div className="h-[1px] w-full bg-gold" />
      </div>
      {FILTERS.map((filter) => (
        <button
          key={filter}
          onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
          className={`tap-target rounded-full px-5 text-[10px] font-bold uppercase tracking-widest transition-all duration-150 ${
            activeFilter === filter
              ? "bg-gold text-navy"
              : "border border-navy/20 text-navy/40 hover:text-navy hover:border-navy"
          }`}
        >
          {filter}
        </button>
      ))}
      <span className="text-navy/40 text-sm ml-2">{count} propriétés</span>
    </div>
  );
}
