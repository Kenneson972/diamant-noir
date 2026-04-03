"use client";

import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Card, Chip, Button } from "@heroui/react";

interface Booking {
  id: string;
  villa_id: string;
  start_date: string;
  end_date: string;
  status: string;
  price?: number;
  guest_name?: string;
  villa?: { name: string; location?: string; image_url?: string | null; image_urls?: string[] | null };
}

function getNights(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function getStatus(booking: Booking): {
  label: string;
  chipColor: "danger" | "success" | "warning" | "default" | "accent";
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
    <Card className="overflow-hidden border border-navy/8 bg-white p-0 gap-0 shadow-none hover:border-navy/15 hover:shadow-sm transition-all rounded-none">
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
            <p className="text-[10px] font-medium text-navy/25 text-center truncate max-w-full">{villaName}</p>
          </div>
        )}
        <Chip
          color={status.chipColor}
          size="sm"
          variant="soft"
          className="absolute top-2.5 right-2.5 uppercase text-[9px] font-bold tracking-[0.2em]"
        >
          {status.label}
        </Chip>
      </div>

      <Card.Content className="p-5 gap-4 flex flex-col">
        <div className="min-w-0">
          <p className="font-display text-base text-navy truncate">{villaName}</p>
          {location && (
            <p className="flex items-center gap-1 text-xs text-navy/40 mt-0.5">
              <MapPin size={10} strokeWidth={1.25} />
              {location}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-navy/60">
          <Calendar size={13} strokeWidth={1.25} className="text-gold shrink-0" />
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
            <span className="text-navy/30"> — {nights} nuit{nights > 1 ? "s" : ""}</span>
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-navy/5 mt-auto">
          {booking.price ? (
            <span className="text-sm font-medium text-navy">
              {Number(booking.price).toLocaleString("fr-FR")} €
            </span>
          ) : (
            <span />
          )}
          <Link href={`/espace-client/reservations/${booking.id}`} className="no-underline">
            <Button
              size="sm"
              variant="ghost"
              className="rounded-none px-2 text-gold hover:text-navy uppercase text-[10px] font-bold tracking-[0.2em] gap-1.5"
            >
              Détail
              <ArrowRight size={11} strokeWidth={1.5} />
            </Button>
          </Link>
        </div>
      </Card.Content>
    </Card>
  );
}
