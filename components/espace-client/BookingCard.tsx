"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { Chip } from "@heroui/react";
import { VillaCoverImage } from "@/components/ui/villa-cover-image";
import { pickVillaImageUrl } from "@/lib/villa-image";
import { linkAsButtonClasses } from "@/components/espace-client/tenant-ui";
import { formatCurrency, getBookingPriceCents } from "@/lib/utils";

interface Booking {
  id: string;
  villa_id: string;
  start_date: string;
  end_date: string;
  status: string;
  price?: number;
  total_price_cents?: number | null;
  guest_name?: string;
  villa?: { name: string; location?: string; image_url?: string | null; image_urls?: string[] | null };
}

function getNights(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function getStatus(booking: Booking): {
  label: string;
  color: "danger" | "success" | "warning" | "default";
} {
  const now = new Date();
  const start = new Date(booking.start_date);
  const end = new Date(booking.end_date);

  if (booking.status === "cancelled") {
    return { label: "Annulée", color: "danger" };
  }
  if (now >= start && now <= end) {
    return { label: "En cours", color: "success" };
  }
  if (now < start) {
    return { label: "À venir", color: "warning" };
  }
  return { label: "Terminée", color: "default" };
}

export function BookingCard({ booking }: { booking: Booking }) {
  const status = getStatus(booking);
  const nights = getNights(booking.start_date, booking.end_date);
  const villaName = booking.villa?.name ?? "Villa";
  const location = booking.villa?.location;
  const imageSrc = pickVillaImageUrl(booking.villa?.image_url, booking.villa?.image_urls ?? null);

  return (
    <article className="group/card overflow-hidden rounded-none border border-navy/8 bg-white transition-all hover:border-navy/15 hover:shadow-sm">
      <div className="relative aspect-[16/7] overflow-hidden bg-navy/5">
        <VillaCoverImage
          src={imageSrc}
          alt={villaName}
          fill
          className="object-cover transition-transform duration-700 group-hover/card:scale-[1.02]"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
        <span className="absolute right-2.5 top-2.5">
          <Chip size="sm" variant="soft" color={status.color} className="uppercase">
            {status.label}
          </Chip>
        </span>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="min-w-0">
          <p className="truncate font-display text-base text-navy">{villaName}</p>
          {location ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-navy/55">
              <KayvilaPngIcon name="location" size={18} alt="" aria-hidden />
              {location}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 text-sm text-navy/80 min-w-0">
          <Calendar size={16} strokeWidth={1.5} className="shrink-0 text-gold" aria-hidden />
          <span className="truncate">
            {new Date(booking.start_date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
            {" · "}
            {new Date(booking.end_date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            <span className="text-navy/30">
              {" "}
              — {nights} nuit{nights > 1 ? "s" : ""}
            </span>
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-navy/5 pt-2">
          {booking.price != null || booking.total_price_cents != null ? (
            <span className="text-sm font-medium text-navy">
              {formatCurrency(getBookingPriceCents(booking))}
            </span>
          ) : (
            <span />
          )}
          <Link
            href={`/espace-client/reservations/${booking.id}`}
            className={linkAsButtonClasses(
              "ghost",
              "sm",
              "rounded-none px-2 uppercase text-gold no-underline hover:text-navy"
            )}
          >
            Détail
            <KayvilaPngIcon name="arrow-right" size={18} alt="" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
