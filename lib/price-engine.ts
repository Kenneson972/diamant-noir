import type { BookingPriceInput, BookingPriceResult } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

const diffDays = (start: Date, end: Date) =>
  Math.ceil((end.getTime() - start.getTime()) / DAY_MS);

type SeasonalPrice = { season: string; start: string; end: string; price: number };

/** Find the applicable seasonal price for a date range */
const findSeasonalPrice = (startDate: Date, endDate: Date, seasonalPrices?: SeasonalPrice[]): number | null => {
  if (!seasonalPrices?.length) return null;
  const start = startDate.toISOString().slice(5, 10); // MM-DD
  const end = endDate.toISOString().slice(5, 10);
  for (const sp of seasonalPrices) {
    if (start >= sp.start && end <= sp.end) return sp.price;
  }
  return null;
};

/** Count weekend nights (Fri-Sat and Sat-Sun) in a date range */
const countWeekendNights = (start: Date, nights: number): number => {
  let count = 0;
  const d = new Date(start);
  for (let i = 0; i < nights; i++) {
    const day = d.getDay(); // 5=Friday, 6=Saturday
    if (day === 5 || day === 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
};

export const calculatePrice = ({
  startDate,
  endDate,
  basePrice = 1000,
  seasonalPrices,
}: BookingPriceInput): BookingPriceResult => {
  const nights = diffDays(startDate, endDate);

  // Use seasonal price if applicable
  const seasonalPrice = findSeasonalPrice(startDate, endDate, seasonalPrices as SeasonalPrice[]);
  const effectiveBasePrice = seasonalPrice ?? basePrice;
  if (nights <= 0) {
    return { total: 0, nights: 0, breakdown: "invalid_date_range" };
  }

  const dailyPrice = effectiveBasePrice;
  const weekPrice = effectiveBasePrice * 3;
  const weekendPrice = effectiveBasePrice * 1.5;

  // Combinatorial: decompose N nights into weeks → weekends → remaining days
  const fullWeeks = Math.floor(nights / 7);
  const remainingAfterWeeks = nights - fullWeeks * 7;

  const weekendNights = countWeekendNights(
    new Date(startDate.getTime() + fullWeeks * 7 * DAY_MS),
    remainingAfterWeeks
  );
  const weekendPairs = Math.floor(weekendNights / 2);
  const remainingAfterWeekends = remainingAfterWeeks - weekendPairs * 2;

  const remainingDays = remainingAfterWeekends;

  const parts: string[] = [];
  let total = 0;

  if (fullWeeks > 0) {
    total += fullWeeks * weekPrice;
    parts.push(`${fullWeeks}x_semaine`);
  }
  if (weekendPairs > 0) {
    total += weekendPairs * weekendPrice;
    parts.push(`${weekendPairs}x_weekend`);
  }
  if (remainingDays > 0) {
    total += remainingDays * dailyPrice;
    parts.push(`${remainingDays}x_journée`);
  }

  const breakdown = parts.join("+") || "0_nuit";

  return { total, nights, breakdown };
};

// ─── Tests (run with: npx ts-node lib/price-engine.ts) ──────────────
// Example cases (copy into a .test.ts file for real test runner):
//
// Nightly:
//   1 night (Wed)  → 1×1000  = 1000
// Weekend:
//   2 nights Fri-Sun → 1 weekend pair → 1×1500 = 1500
// Week:
//   7 nights Mon-Sun → 1 week → 1×3000 = 3000
// Combinatorial:
//   8 nights Mon-Mon (1w+1d) → 1×3000 + 1×1000 = 4000
//   9 nights Fri-Sun (1w+2d weekend) → 1×3000 + 1×1500 = 4500
//   10 nights Mon-Wed (1w+3d, 0 weekend) → 1×3000 + 3×1000 = 6000
//   12 nights containing weekends
