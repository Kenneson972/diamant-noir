"use client";

import { RangeCalendar } from "@heroui/react";
import { getLocalTimeZone, parseDate, today } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";

type HeroDateRangePickerProps = {
  checkin: string;
  checkout: string;
  onChange: (checkin: string, checkout: string) => void;
  surface?: "light" | "dark";
};

function toISO(d: DateValue): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

export function HeroDateRangePicker({
  checkin,
  checkout,
  onChange,
  surface = "dark",
}: HeroDateRangePickerProps) {
  const isLight = surface === "light";
  const now = today(getLocalTimeZone());

  const value =
    checkin && checkout
      ? { start: parseDate(checkin), end: parseDate(checkout) }
      : checkin
        ? { start: parseDate(checkin), end: parseDate(checkin) }
        : null;

  return (
    <RangeCalendar
      aria-label="Dates de séjour"
      value={value}
      onChange={(range) => {
        if (range) onChange(toISO(range.start), toISO(range.end));
      }}
      visibleDuration={{ months: 2 }}
      minValue={now}
      firstDayOfWeek="mon"
      className={
        isLight
          ? "w-full rounded-2xl border border-navy/8 bg-white p-4 shadow-xl sm:w-auto"
          : "w-full rounded-2xl border border-white/12 bg-[#0A1628] p-4 shadow-xl sm:w-auto"
      }
    >
      <RangeCalendar.Header className="pb-3">
        <RangeCalendar.NavButton slot="previous" />
        <RangeCalendar.Heading />
        <RangeCalendar.NavButton slot="next" />
      </RangeCalendar.Header>
      <RangeCalendar.Grid>
        <RangeCalendar.GridHeader>
          {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
        </RangeCalendar.GridHeader>
        <RangeCalendar.GridBody>
          {(date) => (
            <RangeCalendar.Cell date={date}>
              {({ formattedDate }) => <>{formattedDate}</>}
            </RangeCalendar.Cell>
          )}
        </RangeCalendar.GridBody>
      </RangeCalendar.Grid>
    </RangeCalendar>
  );
}
