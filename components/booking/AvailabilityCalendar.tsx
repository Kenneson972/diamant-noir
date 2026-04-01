"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import { getSupabaseBrowser } from "@/lib/supabase";
import { ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
  loading: () => (
    <div className="h-64 animate-pulse rounded-lg bg-navy/5" aria-hidden />
  ),
});

interface Props {
  villaId: string;
  basePrice?: number;
}

export const AvailabilityCalendar = ({ villaId, basePrice }: Props) => {
  const router = useRouter();
  const [bookedDates, setBookedDates] = useState<any[]>([]);
  const [checkin, setCheckin] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<string | null>(null);

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
        .from("bookings")
        .select("start_date, end_date")
        .eq("villa_id", villaId)
        .in("status", ["pending", "confirmed"]);
      if (!error && data) {
        setBookedDates(
          data.map((b: any) => ({
            start: b.start_date,
            end: b.end_date,
            display: "background",
            color: "#D4AF37",
            overlap: false,
          }))
        );
      }
    };
    fetchBookings();
  }, [villaId]);

  // FullCalendar end is exclusive — checkout = endStr (departure day)
  const handleSelect = useCallback((info: any) => {
    setCheckin(info.startStr);
    setCheckout(info.endStr);
  }, []);

  const handleUnselect = useCallback(() => {
    setCheckin(null);
    setCheckout(null);
  }, []);

  const nights =
    checkin && checkout
      ? Math.round(
          (new Date(checkout).getTime() - new Date(checkin).getTime()) /
            86400000
        )
      : 0;

  const total = basePrice && nights > 0 ? basePrice * nights : null;

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });

  const handleBook = () => {
    if (!checkin || !checkout) return;
    router.push(
      `/book?villaId=${villaId}&checkin=${checkin}&checkout=${checkout}&guests=1`
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="availability-calendar-container overflow-hidden rounded-xl border border-navy/10 bg-white p-3 shadow-sm md:p-6">
        {/* Legend */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold text-navy">
            <span className="h-2 w-2 rounded-full bg-gold" />
            Non disponible
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-navy/5 px-3 py-1 text-[11px] font-semibold text-navy/70">
            <span className="h-2 w-2 rounded-full bg-navy/40" />
            Votre sélection
          </span>
          <span className="ml-auto hidden text-[10px] text-navy/35 sm:block">
            Cliquer · glisser pour sélectionner
          </span>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locales={[frLocale]}
          locale="fr"
          headerToolbar={{ left: "title", center: "", right: "prev,next" }}
          events={bookedDates}
          height="auto"
          validRange={{ start: new Date().toISOString().split("T")[0] }}
          dayMaxEvents={true}
          fixedWeekCount={false}
          selectable={true}
          selectMirror={true}
          selectOverlap={false}
          unselectAuto={false}
          selectConstraint={{ start: new Date().toISOString().split("T")[0] }}
          select={handleSelect}
          unselect={handleUnselect}
          selectAllow={(span) => span.end.valueOf() > span.start.valueOf()}
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
            --fc-highlight-color: rgba(10, 10, 20, 0.08);
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
            cursor: pointer;
          }
          .availability-calendar-container .fc-daygrid-day:hover .fc-daygrid-day-frame {
            background: rgba(212, 175, 55, 0.06);
          }
          /* Selection highlight */
          .availability-calendar-container .fc-highlight {
            background: rgba(10, 10, 20, 0.07) !important;
            border-radius: 4px;
          }
          /* Mirror (dragging preview) */
          .availability-calendar-container .fc-daygrid-event.fc-event-mirror {
            background: rgba(10, 10, 20, 0.12) !important;
            border: none !important;
          }
          /* Cursor on selectable days */
          .availability-calendar-container .fc-daygrid-day {
            cursor: pointer;
          }
        `}</style>
      </div>

      {/* Booking summary panel — appears when dates are selected */}
      {checkin && checkout && nights > 0 && (
        <div className="flex flex-col gap-4 rounded-none border border-navy/15 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-navy/40">
              Votre sélection
            </p>
            <p className="text-base font-medium text-navy">
              {formatDate(checkin)} → {formatDate(checkout)}
              <span className="ml-2 text-sm text-navy/55">
                {nights} nuit{nights > 1 ? "s" : ""}
              </span>
            </p>
            {total && (
              <p className="text-sm text-navy/55">
                {total.toLocaleString("fr-FR")} € estimé
                {basePrice && (
                  <span className="text-[10px] text-navy/35">
                    {" "}
                    ({basePrice.toLocaleString("fr-FR")} € / nuit)
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCheckin(null);
                setCheckout(null);
              }}
              className="flex h-9 w-9 items-center justify-center border border-black/10 text-navy/40 transition-colors hover:border-navy/30 hover:text-navy"
              aria-label="Effacer la sélection"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={handleBook}
              className="inline-flex items-center gap-2 border border-navy bg-navy px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-navy/90"
            >
              Réserver ces dates
              <ArrowRight size={14} strokeWidth={1.25} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
