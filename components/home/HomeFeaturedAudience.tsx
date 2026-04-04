"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useHomeAudience } from "@/contexts/HomeAudienceContext";

export type HomeFeaturedVilla = {
  id: string;
  name: string;
  price: number;
  rating: number;
  loc: string;
  tags: string[];
  image: string | null;
};

type Props = {
  featuredVillas: HomeFeaturedVilla[];
  featuredError: string | null;
  featuredCount: number;
};

export function HomeFeaturedAudience({ featuredVillas, featuredError, featuredCount }: Props) {
  const { audience } = useHomeAudience();

  if (audience === "proprietaire") {
    return (
      <section
        id="offre-proprietaire"
        tabIndex={-1}
        className="scroll-mt-24 bg-white py-20 px-6 md:py-28 cv-auto"
      >
        <div className="mx-auto max-w-6xl space-y-12 md:space-y-16">
          <div className="max-w-2xl space-y-5 text-center md:text-left">
            <h2 className="text-[clamp(1.125rem,2.4vw,1.5rem)] font-semibold uppercase tracking-[0.2em] text-navy">
              Propriétaires
            </h2>
            <p className="font-display text-3xl leading-[1.12] text-navy md:text-5xl">
              Confiez votre villa, nous gérons le reste
            </p>
            <span className="mx-auto block h-px w-14 bg-black/15 md:mx-0" />
            <p className="text-sm leading-relaxed text-navy/60 md:text-base">
              Mise en ligne, tarification, ménage, accueil voyageurs et suivi des revenus — une équipe locale
              pour valoriser votre bien sans la charge quotidienne.
            </p>
          </div>

          <div className="grid gap-6 border border-navy/10 bg-offwhite p-8 md:grid-cols-2 md:p-12">
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-navy/45">Par où commencer</p>
              <ul className="space-y-3 text-sm text-navy/70">
                <li className="flex gap-2">
                  <span className="font-medium text-navy">1.</span>
                  Découvrir notre modèle et nos engagements sur la page dédiée.
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-navy">2.</span>
                  Soumettre votre bien pour une étude personnalisée.
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-navy">3.</span>
                  Optionnel : parcourir le catalogue pour voir le niveau d&apos;exigence affiché aux voyageurs.
                </li>
              </ul>
            </div>
            <div className="flex flex-col justify-center gap-4 border-t border-navy/10 pt-8 md:border-t-0 md:border-l md:pl-12 md:pt-0">
              <Link
                href="/proprietaires"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 border border-navy bg-navy px-6 py-3 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              >
                L&apos;offre propriétaires
                <ArrowRight className="h-4 w-4" strokeWidth={1.25} aria-hidden />
              </Link>
              <Link
                href="/soumettre-ma-villa"
                className="inline-flex min-h-[48px] items-center justify-center border border-navy/25 bg-white px-6 py-3 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              >
                Soumettre ma villa
              </Link>
              <p className="text-center text-[10px] text-navy/45 md:text-left">
                <Link href="/villas" className="underline-offset-4 hover:text-navy hover:underline">
                  Voir le catalogue des villas en location
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="locataire"
      tabIndex={-1}
      className="scroll-mt-24 bg-white py-20 px-6 md:py-28 cv-auto"
    >
      <div className="mx-auto max-w-6xl space-y-14 md:space-y-20">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-5 text-center md:text-left">
            <h2 className="text-[clamp(1.125rem,2.4vw,1.5rem)] font-semibold uppercase tracking-[0.2em] text-navy">
              {audience === "voyageur" ? "Pour votre séjour" : "Nos villas"}
            </h2>
            <p className="font-display text-3xl leading-[1.12] text-navy md:text-5xl">
              {audience === "voyageur"
                ? "Des adresses d'exception pour votre prochain voyage"
                : "Une collection privée d’adresses d’exception"}
            </p>
            <span className="mx-auto block h-px w-14 bg-black/15 md:mx-0" />
          </div>
          <Link
            href="/villas"
            className="group flex shrink-0 items-center justify-center gap-2 self-center text-[10px] font-semibold uppercase tracking-[0.28em] text-navy underline-offset-[10px] hover:underline md:self-end"
          >
            Voir tout le catalogue
            <ArrowRight size={14} strokeWidth={1.25} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {featuredVillas.length === 0 ? (
          <div className="border border-navy/10 bg-offwhite px-8 py-12 text-center">
            <p className="text-sm font-semibold text-navy">Aucune villa disponible pour le moment.</p>
            <p className="mt-2 text-xs text-navy/50">
              {featuredError ? `Statut: ${featuredError}` : "Ajoutez des villas dans Supabase pour les afficher ici."}
            </p>
            {process.env.NODE_ENV === "development" && (
              <p className="mt-3 text-[10px] uppercase tracking-widest text-navy/40">
                Supabase: {featuredCount} ligne(s) reçue(s)
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 md:gap-6">
            {featuredVillas.slice(0, 3).map((villa, index) => (
              <ScrollReveal key={villa.id} delay={index * 100}>
                <Link
                  href={`/villas/${villa.id}`}
                  aria-label={`Voir ${villa.name}`}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-navy/5">
                    <Image
                      src={villa.image || "/villa-hero.jpg"}
                      alt={villa.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-5 space-y-2 px-0 text-left">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy md:text-[10px]">
                      {villa.name}
                    </h3>
                    <p className="text-sm font-normal leading-snug text-navy/50">{villa.loc}</p>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
