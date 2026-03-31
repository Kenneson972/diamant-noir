"use client";

/**
 * WishlistButton — Diamant Noir
 * ─────────────────────────────
 * Bouton cœur à superposer sur n'importe quelle carte villa.
 * Apparaît au hover de la carte, animé sur le clic.
 *
 * Usage dans VillaListingCard :
 *   <WishlistButton villaId={id} className="absolute top-3 right-3" />
 */

import { useWishlist } from "@/contexts/WishlistContext";
import { Heart } from "lucide-react";
import { useState } from "react";

interface WishlistButtonProps {
  villaId: string;
  className?: string;
}

export function WishlistButton({ villaId, className = "" }: WishlistButtonProps) {
  const { isFav, toggle } = useWishlist();
  const [pop, setPop] = useState(false);
  const fav = isFav(villaId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(villaId);
    setPop(true);
    setTimeout(() => setPop(false), 300);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`
        group/heart
        flex items-center justify-center
        w-9 h-9 rounded-full
        bg-white/90 backdrop-blur-sm
        border border-navy/10
        shadow-sm
        transition-all duration-200
        hover:scale-110 hover:border-gold/40
        opacity-0 group-hover:opacity-100
        focus:opacity-100
        ${pop ? "scale-125" : ""}
        ${className}
      `}
    >
      <Heart
        size={15}
        strokeWidth={1.5}
        className={`transition-colors duration-200 ${
          fav
            ? "fill-gold stroke-gold"
            : "stroke-navy/60 group-hover/heart:stroke-gold"
        }`}
      />
    </button>
  );
}
