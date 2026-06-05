"use client";

import { useMemo } from "react";
import { Calendar } from "@heroui/react";
import { dateHasEvent } from "@/lib/calendar/date-utils";

type CalendarEvent = {
  title: string;
  start: string;
  end?: string;
};

export const TeamCalendar = ({ events = [] }: { events?: CalendarEvent[] }) => {
  const eventDays = useMemo(() => events, [events]);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg">
      <Calendar
        aria-label="Calendrier équipe"
        className="mx-auto [&_.calendar]:w-full [&_.calendar]:max-w-none"
        isDisabled
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
