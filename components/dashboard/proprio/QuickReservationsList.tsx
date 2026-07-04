import Link from "next/link";
import { User } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import type { Booking } from "@/types/domain";
import { cn, formatDate } from "@/lib/utils";
import { BookingStatusBadge } from "./BookingStatusBadge";

interface QuickReservationsListProps {
  bookings: Pick<Booking, "id" | "start_date" | "end_date" | "guest_name" | "status">[];
}

export function QuickReservationsList({ bookings }: QuickReservationsListProps) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-navy/10 bg-navy/[0.02] px-6 py-12 text-center">
        <KayvilaPngIcon name="calendar" size={24} className="text-navy/60 mb-3 aria-hidden" />
        <p className="text-sm font-medium text-navy/50">
          Aucune réservation à venir
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-navy/5 bg-white shadow-sm">
      <div className="border-b border-navy/5 px-5 py-4">
        <h3 className="text-sm font-semibold text-navy">
          Prochaines réservations
        </h3>
      </div>
      <ul className="divide-y divide-navy/5">
        {bookings.map((booking) => (
          <li key={booking.id}>
            <Link
              href={`/dashboard/reservations/${booking.id}`}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 transition-colors",
                "hover:bg-navy/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/5">
                <User className="h-4 w-4 text-navy/50" aria-hidden />
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate text-sm font-medium text-navy">
                  {booking.guest_name ?? "Anonyme"}
                </span>
                <span className="hidden text-xs text-navy/55 sm:inline">
                  <KayvilaPngIcon name="calendar" size={18} className="mr-1 inline aria-hidden" />
                  {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
                </span>
              </div>

              <div className="shrink-0">
                <BookingStatusBadge status={booking.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
