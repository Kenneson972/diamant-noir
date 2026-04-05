"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Users, BedDouble, ArrowRight, CalendarDays } from "lucide-react";

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

interface VillaSelectionCardProps {
  villa: VillaProps;
  checkin?: string;
  checkout?: string;
  guests?: number;
}

function buildVillaUrl(id: string, checkin?: string, checkout?: string, guests?: number) {
  const params = new URLSearchParams();
  if (checkin) params.set("checkin", checkin);
  if (checkout) params.set("checkout", checkout);
  if (guests) params.set("guests", String(guests));
  const qs = params.toString();
  return `/villas/${id}${qs ? `?${qs}` : ""}`;
}

function buildBookingUrl(id: string, checkin?: string, checkout?: string, guests?: number) {
  if (!checkin || !checkout) return `/villas/${id}`;
  const params = new URLSearchParams({ villaId: id, checkin, checkout, guests: String(guests ?? 1) });
  return `/book?${params.toString()}`;
}

function formatDateRange(checkin?: string, checkout?: string) {
  if (!checkin || !checkout) return null;
  const nights = Math.round(
    (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000
  );
  const fmtCheckin = new Date(checkin + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  const fmtCheckout = new Date(checkout + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  return { fmtCheckin, fmtCheckout, nights };
}

export const VillaSelectionCard = ({ villa, checkin, checkout, guests }: VillaSelectionCardProps) => {
  const villaUrl = buildVillaUrl(villa.id, checkin, checkout, guests);
  const bookingUrl = buildBookingUrl(villa.id, checkin, checkout, guests);
  const dateRange = formatDateRange(checkin, checkout);
  const totalPrice = dateRange ? villa.price * dateRange.nights : null;

  return (
    <div className="group flex flex-col overflow-hidden border border-black/10 bg-white transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] lg:flex-row">
      {/* Image */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden lg:h-auto lg:aspect-auto lg:min-h-[280px] lg:w-[42%]">
        <Image
          src={villa.image}
          alt={villa.name}
          fill
          sizes="(max-width: 1024px) 100vw, 42vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
        />
        <div className="absolute left-4 top-4 border border-white/30 bg-white/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-navy backdrop-blur-sm">
          {villa.location || "Martinique"}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-6 md:p-10 lg:p-12">
        <div className="space-y-5">
          {/* Title + price */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h3 className="font-display text-2xl text-navy md:text-3xl">{villa.name}</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-navy/50">
                <Star size={14} className="fill-navy text-navy" strokeWidth={0} aria-hidden />
                <span className="font-medium text-navy tabular-nums">
                  {(villa.rating ?? 4.9).toFixed(2)}
                </span>
                <span className="text-navy/35">·</span>
                <span className="uppercase tracking-wider">Avis vérifiés</span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xl font-medium text-navy tabular-nums">
                {villa.price.toLocaleString("fr-FR")} €
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-navy/40">
                par nuit
              </p>
              {totalPrice && (
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                  {totalPrice.toLocaleString("fr-FR")} € · {dateRange?.nights} nuit{(dateRange?.nights ?? 0) > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Date range badge */}
          {dateRange && (
            <div className="flex items-center gap-2 rounded-none border border-gold/20 bg-gold/[0.04] px-4 py-2.5">
              <CalendarDays size={14} strokeWidth={1.25} className="text-gold shrink-0" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy/60">
                {dateRange.fmtCheckin} → {dateRange.fmtCheckout}
              </span>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.15em] text-gold">
                {dateRange.nights} nuit{dateRange.nights > 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Description */}
          <p className="line-clamp-3 text-sm leading-relaxed text-navy/55">
            {villa.description || "Une adresse sélectionnée pour son cadre et son confort."}
          </p>

          {/* Specs */}
          <div className="flex flex-col gap-3 xs:flex-row xs:gap-8 border-y border-black/6 py-5">
            <div className="flex items-center gap-2 text-navy/80">
              <Users size={18} strokeWidth={1.25} className="text-navy/35" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                {villa.guests} voyageurs
              </span>
            </div>
            <div className="flex items-center gap-2 text-navy/80">
              <BedDouble size={18} strokeWidth={1.25} className="text-navy/35" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                {villa.rooms} chambre{villa.rooms > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={villaUrl}
            className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy underline-offset-[10px] hover:underline transition-colors"
          >
            Voir la fiche
          </Link>
          <Link
            href={bookingUrl}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-navy bg-navy px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-navy/90"
          >
            {checkin && checkout ? "Réserver ces dates" : "Réserver"}
            <ArrowRight size={16} strokeWidth={1.25} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
};
