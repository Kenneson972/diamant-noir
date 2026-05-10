"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, Users } from "lucide-react";
import { HeroDatePicker } from "@/components/search/HeroDatePicker";
import { HeroGuestPicker } from "@/components/search/HeroGuestPicker";

type HeroSearchWidgetProps = {
  surface?: "light" | "dark";
};

/* ─── Helpers ──────────────────────────────────────────── */

function formatFrShort(ds: string) {
  if (!ds) return "";
  const d = new Date(ds + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function nightsBetween(a: string, b: string) {
  if (!a || !b) return 0;
  const d1 = new Date(a + "T00:00:00").getTime();
  const d2 = new Date(b + "T00:00:00").getTime();
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

/* ─── Composant ─────────────────────────────────────────── */

export function HeroSearchWidget({ surface = "dark" }: HeroSearchWidgetProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLFormElement>(null);
  const datesBtnRef = useRef<HTMLButtonElement>(null);

  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState(2);
  const [openPanel, setOpenPanel] = useState<"date" | "guests" | null>(null);

  const [datePickerStyle, setDatePickerStyle] = useState<React.CSSProperties>({ position: "fixed", top: 0, left: 0, width: 0, zIndex: 9999 });

  const isLight = surface === "light";

  // Close panels on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reposition datepicker — flip above button if insufficient space below
  useEffect(() => {
    if (openPanel !== "date" || !datesBtnRef.current) return;
    const reposition = () => {
      const rect = datesBtnRef.current!.getBoundingClientRect();
      const w = Math.min(Math.max(rect.width, 300), window.innerWidth - 16);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - w - 8));
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const CALENDAR_MIN_HEIGHT = 380;
      const maxH = `calc(100dvh - 16px)`;
      if (spaceBelow >= CALENDAR_MIN_HEIGHT) {
        setDatePickerStyle({ position: "fixed", top: rect.bottom + 4, left, width: w, maxHeight: maxH, overflowY: "auto", zIndex: 9999 });
      } else {
        const bottomOffset = window.innerHeight - rect.top + 4;
        setDatePickerStyle({ position: "fixed", bottom: bottomOffset, top: "auto", left, width: w, maxHeight: maxH, overflowY: "auto", zIndex: 9999 });
      }
    };
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [openPanel]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams();
      if (checkin) params.set("checkin", checkin);
      if (checkout) params.set("checkout", checkout);
      params.set("guests", String(guests));
      router.push(`/villas?${params.toString()}`);
    },
    [checkin, checkout, guests, router]
  );

  const nNights = nightsBetween(checkin, checkout);

  /* ─── Styles ─────────────────────────────────────────── */

  const dateSummary = checkin
    ? `${formatFrShort(checkin)}${checkout ? ` → ${formatFrShort(checkout)}` : " → \u2026"}`
    : "Ajouter";

  /* ─── Render ─────────────────────────────────────────── */

  return (
    <form
      onSubmit={handleSearch}
      aria-label="Recherche de s\u00e9jour par dates et nombre de voyageurs"
      className={`relative mx-auto flex w-full max-w-2xl flex-col items-stretch sm:flex-row sm:items-center ${
        isLight
          ? "rounded-2xl border border-navy/10 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          : "rounded-2xl border border-white/20 bg-white/[0.06]"
      }`}
      ref={containerRef}
    >
      {/* Row 1 — Dates */}
      <button
        ref={datesBtnRef}
        type="button"
        onClick={() => setOpenPanel(openPanel === "date" ? null : "date")}
        className={`tap-target flex items-center gap-3 border-0 bg-transparent px-4 text-left focus:outline-none ${
          isLight
            ? "border-b border-navy/10 text-navy sm:border-b-0 sm:rounded-l-2xl"
            : "border-b border-white/15 text-white sm:border-b-0 sm:rounded-l-2xl"
        }`}
        aria-label="Choisir les dates du s\u00e9jour"
      >
        <Calendar
          size={16}
          className={`shrink-0 ${isLight ? "text-navy/35" : "text-white/40"}`}
          strokeWidth={1.5}
          aria-hidden
        />
        <div className="flex min-h-[52px] flex-1 items-center justify-between gap-2 py-3 sm:min-h-[56px]">
          <div className="flex flex-col gap-0.5">
            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isLight ? "text-navy/45" : "text-white/50"}`}>
              Dates
            </span>
            <span className={`text-sm ${!checkin ? (isLight ? "text-navy/35" : "text-white/40") : ""}`}>
              {dateSummary}
            </span>
          </div>
          {nNights > 0 && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isLight ? "bg-navy/5 text-navy/60" : "bg-white/10 text-white/60"
            }`}>
              {nNights} nuit{nNights > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </button>

      {/* Separator desktop */}
      <div className={`mx-0 hidden h-10 w-px shrink-0 self-center sm:block ${isLight ? "bg-navy/10" : "bg-white/15"}`} aria-hidden />

      {/* Row 2 — Voyageurs */}
      <div className={`sm:flex-1 ${isLight ? "border-b border-navy/10 sm:border-b-0" : "border-b border-white/15 sm:border-b-0"}`}>
        <div className="flex items-center gap-3 px-4">
          <Users
            size={16}
            className={`shrink-0 ${isLight ? "text-navy/35" : "text-white/40"}`}
            strokeWidth={1.5}
            aria-hidden
          />
          <div className="flex-1">
            <span className={`mb-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] ${isLight ? "text-navy/45" : "text-white/50"}`}>
              Voyageurs
            </span>
            <HeroGuestPicker value={guests} onChange={setGuests} surface={isLight ? "light" : "dark"} />
          </div>
        </div>
      </div>

      {/* Row 3 — Bouton Rechercher */}
      <button
        type="submit"
        className={`tap-target flex min-h-[56px] items-center justify-center gap-2.5 border-0 font-bold uppercase tracking-[0.15em] transition-all sm:mx-2 sm:min-h-0 sm:self-center sm:rounded-full sm:px-6 sm:py-3 ${
          isLight
            ? "rounded-b-2xl bg-navy text-[10px] text-white hover:bg-navy/90"
            : "rounded-b-2xl bg-white text-[10px] text-black hover:bg-white/90"
        } sm:rounded-full`}
      >
        <Search size={14} aria-hidden />
        Rechercher
      </button>

      {/* Datepicker dropdown — fixed position to avoid overflow clip */}
      {openPanel === "date" && (
        <div style={datePickerStyle}>
          <HeroDatePicker
            checkin={checkin}
            checkout={checkout}
            onChange={(ci, co) => {
              setCheckin(ci);
              setCheckout(co);
              if (ci && co) setOpenPanel(null);
            }}
            onClose={() => setOpenPanel(null)}
          />
        </div>
      )}
    </form>
  );
}
