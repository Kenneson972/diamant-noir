"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ─── Helpers ──────────────────────────────────────────── */

const MONTHS = [
  "janvier", "f\u00e9vrier", "mars", "avril", "mai", "juin",
  "juillet", "ao\u00fbt", "septembre", "octobre", "novembre", "d\u00e9cembre",
];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstWeekday(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
}
function toISODateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function toFrShort(ds: string) {
  if (!ds) return "";
  const d = new Date(ds + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/* ─── Props ─────────────────────────────────────────────── */

type HeroDatePickerProps = {
  checkin: string;
  checkout: string;
  onChange: (checkin: string, checkout: string) => void;
  onClose: () => void;
  surface?: "light" | "dark";
};

/* ─── Composant ─────────────────────────────────────────── */

export function HeroDatePicker({
  checkin,
  checkout,
  onChange,
  onClose,
  surface = "dark",
}: HeroDatePickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isLight = surface === "light";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(() => {
    if (checkin) {
      const d = new Date(checkin + "T00:00:00");
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const nextMonth = new Date(viewDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 640;

  // Fermeture au clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleDay = useCallback(
    (date: Date) => {
      const ds = toISODateString(date);
      if (date < today) return;
      if (!checkin || (checkin && checkout)) {
        onChange(ds, "");
      } else {
        if (date >= new Date(checkin + "T00:00:00")) {
          onChange(checkin, ds);
          onClose();
        } else {
          onChange(ds, "");
        }
      }
    },
    [checkin, checkout, onChange, onClose, today]
  );

  /* ─── Render month ───────────────────────────────────── */

  const renderMonth = useCallback(
    (base: Date) => {
      const year = base.getFullYear();
      const month = base.getMonth();
      const totalDays = daysInMonth(year, month);
      const startWday = firstWeekday(year, month);
      const cells: React.ReactNode[] = [];

      for (let i = 0; i < startWday; i++) {
        cells.push(
          <div key={`e-${month}-${i}`} aria-hidden className="h-9 w-9 sm:h-10 sm:w-10" />
        );
      }

      for (let d = 1; d <= totalDays; d++) {
        const date = new Date(year, month, d);
        const ds = toISODateString(date);
        const isPast = date < today;
        const isCheckin = checkin === ds;
        const isCheckout = checkout === ds;
        const inRange =
          checkin && checkout && date > new Date(checkin) && date < new Date(checkout);
        const isThisToday = date.getTime() === today.getTime();

        /* Classes par ligne de connexion entre checkin et checkout */
        const isRangeStart = isCheckin && checkout;
        const isRangeEnd = isCheckout && checkin;

        cells.push(
          <button
            key={ds}
            type="button"
            disabled={isPast}
            onClick={() => handleDay(date)}
            className={[
              "relative flex h-9 w-9 items-center justify-center text-[12px] transition-all sm:h-10 sm:w-10",
              isPast ? "cursor-not-allowed" : "cursor-pointer",
              /* Arrière-plan de plage (carré, pas cercle) */
              inRange || isRangeStart || isRangeEnd ? "z-0" : "",
            ].join(" ")}
            aria-label={`${d} ${MONTHS[month]} ${year}`}
          >
            {/* Fond de plage — s'étend du centre vers les bords */}
            {inRange && (
              <span
                className={`absolute inset-0 z-0 ${isLight ? "bg-navy/[0.04]" : "bg-white/[0.07]"}`}
                aria-hidden
              />
            )}
            {isRangeStart && (
              <span
                className={`absolute inset-y-0 right-0 z-0 w-1/2 ${isLight ? "bg-navy/[0.04]" : "bg-white/[0.07]"}`}
                aria-hidden
              />
            )}
            {isRangeEnd && (
              <span
                className={`absolute inset-y-0 left-0 z-0 w-1/2 ${isLight ? "bg-navy/[0.04]" : "bg-white/[0.07]"}`}
                aria-hidden
              />
            )}

            {/* Cercle du jour */}
            <span
              className={[
                "relative z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full sm:h-[38px] sm:w-[38px]",
                isPast ? "text-white/12" : "",
                !isPast && !isCheckin && !isCheckout
                  ? isLight
                    ? "text-navy/75 hover:bg-navy/5"
                    : "text-white/75 hover:bg-white/10"
                  : "",
                isCheckin || isCheckout
                  ? isLight
                    ? "bg-navy font-semibold text-white"
                    : "bg-white font-semibold text-navy"
                  : "",
                isThisToday && !isCheckin && !isCheckout
                  ? isLight
                    ? "ring-1 ring-inset ring-navy/20"
                    : "ring-1 ring-inset ring-white/25"
                  : "",
              ].join(" ")}
            >
              {d}
            </span>
          </button>
        );
      }

      const textCls = isLight
        ? "text-[11px] font-bold uppercase tracking-[0.15em] text-navy/55"
        : "text-[11px] font-bold uppercase tracking-[0.15em] text-white/55";
      const dayCls = isLight ? "text-[10px] font-semibold text-navy/30" : "text-[10px] font-semibold text-white/30";

      return (
        <div className="select-none">
          <p className={`mb-2 text-center ${textCls}`}>
            {MONTHS[month]} <span className="opacity-50">{year}</span>
          </p>
          <div className="mb-[2px] grid grid-cols-7">
            {DAYS.map((d) => (
              <span
                key={d}
                className={`flex h-6 items-center justify-center ${dayCls}`}
              >
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7">{cells}</div>
        </div>
      );
    },
    [checkin, checkout, handleDay, today, isLight]
  );

  /* ─── Navigation entre mois ──────────────────────────── */

  const canGoPrev =
    viewDate.getFullYear() > today.getFullYear() ||
    (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() > today.getMonth());

  const goPrev = () => {
    if (!canGoPrev) return;
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() - 1);
    setViewDate(d);
  };
  const goNext = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + 1);
    setViewDate(d);
  };

  /* ─── Sélection actuelle pour le header ──────────────── */

  const hasSelection = checkin && checkout;

  /* ─── Styles de surface ──────────────────────────────── */

  const bgCls = isLight
    ? "bg-white border-navy/8"
    : "bg-[#0A1628] border-white/12";
  const shadowCls = "shadow-[0_24px_64px_rgba(0,0,0,0.35)]";
  const navCls = isLight
    ? "text-navy/35 hover:bg-navy/5 hover:text-navy/60"
    : "text-white/40 hover:bg-white/8 hover:text-white/70";
  const summaryBarCls = isLight
    ? "bg-navy/[0.03] border-navy/8"
    : "bg-white/[0.03] border-white/8";
  const summaryTextCls = isLight ? "text-navy/50" : "text-white/50";
  const summaryActiveCls = isLight ? "text-navy" : "text-white";
  const summaryLabelCls = isLight ? "text-navy/40" : "text-white/40";

  return (
    <div
      ref={panelRef}
      className={`w-full rounded-[20px] border backdrop-blur-sm sm:w-auto sm:max-w-none ${bgCls} ${shadowCls} animate-in fade-in duration-200`}
    >
      {/* Barre de résumé des dates sélectionnées */}
      {hasSelection && (
        <div className={`flex items-center justify-center gap-2 border-b px-5 py-2.5 ${summaryBarCls}`}>
          <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${summaryLabelCls}`}>
            S\u00e9jour
          </span>
          <span className={`text-[11px] font-semibold ${summaryActiveCls}`}>
            {toFrShort(checkin)}
          </span>
          <span className={`text-[9px] ${summaryTextCls}`}>→</span>
          <span className={`text-[11px] font-semibold ${summaryActiveCls}`}>
            {toFrShort(checkout)}
          </span>
        </div>
      )}

      <div className="px-5 pb-3 pt-4">
        {/* Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canGoPrev}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-20 ${navCls}`}
            aria-label="Mois pr\u00e9c\u00e9dent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-1">
            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${summaryTextCls}`}>
              {hasSelection ? `${toFrShort(checkin)} → ${toFrShort(checkout)}` : "S\u00e9lectionner"}
            </span>
          </div>

          <button
            type="button"
            onClick={goNext}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${navCls}`}
            aria-label="Mois suivant"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Calendriers */}
        {isMobile ? (
          <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            <div className="snap-center shrink-0">{renderMonth(viewDate)}</div>
            <div className="snap-center shrink-0">{renderMonth(nextMonth)}</div>
          </div>
        ) : (
          <div className="flex gap-7">
            <div className="shrink-0">{renderMonth(viewDate)}</div>
            <div className="shrink-0">{renderMonth(nextMonth)}</div>
          </div>
        )}
      </div>

      {/* Pied — bouton Fermer / instructions */}
      <div className={`border-t px-5 py-2.5 ${isLight ? "border-navy/8" : "border-white/8"}`}>
        <p className={`text-center text-[9px] font-medium uppercase tracking-[0.1em] ${isLight ? "text-navy/35" : "text-white/35"}`}>
          {hasSelection
            ? "Appuyez sur Rechercher pour voir les villas disponibles"
            : "S\u00e9lectionnez votre arriv\u00e9e, puis votre d\u00e9part"}
        </p>
      </div>
    </div>
  );
}
