import { calculateTransferAmounts } from "@/lib/stripe/connect";

export type BookingRevenueInput = {
  price?: number | null;
  cleaning_fee?: number | null;
  service_fee?: number | null;
  total_price_cents?: number | null;
};

/** Montant séjour en centimes (price euros prioritaire, sinon total legacy). */
export function stayCentsFromBooking(b: BookingRevenueInput): number {
  if (b.price != null && Number(b.price) > 0) {
    return Math.round(Number(b.price) * 100);
  }
  return b.total_price_cents ?? 0;
}

export function ownerNetCents(
  b: BookingRevenueInput,
  commissionRate = 25
): number {
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
  commissionRate = 25
): number {
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
