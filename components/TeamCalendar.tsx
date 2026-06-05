"use client";

import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

type CalendarEvent = {
  title: string;
  start: string;
  end?: string;
};

export const TeamCalendar = ({ events = [] }: { events?: CalendarEvent[] }) => {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        height="auto"
        events={events}
        selectable={false}
      />
    </div>
  );
};
