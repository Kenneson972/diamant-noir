"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type BookingBottomSheetProps = {
  trigger: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
};

export const BookingBottomSheet = ({
  trigger,
  children,
  ariaLabel = "Réserver votre séjour",
}: BookingBottomSheetProps) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Empêcher le scroll du body quand ouvert
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      // Focus le panel pour la navigation clavier
      setTimeout(() => panelRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Fermer avec Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[48px] min-w-[44px] flex-1 max-w-[min(180px,42vw)] items-center justify-center bg-navy px-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-navy/90"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {trigger}
      </button>

      {/* Overlay + sheet */}
      {open && (
        <div
          className="fixed inset-0 z-50 motion-safe:animate-blur-fade"
          role="presentation"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy/30 motion-safe:animate-blur-fade"
            onClick={close}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
            className="absolute bottom-0 left-0 right-0 max-h-[85dvh] overflow-y-auto bg-white rounded-t-[20px] shadow-2xl motion-safe:animate-slide-up"
            style={{ animationDuration: "300ms" }}
          >
            {/* Drag handle */}
            <div className="sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-white rounded-t-[20px]">
              <div
                className="h-1 w-10 rounded-full bg-navy/20"
                aria-hidden="true"
              />
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={close}
              className="absolute top-3 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-navy/5 text-navy/50 hover:bg-navy/10 hover:text-navy/80 transition-colors"
              aria-label="Fermer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Content */}
            <div className="px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
