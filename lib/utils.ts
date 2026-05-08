import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate un montant en centimes en devise lisible (ex: 1 200 €). */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Extrait le prix en centimes d'un booking, en priorité depuis total_price_cents.
 * Fallback sur price * 100 pour les anciennes réservations.
 */
export function getBookingPriceCents(booking: { total_price_cents?: number | null; price?: number | null }): number {
  if (booking.total_price_cents != null) return booking.total_price_cents;
  if (booking.price != null) return Math.round(booking.price * 100);
  return 0;
}
