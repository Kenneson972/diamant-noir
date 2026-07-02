"use client";

import { DashboardNavIcon } from "@/components/dashboard/shared/dashboard-nav-icon";
import { cn } from "@/lib/utils";

type NavSection = { id: string; label: string; icon: string };

export function QuickNav({
  sections,
  activeSection,
  onNavigate,
}: {
  sections: NavSection[];
  activeSection: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav aria-label="Navigation rapide" className="hidden lg:block" data-testid="quick-nav">
      <ul className="sticky top-24 space-y-1">
        {sections.map((s) => {
          const active = activeSection === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onNavigate(s.id)}
                className={cn(
                  "flex w-full min-h-[36px] items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium transition-colors",
                  active
                    ? "bg-gold/10 text-gold"
                    : "text-navy/50 hover:bg-navy/5 hover:text-navy"
                )}
              >
                <DashboardNavIcon name={s.icon} size={16} />
                <span className="truncate">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
