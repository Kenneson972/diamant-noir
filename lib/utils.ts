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

/** Temps relatif en français (ex: "Il y a 5 min"). */
export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse une chaîne de date. Si c'est une date "pure" (YYYY-MM-DD, sans heure),
 * l'ancre à minuit LOCAL plutôt que de laisser JS l'interpréter en UTC minuit
 * (ce qui décale l'affichage d'un jour pour les fuseaux négatifs par rapport à UTC).
 * Un timestamp complet (avec heure/zone) est laissé inchangé.
 */
export function parseDateOnly(value: string): Date {
  return DATE_ONLY_RE.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
}

/** Formate une date en français avec options. */
export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  return parseDateOnly(dateStr).toLocaleDateString("fr-FR", opts);
}
