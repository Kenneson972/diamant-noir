"use client";

import { useMemo } from "react";
import { Calendar } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { parseDate } from "@internationalized/date";
import { dateHasEvent } from "@/lib/calendar/date-utils";

type CalendarEvent = {
  id?: string;
  title: string;
  start: string;
  end?: string;
  color?: string;
};

export const AdminCalendar = ({
  events = [],
  onDateSelect,
  onEventClick,
}: {
  events?: CalendarEvent[];
  onDateSelect?: (start: string, end: string) => void;
  onEventClick?: (id: string) => void;
}) => {
  const eventDays = useMemo(() => events, [events]);

  const handleChange = (value: DateValue | null) => {
    if (!value) return;
    const iso = value.toString();
    onDateSelect?.(iso, iso);

    const match = eventDays.find((ev) => {
      try {
        const start = parseDate(ev.start.slice(0, 10));
        const end = ev.end ? parseDate(ev.end.slice(0, 10)) : start;
        return value.compare(start) >= 0 && value.compare(end) <= 0;
      } catch {
        return false;
      }
    });
    if (match?.id) onEventClick?.(match.id);
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg">
      <Calendar
        aria-label="Calendrier admin"
        className="mx-auto [&_.calendar]:w-full [&_.calendar]:max-w-none"
        onChange={handleChange}
      >
        <Calendar.Header>
          <Calendar.Heading />
          <Calendar.NavButton slot="previous" />
          <Calendar.NavButton slot="next" />
        </Calendar.Header>
        <Calendar.Grid>
          <Calendar.GridHeader>
            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
          </Calendar.GridHeader>
          <Calendar.GridBody>
            {(date) => (
              <Calendar.Cell date={date}>
                {dateHasEvent(date, eventDays) ? (
                  <Calendar.CellIndicator />
                ) : null}
              </Calendar.Cell>
            )}
          </Calendar.GridBody>
        </Calendar.Grid>
      </Calendar>
    </div>
  );
};
