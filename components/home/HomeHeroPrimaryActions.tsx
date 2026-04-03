"use client";

import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookingSearchBar } from "@/components/booking/BookingSearchBar";
import { useViewTransitionNavigate } from "@/components/home/use-view-transition-navigate";
import { cn } from "@/lib/utils";

const REVEAL_EVENT = "diamant-reveal-booking";

export function HomeHeroPrimaryActions() {
  const goProprio = useViewTransitionNavigate();
  const [bookingOpen, setBookingOpen] = useState(false);
  const searchAnchorRef = useRef<HTMLDivElement>(null);
  const openedOnce = useRef(false);

  const openBookingAndScroll = useCallback(() => {
    setBookingOpen(true);
    openedOnce.current = true;
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "#reserver-un-sejour");
    }
    requestAnimationFrame(() => {
      searchAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    const onReveal = () => {
      setBookingOpen(true);
      openedOnce.current = true;
    };
    window.addEventListener(REVEAL_EVENT, onReveal);
    return () => window.removeEventListener(REVEAL_EVENT, onReveal);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromHash = () => {
      if (window.location.hash === "#reserver-un-sejour") {
        setBookingOpen(true);
        openedOnce.current = true;
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      if (mq.matches) {
        setBookingOpen(true);
        openedOnce.current = true;
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <>
      <div className="mx-auto grid w-full max-w-xl animate-in gap-3 fade-in duration-700 delay-100 sm:grid-cols-2 sm:gap-4">
        <a
          href="#reserver-un-sejour"
          onClick={(e) => {
            e.preventDefault();
            openBookingAndScroll();
          }}
          className="group flex min-h-[48px] flex-col items-start gap-0.5 rounded-none border border-white/28 bg-white/[0.12] px-4 py-3.5 text-left backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.18] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 active:scale-[0.99]"
        >
          <span className="text-[8px] font-bold uppercase tracking-[0.28em] text-white/45">
            Voyageurs
          </span>
          <span className="flex w-full items-center justify-between gap-2 font-display text-lg text-white md:text-xl">
            Réserver un séjour
            <ArrowRight
              className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
              strokeWidth={1.25}
              aria-hidden
            />
          </span>
        </a>
        <a
          href="/proprietaires"
          onClick={(e) => {
            e.preventDefault();
            goProprio("/proprietaires");
          }}
          className="group flex min-h-[48px] flex-col items-start gap-0.5 rounded-none border border-white/28 bg-white/[0.12] px-4 py-3.5 text-left backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.18] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 active:scale-[0.99]"
        >
          <span className="text-[8px] font-bold uppercase tracking-[0.28em] text-white/45">
            Propriétaires
          </span>
          <span className="flex w-full items-center justify-between gap-2 font-display text-lg text-white md:text-xl">
            Confier ma villa
            <ArrowRight
              className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
              strokeWidth={1.25}
              aria-hidden
            />
          </span>
        </a>
      </div>

      <div
        className={cn(
          "grid w-full transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]",
          bookingOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr] md:grid-rows-[1fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden md:overflow-visible">
          <div
            ref={searchAnchorRef}
            id="reserver-un-sejour"
            className={cn(
              "mx-auto w-full max-w-4xl scroll-mt-28 pt-1 md:scroll-mt-24 md:pt-2",
              "transition-all duration-500 ease-out motion-reduce:transition-none",
              bookingOpen
                ? "translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-4 opacity-0 md:pointer-events-auto md:translate-y-0 md:opacity-100"
            )}
          >
            <div
              className={cn(
                "rounded-sm transition-[box-shadow] duration-500",
                bookingOpen && openedOnce.current ? "shadow-[0_18px_48px_-12px_rgba(0,0,0,0.45)]" : ""
              )}
            >
              <BookingSearchBar variant="hero" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
