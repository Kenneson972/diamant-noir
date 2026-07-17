"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";

export function VillaFilters({ count }: { count: number }) {
  const { t } = useLocale();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const filters = [t("villa.filter_price"), t("villa.filter_location")];

  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
      <div className="flex flex-col gap-2 mr-2">
        <span className="text-navy">{t("villas.filter.title")}</span>
        <div className="h-[1px] w-full bg-gold" />
      </div>
      {filters.map((filter) => (
        <button type="button"
          key={filter}
          onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
          className={`tap-target rounded-full px-5 text-[10px] font-bold uppercase tracking-widest transition-all duration-150 ${
            activeFilter === filter
              ? "bg-gold text-navy"
              : "border border-navy/20 text-navy/55 hover:text-navy hover:border-navy"
          }`}
        >
          {filter}
        </button>
      ))}
      <span className="text-navy/55 text-sm ml-2">{count} {t("villa.filter_properties")}</span>
    </div>
  );
}
