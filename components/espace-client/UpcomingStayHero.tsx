"use client";

import Link from "next/link";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { Chip } from "@heroui/react";
import { VillaCoverImage } from "@/components/ui/villa-cover-image";
import { pickVillaImageUrl } from "@/lib/villa-image";

type UpcomingBooking = {
  start_date: string;
  end_date: string;
  price?: number | null;
  villa?: {
    name?: string;
    location?: string | null;
    image_url?: string | null;
    image_urls?: string[] | null;
  } | null;
};

export function UpcomingStayHero({ booking }: { booking: UpcomingBooking }) {
  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const daysUntil = Math.ceil((startDate.getTime() - Date.now()) / 86400000);
  const nights = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
  const isToday = daysUntil <= 0 && Date.now() < endDate.getTime();
  const isInProgress = isToday;

  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  const imageSrc = pickVillaImageUrl(booking.villa?.image_url, booking.villa?.image_urls ?? null);

  return (
    <article className="overflow-hidden border border-navy/8 border-t-2 border-t-gold bg-white">
      <div className="grid md:grid-cols-[1.15fr_1fr]">
        <div className="relative aspect-[16/10] min-h-[200px] bg-navy/5 md:aspect-auto md:min-h-[280px]">
          <VillaCoverImage
            src={imageSrc}
            alt={booking.villa?.name ?? "Villa Kayvila"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 55vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-navy/5" />
          <div className="absolute inset-x-0 bottom-0 p-4 md:hidden">
            <h2 className="font-display text-xl font-normal leading-snug text-white drop-shadow">
              {booking.villa?.name ?? "Villa Kayvila"}
            </h2>
            {booking.villa?.location ? (
              <p className="font-display text-sm italic text-white/80">
                {booking.villa.location}, Martinique
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col justify-center px-6 py-8 md:px-8 md:py-10">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Chip size="sm" variant="soft" color={isInProgress ? "success" : "warning"}>
              {isInProgress ? "Séjour en cours" : "Prochain séjour"}
            </Chip>
            {!isInProgress && daysUntil > 0 ? (
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/45">
                Dans {daysUntil} jour{daysUntil > 1 ? "s" : ""}
              </span>
            ) : null}
          </div>

          <h2 className="hidden font-display text-2xl font-normal leading-snug text-navy md:block md:text-[26px]">
            {booking.villa?.name ?? "Villa Kayvila"}
          </h2>
          {booking.villa?.location ? (
            <p className="mt-1 hidden font-display text-sm italic text-navy/50 md:block">
              {booking.villa.location}, Martinique
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-navy/10 px-3 py-1.5 text-[11px] font-medium text-navy/70">
              {fmt(startDate)} – {fmt(endDate)}
            </span>
            <span className="rounded-full border border-navy/10 px-3 py-1.5 text-[11px] font-medium text-navy/70">
              {nights} nuit{nights > 1 ? "s" : ""}
            </span>
            {booking.price != null && booking.price > 0 ? (
              <span className="rounded-full border border-navy/10 px-3 py-1.5 text-[11px] font-medium text-navy/70">
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(booking.price)}
              </span>
            ) : null}
          </div>

          <Link
            href="/espace-client/livret"
            className="mt-7 inline-flex min-h-[44px] items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gold no-underline transition-colors hover:text-navy"
          >
            <KayvilaPngIcon name="book" size={18} alt="" aria-hidden />
            Consulter le livret
            <KayvilaPngIcon name="arrow-right" size={18} alt="" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
