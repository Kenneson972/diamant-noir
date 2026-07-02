"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardNavIcon } from "@/components/dashboard/shared/dashboard-nav-icon";
import type { SectionStatus } from "@/lib/villa-editor-sections";

const STATUS_STYLES: Record<SectionStatus, string> = {
  empty: "bg-navy/8 text-navy/50",
  partial: "bg-amber-100 text-amber-700",
  complete: "bg-gold/15 text-gold",
};

const STATUS_LABELS: Record<SectionStatus, string> = {
  empty: "À remplir",
  partial: "En cours",
  complete: "Complet",
};

export function EditorSection({
  id,
  icon,
  title,
  help,
  status,
  defaultOpen = false,
  children,
}: {
  id: string;
  icon: string;
  title: string;
  help?: string;
  status?: SectionStatus;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      id={`ve-${id}`}
      role="region"
      aria-labelledby={`ve-${id}-title`}
      className="scroll-mt-24 border-t border-navy/8 py-5"
      data-testid={`editor-section-${id}`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`ve-${id}-content`}
        onClick={() => setOpen(!open)}
        className="flex min-h-[44px] w-full items-center gap-3 text-left"
      >
        <DashboardNavIcon name={icon} size={20} />
        <span className="min-w-0 flex-1">
          <span id={`ve-${id}-title`} className="block font-display text-base font-semibold text-navy">
            {title}
          </span>
          {help && <span className="mt-0.5 block text-xs text-navy/50">{help}</span>}
        </span>
        {status && (
          <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em]", STATUS_STYLES[status])}>
            {STATUS_LABELS[status]}
          </span>
        )}
        <ChevronDown
          aria-hidden
          className={cn("size-4 shrink-0 text-navy/40 transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")}
        />
      </button>

      {!open && status === "empty" && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-1 min-h-[44px] text-xs font-semibold text-gold transition-colors hover:text-gold/80"
        >
          Remplir cette section →
        </button>
      )}

      <div
        id={`ve-${id}-content`}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
