import Link from "next/link";
import type { Booking } from "@/types/domain";
import { BookingStatusBadge } from "@/components/dashboard/proprio/BookingStatusBadge";

type BookingRow = Pick<
  Booking,
  "id" | "start_date" | "end_date" | "guest_name" | "status" | "price"
>;

interface BookingListProps {
  bookings: BookingRow[];
  villaId: string;
}

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2) + "€";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export function BookingList({ bookings, villaId }: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-navy/5 bg-white p-8 text-center">
        <p className="text-sm text-navy/50">
          Aucune réservation pour cette villa
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-navy/5 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-navy/5">
            <th className="px-5 py-3 font-medium text-navy/60">Client</th>
            <th className="px-5 py-3 font-medium text-navy/60">Arrivée</th>
            <th className="px-5 py-3 font-medium text-navy/60">Départ</th>
            <th className="px-5 py-3 font-medium text-navy/60">Montant</th>
            <th className="px-5 py-3 font-medium text-navy/60">Statut</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr
              key={booking.id}
              className="group cursor-pointer border-b border-navy/5 transition-colors last:border-0 hover:bg-navy/[0.02]"
            >
              <td className="px-5 py-4" colSpan={5}>
                <Link
                  href={`/dashboard/reservations/${villaId}/${booking.id}`}
                  className="flex items-center justify-between"
                >
                  <span className="w-1/4 font-medium text-navy">
                    {booking.guest_name ?? "Anonyme"}
                  </span>
                  <span className="w-1/6 text-navy/60">
                    {formatDate(booking.start_date)}
                  </span>
                  <span className="w-1/6 text-navy/60">
                    {formatDate(booking.end_date)}
                  </span>
                  <span className="w-1/6 font-medium text-navy">
                    {formatPrice(booking.price)}
                  </span>
                  <span className="w-1/6">
                    <BookingStatusBadge status={booking.status} />
                  </span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
