"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";

function getShareUrl(villaId: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/villas/${villaId}`;
  }
  return "";
}

export const VillaHeaderActions = ({ villaName, villaId }: { villaName: string; villaId: string }) => {
  const { isFav, toggle } = useWishlist();
  const saved = isFav(villaId);
  const [shareOpen, setShareOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermeture au clic extérieur
  useEffect(() => {
    if (!shareOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [shareOpen]);

  const shareUrl = getShareUrl(villaId);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${villaName} — Diamant Noir`);
  const whatsappUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  return (
    <div className="flex items-center gap-3">
      {/* Partager */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setShareOpen((v) => !v)}
          aria-expanded={shareOpen}
          aria-haspopup="true"
          className="flex items-center gap-2 border border-navy/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-navy transition-all hover:border-navy hover:bg-navy hover:text-white"
        >
          <Share2 size={12} strokeWidth={2} />
          Partager
        </button>

        {shareOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 min-w-[160px] border border-navy/10 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
          >
            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => setShareOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-navy transition-colors hover:bg-[#25D366] hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.552 4.103 1.518 5.83L0 24l6.335-1.502A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.37l-.36-.214-3.76.892.944-3.665-.235-.376A9.818 9.818 0 1112 21.818z"/>
              </svg>
              WhatsApp
            </a>

            <div className="mx-4 h-px bg-navy/6" />

            {/* Facebook */}
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => setShareOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-navy transition-colors hover:bg-[#1877F2] hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              Facebook
            </a>
          </div>
        )}
      </div>

      {/* Favoris */}
      <button
        onClick={() => toggle(villaId)}
        aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
        className="flex items-center gap-2 border border-navy/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-navy transition-all hover:border-navy hover:bg-navy hover:text-white"
      >
        <Heart
          size={12}
          strokeWidth={2}
          className={saved ? "fill-red-500 text-red-500" : ""}
        />
        {saved ? "Enregistré" : "Enregistrer"}
      </button>
    </div>
  );
};

export const ExpandableDescription = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > 300;
  const displayText = isExpanded ? text : text.slice(0, 300) + (shouldTruncate ? "…" : "");

  return (
    <div className="space-y-4">
      <p className="whitespace-pre-line leading-relaxed text-navy/70">{displayText}</p>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy underline underline-offset-4 transition-colors hover:text-gold"
        >
          {isExpanded ? "Afficher moins" : "En savoir plus"}
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}
    </div>
  );
};
