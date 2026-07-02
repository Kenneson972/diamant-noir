"use client";

import { cn } from "@/lib/utils";

type SectionStatus = { id: string; label: string; status: "empty" | "partial" | "complete" };

export function ProgressBar({ sections }: { sections: SectionStatus[] }) {
  const completed = sections.filter((s) => s.status === "complete").length;
  const total = sections.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="sticky top-16 z-30 mb-6 space-y-2" data-testid="progress-bar">
      <div className="flex items-center justify-between text-[11px] text-navy/45">
        <span>{completed}/{total} sections complétées</span>
        <span>{pct}%</span>
      </div>
      <div className="flex gap-1.5">
        {sections.map((s) => (
          <div
            key={s.id}
            title={s.label}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              s.status === "complete" && "bg-emerald-500",
              s.status === "partial" && "bg-amber-400",
              s.status === "empty" && "bg-navy/10"
            )}
          />
        ))}
      </div>
    </div>
  );
}
