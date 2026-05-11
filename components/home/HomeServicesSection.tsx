"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SCROLL_SECTIONS } from "@/data/prestations-scroll-sections";
import { useCallback, useEffect, useRef, useState } from "react";

const SERVICE_VISUALS: Record<
  string,
  { src: string; alt: string; position: string }
> = {
  marketing: {
    src: "/marketing.png",
    alt: "Piscine de villa de luxe au coucher du soleil avec appareil photo — Marketing locatif Martinique",
    position: "center 30%",
  },
  operations: {
    src: "/terrain.png",
    alt: "Entrée de villa avec boîte à clés sécurisée et serviette fraîche — Opérations terrain Martinique",
    position: "center 25%",
  },
  voyageurs: {
    src: "/relation.png",
    alt: "Couple en terrasse face à l'océan, verre de coco à la main — Relation voyageurs Martinique",
    position: "center 55%",
  },
  menage: {
    src: "/menage.png",
    alt: "Lit impeccable avec drap blanc et fleur de frangipanier — Ménage blanchisserie Martinique",
    position: "center 40%",
  },
  finance: {
    src: "/finance.png",
    alt: "Bureau en terrasse avec MacBook, café et orchidée — Gestion financière Martinique",
    position: "right 30%",
  },
};

const SERVICE_TAGLINES: Record<string, string> = {
  marketing:
    "Estimation locative, photos pro, annonces optimisées.",
  operations:
    "Check-in, contrôles qualité, coordination ménage et artisans.",
  voyageurs:
    "Interlocuteur unique 7j/7, de la réservation au départ.",
  menage:
    "Ménage et blanchisserie facturés aux voyageurs, hors commission.",
  finance:
    "Commission 20 % TTC, espace propriétaire, Copilot IA inclus.",
};

const SERVICE_DESCS: Record<string, string> = {
  marketing:
    "Votre villa visible partout, valorisée au bon prix — estimation locative, photos professionnelles, annonces optimisées et prix dynamiques automatiques.",
  operations:
    "Zéro contrainte, tout géré sur place — check-in, contrôles qualité entre chaque séjour, coordination ménage, linge, consommables et artisans.",
  voyageurs:
    "Vous ne recevez aucun appel, aucun message — nous sommes l'interlocuteur unique de vos voyageurs 7j/7, de la réservation au départ.",
  menage:
    "Les frais de ménage et blanchisserie sont facturés aux voyageurs, hors commission. Réassort des consommables à nos frais dès la 2e location.",
  finance:
    "Vous encaissez directement via Airbnb ou Booking. Kayvila facture sa commission de 20 % TTC sur les nuitées réalisées en fin de mois. Espace propriétaire en ligne et assistant IA Copilot inclus.",
};

