"use client";

import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

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
  onEventClick
}: { 
  events?: CalendarEvent[],
  onDateSelect?: (start: string, end: string) => void,
  onEventClick?: (id: string) => void
}) => {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-lg sm:p-6">
      <div className="overflow-x-auto">
        <div className="min-w-[42rem]">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="auto"
            events={events}
            selectable
            select={(info) => {
              if (onDateSelect) {
                onDateSelect(info.startStr, info.endStr);
              }
            }}
            eventClick={(info) => {
              if (onEventClick && info.event.id) {
                onEventClick(info.event.id);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
