import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  );
}

export function formatDateFr(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "d MMMM yyyy", { locale: fr });
  } catch {
    return isoDate;
  }
}

export function bookingNights(startDate: string, endDate: string): number {
  try {
    const nights = differenceInCalendarDays(parseISO(endDate), parseISO(startDate));
    return Math.max(nights, 1);
  } catch {
    return 1;
  }
}

export function formatEuros(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function bookingTotalEuros(booking: {
  total_price_cents?: number | null;
  price?: number | null;
}): number {
  if (booking.total_price_cents != null) {
    return booking.total_price_cents / 100;
  }
  return booking.price ?? 0;
}
