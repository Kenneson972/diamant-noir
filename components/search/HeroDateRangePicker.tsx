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
}: HeroDateRangePickerProps) {
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
      minValue={now}
      firstDayOfWeek="mon"
      visibleDuration={{ months: 2 }}
      // Sélection en navy (couleur de marque) plutôt que le bleu HeroUI par défaut
      style={{ "--accent": "oklch(0.24 0.05 256)" } as React.CSSProperties}
      className="w-full rounded-2xl border border-navy/10 bg-white p-4 text-navy shadow-2xl @container-normal sm:w-auto"
    >
      <div className="mx-auto flex w-max gap-6">
        {/* Mois 1 */}
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
        {/* Mois 2 */}
        <div className="w-64">
          <RangeCalendar.Header>
            <div className="size-6" />
            {/* @ts-expect-error offset supported at runtime, types lag behind v3.1.0 */}
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
    </RangeCalendar>
  );
}
