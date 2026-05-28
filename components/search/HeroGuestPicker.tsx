"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";

type HeroGuestPickerProps = {
  value: number;
  onChange: (v: number) => void;
  surface?: "light" | "dark";
};

export function HeroGuestPicker({ value, onChange, surface = "dark" }: HeroGuestPickerProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const ddRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ top: 0, left: 0, width: 0 });
  const isLight = surface === "light";

  const reposition = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const w = Math.min(Math.max(rect.width, 260), window.innerWidth - 16);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - w - 8));
      setStyle({ top: rect.bottom + 4, left, width: w });
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        ddRef.current &&
        !ddRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  const toggle = () => {
    if (!open) reposition();
    setOpen((p) => !p);
  };

  const dec = () => onChange(Math.max(1, value - 1));
  const inc = () => onChange(Math.min(12, value + 1));

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`tap-target flex min-h-[24px] w-full items-center justify-between gap-2 bg-transparent pb-1 text-sm transition-colors focus:outline-none ${
          isLight ? "text-navy" : "text-white"
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span>
          {value} voyageur{value > 1 ? "s" : ""}
        </span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
            isLight ? "text-navy/50" : "text-white/40"
          } ${open ? "rotate-180" : ""}`}
          strokeWidth={1.5}
          aria-hidden
        />
      </button>

      {open && (
        <div
          ref={ddRef}
          style={{
            position: "fixed",
            top: style.top,
            left: style.left,
            width: style.width,
            zIndex: 9999,
          }}
          className={`rounded-xl border p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] ${
            isLight
              ? "border-navy/10 bg-white"
              : "border-white/15 bg-navy"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isLight ? "text-navy" : "text-white"}`}>
                Voyageurs
              </p>
              <p className={`mt-0.5 text-[10px] ${isLight ? "text-navy/55" : "text-white/40"}`}>
                Adultes et enfants
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={dec}
                disabled={value <= 1}
                className={`flex h-11 w-11 items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                  isLight
                    ? "border border-navy/20 text-navy hover:border-navy/40"
                    : "border border-white/20 text-white hover:border-white/40"
                }`}
                aria-label="Réduire"
              >
                <Minus size={13} strokeWidth={1.5} />
              </button>
              <span className={`w-6 text-center text-base font-semibold tabular-nums ${isLight ? "text-navy" : "text-white"}`}>
                {value}
              </span>
              <button
                type="button"
                onClick={inc}
                disabled={value >= 12}
                className={`flex h-11 w-11 items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                  isLight
                    ? "border border-navy/20 text-navy hover:border-navy/40"
                    : "border border-white/20 text-white hover:border-white/40"
                }`}
                aria-label="Augmenter"
              >
                <Plus size={13} strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`mt-4 flex min-h-[44px] w-full items-center justify-center py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
              isLight
                ? "border border-navy bg-navy text-white hover:bg-navy/90"
                : "border border-white bg-white text-navy hover:bg-white/90"
            }`}
          >
            Confirmer
          </button>
        </div>
      )}
    </>
  );
}
