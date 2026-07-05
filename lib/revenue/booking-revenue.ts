import { calculateTransferAmounts } from "@/lib/stripe/connect";

export type BookingRevenueInput = {
  price?: number | null;
  cleaning_fee?: number | null;
  service_fee?: number | null;
  total_price_cents?: number | null;
};

const OTA_SOURCES = ['airbnb', 'expedia', 'trivago', 'vrbo', 'booking', 'ical'];

export function getCommissionRate(source: string | null): number {
  if (source && OTA_SOURCES.includes(source)) return 20;
  return 22; // direct, manual, admin, ou null → 22%
}

/** Montant séjour en centimes (price euros prioritaire, sinon total legacy). */
export function stayCentsFromBooking(b: BookingRevenueInput): number {
  if (b.price != null && Number(b.price) > 0) {
    return Math.round(Number(b.price) * 100);
  }
  return b.total_price_cents ?? 0;
}

export function ownerNetCents(
  b: BookingRevenueInput,
  commissionRateOrSource?: number | string | null
): number {
  const commissionRate = typeof commissionRateOrSource === 'number'
    ? commissionRateOrSource
    : getCommissionRate(commissionRateOrSource ?? null);
  const stayCents = stayCentsFromBooking(b);
  const cleaningCents = Math.round(Number(b.cleaning_fee ?? 0) * 100);
  const serviceCents = Math.round(Number(b.service_fee ?? 0) * 100);
  return calculateTransferAmounts(
    stayCents,
    cleaningCents,
    serviceCents,
    commissionRate
  ).ownerAmountCents;
}

export function platformFeeCents(
  b: BookingRevenueInput,
  commissionRateOrSource?: number | string | null
): number {
  const commissionRate = typeof commissionRateOrSource === 'number'
    ? commissionRateOrSource
    : getCommissionRate(commissionRateOrSource ?? null);
  const stayCents = stayCentsFromBooking(b);
  const cleaningCents = Math.round(Number(b.cleaning_fee ?? 0) * 100);
  const serviceCents = Math.round(Number(b.service_fee ?? 0) * 100);
  return calculateTransferAmounts(
    stayCents,
    cleaningCents,
    serviceCents,
    commissionRate
  ).platformFeeCents;
}

export function grossCentsFromBooking(b: BookingRevenueInput): number {
  const stay = stayCentsFromBooking(b);
  const cleaning = Math.round(Number(b.cleaning_fee ?? 0) * 100);
  const service = Math.round(Number(b.service_fee ?? 0) * 100);
  if (cleaning > 0 || service > 0) return stay + cleaning + service;
  return b.total_price_cents ?? stay;
}

const CHANNEL_LABELS: Record<string, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking.com',
  expedia: 'Expedia',
  vrbo: 'VRBO',
  trivago: 'Trivago',
  ical: 'Import iCal',
};

/** Libellé affichable d'un canal de réservation ; tout ce qui n'est pas une OTA connue → "Direct". */
export function channelLabel(source: string | null): string {
  if (!source) return 'Direct';
  return CHANNEL_LABELS[source] ?? 'Direct';
}
