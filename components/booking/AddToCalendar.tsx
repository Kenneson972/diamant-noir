"use client";

import { CalendarPlus } from "lucide-react";
import { downloadICS } from "@/lib/generate-ics";

type AddToCalendarProps = {
  villaName: string;
  startDate: string;
  endDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  address?: string;
  className?: string;
};

export function AddToCalendar({
  villaName,
  startDate,
  endDate,
  checkInTime,
  checkOutTime,
  address,
  className,
}: AddToCalendarProps) {
  return (
    <button
      type="button"
      onClick={() =>
        downloadICS({
          villaName,
          startDate,
          endDate,
          checkInTime,
          checkOutTime,
          address,
        })
      }
      className={
        className ??
        "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/50 transition-colors hover:text-gold"
      }
    >
      <CalendarPlus className="size-4" aria-hidden />
      Ajouter à mon calendrier
    </button>
  );
}
