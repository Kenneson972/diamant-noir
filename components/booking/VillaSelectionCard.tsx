"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Users, BedDouble, ArrowRight } from "lucide-react";

interface VillaProps {
  id: string;
  name: string;
  location: string | null;
  price: number;
  guests: number;
  rooms: number;
  rating: number;
  image: string;
  description: string | null;
}

export const VillaSelectionCard = ({ villa }: { villa: VillaProps }) => {
  return (
    <div className="group flex flex-col overflow-hidden border border-black/10 bg-white transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] lg:flex-row">
      <div className="relative h-[260px] w-full shrink-0 overflow-hidden lg:h-auto lg:min-h-[280px] lg:w-[42%]">
        <Image
          src={villa.image}
          alt={villa.name}
          fill
          sizes="(max-width: 1024px) 100vw, 42vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
        <div className="absolute left-4 top-4 border border-white/30 bg-white/95 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-navy backdrop-blur-sm">
          {villa.location || "Martinique"}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-6 md:p-10 lg:p-12">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h3 className="font-display text-2xl text-navy md:text-3xl">{villa.name}</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-navy/50">
                <Star size={14} className="fill-navy text-navy" strokeWidth={0} aria-hidden />
                <span className="font-medium text-navy">{(villa.rating ?? 4.9).toFixed(2)}</span>
                <span className="text-navy/35">·</span>
                <span className="uppercase tracking-wider">Avis vérifiés</span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xl font-medium text-navy">{villa.price} €</span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-navy/40">
                par nuit
              </p>
            </div>
          </div>

          <p className="line-clamp-3 text-sm leading-relaxed text-navy/55">
            {villa.description || "Une adresse sélectionnée pour son cadre et son confort."}
          </p>

          <div className="flex flex-wrap gap-8 border-y border-black/6 py-5">
            <div className="flex items-center gap-2 text-navy/80">
              <Users size={18} strokeWidth={1.25} className="text-navy/35" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                {villa.guests} voyageurs
              </span>
            </div>
            <div className="flex items-center gap-2 text-navy/80">
              <BedDouble size={18} strokeWidth={1.25} className="text-navy/35" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                {villa.rooms} chambres
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/villas/${villa.id}`}
            className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy underline-offset-[10px] hover:underline"
          >
            Voir la fiche
          </Link>
          <Link
            href={`/villas/${villa.id}`}
            className="inline-flex items-center justify-center gap-2 border border-navy bg-navy px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-navy/90"
          >
            Réserver
            <ArrowRight size={16} strokeWidth={1.25} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
};