export function HomeServicesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [hintPlayed, setHintPlayed] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeIdx) setActiveIdx(idx);
  }, [activeIdx]);

  const scrollTo = useCallback((idx: number) => {
    scrollRef.current?.children[idx]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
    setActiveIdx(idx);
  }, []);

  const scrollPrev = useCallback(() => scrollTo(Math.max(activeIdx - 1, 0)), [activeIdx, scrollTo]);
  const scrollNext = useCallback(() => scrollTo(Math.min(activeIdx + 1, SCROLL_SECTIONS.length - 1)), [activeIdx, scrollTo]);

  useEffect(() => {
    if (hintPlayed) return;
    const timer = setTimeout(() => {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 600);
      setHintPlayed(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [hintPlayed]);

  return (
    <section id="piliers" className="relative overflow-hidden bg-offwhite py-12 md:py-20 scroll-mt-20" aria-labelledby="services-title">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.03)_0%,transparent_60%),radial-gradient(circle_at_70%_80%,rgba(10,10,10,0.02)_0%,transparent_50%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/45">
              Gestion clé en main
            </span>
            <h2
              id="services-title"
              className="mt-4 font-display text-2xl font-light leading-[1.04] text-navy md:text-4xl lg:text-5xl"
            >
              Cinq piliers,
              <br />
              une seule équipe
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-navy/55 md:text-[15px] md:mt-4">
              Faites défiler pour découvrir chaque pilier — ou cliquez directement sur un service.
            </p>
          </div>
        </ScrollReveal>

        {/* ── Indicateur de position ── */}
        <div className="mt-8 flex items-center justify-center gap-1 md:mt-10" role="tablist" aria-label="Pilier actif">
          {SCROLL_SECTIONS.map((s, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activeIdx}
              aria-label={`Pilier ${i + 1} — ${s.title}`}
              title={s.title}
              onClick={() => scrollTo(i)}
              className={`relative flex h-11 w-11 items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30`}
            >
              <span className={`block rounded-full transition-all duration-300 ${
                i === activeIdx
                  ? "h-1.5 w-8 bg-navy/30"
                  : "h-1.5 w-1.5 bg-navy/10 hover:bg-navy/20"
              }`} />
            </button>
          ))}
        </div>

        {/* ── Carrousel horizontal snap ── */}
        <div className="relative">
          {/* Flèche gauche — desktop */}
          <button
            type="button"
            onClick={scrollPrev}
            disabled={activeIdx === 0}
            aria-label="Pilier précédent"
            className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center border border-navy/15 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-200 hover:border-navy/40 hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] disabled:cursor-not-allowed disabled:opacity-30 md:flex focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          {/* Flèche droite — desktop */}
          <button
            type="button"
            onClick={scrollNext}
            disabled={activeIdx === SCROLL_SECTIONS.length - 1}
            aria-label="Pilier suivant"
            className="absolute right-0 top-1/2 z-10 hidden translate-x-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center border border-navy/15 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-200 hover:border-navy/40 hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] disabled:cursor-not-allowed disabled:opacity-30 md:flex focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-hide md:mt-6 md:gap-6 md:pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {SCROLL_SECTIONS.map((service, i) => {
            const visual = SERVICE_VISUALS[service.id];
            const tagline = SERVICE_TAGLINES[service.id];
            const desc = SERVICE_DESCS[service.id];

            return (
              <div
                key={service.id}
                className={`flex w-[85vw] shrink-0 snap-start snap-always transition-transform duration-300 md:w-[75vw] lg:w-[65vw] ${showHint && i === 0 ? "translate-x-[-2%]" : ""}`}
              >
                <Link
                  href={`/prestations/services/${service.id}`}
                  className="group relative flex w-full flex-col overflow-hidden border border-navy/[0.07] bg-white transition-all duration-400 hover:border-navy/20 hover:shadow-[0_16px_48px_rgba(0,0,0,0.07)] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 md:flex-row"
                >
                  {/* Image — plein largeur mobile, moitié gauche desktop */}
                  {visual && (
                    <div className="relative h-[40vw] min-h-[200px] w-full shrink-0 overflow-hidden md:w-1/2 md:h-auto">
                      <Image
                        src={visual.src}
                        alt={visual.alt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        style={{ objectPosition: visual.position }}
                        sizes="(max-width: 768px) 85vw, 50vw"
                      />
                    </div>
                  )}

                  {/* Texte — en dessous sur mobile, moitié droite desktop */}
                  <div className="flex flex-1 flex-col justify-center px-5 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12 lg:px-14">
                    <div className="mb-3 flex items-center gap-3 md:mb-4">
                      <span
                        aria-hidden
                        className="font-display text-[11px] font-bold tracking-[0.15em] text-gold/50"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="h-px flex-1 bg-navy/[0.06]" aria-hidden />
                    </div>

                    <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-navy/35">
                      {tagline}
                    </p>

                    <h3 className="mt-2 font-display text-lg leading-tight text-navy md:mt-3 md:text-2xl">
                      {service.title}
                    </h3>

                    <p className="mt-2 max-w-md text-[12px] leading-relaxed text-navy/55 md:mt-3 md:text-[13px]">
                      {desc}
                    </p>

                    {/* Progress indicator — 5 segments */}
                    <div className="mt-4 flex items-center gap-1.5 md:mt-6" aria-label={`Pilier ${i + 1} sur 5`}>
                      {SCROLL_SECTIONS.map((_, si) => (
                        <div
                          key={si}
                          className={`h-0.5 flex-1 transition-colors duration-300 ${si <= i ? "bg-gold" : "bg-navy/[0.1]"}`}
                          aria-hidden
                        />
                      ))}
                      <span className="ml-2 text-[9px] font-bold tabular-nums tracking-[0.15em] text-navy/30">
                        {i + 1}/5
                      </span>
                    </div>

                    <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-navy/35 transition-colors group-hover:text-navy md:mt-4">
                      Voir le détail <ArrowRight size={12} strokeWidth={1.75} aria-hidden />
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
        </div>{/* /relative */}

        <ScrollReveal delay={120}>
          <div className="mt-10 text-center">
            <Link
              href="/prestations"
              scroll={true}
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
