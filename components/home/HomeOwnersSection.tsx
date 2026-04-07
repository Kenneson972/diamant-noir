import Image from "next/image";
import Link from "next/link";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * Section propriétaires — toujours visible sur la home.
 * Ancre `#offre-proprietaire` pour le scroll depuis HeroAudienceCards.
 */
export function HomeOwnersSection() {
  return (
    <>
      {/* ── Valeur proprio — fond sombre ── */}
      <section
        id="offre-proprietaire"
        tabIndex={-1}
        className="relative scroll-mt-20 overflow-hidden bg-navy py-32 text-white lg:py-44"
      >
        <div className="absolute left-0 top-0 h-full w-2/5 opacity-15">
          <Image src="/villa-hero.jpg" alt="" fill className="object-cover" aria-hidden />
        </div>
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="ml-auto max-w-xl space-y-12">
            <div className="space-y-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/45">
                Pour les propriétaires
              </span>
              <h2 className="font-display text-5xl md:text-7xl">Sérénité &amp;<br />performance.</h2>
              <p className="text-lg font-light leading-relaxed text-white/60">
                Nous structurons l&apos;exploitation locative de votre bien : calendrier, ménage, relation voyageurs
                et reporting — pour que vous gardiez la visibilité sans la charge opérationnelle.
              </p>
            </div>

            <div className="grid gap-12 sm:grid-cols-2">
              <ScrollReveal delay={0}>
                <div className="space-y-4">
                  <KeyRound className="text-white opacity-40" size={24} strokeWidth={1} aria-hidden />
                  <h3 className="font-bold">Clé en main</h3>
                  <p className="text-sm text-white/40">
                    Mise en ligne, shooting, tarification et optimisation continue selon la saisonnalité.
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <div className="space-y-4">
                  <ShieldCheck className="text-white opacity-40" size={24} strokeWidth={1} aria-hidden />
                  <h3 className="font-bold">Transparence</h3>
                  <p className="text-sm text-white/40">
                    Suivi des revenus et des interventions — une équipe locale réactive.
                  </p>
                </div>
              </ScrollReveal>
            </div>

            <p className="pt-2">
              <Link
                href="/prestations"
                className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55 underline-offset-8 transition-colors hover:text-white hover:underline"
              >
                Découvrir notre conciergerie
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Par où commencer — fond blanc ── */}
      <section className="bg-white py-14 px-6 md:py-20">
        <div className="mx-auto max-w-6xl space-y-8 md:space-y-12">
          <div className="flex items-center justify-between border-b border-navy/8 pb-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-navy/40">
              Propriétaires
            </span>
            <Link
              href="/prestations"
              className="group flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/60 transition-colors hover:text-navy"
            >
              En savoir plus
              <ArrowRight size={12} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
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
                  Parcourir le catalogue pour voir le niveau d&apos;exigence affiché aux voyageurs.
                </li>
              </ul>
            </div>
            <div className="flex flex-col justify-center gap-4 border-t border-navy/10 pt-8 md:border-t-0 md:border-l md:pl-12 md:pt-0">
              <Link
                href="/prestations"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 border border-navy bg-navy px-6 py-3 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              >
                Notre conciergerie
                <ArrowRight className="h-4 w-4" strokeWidth={1.25} aria-hidden />
              </Link>
              <Link
                href="/soumettre-ma-villa"
                className="inline-flex min-h-[48px] items-center justify-center border border-navy/25 bg-white px-6 py-3 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              >
                Soumettre ma villa
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
