import { grossCentsFromBooking, type BookingRevenueInput } from "./booking-revenue";

export type VillaRevenueRow = {
  villaId: string;
  villaName: string;
  grossCents: number;
  bookingsCount: number;
};

type Input = BookingRevenueInput & { villa_id: string; villa_name?: string | null };

export function revenueByVilla(bookings: Input[]): VillaRevenueRow[] {
  const map = new Map<string, VillaRevenueRow>();
  for (const b of bookings) {
    const key = b.villa_id;
    const existing = map.get(key);
    const gross = grossCentsFromBooking(b);
    if (existing) {
      existing.grossCents += gross;
      existing.bookingsCount += 1;
    } else {
      map.set(key, { villaId: key, villaName: b.villa_name ?? "Villa", grossCents: gross, bookingsCount: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.grossCents - a.grossCents);
}
