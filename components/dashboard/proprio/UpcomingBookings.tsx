import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { Booking } from "@/types/domain";

interface UpcomingBookingsProps {
  bookings: Pick<
    Booking,
    "id" | "start_date" | "end_date" | "guest_name" | "status" | "villa_id"
  >[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

export function UpcomingBookings({ bookings }: UpcomingBookingsProps) {
  if (bookings.length === 0) {
    return (
      <div className="dashboard-card">
        <span className="dashboard-eyebrow">PROCHAINES RÉSERVATIONS</span>
        <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
          <CalendarDays className="mb-3 h-8 w-8 text-muted" aria-hidden />
          <p className="text-sm italic text-muted">
            Aucune réservation à venir
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <span className="dashboard-eyebrow">PROCHAINES RÉSERVATIONS</span>

      <ul className="mt-4 divide-y divide-border-subtle">
        {bookings.slice(0, 3).map((booking) => (
          <li key={booking.id}>
            <Link
              href={`/dashboard/reservations/${booking.villa_id}/${booking.id}`}
              className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-navy-900/[0.02]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy-900">
                  {booking.guest_name ?? "Anonyme"}
                </p>
                <p className="text-xs text-muted">
                  {formatDate(booking.start_date)} —{" "}
                  {formatDate(booking.end_date)}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-2 border-t border-border-subtle pt-3">
        <Link
          href="/dashboard/reservations"
          className="text-xs font-medium text-navy-900/60 transition-colors hover:text-navy-900"
        >
          → Voir toutes les réservations
        </Link>
      </div>
    </div>
  );
}
