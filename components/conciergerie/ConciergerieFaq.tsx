"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CONCIERGERIE_FAQ, type FaqTheme } from "@/data/conciergerie-faq";

function FaqThemeBlock({ theme }: { theme: FaqTheme }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mb-10 last:mb-0">
      {/* Theme header */}
      <div className="mb-4 flex items-center gap-3">
        <span
          className="font-display text-[0.65rem] font-bold tracking-[0.35em] text-gold/40"
          aria-hidden
        >
          {theme.label}
        </span>
        <div className="h-px flex-1 bg-white/8" />
        <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/35">
          {theme.title}
        </h3>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {theme.items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className="overflow-hidden rounded-xl border transition-colors duration-200"
              style={{
                borderColor: isOpen ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.07)",
                background: isOpen
                  ? "rgba(212,175,55,0.05)"
                  : "rgba(255,255,255,0.03)",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-[12px] font-semibold leading-snug text-white/80">
                  {item.q}
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className="shrink-0 text-gold/60 transition-transform duration-300"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  aria-hidden
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-0">
                  <div className="mb-3 h-px w-6 bg-gold/30" aria-hidden />
                  <p className="text-[12px] leading-relaxed text-white/50">{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ConciergerieFaq() {
  return (
    <section
      className="relative px-4 pb-24 pt-20"
      style={{
        background: "rgba(6,6,8,0.88)",
        backdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-14 text-center">
          <div className="mx-auto mb-4 h-px w-8 bg-gold/40" aria-hidden />
          <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.45em] text-gold/55">
            Questions fréquentes
          </p>
          <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
            Tout ce qu&apos;il faut savoir
          </h2>
          <p className="mt-3 text-[12px] leading-relaxed text-white/35">
            Les réponses exactes aux questions posées par nos propriétaires — sans ambiguïté.
          </p>
        </div>

        {/* Themes */}
        {CONCIERGERIE_FAQ.map((theme) => (
          <FaqThemeBlock key={theme.id} theme={theme} />
        ))}

        {/* Footer CTA */}
        <div className="mt-14 text-center">
          <p className="text-[11px] leading-relaxed text-white/30">
            Une question qui n&apos;est pas listée ici ?
          </p>
          <a
            href="/contact"
            className="mt-3 inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-gold/70 underline-offset-4 hover:text-gold hover:underline transition-colors"
          >
            Contactez-nous directement
          </a>
        </div>
      </div>
    </section>
  );
}
