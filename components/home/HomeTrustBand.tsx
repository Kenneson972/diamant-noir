"use client";

import { Star } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

export function HomeTrustBand() {
  return (
    <section className="border-y border-black/[0.07] bg-white py-10 px-6">
      <ScrollReveal delay={100}>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center">
          <div className="flex items-center gap-2">
            <Star size={14} className="fill-navy text-navy" strokeWidth={0} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/55">
              4,9 / 5
            </span>
          </div>
          <span className="hidden h-3 w-px bg-black/10 sm:block" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/45">
            100+ séjours
          </span>
          <span className="hidden h-3 w-px bg-black/10 sm:block" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/45">
            Conciergerie 24/7
          </span>
          <span className="hidden h-3 w-px bg-black/10 sm:block" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/45">
            Équipe locale 7j/7
          </span>
        </div>
      </ScrollReveal>
    </section>
  );
}
