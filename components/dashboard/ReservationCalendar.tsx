"use client";

import { useState, useEffect, useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BookingCalendarProps {
  bookings: any[];
  villaFilter: string | null;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0 = dimanche → on veut 0 = lundi
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function ReservationCalendar({ bookings, villaFilter }: BookingCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  // Convertir dimanche=0 → 6, lundi=1 → 0, etc.
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  // Grouper les bookings par date de début
  const bookingsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const b of bookings) {
      if (!b.start_date) continue;
      const key = b.start_date;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }
    return map;
  }, [bookings]);

  const today = now.toISOString().split("T")[0];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  return (
    <div className="border border-navy/10 bg-white rounded-lg overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center justify-between px-4 py-3 bg-navy/[0.02] border-b border-navy/10">
        <button onClick={prevMonth} className="text-navy/50 hover:text-navy p-1">
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-sm font-semibold text-navy">
          {MONTHS[month]} {year}
        </h3>
        <button onClick={nextMonth} className="text-navy/50 hover:text-navy p-1">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 border-b border-navy/[0.05]">
        {DAYS.map((d) => (
          <div key={d} className="px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.05em] text-navy/40">
            {d}
          </div>
        ))}
      </div>

      {/* Cases du mois */}
      <div className="grid grid-cols-7">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[80px] border border-navy/[0.03] bg-navy/[0.01]" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayBookings = bookingsByDate[dateStr] ?? [];
          const isToday = dateStr === today;

          return (
            <div
              key={day}
              className={`min-h-[80px] border border-navy/[0.03] p-1 relative ${
                isToday ? "bg-gold/[0.06]" : ""
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-5 h-5 text-[11px] rounded-full ${
                  isToday ? "bg-gold text-white font-bold" : "text-navy/60"
                }`}
              >
                {day}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayBookings.slice(0, 2).map((b) => (
                  <div
                    key={b.id}
                    className={`text-[9px] px-1 py-0.5 rounded truncate ${
                      b.status === "confirmed"
                        ? "bg-emerald-50 text-emerald-700"
                        : b.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    }`}
                    title={`${b.guest_name ?? "Voyageur"} — ${b.villas?.name ?? ""}`}
                  >
                    {b.guest_name ?? "—"} {b.villas?.name ? `· ${b.villas.name}` : ""}
                  </div>
                ))}
                {dayBookings.length > 2 && (
                  <span className="text-[9px] text-navy/30">+{dayBookings.length - 2}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
