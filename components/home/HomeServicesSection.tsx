"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SCROLL_SECTIONS } from "@/data/prestations-scroll-sections";

const MARKETING_PAIRS = [
  { icon: "▴", title: "Marketing & Visibilité", tag: "01", color: "bg-gold/10 text-gold" },
  { icon: "◈", title: "Opérations & Terrain", tag: "02", color: "bg-navy/[0.06] text-navy" },
  { icon: "◎", title: "Relation Voyageurs", tag: "03", color: "bg-gold/10 text-gold" },
  { icon: "◇", title: "Ménage & Blanchisserie", tag: "04", color: "bg-navy/[0.06] text-navy" },
  { icon: "▣", title: "Finance & Reversements", tag: "05", color: "bg-gold/10 text-gold" },
];

export function HomeServicesSection() {
  return (
    <section className="relative overflow-hidden bg-offwhite py-16 md:py-24" aria-labelledby="services-title">
      {/* Subtile texture de fond */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.03)_0%,transparent_60%),radial-gradient(circle_at_70%_80%,rgba(10,10,10,0.02)_0%,transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/45">
              Gestion clé en main
            </span>
            <h2
              id="services-title"
              className="mt-4 font-display text-3xl font-normal leading-[1.08] text-navy md:text-5xl lg:text-6xl"
            >
              Cinq piliers,
              <br />
              une seule équipe
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-navy/55 md:text-[15px]">
              De la mise en ligne au reversement, chaque aspect de votre villa est pris en charge
              par notre équipe locale en Martinique.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SCROLL_SECTIONS.map((service, i) => {
            const pair = MARKETING_PAIRS[i];
            return (
              <ScrollReveal key={service.id} delay={i * 80}>
                <Link
                  href={`/prestations/services/${service.id}`}
                  className="group relative flex h-full flex-col border border-navy/[0.07] bg-white p-7 transition-all duration-400 hover:border-navy/20 hover:shadow-[0_16px_48px_rgba(0,0,0,0.07)] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                >
                  {/* Numéro en fond très discret */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-4 top-3 select-none font-display text-[5rem] font-bold leading-none text-navy/[0.04] transition-colors duration-400 group-hover:text-navy/[0.08]"
                  >
                    {pair?.tag}
                  </span>

                  {/* Grande icône décorative */}
                  <div
                    aria-hidden
                    className={`mb-6 flex h-10 w-10 items-center justify-center text-sm ${pair?.color}`}
                  >
                    {pair?.icon}
                  </div>

                  {/* Ligne décorative */}
                  <div
                    aria-hidden
                    className="mb-5 h-px w-8 bg-navy/15 transition-all duration-300 group-hover:w-12 group-hover:bg-navy/35"
                  />

                  <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-navy">
                    {service.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-navy/55">
                    {service.tagline}
                  </p>

                  <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-navy/60 transition-colors group-hover:text-navy">
                    Voir le détail <ArrowRight size={12} strokeWidth={1.75} aria-hidden />
                  </span>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal delay={120}>
          <div className="mt-12 text-center">
            <Link
              href="/prestations"
              className="inline-flex min-h-[48px] items-center gap-2 border border-navy bg-navy px-7 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
            >
              Tout savoir sur la conciergerie <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
