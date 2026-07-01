"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { KayvilaPngIcon, type KayvilaPngName } from "@/components/icons/KayvilaPngIcon";
import { SCROLL_SECTIONS } from "@/data/prestations-scroll-sections";
import { useCallback, useEffect, useState } from "react";

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
  marketing: "Estimation locative, photos pro, annonces optimisées.",
  operations: "Check-in, contrôles qualité, coordination ménage et artisans.",
  voyageurs: "Interlocuteur unique 7j/7, de la réservation au départ.",
  menage: "Ménage et blanchisserie facturés aux voyageurs, hors commission.",
  finance: "Commission 22 %, espace propriétaire, Copilot IA inclus.",
};

const SERVICE_DESCS: Record<string, string> = {
  marketing:
    "Votre villa visible partout, valorisée au bon prix — estimation locative, reportage photos, annonces optimisées et prix dynamiques automatiques.",
  operations:
    "Zéro contrainte, tout géré sur place — check-in, contrôles qualité entre chaque séjour, coordination ménage, linge, consommables et artisans.",
  voyageurs:
    "Vous ne recevez aucun appel, aucun message — nous sommes l'interlocuteur unique de vos voyageurs 7j/7, de la réservation au départ.",
  menage:
    "Les frais de ménage et blanchisserie sont facturés aux voyageurs, hors commission. Réassort des consommables à nos frais dès la 2e location.",
  finance:
    "Vous encaissez directement via Airbnb ou Booking. Kayvila facture sa commission sur les nuitées réalisées en fin de mois. Espace propriétaire en ligne et assistant IA Copilot inclus.",
};

export function HomeServicesSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    containScroll: "trimSnaps",
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const syncEmbla = useCallback(() => {
    if (!emblaApi) return;
    setActiveIdx(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    syncEmbla();
    emblaApi.on("select", syncEmbla);
    emblaApi.on("reInit", syncEmbla);
    return () => {
      emblaApi.off("select", syncEmbla);
      emblaApi.off("reInit", syncEmbla);
    };
  }, [emblaApi, syncEmbla]);

  const scrollTo = useCallback(
    (idx: number) => {
      emblaApi?.scrollTo(idx);
    },
    [emblaApi]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section
      id="piliers"
      className="relative overflow-hidden bg-offwhite py-12 md:py-20 scroll-mt-20"
      aria-labelledby="services-title"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.03)_0%,transparent_60%),radial-gradient(circle_at_70%_80%,rgba(10,10,10,0.02)_0%,transparent_50%)]"
      />

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
            <p className="mt-3 text-xs leading-relaxed text-navy/80 md:text-[15px] md:mt-4">
              Faites défiler pour découvrir chaque pilier — ou cliquez directement sur un service.
            </p>
          </div>
        </ScrollReveal>

        <div
          className="mt-8 flex items-center justify-center gap-1 md:mt-10"
          role="tablist"
          aria-label="Pilier actif"
        >
          {SCROLL_SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === activeIdx}
              aria-label={`Pilier ${i + 1} — ${s.title}`}
              title={s.title}
              onClick={() => scrollTo(i)}
              className="relative flex h-11 w-11 items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === activeIdx
                    ? "h-1.5 w-8 bg-navy/30"
                    : "h-1.5 w-1.5 bg-navy/10 hover:bg-navy/20"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="relative mt-4 md:mt-6">
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canPrev}
            aria-label="Pilier précédent"
            className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full border-2 border-navy/30 bg-white text-navy shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200 hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-0 md:flex focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={!canNext}
            aria-label="Pilier suivant"
            className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full border-2 border-navy/30 bg-white text-navy shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200 hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-0 md:flex focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>

          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex gap-4 md:gap-6">
              {SCROLL_SECTIONS.map((service, i) => {
                const visual = SERVICE_VISUALS[service.id];
                const tagline = SERVICE_TAGLINES[service.id];
                const desc = SERVICE_DESCS[service.id];

                return (
                  <div
                    key={service.id}
                    className="min-w-0 shrink-0 grow-0 basis-[85vw] sm:basis-[80vw] md:basis-[75vw] lg:basis-[65vw]"
                  >
                    <Link
                      href={`/prestations/services/${service.id}`}
                      className="group relative flex w-full flex-col overflow-hidden border border-navy/[0.07] bg-white transition-all duration-400 hover:border-navy/20 hover:shadow-[0_16px_48px_rgba(0,0,0,0.07)] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 md:flex-row"
                    >
                      {visual && (
                        <div className="relative h-[35vw] min-h-[160px] w-full shrink-0 overflow-hidden md:h-auto md:w-1/2">
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

                      <div className="flex flex-1 flex-col justify-center px-5 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12 lg:px-14">
                        <div className="mb-3 flex items-center gap-3 md:mb-4">
                          <KayvilaPngIcon
                            name={`pilier-${service.id}` as KayvilaPngName}
                            size={36}
                            alt=""
                            className="shrink-0"
                          />
                          <span
                            aria-hidden
                            className="font-display text-[11px] font-bold tracking-[0.15em] text-gold/50"
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="h-px flex-1 bg-navy/[0.06]" aria-hidden />
                        </div>

                        <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-navy/50">
                          {tagline}
                        </p>

                        <h3 className="mt-2 font-display text-lg leading-tight text-navy md:mt-3 md:text-2xl">
                          {service.title}
                        </h3>

                        <p className="mt-2 max-w-md text-[12px] leading-relaxed text-navy/80 md:mt-3 md:text-[13px]">
                          {desc}
                        </p>

                        <div
                          className="mt-4 flex items-center gap-1.5 md:mt-6"
                          aria-label={`Pilier ${i + 1} sur 5`}
                        >
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

                        <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-navy/50 transition-colors group-hover:text-navy md:mt-4">
                          Voir le détail <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
                        </span>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <ScrollReveal delay={120}>
          <div className="mt-10 text-center">
            <Link
              href="/prestations"
              scroll={true}
              className="inline-flex min-h-[48px] items-center gap-2 border border-navy bg-navy px-7 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
            >
              Tout savoir sur la conciergerie <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
