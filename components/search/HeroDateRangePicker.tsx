"use client";

import { useEffect, useState } from "react";
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
}: HeroDateRangePickerProps) {
  const now = today(getLocalTimeZone());
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setWide(mq.matches);
    const h = (e: MediaQueryListEvent) => setWide(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const value =
    checkin && checkout
      ? { start: parseDate(checkin), end: parseDate(checkout) }
      : checkin
        ? { start: parseDate(checkin), end: parseDate(checkin) }
        : null;

  const months = wide ? 2 : 1;

  return (
    <div className="w-full rounded-2xl bg-white p-3 text-navy shadow-2xl ring-1 ring-navy/10 sm:w-auto sm:p-4">
      <RangeCalendar
        key={months}
        aria-label="Dates de séjour"
        value={value}
        onChange={(range) => {
          if (range) onChange(toISO(range.start), toISO(range.end));
        }}
        minValue={now}
        firstDayOfWeek="mon"
        visibleDuration={{ months }}
        style={{ "--accent": "oklch(0.24 0.05 256)" } as React.CSSProperties}
      >
        {wide ? (
          <div className="flex w-max flex-row gap-6">
            <div className="w-64">
              <RangeCalendar.Header>
                <RangeCalendar.NavButton slot="previous" />
                <RangeCalendar.Heading className="flex-none" />
                <div className="size-6" />
              </RangeCalendar.Header>
              <RangeCalendar.Grid>
                <RangeCalendar.GridHeader>
                  {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
                </RangeCalendar.GridHeader>
                <RangeCalendar.GridBody>
                  {(date) => <RangeCalendar.Cell date={date} />}
                </RangeCalendar.GridBody>
              </RangeCalendar.Grid>
            </div>
            <div className="w-64">
              <RangeCalendar.Header>
                <div className="size-6" />
                {/* @ts-expect-error offset supported at runtime, types lag behind v3.0 */}
                <RangeCalendar.Heading className="flex-none" offset={{ months: 1 }} />
                <RangeCalendar.NavButton slot="next" />
              </RangeCalendar.Header>
              <RangeCalendar.Grid offset={{ months: 1 }}>
                <RangeCalendar.GridHeader>
                  {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
                </RangeCalendar.GridHeader>
                <RangeCalendar.GridBody>
                  {(date) => <RangeCalendar.Cell date={date} />}
                </RangeCalendar.GridBody>
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
              <RangeCalendar.GridBody>
                {(date) => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
          </>
        )}
      </RangeCalendar>
    </div>
  );
}
