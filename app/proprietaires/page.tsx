// app/proprietaires/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  Headphones,
  TrendingUp,
} from "lucide-react";
import { HeroWordmarkBaseline } from "@/components/marketing/HeroWordmarkBaseline";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  LandingSection,
  LandingCtaBand,
} from "@/components/marketing/landing-sections";
import {
  EditorialFigureBand,
  EditorialImageSplit,
} from "@/components/marketing/editorial-blocks";
import {
  COMMISSION_CAPTION_BRIEF,
  COMMISSION_CAPTION_FULL,
  INCLUSIONS_HIGHLIGHTS,
  INCLUSIONS_REST_COL_A,
  INCLUSIONS_REST_COL_B,
  PREMIERE_LOCATION_SUPPLEMENT,
  PROPRIO_LANDING_IMAGE_ALTS,
  PROPRIO_LANDING_IMAGES,
  TEMOIGNAGE_PROPRIO,
  WHY_PILLARS,
} from "@/lib/proprietaires-data";

export const metadata: Metadata = {
  title: "Programme propriétaires — Confiez votre villa | Diamant Noir",
  description:
    "Confiez votre villa en Martinique à Diamant Noir : commission 20 % TTC, gestion complète clé en main, conciergerie 24/7. Soumettre votre bien pour rejoindre notre collection.",
};

const PILIER_ICONS = [TrendingUp, Headphones, Building2] as const;

