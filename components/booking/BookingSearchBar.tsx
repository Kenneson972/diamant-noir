"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Users, Search, ArrowRight, ChevronDown, Plus, Minus } from "lucide-react";
import { useRouter } from "next/navigation";

interface BookingSearchBarProps {
  initialCheckin?: string;
  initialCheckout?: string;
  initialGuests?: number;
  /** Redirection vers le catalogue unique `/villas` (dates en query). */
  variant?: "page" | "hero";
}

export function BookingSearchBar({
  initialCheckin = "",
  initialCheckout = "",
  initialGuests = 2,
  variant = "page",
}: BookingSearchBarProps) {
  const router = useRouter();
  const [checkin, setCheckin] = useState(initialCheckin);
  const [checkout, setCheckout] = useState(initialCheckout);
  const [guests, setGuests] = useState(initialGuests);
  const [guestOpen, setGuestOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 });

  const guestBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const checkinRef = useRef<HTMLInputElement>(null);
  const checkoutRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split("T")[0];

  // Close dropdown on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        guestBtnRef.current &&
        !guestBtnRef.current.contains(e.target as Node)
      ) {
        setGuestOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Reposition dropdown on scroll/resize
  useEffect(() => {
    if (!guestOpen) return;
    const reposition = () => {
      if (guestBtnRef.current) {
        const rect = guestBtnRef.current.getBoundingClientRect();
        setDropdownStyle({
          top: rect.bottom + 4,
          left: rect.left,
          width: Math.max(rect.width, 280),
        });
      }
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [guestOpen]);

  const openGuestDropdown = () => {
    if (guestBtnRef.current) {
      const rect = guestBtnRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 280),
      });
    }
    setGuestOpen((prev) => !prev);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (checkin) params.set("checkin", checkin);
    if (checkout) params.set("checkout", checkout);
    params.set("guests", String(guests));

    const path = `/villas?${params.toString()}`;
    router.push(path);
  };

  const formatDate = (d: string) => {
    if (!d) return null;
    return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const nightCount =
    checkin && checkout
      ? Math.round(
          (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000
        )
      : null;

  return (
    <>
      <div className="flex flex-col divide-y divide-black/10 border border-white/20 bg-white/[0.97] text-navy shadow-[0_20px_50px_rgba(0,0,0,0.18)] xs:flex-row xs:divide-x xs:divide-y-0">

        {/* Arrivée */}
        <button
          type="button"
          onClick={() => (checkinRef.current as any)?.showPicker?.()}
          className="relative flex-1 cursor-pointer text-left transition-colors hover:bg-black/[0.03]"
          aria-label="Choisir la date d'arrivée"
        >
          <div className="flex min-h-[60px] items-center gap-4 px-5 py-3.5">
            <Calendar className="h-4 w-4 shrink-0 text-navy/35" strokeWidth={1.25} aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40">Arrivée</p>
              <p className={`mt-0.5 text-sm font-medium truncate ${checkin ? "text-navy" : "text-navy/45"}`}>
                {formatDate(checkin) ?? "Choisir une date"}
              </p>
            </div>
          </div>
          <input
            ref={checkinRef}
            type="date"
            value={checkin}
            min={today}
            onChange={(e) => {
              setCheckin(e.target.value);
              if (checkout && e.target.value >= checkout) setCheckout("");
            }}
            className="absolute opacity-0 pointer-events-none w-px h-px bottom-0 left-4"
            tabIndex={-1}
            aria-hidden="true"
          />
        </button>

        {/* Départ */}
        <button
          type="button"
          onClick={() => (checkoutRef.current as any)?.showPicker?.()}
          className="relative flex-1 cursor-pointer text-left transition-colors hover:bg-black/[0.03]"
          aria-label="Choisir la date de départ"
        >
          <div className="flex min-h-[60px] items-center gap-4 px-5 py-3.5">
            <Calendar className="h-4 w-4 shrink-0 text-navy/35" strokeWidth={1.25} aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40">Départ</p>
              <p className={`mt-0.5 text-sm font-medium truncate ${checkout ? "text-navy" : "text-navy/45"}`}>
                {formatDate(checkout) ?? "Choisir une date"}
              </p>
              {nightCount !== null && nightCount > 0 && (
                <p className="text-[10px] text-gold font-semibold">{nightCount} nuit{nightCount > 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
          <input
            ref={checkoutRef}
            type="date"
            value={checkout}
            min={checkin || today}
            onChange={(e) => setCheckout(e.target.value)}
            className="absolute opacity-0 pointer-events-none w-px h-px bottom-0 left-4"
            tabIndex={-1}
            aria-hidden="true"
          />
        </button>

        {/* Voyageurs */}
        <div className="relative flex-1">
          <button
            ref={guestBtnRef}
            type="button"
            onClick={openGuestDropdown}
            className="flex min-h-[60px] w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-black/[0.03]"
            aria-expanded={guestOpen}
            aria-haspopup="true"
          >
            <Users className="h-4 w-4 shrink-0 text-navy/35" strokeWidth={1.25} aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40">Voyageurs</p>
              <p className="mt-0.5 text-sm font-medium text-navy">
                {guests} voyageur{guests > 1 ? "s" : ""}
              </p>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-navy/30 transition-transform duration-200 ${guestOpen ? "rotate-180" : ""}`}
              strokeWidth={1.5}
              aria-hidden
            />
          </button>
        </div>

        {/* Bouton Rechercher */}
        <button
          type="button"
          onClick={handleSearch}
          className="group flex min-h-[52px] items-center justify-center gap-2 bg-navy px-8 py-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-navy/90 sm:min-w-[10.5rem]"
          aria-label="Lancer la recherche"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
          Rechercher
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            strokeWidth={1.25}
            aria-hidden
          />
        </button>
      </div>

      {/* Guest dropdown — fixed position to escape overflow-hidden parents */}
      {guestOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: dropdownStyle.top,
            left: dropdownStyle.left,
            width: dropdownStyle.width,
            zIndex: 9999,
          }}
          className="border border-black/10 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.14)]"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-navy">Voyageurs</p>
              <p className="mt-0.5 text-[10px] text-navy/40">Adultes et enfants</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGuests(Math.max(1, guests - 1))}
                disabled={guests <= 1}
                className="flex h-11 w-11 items-center justify-center border border-black/15 text-navy transition-colors hover:border-navy/40 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Réduire"
              >
                <Minus size={13} strokeWidth={1.5} />
              </button>
              <span className="w-6 text-center text-base font-semibold text-navy tabular-nums">
                {guests}
              </span>
              <button
                type="button"
                onClick={() => setGuests(Math.min(12, guests + 1))}
                disabled={guests >= 12}
                className="flex h-11 w-11 items-center justify-center border border-black/15 text-navy transition-colors hover:border-navy/40 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Augmenter"
              >
                <Plus size={13} strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGuestOpen(false)}
            className="mt-4 flex min-h-[44px] w-full items-center justify-center border border-navy bg-navy py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-navy/90"
          >
            Confirmer
          </button>
        </div>
      )}
    </>
  );
}
