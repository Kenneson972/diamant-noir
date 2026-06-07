import { getSupabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import { BookingStatusBadge } from "@/components/dashboard/proprio/BookingStatusBadge";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { formatCurrency, getBookingPriceCents } from "@/lib/utils";

function calcNights(start: string, end: string): number {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réservations — Kayvila",
};

export default async function ProprioReservationsIndexPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch villas for this owner
  const { data: villas } = await supabase
    .from("villas")
    .select("id, name")
    .eq("owner_id", user!.id)
    .order("name");

  if (!villas || villas.length === 0) {
    return (
      <div>
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-navy-900">
              Réservations
            </h1>
            <p className="text-sm text-muted">Gérez vos réservations</p>
          </div>
          <div className="dashboard-card flex flex-col items-center py-12 text-center">
            <CalendarCheck className="mb-4 h-12 w-12 text-muted" />
            <p className="text-sm text-muted">Aucune réservation pour le moment.</p>
            <p className="mt-1 text-xs text-muted">
              Vos réservations apparaîtront ici dès qu&apos;un voyageur réservera votre villa.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch bookings for all owner villas using admin client to bypass RLS
  const villaIds = villas.map((v) => v.id);
  const { data: allBookings } = await supabaseAdmin()
    .from("bookings")
    .select("id, villa_id, guest_name, start_date, end_date, status, total_price_cents, source, payment_status, guests")
    .in("villa_id", villaIds)
    .order("start_date", { ascending: false });

  // Merge bookings into villas
  const bookingsByVillaId: Record<string, any[]> = {};
  for (const b of allBookings ?? []) {
    if (!bookingsByVillaId[b.villa_id]) bookingsByVillaId[b.villa_id] = [];
    bookingsByVillaId[b.villa_id].push(b);
  }
  const villasWithBookings = villas.map((v) => ({
    ...v,
    bookings: bookingsByVillaId[v.id] ?? [],
  }));

  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Réservations
          </h1>
          <p className="text-sm text-muted">Gérez vos réservations</p>
        </div>

        {/* Liste des villas avec leurs réservations */}
        <div className="space-y-4">
          {villasWithBookings.map((villa) => (
            <div
              key={villa.id}
              className="dashboard-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold text-navy-900">
                    {villa.name}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted">
                    {(villa.bookings || []).length} réservation
                    {(villa.bookings || []).length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Réservations — chacune cliquable vers la fiche détail */}
              {(villa.bookings || []).length > 0 && (
                <div className="mt-3 space-y-1 border-t border-border-subtle pt-3">
                  {(villa.bookings as any[])
                    .filter((b: any) => b.status !== "cancelled")
                    .sort(
                      (a: any, b: any) =>
                        new Date(a.start_date).getTime() -
                        new Date(b.start_date).getTime()
                    )
                    .map((booking: any) => {
                      const nights = calcNights(booking.start_date, booking.end_date);
                      const price = formatCurrency(getBookingPriceCents(booking));
                      const sourceLabel: Record<string, string> = { airbnb: "Airbnb", direct: "Direct", booking: "Booking", vrbo: "Vrbo", expedia: "Expedia", ical: "iCal" };
                      const pmtLabel: Record<string, string> = { paid: "Payé", unpaid: "En attente", refunded: "Remboursé", partially_refunded: "Remb. partiel" };
                      return (
                        <Link
                          key={booking.id}
                          href={`/dashboard/reservations/${villa.id}/${booking.id}`}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-navy/[0.04]"
                        >
                          <span className="w-1/5 font-medium text-navy-900/80">
                            {booking.guest_name}
                          </span>
                          <span className="text-xs text-muted">
                            {new Date(booking.start_date).toLocaleDateString("fr-FR")} –{" "}
                            {new Date(booking.end_date).toLocaleDateString("fr-FR")}
                          </span>
                          <span className="text-xs text-navy/60">
                            {nights} nuit{nights > 1 ? "s" : ""} · {price}
                          </span>
                          <span className="text-[10px] text-navy/40">
                            {sourceLabel[booking.source] ?? booking.source ?? "—"}
                          </span>
                          <span className={`text-[10px] font-medium ${booking.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                            {pmtLabel[booking.payment_status] ?? "En attente"}
                          </span>
                          <span className="text-[10px] text-navy/40">
                            {booking.guests ?? "—"} pers.
                          </span>
                          <BookingStatusBadge status={booking.status} />
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
