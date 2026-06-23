"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RangeCalendar } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone, today } from "@internationalized/date";
import { PricingCalendarCell } from "@/components/booking/PricingCalendarCell";
import { useLocale } from "@/contexts/LocaleContext";
import {
  buildUnavailableChecker,
  rangeValueToStrings,
  type DateRangeStrings,
} from "@/lib/calendar/date-utils";
import type { SeasonalNightRate } from "@/lib/calendar/pricing-utils";
import { getSupabaseBrowser } from "@/lib/supabase";

type AvailabilityCalendarProps = {
  villaId: string;
  basePrice?: number;
  seasonalPrices?: SeasonalNightRate[];
  onDatesChange?: (range: DateRangeStrings | null) => void;
};

function CalendarGridBody({
  basePrice,
  seasonalPrices,
  formatPrice,
}: {
  basePrice: number;
  seasonalPrices?: SeasonalNightRate[];
  formatPrice: (price: number) => string;
}) {
  return (
    <RangeCalendar.GridBody>
      {(date) => (
        <PricingCalendarCell
          date={date}
          basePrice={basePrice}
          seasonalRates={seasonalPrices}
          formatPrice={formatPrice}
        />
      )}
    </RangeCalendar.GridBody>
  );
}

export const AvailabilityCalendar = ({
  villaId,
  basePrice = 0,
  seasonalPrices,
  onDatesChange,
}: AvailabilityCalendarProps) => {
  const { locale, formatPrice } = useLocale();
  const [bookedRanges, setBookedRanges] = useState<DateRangeStrings[]>([]);
  const [loading, setLoading] = useState(true);
  const [wide, setWide] = useState(false);
  const minDate = today(getLocalTimeZone());

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setWide(mq.matches);
    const handler = (e: MediaQueryListEvent) => setWide(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          villaId
        );
      if (!isUUID) {
        setLoading(false);
        return;
      }

      const supabase = getSupabaseBrowser();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("booking_calendar_slots")
        .select("start_date, end_date")
        .eq("villa_id", villaId);

      if (!error && data) {
        setBookedRanges(
          data.map((b: { start_date: string; end_date: string }) => ({
            start: b.start_date,
            end: b.end_date,
          }))
        );
      }
      setLoading(false);
    };

    fetchBookings();
  }, [villaId]);

  const isDateUnavailable = useMemo(
    () => buildUnavailableChecker(bookedRanges),
    [bookedRanges]
  );

  const handleChange = useCallback(
    (value: { start: DateValue; end: DateValue } | null) => {
      onDatesChange?.(rangeValueToStrings(value));
    },
    [onDatesChange]
  );

  const cellProps = { basePrice, seasonalPrices, formatPrice };

  return (
    <div className="availability-calendar-container rounded-2xl border border-navy/10 bg-white p-3 shadow-sm md:p-6">
      {loading && (
        <p className="mb-3 text-xs text-navy/50" role="status">
          Chargement des disponibilités…
        </p>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold text-navy">
          <span className="h-2 w-2 rounded-full bg-gold" />
          Dates non disponibles
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-[11px] font-semibold text-navy">
          <span className="h-2 w-2 rounded-full bg-gold/70" />
          Sélection
        </span>
        {basePrice > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-offwhite px-3 py-1 text-[11px] font-semibold text-gold">
            Tarif saisonnier
          </span>
        )}
        <span className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-offwhite px-3 py-1 text-[11px] font-semibold text-navy/80">
          Cliquez une date d&apos;arrivée, puis une date de départ
        </span>
      </div>
      <RangeCalendar
        key={wide ? "wide" : "narrow"}
        aria-label="Sélection des dates de séjour"
        className="mx-auto w-full max-w-none overflow-x-auto [&_.calendar]:w-full [&_.calendar]:max-w-none [&_.calendar]:min-w-0"
        firstDayOfWeek={locale.startsWith("en") ? "sun" : "mon"}
        isDateUnavailable={isDateUnavailable}
        isDisabled={loading}
        minValue={minDate}
        onChange={handleChange}
        style={{ "--accent": "oklch(0.24 0.05 256)" } as React.CSSProperties}
      >
        {wide ? (
          <div className="mx-auto flex w-max flex-row gap-6 md:gap-8">
            <div className="w-64 shrink-0">
              <RangeCalendar.Header>
                <RangeCalendar.NavButton slot="previous" />
                <RangeCalendar.Heading className="flex-none" />
                <div className="size-6" aria-hidden />
              </RangeCalendar.Header>
              <RangeCalendar.Grid>
                <RangeCalendar.GridHeader>
                  {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
                </RangeCalendar.GridHeader>
                <CalendarGridBody {...cellProps} />
              </RangeCalendar.Grid>
            </div>
            <div className="w-64 shrink-0">
              <RangeCalendar.Header>
                <div className="size-6" aria-hidden />
                <RangeCalendar.Heading className="flex-none" offset={{ months: 1 }} />
                <RangeCalendar.NavButton slot="next" />
              </RangeCalendar.Header>
              <RangeCalendar.Grid offset={{ months: 1 }}>
                <RangeCalendar.GridHeader>
                  {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
                </RangeCalendar.GridHeader>
                <CalendarGridBody {...cellProps} />
              </RangeCalendar.Grid>
            </div>
          </div>
        ) : (
          <>
            <RangeCalendar.Header>
              <RangeCalendar.NavButton slot="previous" />
              <RangeCalendar.Heading />
              <RangeCalendar.NavButton slot="next" />
            </RangeCalendar.Header>
            <RangeCalendar.Grid>
              <RangeCalendar.GridHeader>
                {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
              </RangeCalendar.GridHeader>
              <CalendarGridBody {...cellProps} />
            </RangeCalendar.Grid>
          </>
        )}
      </RangeCalendar>
    </div>
  );
};
