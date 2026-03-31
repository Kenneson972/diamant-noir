"use client";

/**
 * CompareButton — Diamant Noir
 * ─────────────────────────────
 * Bouton "Comparer" discret, apparaît sous la carte villa.
 * Change d'état quand la villa est dans la sélection.
 */

import { useCompare, type CompareItem } from "@/contexts/CompareContext";
import { Scale } from "lucide-react";

interface CompareButtonProps {
  villa: CompareItem;
}

export function CompareButton({ villa }: CompareButtonProps) {
  const { isSelected, toggle, canAdd } = useCompare();
  const selected = isSelected(villa.id);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(villa);
      }}
      disabled={!selected && !canAdd}
      className={`
        flex items-center gap-1.5
        text-[9px] font-semibold uppercase tracking-[0.2em]
        transition-colors duration-150
        ${selected
          ? "text-gold"
          : canAdd
            ? "text-navy/35 hover:text-navy/70"
            : "text-navy/15 cursor-not-allowed"
        }
      `}
    >
      <Scale size={11} strokeWidth={1.8} />
      {selected ? "Sélectionné" : "Comparer"}
    </button>
  );
}
