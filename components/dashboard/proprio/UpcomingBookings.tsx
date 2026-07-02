import Link from "next/link";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
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
          <KayvilaPngIcon name="calendar" size={24} className="mb-3 text-muted" />
          <p className="text-sm italic text-muted">
            Aucune réservation à venir
          </p>
          <Link
            href="/dashboard/villas"
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold no-underline transition-colors hover:text-navy"
          >
            Voir mes villas
            <KayvilaPngIcon name="arrow-right" size={18} alt="" aria-hidden />
          </Link>
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
              <KayvilaPngIcon name="arrow-right" size={20} className="shrink-0 text-muted" />
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
