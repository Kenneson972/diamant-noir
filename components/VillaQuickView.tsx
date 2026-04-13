"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import type { VillaMapItem } from "./VillaLeafletMap";

interface Props {
  villa: VillaMapItem | null;
  open: boolean;
  onClose: () => void;
}

export default function VillaQuickView({ villa, open, onClose }: Props) {
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  if (!villa) return null;

  const photos =
    villa.images.length > 0 ? villa.images.slice(0, 3) : ["/villa-hero.jpg"];

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[1050] bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Aperçu rapide — ${villa.name}`}
        className={`fixed inset-x-0 bottom-0 z-[1060] bg-white max-h-[85dvh] overflow-y-auto transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
        onTouchEnd={(e) => {
          if (
            touchStartY !== null &&
            e.changedTouches[0].clientY - touchStartY > 80
          ) {
            onClose();
          }
          setTouchStartY(null);
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-navy/15" aria-hidden="true" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer l'aperçu"
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 border border-navy/15 text-navy/50 hover:border-navy/30 hover:text-navy transition-colors"
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        {/* Photo strip — scroll horizontal */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-4 pt-2 scrollbar-none">
          {photos.map((src, i) => (
            <div
              key={i}
              className="relative shrink-0 w-[240px] aspect-[4/3] overflow-hidden"
            >
              <Image
                src={src}
                alt={`${villa.name} — photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="240px"
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-4 pb-6 space-y-4">
          {/* Location eyebrow */}
          {villa.location && (
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              {villa.location}
            </p>
          )}

          {/* Name */}
          <h2 className="font-display text-2xl text-navy leading-snug">
            {villa.name}
          </h2>

          {/* Stats grid — 4 cols */}
          <div className="grid grid-cols-4 gap-3 border-t border-b border-navy/8 py-4">
            <div className="text-center">
              <p className="text-lg font-display text-navy">
                {villa.capacity ?? "—"}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40 mt-0.5">
                Ch.
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display text-navy">
                {villa.capacity ? villa.capacity * 2 : "—"}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40 mt-0.5">
                Voyag.
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display text-navy">
                {villa.surface ?? "—"}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40 mt-0.5">
                m²
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display text-navy">★</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40 mt-0.5">
                Note
              </p>
            </div>
          </div>

          {/* Amenities chips */}
          {villa.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {villa.amenities.slice(0, 4).map((a) => (
                <span
                  key={a}
                  className="border border-navy/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy/55"
                >
                  {a}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <p className="text-navy">
            <span className="font-display text-2xl">
              {villa.price.toLocaleString("fr-FR")} €
            </span>
            <span className="text-[11px] text-navy/45 ml-1">/ nuit</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col xs:flex-row gap-3 pt-2">
            <Link
              href={`/villas/${villa.id}`}
              className="flex-1 text-center border border-navy py-3 text-[10px] font-bold uppercase tracking-[0.28em] text-navy hover:bg-navy hover:text-white transition-colors min-h-[44px] flex items-center justify-center"
            >
              Voir la villa →
            </Link>
            <Link
              href={`/book?villaId=${villa.id}`}
              className="flex-1 text-center bg-navy py-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white hover:bg-navy/90 transition-colors min-h-[44px] flex items-center justify-center"
            >
              Réserver
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
