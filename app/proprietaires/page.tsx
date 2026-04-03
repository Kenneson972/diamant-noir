// app/proprietaires/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  Headphones,
  TrendingUp,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import {
  LandingSection,
  LandingBlockTitle,
  LandingCtaBand,
} from "@/components/marketing/landing-sections";
import { EditorialFigureBand } from "@/components/marketing/editorial-blocks";
import {
  INCLUSIONS_COL_A,
  INCLUSIONS_COL_B,
  TEMOIGNAGE_PROPRIO,
} from "@/lib/proprietaires-data";

export const metadata: Metadata = {
  title: "Programme propriétaires — Confiez votre villa | Diamant Noir",
  description:
    "Confiez votre villa en Martinique à Diamant Noir : commission 20 % TTC, gestion complète clé en main, conciergerie 24/7. Soumettre votre bien pour rejoindre notre collection.",
};

export default function ProprietairesPage() {
  return (
    <main className="min-h-screen bg-offwhite">
      {/* ─── Section 1 : Hero vidéo ─── */}
      <section
        className="relative flex min-h-[min(72vh,720px)] w-full flex-col justify-center overflow-hidden bg-black py-24 pt-28 md:min-h-[min(68vh,680px)] md:py-20 md:pt-24"
        aria-labelledby="proprio-hero-title"
      >
        <h1 id="proprio-hero-title" className="sr-only">
          Diamant Noir — Programme propriétaires, Martinique
        </h1>
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
          <div className="w-full space-y-4 md:space-y-5">
            <div className="flex justify-center animate-in fade-in duration-700">
              <BrandLogo
                variant="onDark"
                size="hero"
                showWordmark={false}
                linkToHome={false}
                priority
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-gold/90 animate-in fade-in duration-700">
              Programme propriétaires · Martinique
            </p>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-white/72 animate-in fade-in duration-700 delay-75 md:max-w-lg md:text-base">
              Confiez votre villa à une conciergerie d&apos;exception. Visibilité, revenus, sérénité.
            </p>

            <div className="mx-auto grid w-full max-w-xl animate-in gap-3 fade-in duration-700 delay-100 sm:grid-cols-2 sm:gap-4">
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
          </div>
        </div>
      </section>

      {/* ─── Section 2 : Pourquoi Diamant Noir ─── */}
      <LandingSection bg="offwhite">
        <LandingBlockTitle
          eyebrow="Programme propriétaires"
          title="Pourquoi confier votre villa à Diamant Noir ?"
        />
        <p className="-mt-4 mb-14 max-w-2xl text-sm leading-relaxed text-navy/65 md:text-[15px]">
          Mise en avant premium, conciergerie exigeante et gestion complète pour protéger votre bien
          tout en maximisant ses performances.
        </p>
        <ul className="grid gap-10 sm:grid-cols-3">
          <li className="space-y-3">
            <TrendingUp className="text-gold/80" size={22} strokeWidth={1.25} aria-hidden />
            <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-navy">
              Visibilité &amp; revenue
            </h3>
            <p className="text-sm leading-relaxed text-navy/55">
              Positionnement luxe, pricing et diffusion alignés sur une clientèle haut de gamme.
            </p>
          </li>
          <li className="space-y-3">
            <Headphones className="text-gold/80" size={22} strokeWidth={1.25} aria-hidden />
            <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-navy">
              Conciergerie 24/7
            </h3>
            <p className="text-sm leading-relaxed text-navy/55">
              Accueil, housekeeping, demandes voyageurs : une équipe dédiée sur le terrain.
            </p>
          </li>
          <li className="space-y-3">
            <Building2 className="text-gold/80" size={22} strokeWidth={1.25} aria-hidden />
            <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-navy">
              Sérénité propriétaire
            </h3>
            <p className="text-sm leading-relaxed text-navy/55">
              Suivi transparent, standards élevés et relation de confiance sur la durée.
            </p>
          </li>
        </ul>
      </LandingSection>

      {/* ─── Section 3 : 20% TTC ─── */}
      <EditorialFigureBand
        label="Transparence"
        figure="20%"
        caption="TTC sur le montant net des nuitées collectées — frais de ménage et blanchisserie facturés aux voyageurs, hors commission."
      />

      {/* ─── Section 4 : Inclusions + Pack démarrage ─── */}
      <LandingSection bg="white">
        <LandingBlockTitle eyebrow="Gestion complète" title="Inclus dans la formule" />
        <p className="-mt-4 mb-12 max-w-2xl text-sm leading-relaxed text-navy/65 md:text-[15px]">
          Le périmètre contractuel que nous mettons en œuvre pour votre villa en gestion clé en main.
        </p>
        <div className="grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          <ul className="space-y-4">
            {INCLUSIONS_COL_A.map((line) => (
              <li key={line} className="flex gap-3 text-sm text-navy/85 md:text-[15px]">
                <span className="mt-0.5 shrink-0 text-gold" aria-hidden>
                  <Check size={18} strokeWidth={1} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <ul className="space-y-4">
            {INCLUSIONS_COL_B.map((line) => (
              <li key={line} className="flex gap-3 text-sm text-navy/85 md:text-[15px]">
                <span className="mt-0.5 shrink-0 text-gold" aria-hidden>
                  <Check size={18} strokeWidth={1} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pack démarrage */}
        <div className="mt-14 border border-navy/10 bg-offwhite/40 px-8 py-10 md:px-12">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-navy/45">
            Première location · En supplément
          </p>
          <p className="text-sm leading-relaxed text-navy/75 md:text-[15px]">
            <span className="font-semibold text-navy">En supplément</span> — uniquement pour la{" "}
            <span className="font-semibold">première location</span> réalisée par notre conciergerie — un{" "}
            <span className="font-semibold">pack de démarrage</span> vous sera facturé (sucre, café, eau,
            poivre, huile, épices, papier toilette, savon, boîte à clefs, inventaire).
          </p>
        </div>
      </LandingSection>

      {/* ─── Section 5 : Témoignage propriétaire ─── */}
      <LandingSection bg="offwhite">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.45em] text-navy/40">
          Ils nous font confiance
        </p>
        <blockquote className="max-w-3xl border-t border-navy/10 pt-8">
          <p className="font-display text-xl leading-relaxed text-navy md:text-2xl">
            &ldquo;{TEMOIGNAGE_PROPRIO.quote}&rdquo;
          </p>
          <footer className="mt-6">
            <cite className="not-italic text-sm font-semibold text-navy">
              {TEMOIGNAGE_PROPRIO.author}
            </cite>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-navy/45">
              {TEMOIGNAGE_PROPRIO.place}
            </p>
          </footer>
        </blockquote>
      </LandingSection>

      {/* ─── Section 6 : CTA final ─── */}
      <LandingSection bg="white">
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
