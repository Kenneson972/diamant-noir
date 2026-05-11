"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import { getSupabaseBrowser } from "@/lib/supabase";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

type DateRange = {
  start: string;
  end: string;
};

export const AvailabilityCalendar = ({
  villaId,
  onDatesChange,
}: {
  villaId: string;
  onDatesChange?: (range: DateRange | null) => void;
}) => {
  const [bookedDates, setBookedDates] = useState<any[]>([]);
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          villaId
        );
      if (!isUUID) return;

      const supabase = getSupabaseBrowser();
      if (!supabase) return;

      const { data, error } = await supabase
        .from("booking_calendar_slots")
        .select("start_date, end_date")
        .eq("villa_id", villaId);

      if (!error && data) {
        const events = data.map((b: any) => ({
          start: b.start_date,
          end: b.end_date,
          display: "background",
          color: "#D4AF37",
          overlap: false,
        }));
        setBookedDates(events);
      }
    };

    fetchBookings();
  }, [villaId]);

  // Génère les events pour le range sélectionné
  const selectionEvents = selectedRange
    ? [
        {
          start: selectedRange.start,
          end: selectedRange.end,
          display: "background",
          color: "#D4AF37",
          classNames: ["fc-selected-range"],
          overlap: false,
        },
      ]
    : [];

  const handleSelect = useCallback(
    (info: { startStr: string; endStr: string; view: { currentStart: Date } }) => {
      // endStr de FullCalendar est exclusive (ex: si on sélectionne du 5 au 10, endStr = "2026-05-11")
      // On soustrait 1 jour pour avoir la vraie date de checkout
      const endDate = new Date(info.endStr);
      endDate.setDate(endDate.getDate() - 1);
      const adjustedEnd = endDate.toISOString().slice(0, 10);

      const range: DateRange = {
        start: info.startStr,
        end: adjustedEnd,
      };

      setSelectedRange(range);
      onDatesChange?.(range);
    },
    [onDatesChange]
  );

  const handleUnselect = useCallback(() => {
    setSelectedRange(null);
    onDatesChange?.(null);
  }, [onDatesChange]);

  return (
    <div className="availability-calendar-container rounded-2xl border border-navy/10 bg-white p-3 md:p-6 overflow-x-auto shadow-sm">
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
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locales={[frLocale]}
        locale="fr"
        headerToolbar={{
          left: "title",
          center: "",
          right: "prev,next",
        }}
        events={[...bookedDates, ...selectionEvents]}
        height="auto"
        validRange={{
          start: new Date().toISOString(),
        }}
        dayMaxEvents={true}
        fixedWeekCount={false}
        selectable={true}
        selectMirror={true}
        unselectAuto={false}
        select={handleSelect}
        unselect={handleUnselect}
        selectAllow={(selectInfo) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return selectInfo.start >= today;
        }}
        selectConstraint="availableForBooking"
        eventContent={(arg) => {
          if (arg.event.display === "background") return <></>;
          return arg.event.title;
        }}
      />
      <style jsx global>{`
        .availability-calendar-container .fc {
          --fc-border-color: transparent;
          --fc-button-bg-color: transparent;
          --fc-button-border-color: transparent;
          --fc-button-hover-bg-color: #f8f8f8;
          --fc-button-active-bg-color: #f0f0f0;
          --fc-button-text-color: #0a0a14;
          --fc-today-bg-color: transparent;
          font-family: inherit;
        }
        .availability-calendar-container .fc-toolbar-title {
          font-size: 1.05rem !important;
          font-weight: 600 !important;
          color: #0a0a14 !important;
          text-transform: capitalize;
          letter-spacing: 0.02em;
        }
        .availability-calendar-container .fc-toolbar.fc-header-toolbar {
          margin-bottom: 0.75rem !important;
          align-items: center;
        }
        .availability-calendar-container .fc-col-header-cell-cushion {
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          color: #0a0a14 !important;
          text-decoration: none !important;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .availability-calendar-container .fc-daygrid-day-number {
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          color: #0a0a14 !important;
          text-decoration: none !important;
          padding: 10px !important;
        }
        .availability-calendar-container .fc-day-other .fc-daygrid-day-number {
          opacity: 0.3;
        }
        .availability-calendar-container .fc-bg-event {
          opacity: 0.15 !important;
          border-radius: 4px;
        }
        .availability-calendar-container .fc-day-today {
          background: transparent !important;
        }
        .availability-calendar-container .fc-day-today .fc-daygrid-day-number {
          background: #0a0a14;
          color: white !important;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 4px auto !important;
          padding: 0 !important;
        }
        .availability-calendar-container .fc-button .fc-icon {
          font-size: 1.05em !important;
        }
        .availability-calendar-container .fc-prev-button,
        .availability-calendar-container .fc-next-button {
          border: 1px solid rgba(10, 10, 20, 0.15) !important;
          border-radius: 9999px !important;
          width: 2rem !important;
          height: 2rem !important;
          padding: 0 !important;
        }
        .availability-calendar-container .fc-daygrid-day-frame {
          border-radius: 10px;
          transition: background-color 120ms ease;
        }
        .availability-calendar-container
          .fc-daygrid-day:hover
          .fc-daygrid-day-frame {
          background: rgba(212, 175, 55, 0.07);
        }

        /* --- Style de sélection gold --- */
        .availability-calendar-container .fc-daygrid-day.fc-day-selected {
          background: rgba(212, 175, 55, 0.1) !important;
        }
        .availability-calendar-container
          .fc-daygrid-day.fc-day-selected
          .fc-daygrid-day-number {
          background: #d4af37;
          color: #0a0a14 !important;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 4px auto !important;
          padding: 0 !important;
        }

        /* Sélection par glisser FullCalendar */
        .availability-calendar-container .fc-highlight {
          background: rgba(212, 175, 55, 0.1) !important;
          border-radius: 4px;
        }

        .availability-calendar-container
          .fc-daygrid-day.fc-day-today.fc-highlight
          .fc-daygrid-day-number {
          background: #d4af37;
          color: #0a0a14 !important;
        }

        /* Apparence du bg-event pour la sélection */
        .availability-calendar-container
          .fc-bg-event.fc-selected-range {
          opacity: 0.2 !important;
          background: #d4af37 !important;
          border: 1px dashed #d4af37 !important;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .availability-calendar-container .fc-daygrid-day-frame {
            transition: none;
          }
          .availability-calendar-container
            .fc-daygrid-day:hover
            .fc-daygrid-day-frame {
            background: transparent;
          }
        }
      `}</style>
    </div>
  );
};
