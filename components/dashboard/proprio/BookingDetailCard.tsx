import type { Booking } from "@/types/domain";
import { BookingStatusBadge } from "@/components/dashboard/proprio/BookingStatusBadge";

interface BookingDetailCardProps {
  booking: Booking;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2) + "€";
}

export function BookingDetailCard({ booking }: BookingDetailCardProps) {
  const shortId = booking.id.slice(0, 8);

  return (
    <div className="overflow-hidden rounded-2xl border border-navy/5 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-navy/5 px-6 py-4">
        <h2 className="font-display text-lg font-semibold text-navy">
          Réservation #{shortId}
        </h2>
        <BookingStatusBadge status={booking.status} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-3">
        {/* Client */}
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-navy/40">
            Client
          </span>
          <p className="mt-1.5 font-medium text-navy">
            {booking.guest_name ?? "Anonyme"}
          </p>
          {booking.guest_email && (
            <p className="mt-0.5 text-sm text-navy/50">{booking.guest_email}</p>
          )}
        </div>

        {/* Séjour */}
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-navy/40">
            Séjour
          </span>
          <p className="mt-1.5 font-medium text-navy">
            {formatDate(booking.start_date)}
          </p>
          <p className="mt-0.5 text-sm text-navy/50">→ {formatDate(booking.end_date)}</p>
        </div>

        {/* Total */}
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-navy/40">
            Total
          </span>
          <p className="mt-1.5 font-display text-2xl font-bold text-navy">
            {formatPrice(booking.price)}
          </p>
        </div>
      </div>
    </div>
  );
}
