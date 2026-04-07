import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ProprietairesTransitionLink } from "@/components/home/ProprietairesTransitionLink";

export function HomeBottomCta() {
  return (
    <section className="py-32 text-center bg-offwhite px-6">
      <ScrollReveal delay={0}>
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="space-y-8">
            <h2 className="font-display text-4xl text-navy md:text-6xl">Prêt pour l&apos;exception ?</h2>
            <p className="leading-relaxed text-navy/60">
              Rejoignez le cercle Diamant Noir — séjournez dans nos villas d&apos;exception ou confiez-nous votre bien pour en maximiser le potentiel.
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
