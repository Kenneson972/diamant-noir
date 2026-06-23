export type SeasonalNightRate = {
  season: string;
  start: string;
  end: string;
  price: number;
};

/** Prix par nuit pour une date ISO (YYYY-MM-DD), en tenant compte des tarifs saisonniers. */
export function getNightlyPriceForDate(
  dateIso: string,
  basePrice: number,
  seasonalRates?: SeasonalNightRate[]
): number {
  if (!seasonalRates?.length) return basePrice;

  for (const rate of seasonalRates) {
    const start = rate.start.slice(0, 10);
    const end = rate.end.slice(0, 10);
    if (dateIso >= start && dateIso <= end) {
      return rate.price;
    }
  }

  return basePrice;
}

/** Affichage compact pour une cellule calendrier (ex. «450€»). */
export function formatCompactNightPrice(
  amount: number,
  formatPrice: (price: number) => string
): string {
  return formatPrice(amount).replace(/\s/g, "");
}
