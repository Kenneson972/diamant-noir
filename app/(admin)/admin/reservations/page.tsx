import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { BookingStatusBadge } from "@/components/dashboard/proprio/BookingStatusBadge";
import type { BookingStatus } from "@/types/domain";
import { Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Réservations — Administration Kayvila",
};

interface BookingRow {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  villa_id: string | null;
  start_date: string;
  end_date: string;
  price: number;
  status: BookingStatus;
  villa_name?: string | null;
}

async function getBookings(): Promise<BookingRow[]> {
  const supabase = await getSupabaseServer();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, guest_name, guest_email, villa_id, start_date, end_date, price, status")
    .order("start_date", { ascending: false })
    .limit(50);

  if (!bookings?.length) return [];

  // Fetch villa names in a separate query
  const villaIds = [
    ...new Set(bookings.map((b: { villa_id: string | null }) => b.villa_id).filter(Boolean)),
  ] as string[];

  const { data: villas } = await supabase
    .from("villas")
    .select("id, name")
    .in("id", villaIds);

  const villaMap: Record<string, string> = {};
  if (villas) {
    for (const v of villas) {
      villaMap[v.id] = v.name;
    }
  }

  return bookings.map((b: { id: string; guest_name: string | null; guest_email: string | null; villa_id: string | null; start_date: string; end_date: string; price: number; status: string }) => ({
    ...b,
    status: b.status as BookingStatus,
    villa_name: b.villa_id ? villaMap[b.villa_id] ?? null : null,
  }));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(price: number): string {
  return `${price.toLocaleString("fr-FR")} €`;
}

export default async function AdminReservationsPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin/reservations");

  const bookings = await getBookings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Réservations</h1>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">
            Aucune réservation pour le moment.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy/[0.02]">
              <tr>
                <th className="px-4 py-3 font-medium text-navy">Client</th>
                <th className="px-4 py-3 font-medium text-navy">Villa</th>
                <th className="px-4 py-3 font-medium text-navy">Arrivée</th>
                <th className="px-4 py-3 font-medium text-navy">Départ</th>
                <th className="px-4 py-3 font-medium text-navy">Montant</th>
                <th className="px-4 py-3 font-medium text-navy">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {booking.guest_name ?? "Anonyme"}
                    </div>
                    {booking.guest_email && (
                      <div className="text-xs text-gray-500">
                        {booking.guest_email}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {booking.villa_name ?? (
                      <span className="font-mono text-xs text-gray-400">
                        {booking.villa_id?.slice(0, 8)}…
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(booking.start_date)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(booking.end_date)}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {formatPrice(booking.price)}
                  </td>
                  <td className="px-4 py-3">
                    <BookingStatusBadge status={booking.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
