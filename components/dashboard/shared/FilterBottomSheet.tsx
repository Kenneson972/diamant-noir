"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export function FilterBottomSheet({
  label = "Filtres",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        data-testid="filter-bottom-sheet-trigger"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-navy/15 bg-white px-4 text-sm font-semibold text-navy md:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-navy/40"
          />
          <div
            ref={panelRef}
            data-testid="filter-bottom-sheet-panel"
            className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-2xl bg-white pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl motion-safe:animate-[sheet-up_0.25s_cubic-bezier(0.16,1,0.3,1)]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-navy/8 bg-white px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-navy/45">
                {label}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer les filtres"
                className="flex size-11 items-center justify-center text-navy/55"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="px-4 py-4">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
