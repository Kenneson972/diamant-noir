"use client";

import type { VillaMapItem } from "./VillaLeafletMap";

export type FilterState = {
  piscine: boolean;
  viewMer: boolean;
  plage: boolean;
  chambres: boolean;
  budget: null | "<800" | "800-1200" | ">1200";
  tier: null | "Signature" | "Prestige" | "Exclusive";
};

export const DEFAULT_FILTERS: FilterState = {
  piscine: false,
  viewMer: false,
  plage: false,
  chambres: false,
  budget: null,
  tier: null,
};

export function isFilterActive(filters: FilterState): boolean {
  return (
    filters.piscine ||
    filters.viewMer ||
    filters.plage ||
    filters.chambres ||
    filters.budget !== null ||
    filters.tier !== null
  );
}

export function filterVillas(villas: VillaMapItem[], filters: FilterState): Set<string> {
  const passing = new Set<string>();
  for (const v of villas) {
    const amenLower = v.amenities.map((a) => a.toLowerCase());
    if (filters.piscine && !amenLower.some((a) => a.includes("piscine"))) continue;
    if (filters.viewMer && !amenLower.some((a) => a.includes("mer"))) continue;
    if (filters.plage && !amenLower.some((a) => a.includes("plage"))) continue;
    if (filters.chambres && (v.capacity === null || v.capacity < 4)) continue;
    if (filters.budget === "<800" && v.price >= 800) continue;
    if (filters.budget === "800-1200" && (v.price < 800 || v.price > 1200)) continue;
    if (filters.budget === ">1200" && v.price <= 1200) continue;
    if (filters.tier && v.tier !== filters.tier) continue;
    passing.add(v.id);
  }
  return passing;
}

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  passCount: number;
  total: number;
}

const CHIP_BASE =
  "shrink-0 border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] min-h-[44px] flex items-center transition-colors cursor-pointer";
const CHIP_OFF = `${CHIP_BASE} border-navy/15 text-navy/60 hover:border-navy/40`;
const CHIP_ON = `${CHIP_BASE} border-gold bg-gold/[0.08] text-gold`;

type BudgetVal = "<800" | "800-1200" | ">1200";
type TierVal = "Signature" | "Prestige" | "Exclusive";

export default function VillaFilterBar({ filters, onChange, passCount, total }: Props) {
  const toggle = (key: keyof Pick<FilterState, "piscine" | "viewMer" | "plage" | "chambres">) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const toggleBudget = (val: BudgetVal) => {
    onChange({ ...filters, budget: filters.budget === val ? null : val });
  };

  const toggleTier = (val: TierVal) => {
    onChange({ ...filters, tier: filters.tier === val ? null : val });
  };

  const active = isFilterActive(filters);

  return (
    <div className="border-b border-navy/8 bg-offwhite/98">
      <div className="flex items-center gap-2 overflow-x-auto px-6 py-3 scrollbar-none">
        {/* Boolean chips */}
        <button type="button" className={filters.piscine ? CHIP_ON : CHIP_OFF} onClick={() => toggle("piscine")}>
          Piscine
        </button>
        <button type="button" className={filters.viewMer ? CHIP_ON : CHIP_OFF} onClick={() => toggle("viewMer")}>
          Vue mer
        </button>
        <button type="button" className={filters.plage ? CHIP_ON : CHIP_OFF} onClick={() => toggle("plage")}>
          Plage directe
        </button>
        <button type="button" className={filters.chambres ? CHIP_ON : CHIP_OFF} onClick={() => toggle("chambres")}>
          4+ chambres
        </button>

        {/* Separator */}
        <div className="h-5 w-px shrink-0 bg-navy/12 mx-1" aria-hidden="true" />

        {/* Budget chips */}
        {(["<800", "800-1200", ">1200"] as BudgetVal[]).map((val) => (
          <button
            key={val}
            type="button"
            className={filters.budget === val ? CHIP_ON : CHIP_OFF}
            onClick={() => toggleBudget(val)}
          >
            {val === "<800" ? "< 800 €" : val === "800-1200" ? "800–1200 €" : "> 1200 €"}
          </button>
        ))}

        {/* Separator */}
        <div className="h-5 w-px shrink-0 bg-navy/12 mx-1" aria-hidden="true" />

        {/* Tier chips */}
        {(["Signature", "Prestige", "Exclusive"] as TierVal[]).map((val) => (
          <button
            key={val}
            type="button"
            className={filters.tier === val ? CHIP_ON : CHIP_OFF}
            onClick={() => toggleTier(val)}
          >
            {val}
          </button>
        ))}
      </div>

      {/* Result count + reset */}
      {active && (
        <div className="flex items-center justify-between px-6 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/50">
            {passCount} résultat{passCount !== 1 ? "s" : ""} sur {total}
          </p>
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold hover:text-gold/80 transition-colors"
          >
            Tout effacer
          </button>
        </div>
      )}
    </div>
  );
}
