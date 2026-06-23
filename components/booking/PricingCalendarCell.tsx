"use client";

import { RangeCalendar } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import {
  formatCompactNightPrice,
  getNightlyPriceForDate,
  type SeasonalNightRate,
} from "@/lib/calendar/pricing-utils";

type PricingCalendarCellProps = {
  date: CalendarDate;
  basePrice: number;
  seasonalRates?: SeasonalNightRate[];
  formatPrice: (price: number) => string;
};

export function PricingCalendarCell({
  date,
  basePrice,
  seasonalRates,
  formatPrice,
}: PricingCalendarCellProps) {
  const dateIso = date.toString();

  return (
    <RangeCalendar.Cell date={date}>
      {({ formattedDate, isUnavailable, isOutsideMonth, isDisabled }) => {
        const showPrice = !isUnavailable && !isOutsideMonth && !isDisabled;
        const nightly = getNightlyPriceForDate(dateIso, basePrice, seasonalRates);
        const isSeasonal = nightly !== basePrice;

        return (
          <div className="flex min-h-[2.75rem] flex-col items-center justify-center gap-0.5 py-1">
            <span className="text-sm leading-none">{formattedDate}</span>
            {showPrice && (
              <span
                className={`text-[9px] font-semibold leading-none tabular-nums ${
                  isSeasonal ? "text-gold" : "text-navy/40"
                }`}
              >
                {formatCompactNightPrice(nightly, formatPrice)}
              </span>
            )}
          </div>
        );
      }}
    </RangeCalendar.Cell>
  );
}