export default function ProprietairesPage() {
  return (
    <main className="min-h-screen bg-offwhite animate-fade-up [animation-duration:500ms]">
      {/* ─── Hero vidéo ─── */}
      <section
        className="relative flex min-h-[min(72vh,720px)] w-full flex-col justify-center overflow-hidden bg-black py-24 pt-28 md:min-h-[min(68vh,680px)] md:py-20 md:pt-24"
        aria-labelledby="proprio-hero-title"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/villa-hero.jpg"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        >
          <source src="/hero.webm" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/80" />

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-5 text-center sm:px-6">
          <HeroWordmarkBaseline
            headingId="proprio-hero-title"
            titleLabel="Diamant Noir — Programme propriétaires — Confiance, réactivité, excellence"
          >
            <div className="mx-auto grid w-full max-w-xl animate-in gap-3 fade-in duration-700 delay-300 sm:grid-cols-2 sm:gap-4">
              <Link
                href="/soumettre-ma-villa"
                className="group flex min-h-[48px] flex-col items-start gap-0.5 rounded-none border border-gold/55 bg-gold/[0.12] px-4 py-3.5 text-left backdrop-blur-sm transition-colors hover:bg-gold/[0.20] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
              >
                <span className="text-[8px] font-bold uppercase tracking-[0.28em] text-gold/80">
                  Première étape
                </span>
                <span className="flex w-full items-center justify-between gap-2 font-display text-lg text-white md:text-xl">
                  Soumettre ma villa
                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                </span>
              </Link>
              <Link
                href="/login?redirect=/dashboard/proprio"
                className="group flex min-h-[48px] flex-col items-start gap-0.5 rounded-none border border-white/28 bg-white/[0.12] px-4 py-3.5 text-left backdrop-blur-sm transition-colors hover:bg-white/[0.18] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
              >
                <span className="text-[8px] font-bold uppercase tracking-[0.28em] text-white/45">
                  Déjà partenaire
                </span>
                <span className="flex w-full items-center justify-between gap-2 font-display text-lg text-white md:text-xl">
                  Espace propriétaire
                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                </span>
              </Link>
            </div>
          </HeroWordmarkBaseline>
        </div>
      </section>

      {/* ─── Intro + piliers : un seul bloc image | texte ─── */}
      <EditorialImageSplit
        title="Pourquoi confier votre villa à Diamant Noir ?"
        imagePosition="left"
        imageSrc={PROPRIO_LANDING_IMAGES.splitPourquoi}
        imageAlt={PROPRIO_LANDING_IMAGE_ALTS.splitPourquoi}
        imageClassName="object-[center_32%] md:object-[center_28%]"
        sectionClassName="mt-6 bg-white md:mt-8"
        textColClassName="lg:max-w-xl"
        body={
          <>
            <p className="max-w-prose text-[15px] leading-relaxed text-navy/65 md:text-[16px]">
              Mise en avant premium, conciergerie exigeante et gestion complète pour protéger votre bien
              tout en maximisant ses performances.
            </p>
            <div className="mt-14 border-t border-navy/10 pt-14">
              <ul className="grid gap-10 md:grid-cols-3 md:gap-x-10 lg:gap-x-14">
                {WHY_PILLARS.map((pillar, index) => {
                  const Icon = PILIER_ICONS[index];
                  return (
                    <li key={pillar.title}>
                      <ScrollReveal delay={index * 120}>
                        <Icon className="text-gold/75" size={20} strokeWidth={1.15} aria-hidden />
                        <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy">
                          {pillar.title}
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-navy/55">{pillar.short}</p>
                      </ScrollReveal>
                    </li>
                  );
                })}
              </ul>
              <details className="mt-12 border-t border-navy/10 pt-10">
                <summary className="cursor-pointer list-none text-center text-[10px] font-bold uppercase tracking-[0.32em] text-navy/45 outline-none transition-colors hover:text-navy md:text-left [&::-webkit-details-marker]:hidden">
                  En savoir plus
                </summary>
                <div className="mt-8 grid gap-8 md:grid-cols-3 md:gap-x-8">
                  {WHY_PILLARS.map((pillar) => (
                    <div key={`${pillar.title}-detail`}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy">
                        {pillar.title}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-navy/60">{pillar.detail}</p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </>
        }
      />

      <EditorialFigureBand
        label="Transparence"
        figure="20%"
        caption={COMMISSION_CAPTION_BRIEF}
        detailsCaption={COMMISSION_CAPTION_FULL}
        detailsSummaryLabel="Détails de la commission"
      />

      <EditorialImageSplit
        title="Inclus dans la formule"
        imagePosition="right"
        imageSrc={PROPRIO_LANDING_IMAGES.splitInclusions}
        imageAlt={PROPRIO_LANDING_IMAGE_ALTS.splitInclusions}
        imageClassName="object-[center_65%] md:object-[center_70%]"
        sectionClassName="bg-offwhite"
        textColClassName="lg:max-w-2xl"
        body={
          <>
            <p className="max-w-prose text-[15px] leading-relaxed text-navy/65 md:text-[16px]">
              Le périmètre contractuel que nous mettons en œuvre pour votre villa en gestion clé en main.
            </p>
            <ul className="mt-10 space-y-4">
              {INCLUSIONS_HIGHLIGHTS.map((line) => (
                <li key={line} className="flex gap-3 text-[14px] leading-snug text-navy/80 md:text-[15px]">
                  <span className="mt-0.5 shrink-0 text-gold/90" aria-hidden>
                    <Check size={16} strokeWidth={1} />
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <details className="mt-10 border-t border-navy/10 pt-10">
              <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.28em] text-navy/45 outline-none transition-colors hover:text-navy [&::-webkit-details-marker]:hidden">
                Voir toute la liste et les détails
              </summary>
              <div className="mt-8 grid gap-x-12 gap-y-5 sm:grid-cols-2">
                <ul className="space-y-4">
                  {INCLUSIONS_REST_COL_A.map((line) => (
                    <li key={line} className="flex gap-3 text-[14px] leading-snug text-navy/80 md:text-[15px]">
                      <span className="mt-0.5 shrink-0 text-gold/90" aria-hidden>
                        <Check size={16} strokeWidth={1} />
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-4">
                  {INCLUSIONS_REST_COL_B.map((line) => (
                    <li key={line} className="flex gap-3 text-[14px] leading-snug text-navy/80 md:text-[15px]">
                      <span className="mt-0.5 shrink-0 text-gold/90" aria-hidden>
                        <Check size={16} strokeWidth={1} />
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 max-w-prose border-t border-navy/10 pt-10">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-navy/55">
                  Première location · En supplément
                </p>
                <p className="text-sm leading-relaxed text-navy/70 md:text-[15px]">{PREMIERE_LOCATION_SUPPLEMENT}</p>
              </div>
            </details>
          </>
        }
      />

      {/* ─── Témoignage ─── */}
      <section className="relative overflow-hidden bg-white px-6 py-20 md:py-24 lg:py-28">
        <Image
          src={PROPRIO_LANDING_IMAGES.fondTemoignage}
          alt={PROPRIO_LANDING_IMAGE_ALTS.fondTemoignage || ""}
          fill
          className="object-cover object-[center_40%] opacity-[0.12]"
          sizes="100vw"
          aria-hidden={!PROPRIO_LANDING_IMAGE_ALTS.fondTemoignage}
        />
        <div className="absolute inset-0 bg-white/88 backdrop-blur-[1px]" aria-hidden />
        <ScrollReveal delay={0}><div className="relative z-10 mx-auto max-w-3xl text-center md:text-left">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.42em] text-navy/55">
            Ils nous font confiance
          </p>
          <blockquote className="border-t border-navy/10 pt-10">
            <p className="font-display text-[1.35rem] leading-snug text-navy md:text-2xl md:leading-snug">
              &ldquo;{TEMOIGNAGE_PROPRIO.quote}&rdquo;
            </p>
            <footer className="mt-8">
              <cite className="not-italic text-sm font-semibold text-navy">
                {TEMOIGNAGE_PROPRIO.author}
              </cite>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-navy/42">
                {TEMOIGNAGE_PROPRIO.place}
              </p>
            </footer>
          </blockquote>
        </div></ScrollReveal>
      </section>

      <LandingSection bg="offwhite">
        <LandingCtaBand title="Prêt à confier votre villa ?">
          <Link href="/soumettre-ma-villa" className="btn-luxury bg-black text-white">
            Soumettre ma villa
            <ArrowRight size={16} strokeWidth={1} aria-hidden />
          </Link>
          <p className="text-xs text-navy/45">
            Une question ?{" "}
            <Link href="/contact" className="font-medium text-navy underline-offset-4 hover:underline">
              Contactez-nous
            </Link>
          </p>
        </LandingCtaBand>
      </LandingSection>
    </main>
  );
}
