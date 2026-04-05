"use client";

import Link from "next/link";
import { Calendar, Users, Search, ArrowRight, MessageCircle, MapPin, Building2 } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useHomeAudience } from "@/contexts/HomeAudienceContext";

function formatIsoDate(d: string) {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

type Props = {
  catalogueHref: string;
  hasDateOnly: boolean;
  checkin: string;
  checkout: string;
  guestsParam: number;
};

export function BookLandingMarketing({
  catalogueHref,
  hasDateOnly,
  checkin,
  checkout,
  guestsParam,
}: Props) {
  const { audience } = useHomeAudience();

  if (audience === "proprietaire") {
    return (
      <>
        <section className="relative min-h-[490px] w-full overflow-hidden bg-black xs:min-h-[520px] md:min-h-[78vh]">
          <div
            className="absolute inset-0 bg-[url('/villa-hero.jpg')] bg-cover bg-center opacity-40"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-offwhite" />

          <div className="relative z-10 flex min-h-[490px] flex-col justify-end px-6 pb-8 pt-24 xs:min-h-[520px] md:min-h-[78vh] md:pb-20 md:pt-32">
            <div className="mx-auto w-full max-w-3xl space-y-5 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-white/65">
                Espace propriétaires
              </p>
              <h1 className="font-display text-4xl leading-[1.08] text-white md:text-6xl lg:text-7xl">
                Confier ou suivre votre bien
              </h1>
              <p className="mx-auto max-w-lg text-sm font-light tracking-[0.12em] text-white/70">
                La réservation voyageur se fait depuis le catalogue ou une fiche villa. En tant que propriétaire,
                privilégiez l&apos;offre dédiée et la soumission de bien — le catalogue reste accessible pour voir
                le positionnement.
              </p>
            </div>

            <div className="mx-auto mt-10 w-full max-w-4xl animate-in fade-in duration-700">
              <div className="flex flex-col divide-y divide-black/10 border border-white/20 bg-white/[0.97] text-navy shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:flex-row sm:divide-x sm:divide-y-0">
                <Link
                  href="/proprietaires"
                  className="group flex flex-1 items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.03] sm:py-5"
                >
                  <Building2 className="h-4 w-4 shrink-0 text-navy/35" strokeWidth={1.25} aria-hidden />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-navy/40">Étape 1</p>
                    <p className="mt-1 text-sm font-medium text-navy">L&apos;offre propriétaires</p>
                  </div>
                </Link>
                <Link
                  href="/soumettre-ma-villa"
                  className="group flex flex-1 items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.03] sm:py-5"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-navy/35" strokeWidth={1.25} aria-hidden />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-navy/40">Étape 2</p>
                    <p className="mt-1 text-sm text-navy/70">Soumettre ma villa</p>
                  </div>
                </Link>
                <Link
                  href={catalogueHref}
                  className="flex min-h-[52px] items-center justify-center bg-navy px-8 py-4 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-colors hover:bg-navy/90 sm:min-w-[10rem]"
                >
                  <Search className="mr-2 h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
                  Catalogue locations
                  <ArrowRight className="ml-2 inline h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {hasDateOnly && (
          <section className="border-b border-black/8 bg-white px-6 py-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="flex items-start gap-3 sm:items-center">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-navy/35" strokeWidth={1.25} aria-hidden />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/45">Dates indiquées</p>
                  <p className="text-sm text-navy">
                    Du {formatIsoDate(checkin)} au {formatIsoDate(checkout)}
                    {guestsParam > 1 ? ` · ${guestsParam} voyageurs` : ""}
                  </p>
                </div>
              </div>
              <Link
                href={catalogueHref}
                className="inline-flex shrink-0 items-center justify-center border border-navy bg-navy px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-navy/90"
              >
                Voir le catalogue
              </Link>
            </div>
          </section>
        )}

        <section className="relative z-10 mx-auto max-w-2xl scroll-mt-28 px-6 pb-20 pt-12 md:pt-16">
          <div className="space-y-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/55">Une seule vitrine</p>
            <h2 className="font-display text-2xl text-navy md:text-3xl">Catalogue voyageurs &amp; exigence marque</h2>
            <p className="text-sm leading-relaxed text-navy/55">
              La page <span className="font-medium text-navy">Nos villas</span> présente la collection louée par Diamant
              Noir. Pour intégrer votre bien ou suivre votre exploitation, passez par l&apos;espace propriétaires.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/proprietaires"
                className="inline-flex items-center gap-2 border border-navy bg-navy px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              >
                Offre propriétaires
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
              </Link>
              <Link
                href={catalogueHref}
                className="inline-flex items-center gap-2 border border-navy bg-white px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.28em] text-navy transition-colors hover:bg-navy hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              >
                Ouvrir le catalogue
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-black/8 bg-white px-6 py-20 md:py-28">
          <ScrollReveal delay={0}>
            <div className="mx-auto max-w-2xl space-y-8 text-center">
              <MessageCircle className="mx-auto text-gold/70" size={28} strokeWidth={1} aria-hidden />
              <h2 className="font-display text-3xl leading-tight text-navy md:text-4xl">
                Un interlocuteur dédié
              </h2>
              <p className="text-base font-light leading-relaxed text-navy/55">
                Pour un projet de mise en location ou le suivi de votre bien, notre équipe répond sur mesure.
              </p>
              <div className="pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 border border-navy bg-navy px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                >
                  Nous contacter
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="relative min-h-[490px] w-full overflow-hidden bg-black xs:min-h-[520px] md:min-h-[78vh]">
        <div
          className="absolute inset-0 bg-[url('/villa-hero.jpg')] bg-cover bg-center opacity-40"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-offwhite" />

        <div className="relative z-10 flex min-h-[490px] flex-col justify-end px-6 pb-8 pt-24 xs:min-h-[520px] md:min-h-[78vh] md:pb-20 md:pt-32">
          <div className="mx-auto w-full max-w-3xl space-y-5 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-white/65">Réservation</p>
            <h1 className="font-display text-4xl leading-[1.08] text-white md:text-6xl lg:text-7xl">
              Réserver votre séjour
            </h1>
            <p className="mx-auto max-w-lg text-sm font-light tracking-[0.12em] text-white/70">
              Choisissez d&apos;abord une villa dans notre collection, puis vos dates sur la fiche — paiement sécurisé
              en dernière étape.
            </p>
          </div>

          <div className="mx-auto mt-10 w-full max-w-4xl animate-in fade-in duration-700">
            <div className="flex flex-col divide-y divide-black/10 border border-white/20 bg-white/[0.97] text-navy shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:flex-row sm:divide-x sm:divide-y-0">
              <Link
                href={catalogueHref}
                className="group flex flex-1 items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.03] sm:py-5"
              >
                <MapPin className="h-4 w-4 shrink-0 text-navy/35" strokeWidth={1.25} aria-hidden />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-navy/40">Étape 1</p>
                  <p className="mt-1 text-sm font-medium text-navy">Parcourir le catalogue</p>
                </div>
              </Link>
              <Link
                href={catalogueHref}
                className="group flex flex-1 items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.03] sm:py-5"
              >
                <Calendar className="h-4 w-4 shrink-0 text-navy/35" strokeWidth={1.25} aria-hidden />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-navy/40">Étape 2</p>
                  <p className="mt-1 text-sm text-navy/70">Dates sur la fiche villa</p>
                </div>
              </Link>
              <Link
                href={catalogueHref}
                className="flex min-h-[52px] items-center justify-center bg-navy px-8 py-4 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-colors hover:bg-navy/90 sm:min-w-[10rem]"
              >
                <Search className="mr-2 h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
                Voir les villas
                <ArrowRight className="ml-2 inline h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {hasDateOnly && (
        <section className="border-b border-black/8 bg-white px-6 py-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className="flex items-start gap-3 sm:items-center">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-navy/35" strokeWidth={1.25} aria-hidden />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/45">Dates indiquées</p>
                <p className="text-sm text-navy">
                  Du {formatIsoDate(checkin)} au {formatIsoDate(checkout)}
                  {guestsParam > 1 ? ` · ${guestsParam} voyageurs` : ""}
                </p>
              </div>
            </div>
            <Link
              href={catalogueHref}
              className="inline-flex shrink-0 items-center justify-center border border-navy bg-navy px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-navy/90"
            >
              Choisir une villa
            </Link>
          </div>
        </section>
      )}

      <section className="relative z-10 mx-auto max-w-2xl scroll-mt-28 px-6 pb-20 pt-12 md:pt-16">
        <div className="space-y-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/55">Un seul catalogue</p>
          <h2 className="font-display text-2xl text-navy md:text-3xl">Carte, liste et fiches détaillées</h2>
          <p className="text-sm leading-relaxed text-navy/55">
            La page <span className="font-medium text-navy">Nos villas</span> regroupe toute la collection. Après votre
            choix, les disponibilités et le paiement se font sur la page de la villa — sans parcourir deux catalogues.
          </p>
          <Link
            href={catalogueHref}
            className="inline-flex items-center gap-2 border border-navy bg-white px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.28em] text-navy transition-colors hover:bg-navy hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            Ouvrir le catalogue
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
          </Link>
        </div>
      </section>

      <section className="border-t border-black/8 bg-white px-6 py-20 md:py-28">
        <ScrollReveal delay={0}>
          <div className="mx-auto max-w-2xl space-y-8 text-center">
            <MessageCircle className="mx-auto text-gold/70" size={28} strokeWidth={1} aria-hidden />
            <h2 className="font-display text-3xl leading-tight text-navy md:text-4xl">Un accompagnement sur mesure</h2>
            <p className="text-base font-light leading-relaxed text-navy/55">
              Notre conciergerie vous aide à composer votre séjour : transferts, expériences, équipe sur place.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-navy bg-navy px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
              >
                Contacter la conciergerie
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
