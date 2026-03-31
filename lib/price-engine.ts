import type { BookingPriceInput, BookingPriceResult } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

const diffDays = (start: Date, end: Date) =>
  Math.ceil((end.getTime() - start.getTime()) / DAY_MS);

const isWeekendRange = (start: Date, end: Date, nights: number) => {
  const startDay = start.getDay(); // 5 = Friday
  return startDay === 5 && nights === 2;
};

export const calculatePrice = ({
  startDate,
  endDate,
  basePrice = 1000,
}: BookingPriceInput): BookingPriceResult => {
  const nights = diffDays(startDate, endDate);
  if (nights <= 0) {
    return { total: 0, nights: 0, breakdown: "invalid_date_range" };
  }

  // Logic: 
  // Week (7 nights) = 3x daily price (as requested 3000 vs 1000)
  // Weekend (Fri-Sun, 2 nights) = 1.5x daily price (as requested 1500 vs 1000)
  // Day = daily price
  
  const dailyPrice = basePrice;
  const weekPrice = basePrice * 3;
  const weekendPrice = basePrice * 1.5;

  if (nights % 7 === 0) {
    const weeks = nights / 7;
    return {
      total: weeks * weekPrice,
      nights,
      breakdown: `${weeks}x_semaine`,
    };
  }

  if (isWeekendRange(startDate, endDate, nights)) {
    return { total: weekendPrice, nights, breakdown: "weekend" };
  }

  return {
    total: nights * dailyPrice,
    nights,
    breakdown: `${nights}x_journée`,
  };
};
