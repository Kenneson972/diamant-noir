import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  WHY_PILLARS,
  INCLUSIONS,
  INCLUSIONS_HIGHLIGHTS,
  COMMISSION_CAPTION_BRIEF,
} from "@/lib/proprietaires-data";

export function HomeConciergeHighlight() {
  const remaining = INCLUSIONS.length - INCLUSIONS_HIGHLIGHTS.length;

  return (
    <section className="border-b border-black/[0.07] bg-offwhite py-20 px-6 md:py-28">
      <div className="mx-auto max-w-5xl space-y-16">

        {/* Header */}
        <ScrollReveal delay={0}>
          <div className="max-w-2xl space-y-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/40">
              Gestion clé en main
            </span>
            <h2 className="font-display text-4xl font-normal text-navy md:text-5xl">
              La conciergerie autrement.
            </h2>
            <p className="text-[15px] leading-relaxed text-navy/60">
              Bien plus que des gestionnaires — des passionnés ancrés en Martinique qui orchestrent
              chaque séjour avec exigence, de l&apos;annonce au départ du voyageur.
            </p>
          </div>
        </ScrollReveal>

        {/* 3 piliers */}
        <div className="grid gap-10 sm:grid-cols-3">
          {WHY_PILLARS.map(({ title, short }, i) => (
            <ScrollReveal key={title} delay={i * 80}>
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.28em] text-navy">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-navy/55">{short}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Inclusions + tarif */}
        <div className="grid gap-10 border border-navy/10 bg-white px-8 py-10 md:grid-cols-2 md:px-12">
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-navy/45">
              Inclus dans la formule
            </p>
            <ul className="space-y-3">
              {INCLUSIONS_HIGHLIGHTS.map((line) => (
                <li key={line} className="flex gap-3 text-sm text-navy/80">
                  <Check size={16} strokeWidth={1} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="pt-1 text-[12px] italic text-navy/40">
              Et {remaining} prestations supplémentaires détaillées sur la page conciergerie.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-2 border-t border-navy/10 pt-8 md:border-t-0 md:border-l md:pl-12 md:pt-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-navy/45">
              Transparence tarifaire
            </p>
            <p className="font-display text-6xl font-light text-navy">
              20<span className="text-3xl">%</span>
            </p>
            <p className="text-[13px] leading-relaxed text-navy/55">{COMMISSION_CAPTION_BRIEF}</p>
          </div>
        </div>

        {/* CTA */}
        <ScrollReveal delay={80}>
          <Link
            href="/prestations"
            className="group inline-flex items-center gap-2 border border-navy bg-navy px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            En savoir plus
            <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
