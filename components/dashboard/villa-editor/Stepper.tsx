"use client";

import { cn } from "@/lib/utils";

type Step = { label: string; description: string };

export function Stepper({
  steps,
  current,
  onChange,
}: {
  steps: Step[];
  current: number;
  onChange: (index: number) => void;
}) {
  return (
    <nav aria-label="Étapes de création" className="mb-8">
      <ol className="flex flex-wrap gap-4 sm:gap-0 sm:divide-x sm:divide-navy/10">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step.label} className="flex-1">
              <button
                type="button"
                disabled={!done && !active}
                onClick={() => onChange(i)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                  active && "rounded-lg bg-navy/5",
                  done && "opacity-60 hover:opacity-100",
                  !done && !active && "pointer-events-none opacity-40"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    done
                      ? "bg-emerald-100 text-emerald-700"
                      : active
                        ? "bg-gold text-white"
                        : "bg-navy/10 text-navy/40"
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm font-semibold", active ? "text-navy" : "text-navy/60")}>
                    {step.label}
                  </span>
                  <span className="hidden text-[11px] text-navy/40 sm:block">{step.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
