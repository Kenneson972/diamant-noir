import type { Booking } from "@/types/domain";
import { KayvilaEmptyState } from "@/components/ui/pro";
import { ProprioBookingDataGrid } from "@/components/dashboard/proprio/ProprioBookingDataGrid";

type BookingRow = Pick<
  Booking,
  "id" | "start_date" | "end_date" | "guest_name" | "status" | "price" | "total_price_cents" | "source" | "payment_status" | "guests"
>;

interface BookingListProps {
  bookings: BookingRow[];
  villaId: string;
}

export function BookingList({ bookings, villaId }: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <KayvilaEmptyState
        title="Aucune réservation"
        description="Aucune réservation pour cette villa pour le moment."
      />
    );
  }

  return <ProprioBookingDataGrid bookings={bookings} villaId={villaId} />;
}
