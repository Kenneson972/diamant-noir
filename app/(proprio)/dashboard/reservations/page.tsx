import { getCurrentUser, getOwnerVillas } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import type { BookingStatus } from "@/types/domain";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import {
  BookingGroupedList,
  type OwnerBookingItem,
} from "@/components/dashboard/proprio/BookingGroupedList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réservations",
};

export default async function ProprioReservationsIndexPage() {
  const {
    data: { user },
  } = await getCurrentUser();

  const { data: villas } = await getOwnerVillas(user!.id);

  if (!villas || villas.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-navy-900">Réservations</h1>
          <p className="text-sm text-muted">Gérez vos réservations</p>
        </div>
        <div className="dashboard-card flex flex-col items-center py-12 text-center">
          <KayvilaPngIcon name="calendar" size={24} className="mb-4 text-muted" />
          <p className="text-sm text-muted">Aucune réservation pour le moment.</p>
          <p className="mt-1 text-xs text-muted">
            Vos réservations apparaîtront ici dès qu&apos;un voyageur réservera votre villa.
          </p>
        </div>
      </div>
    );
  }

  const villaIds = villas.map((v) => v.id);
  const villaNames = new Map(villas.map((v) => [v.id, v.name]));

  const { data: allBookings } = await supabaseAdmin()
    .from("bookings")
    .select(
      "id, villa_id, guest_name, start_date, end_date, status, total_price_cents, source, payment_status, guests"
    )
    .in("villa_id", villaIds)
    .order("start_date", { ascending: false });

  const items: OwnerBookingItem[] = (allBookings ?? []).map((b) => ({
    id: b.id,
    villa_id: b.villa_id,
    villa_name: villaNames.get(b.villa_id) ?? "Villa",
    guest_name: b.guest_name,
    start_date: b.start_date,
    end_date: b.end_date,
    status: b.status as BookingStatus,
    total_price_cents: b.total_price_cents,
    source: b.source,
    payment_status: b.payment_status,
    guests: b.guests,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-900">Réservations</h1>
        <p className="text-sm text-muted">
          {items.length} réservation{items.length > 1 ? "s" : ""} sur {villas.length} villa
          {villas.length > 1 ? "s" : ""}
        </p>
      </div>
      <BookingGroupedList
        items={items}
        villas={villas.map((v) => ({ id: v.id, name: v.name }))}
      />
    </div>
  );
}
