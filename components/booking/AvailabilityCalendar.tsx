"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RangeCalendar } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone, today } from "@internationalized/date";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useLocale } from "@/contexts/LocaleContext";
import {
  buildUnavailableChecker,
  rangeValueToStrings,
  type DateRangeStrings,
} from "@/lib/calendar/date-utils";

export const AvailabilityCalendar = ({
  villaId,
  onDatesChange,
}: {
  villaId: string;
  onDatesChange?: (range: DateRangeStrings | null) => void;
}) => {
  const { locale } = useLocale();
  const [bookedRanges, setBookedRanges] = useState<DateRangeStrings[]>([]);
  const [loading, setLoading] = useState(true);
  const minDate = today(getLocalTimeZone());

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
        <span className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-offwhite px-3 py-1 text-[11px] font-semibold text-navy/80">
          Cliquez une date d&apos;arrivée, puis une date de départ
        </span>
      </div>
      <RangeCalendar
        aria-label="Sélection des dates de séjour"
        className="mx-auto w-full max-w-md overflow-x-auto [&_.calendar]:w-full [&_.calendar]:max-w-none [&_.calendar]:min-w-0"
        firstDayOfWeek={locale.startsWith("en") ? "sun" : "mon"}
        isDateUnavailable={isDateUnavailable}
        isDisabled={loading}
        minValue={minDate}
        onChange={handleChange}
      >
        <RangeCalendar.Header>
          <RangeCalendar.Heading />
          <RangeCalendar.NavButton slot="previous" />
          <RangeCalendar.NavButton slot="next" />
        </RangeCalendar.Header>
        <RangeCalendar.Grid>
          <RangeCalendar.GridHeader>
            {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
          </RangeCalendar.GridHeader>
          <RangeCalendar.GridBody>
            {(date) => <RangeCalendar.Cell date={date} />}
          </RangeCalendar.GridBody>
        </RangeCalendar.Grid>
      </RangeCalendar>
    </div>
  );
};
