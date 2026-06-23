"use client";

import { useState } from "react";
import Link from "next/link";
import { Sheet } from "@heroui-pro/react";
import type { VillaMapItem } from "@/components/VillaLeafletMap";
import { Maximize2 } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { VillaCoverImage } from "@/components/ui/villa-cover-image";
import { pickVillaImageUrl, VILLA_IMAGE_FALLBACK } from "@/lib/villa-image";

const ENABLE_BORDER_GLOW = true; // mettre false pour désactiver

type VillaListingCardProps = {
  villa: VillaMapItem & { dimmed?: boolean };
  href: string;
  formatPrice: (price: number) => string;
  previewLabel: string;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onQuickView: (id: string) => void;
};

function CardImageBlock({
  villa,
  formatPrice,
}: {
  villa: VillaMapItem;
  formatPrice: (price: number) => string;
}) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-none">
      <VillaCoverImage
        src={pickVillaImageUrl(villa.image, villa.images)}
        alt={villa.name}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
  );
}

function PreviewBody({
  villa,
  formatPrice,
  href,
}: {
  villa: VillaMapItem;
  formatPrice: (price: number) => string;
  href: string;
}) {
  const previewImage = pickVillaImageUrl(villa.image, villa.images) || VILLA_IMAGE_FALLBACK;

  return (
    <>
      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-lg">
        <VillaCoverImage src={previewImage} alt={villa.name} fill className="object-cover" sizes="320px" />
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
            <KayvilaPngIcon name="users" size={18} alt="" />
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
      <p className="mt-3 font-sora text-sm font-semibold text-[#B8860B]">
        {formatPrice(villa.price)}
        <span className="font-normal text-muted"> / nuit</span>
      </p>
      <Link
        href={href}
        className="mt-4 block rounded-full bg-gold py-3 text-center text-sm font-semibold text-navy transition-colors hover:brightness-110"
      >
        Voir la villa — {formatPrice(villa.price)} / nuit
      </Link>
    </>
  );
}

export function VillaListingCard({
  villa,
  href,
  formatPrice,
  previewLabel,
  isHovered,
  onHover,
  onQuickView,
}: VillaListingCardProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sheetOpen, setSheetOpen] = useState(false);

  const cardShell = cn(
    "group relative overflow-hidden rounded-none border border-transparent transition-all duration-200",
    ENABLE_BORDER_GLOW && "villa-card-luxe",
    villa.dimmed && "opacity-40",
    isHovered
      ? "border-navy/15 shadow-[0_12px_40px_rgba(0,0,0,0.08)] -translate-y-px"
      : "hover:border-navy/10 hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)] hover:-translate-y-px"
  );

  if (isMobile) {
    return (
      <div
        data-villa={villa.id}
        className={cardShell}
      >
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          aria-label={`Aperçu — ${villa.name}`}
        >
          <CardImageBlock villa={villa} formatPrice={formatPrice} />
        </button>

        <Sheet isOpen={sheetOpen} onOpenChange={setSheetOpen} placement="bottom">
          <Sheet.Backdrop isDismissable>
            <Sheet.Content className="rounded-t-2xl bg-offwhite">
              <Sheet.Handle />
              <Sheet.Dialog aria-label={`Détails — ${villa.name}`}>
                <Sheet.Body className="px-6 pb-8 pt-2">
                  <PreviewBody villa={villa} formatPrice={formatPrice} href={href} />
                </Sheet.Body>
              </Sheet.Dialog>
            </Sheet.Content>
          </Sheet.Backdrop>
        </Sheet>

        <CardFooter
          villa={villa}
          href={href}
          formatPrice={formatPrice}
          previewLabel={previewLabel}
          onQuickView={onQuickView}
        />
      </div>
    );
  }

  return (
    <div
      data-villa={villa.id}
      onMouseEnter={() => onHover(villa.id)}
      onMouseLeave={() => onHover(null)}
      className={cardShell}
    >
      <Link
        href={href}
        className="block w-full min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite"
        tabIndex={villa.dimmed ? -1 : 0}
      >
        <CardImageBlock villa={villa} formatPrice={formatPrice} />
      </Link>

      <CardFooter
        villa={villa}
        href={href}
        formatPrice={formatPrice}
        previewLabel={previewLabel}
        onQuickView={onQuickView}
      />
    </div>
  );
}

function CardFooter({
  villa,
  formatPrice,
  previewLabel,
  onQuickView,
}: Pick<VillaListingCardProps, "villa" | "formatPrice" | "previewLabel" | "onQuickView"> & { href?: string }) {
  return (
    <div className="space-y-1 px-1 pb-2 pt-3">
      <p className="font-display text-lg font-normal leading-snug text-navy">{villa.name}</p>
      {villa.location ? (
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/55">{villa.location}</p>
      ) : null}
      <div className="flex items-center justify-between pt-0.5">
        <p className="text-xs text-navy/80">
          {formatPrice(villa.price)}
          <span className="text-navy/50"> / nuit</span>
        </p>
        <button
          type="button"
          onClick={() => onQuickView(villa.id)}
          aria-label={`Aperçu rapide — ${villa.name}`}
          className="flex min-h-[44px] items-center border border-navy/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy/80 transition-opacity duration-200 hover:border-gold hover:text-gold sm:opacity-0 sm:group-hover:opacity-100"
        >
          {previewLabel}
        </button>
      </div>
    </div>
  );
}
