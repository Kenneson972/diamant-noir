"use client";

import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, Chip, linkAsButtonClasses } from "@/components/espace-client/tenant-ui";
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
  chipColor: "danger" | "success" | "warning" | "default";
} {
  const now = new Date();
  const start = new Date(booking.start_date);
  const end = new Date(booking.end_date);

  if (booking.status === "cancelled") {
    return { label: "Annulée", chipColor: "danger" };
  }
  if (now >= start && now <= end) {
    return { label: "En cours", chipColor: "success" };
  }
  if (now < start) {
    return { label: "À venir", chipColor: "warning" };
  }
  return { label: "Terminée", chipColor: "default" };
}

function villaImageUrl(villa?: Booking["villa"]): string | undefined {
  if (!villa) return undefined;
  if (villa.image_url) return villa.image_url;
  const first = villa.image_urls?.[0];
  return first || undefined;
}

export function BookingCard({ booking }: { booking: Booking }) {
  const status = getStatus(booking);
  const nights = getNights(booking.start_date, booking.end_date);
  const villaName = booking.villa?.name ?? "Villa";
  const location = booking.villa?.location;
  const img = villaImageUrl(booking.villa);

  return (
    <Card className="group/card gap-0 overflow-hidden rounded-none border border-navy/8 bg-white p-0 shadow-none transition-all hover:border-navy/15 hover:shadow-sm">
      <div className="relative aspect-[16/7] overflow-hidden bg-navy/5">
        {img ? (
          <Image
            src={img}
            alt={villaName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-3">
            <p className="max-w-full truncate text-center text-[10px] font-medium text-navy/25">{villaName}</p>
          </div>
        )}
        <span className="absolute right-2.5 top-2.5">
          <Chip color={status.chipColor} className="uppercase">
            {status.label}
          </Chip>
        </span>
      </div>

      <CardContent className="flex flex-col gap-4 p-5">
        <div className="min-w-0">
          <p className="truncate font-display text-base text-navy">{villaName}</p>
          {location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-navy/55">
              <MapPin size={10} strokeWidth={1.25} />
              {location}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-navy/60">
          <Calendar size={13} strokeWidth={1.25} className="shrink-0 text-gold" />
          <span>
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
              {formatCurrency(getBookingPriceCents(booking as any))}
            </span>
          ) : (
            <span />
          )}
          <Link
            href={`/espace-client/reservations/${booking.id}`}
            className={linkAsButtonClasses(
              "ghost",
              "sm",
              "rounded-none px-2 text-gold hover:text-navy uppercase no-underline"
            )}
          >
            Détail
            <ArrowRight size={11} strokeWidth={1.5} />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
