"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ProprietairesTransitionLink } from "@/components/home/ProprietairesTransitionLink";
import { useHomeAudience } from "@/contexts/HomeAudienceContext";

export function HomeBottomCta() {
  const { audience } = useHomeAudience();

  if (audience === "voyageur") {
    return (
      <section className="py-32 text-center bg-offwhite px-6 cv-auto">
        <ScrollReveal delay={0}>
          <div className="mx-auto max-w-3xl space-y-10">
            <div className="space-y-8">
              <h2 className="font-display text-4xl text-navy md:text-6xl">Prêt pour l&apos;exception ?</h2>
              <p className="leading-relaxed text-navy/60">
                Rejoignez le cercle Diamant Noir et vivez des moments hors du temps dans les plus belles résidences de la
                côte.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <Link href="/villas" className="btn-luxury bg-black text-white">
                  Réserver votre villa
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    );
  }

  if (audience === "proprietaire") {
    return (
      <section className="py-32 text-center bg-offwhite px-6 cv-auto">
        <ScrollReveal delay={0}>
          <div className="mx-auto max-w-3xl space-y-10">
            <div className="space-y-8">
              <h2 className="font-display text-4xl text-navy md:text-6xl">Confiez-nous votre villa</h2>
              <p className="leading-relaxed text-navy/60">
                Conciergerie haut de gamme, gestion des réservations et entretien : faites fructifier votre bien avec une
                équipe dédiée.
              </p>
              <div className="flex flex-col items-center gap-4 pt-2 sm:flex-row sm:justify-center">
                <ProprietairesTransitionLink className="btn-luxury inline-flex min-h-11 items-center justify-center bg-black px-8 text-white">
                  Confier ma villa
                </ProprietairesTransitionLink>
                <Link
                  href="/villas"
                  className="inline-flex min-h-11 items-center justify-center border border-navy/25 px-6 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/[0.04]"
                >
                  Catalogue locations
                </Link>
              </div>
            </div>
            <p className="border-t border-black/10 pt-10 text-sm text-navy/50">
              Déjà client ?{" "}
              <Link
                href="/login?redirect=/dashboard/proprio"
                className="font-medium text-navy underline-offset-4 hover:underline"
              >
                Connexion espace propriétaire
              </Link>
            </p>
          </div>
        </ScrollReveal>
      </section>
    );
  }

  return (
    <section className="py-32 text-center bg-offwhite px-6 cv-auto">
      <ScrollReveal delay={0}>
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="space-y-8">
            <h2 className="font-display text-4xl text-navy md:text-6xl">Prêt pour l&apos;exception ?</h2>
            <p className="leading-relaxed text-navy/60">
              Rejoignez le cercle Diamant Noir et vivez des moments hors du temps dans les plus belles résidences de la
              côte.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link href="/villas" className="btn-luxury bg-black text-white">
                Réserver votre villa
              </Link>
              <ProprietairesTransitionLink className="inline-flex min-h-11 items-center justify-center border border-navy/25 px-6 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30">
                Confier ma villa
              </ProprietairesTransitionLink>
            </div>
          </div>
          <p className="border-t border-black/10 pt-10 text-sm text-navy/50">
            Propriétaire déjà accompagné ?{" "}
            <Link href="/login?redirect=/dashboard/proprio" className="font-medium text-navy underline-offset-4 hover:underline">
              Connexion espace propriétaire
            </Link>
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}
