"use client";

import { ScrollReveal } from "@/components/ScrollReveal";

const STATS = [
  { value: "12", label: "Villas exclusives" },
  { value: "4.9", label: "Note moyenne" },
  { value: "7j/7", label: "Équipe disponible" },
  { value: "< 2h", label: "Temps de réponse" },
];

export function HomeTrustBand() {
  return (
    <section className="border-y border-navy/[0.06] bg-white py-14 px-6 md:py-20">
      <ScrollReveal delay={100}>
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-left">
                <p className="font-display text-3xl font-light leading-none text-navy md:text-4xl">
                  {value}
                </p>
                <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.32em] text-navy/35">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
