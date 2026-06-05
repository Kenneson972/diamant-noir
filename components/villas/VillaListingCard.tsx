"use client";

import Image from "next/image";
import Link from "next/link";
import { HoverCard } from "@heroui-pro/react";
import type { VillaMapItem } from "@/components/VillaLeafletMap";
import { Users, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

type VillaListingCardProps = {
  villa: VillaMapItem & { dimmed?: boolean };
  href: string;
  formatPrice: (price: number) => string;
  previewLabel: string;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onQuickView: (id: string) => void;
};

export function VillaListingCard({
  villa,
  href,
  formatPrice,
  previewLabel,
  isHovered,
  onHover,
  onQuickView,
}: VillaListingCardProps) {
  const previewImage = villa.images[0] ?? villa.image ?? "/villa-hero.jpg";

  return (
    <div
      data-villa={villa.id}
      onMouseEnter={() => onHover(villa.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "group relative overflow-hidden rounded-none border border-transparent transition-all duration-200",
        villa.dimmed && "opacity-40",
        isHovered
          ? "border-navy/15 shadow-[0_12px_40px_rgba(0,0,0,0.08)] -translate-y-px"
          : "hover:border-navy/10 hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)] hover:-translate-y-px"
      )}
    >
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCard.Trigger>
          <Link
            href={href}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite"
            tabIndex={villa.dimmed ? -1 : 0}
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-none">
              <Image
                src={villa.image || "/villa-hero.jpg"}
                alt={villa.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              {villa.tier ? (
                <div className="absolute top-4 left-4">
                  <span className="rounded-none border border-gold/40 bg-navy/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-gold backdrop-blur-sm">
                    {villa.tier}
                  </span>
                </div>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent pb-5 pt-14 px-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">À partir de</p>
                <p className="mt-0.5 font-display text-lg leading-none text-white">
                  {formatPrice(villa.price)}
                  <span className="text-xs font-sans font-normal text-white/50"> / nuit</span>
                </p>
              </div>
            </div>
          </Link>
        </HoverCard.Trigger>
        <HoverCard.Content className="w-80 rounded-xl border border-border-subtle bg-white p-4 shadow-2xl">
          <HoverCard.Arrow />
          <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-lg">
            <Image src={previewImage} alt={villa.name} fill className="object-cover" sizes="320px" />
          </div>
          <div className="flex items-start justify-between gap-2">
            <span className="font-display text-lg text-navy">{villa.name}</span>
            {villa.tier ? (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-gold">{villa.tier}</span>
            ) : null}
          </div>
          {villa.location ? (
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{villa.location}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
            {villa.capacity ? (
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" />
                {villa.capacity} pers.
              </span>
            ) : null}
            {villa.surface ? (
              <span className="inline-flex items-center gap-1">
                <Maximize2 className="size-3.5" />
                {villa.surface} m²
              </span>
            ) : null}
          </div>
          {villa.amenities.length > 0 ? (
            <p className="mt-2 line-clamp-2 text-sm text-navy/70">{villa.amenities.slice(0, 4).join(" · ")}</p>
          ) : null}
          <p className="mt-3 font-sora text-sm font-semibold text-gold">
            {formatPrice(villa.price)}
            <span className="font-normal text-muted"> / nuit</span>
          </p>
        </HoverCard.Content>
      </HoverCard>

      <div className="space-y-1 px-1 pb-2 pt-3">
        <p className="font-display text-lg font-normal leading-snug text-navy">{villa.name}</p>
        {villa.location ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/55">{villa.location}</p>
        ) : null}
        <div className="flex items-center justify-between pt-0.5">
          <p className="text-xs text-navy/60">
            {formatPrice(villa.price)}
            <span className="text-navy/50"> / nuit</span>
          </p>
          <button
            type="button"
            onClick={() => onQuickView(villa.id)}
            aria-label={`Aperçu rapide — ${villa.name}`}
            className="flex min-h-[44px] items-center border border-navy/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy/60 transition-opacity duration-200 hover:border-gold hover:text-gold sm:opacity-0 sm:group-hover:opacity-100"
          >
            {previewLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
