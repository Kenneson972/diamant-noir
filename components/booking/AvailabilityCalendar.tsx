"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import { getSupabaseBrowser } from "@/lib/supabase";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

export const AvailabilityCalendar = ({ villaId }: { villaId: string }) => {
  const [bookedDates, setBookedDates] = useState<any[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      // Ne pas requêter si l'ID n'est pas un UUID valide (ex: fallback "1")
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(villaId);
      if (!isUUID) return;

      const supabase = getSupabaseBrowser();
      if (!supabase) return;

      const { data, error } = await supabase
        .from("bookings")
        .select("start_date, end_date")
        .eq("villa_id", villaId)
        .in("status", ["pending", "confirmed"]);

      if (!error && data) {
        const events = data.map((b: any) => ({
          start: b.start_date,
          end: b.end_date,
          display: 'background',
          color: '#D4AF37', // Gold color for booked dates
          overlap: false,
        }));
        setBookedDates(events);
      }
    };

    fetchBookings();
  }, [villaId]);

  return (
    <div className="availability-calendar-container rounded-2xl border border-navy/10 bg-white p-3 md:p-6 overflow-hidden shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold text-navy">
          <span className="h-2 w-2 rounded-full bg-gold" />
          Dates non disponibles
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-offwhite px-3 py-1 text-[11px] font-semibold text-navy/80">
          Sélectionnez un mois
        </span>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locales={[frLocale]}
        locale="fr"
        headerToolbar={{
          left: 'title',
          center: '',
          right: 'prev,next'
        }}
        events={bookedDates}
        height="auto"
        validRange={{
          start: new Date().toISOString()
        }}
        dayMaxEvents={true}
        fixedWeekCount={false}
      />
      <style jsx global>{`
        /* FullCalendar module builds don't ship CSS. We provide minimal layout rules here. */
        .availability-calendar-container .fc {
          --fc-border-color: transparent;
          --fc-button-bg-color: transparent;
          --fc-button-border-color: transparent;
          --fc-button-hover-bg-color: #f8f8f8;
          --fc-button-active-bg-color: #f0f0f0;
          --fc-button-text-color: #0A0A14;
          --fc-today-bg-color: transparent;
          font-family: inherit;
        }
        .availability-calendar-container .fc,
        .availability-calendar-container .fc * {
          box-sizing: border-box;
        }
        .availability-calendar-container .fc {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .availability-calendar-container .fc-view-harness {
          flex: 1 1 auto;
          width: 100%;
        }
        .availability-calendar-container .fc-scrollgrid,
        .availability-calendar-container .fc-scrollgrid table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: transparent;
        }
        .availability-calendar-container .fc-scrollgrid-section > td {
          border: 0;
        }
        .availability-calendar-container .fc-col-header-cell,
        .availability-calendar-container .fc-daygrid-day {
          border: 0;
        }
        .availability-calendar-container .fc-daygrid-body {
          width: 100% !important;
        }
        .availability-calendar-container .fc-daygrid-day-frame {
          min-height: 3.25rem;
        }
        .availability-calendar-container .fc-daygrid-day-top {
          display: flex;
          justify-content: flex-end;
        }
        .availability-calendar-container .fc-daygrid-day-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .availability-calendar-container .fc-daygrid-day-events {
          margin: 0 !important;
        }
        .availability-calendar-container .fc-scroller {
          overflow: visible !important;
        }
        .availability-calendar-container .fc-toolbar-title {
          font-size: 1.05rem !important;
          font-weight: 600 !important;
          color: #0A0A14 !important;
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
          color: #0A0A14 !important;
          text-decoration: none !important;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .availability-calendar-container .fc-daygrid-day-number {
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          color: #0A0A14 !important;
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
          background: #0A0A14;
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
        .availability-calendar-container .fc-daygrid-day:hover .fc-daygrid-day-frame {
          background: rgba(212, 175, 55, 0.07);
        }
      `}</style>
    </div>
  );
};
