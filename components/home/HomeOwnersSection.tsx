import Image from "next/image";
import Link from "next/link";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * Section propriétaires — toujours visible sur la home.
 * Ancre `#offre-proprietaire` pour le scroll depuis HeroAudienceCards.
 * Fond clair ; cartes légères (bords fins, icônes navy, peu d’or).
 */
export function HomeOwnersSection() {
  return (
    <>
      <section
        id="offre-proprietaire"
        tabIndex={-1}
        className="relative scroll-mt-20 overflow-hidden border-y border-navy/[0.06] bg-white py-14 text-navy md:py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-navy/10 shadow-[0_12px_40px_rgba(0,0,0,0.06)] lg:col-span-5 lg:aspect-[4/5] lg:max-h-[min(560px,72vh)]">
              <Image
                src="/villa-hero.jpg"
                alt=""
                fill
                className="object-cover object-[center_35%]"
                sizes="(max-width: 1024px) 100vw, 38vw"
                loading="lazy"
              />
            </div>

            <div className="space-y-10 lg:col-span-7">
              <div className="space-y-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/45">
                  Pour les propriétaires
                </span>
                <h2 className="font-display text-4xl font-normal leading-[1.08] md:text-6xl lg:text-7xl">
                  Sérénité &amp;
                  <br />
                  performance.
                </h2>
                <p className="max-w-xl text-lg font-light leading-relaxed text-navy/65">
                  Nous structurons l&apos;exploitation locative de votre bien : calendrier, ménage,
                  relation voyageurs et reporting — pour que vous gardiez la visibilité sans la charge
                  opérationnelle.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <ScrollReveal delay={0}>
                  <div className="flex h-full flex-col rounded-xl border border-navy/[0.06] bg-offwhite/60 p-6 md:p-8">
                    <KeyRound className="mb-5 text-navy/25" size={18} strokeWidth={1.25} aria-hidden />
                    <h3 className="font-semibold text-navy">Clé en main</h3>
                    <p className="mt-1 text-sm leading-relaxed text-navy/50">
                      Mise en ligne, shooting, tarification et optimisation continue selon la
                      saisonnalité.
                    </p>
                  </div>
                </ScrollReveal>
                <ScrollReveal delay={120}>
                  <div className="flex h-full flex-col rounded-xl border border-navy/[0.06] bg-offwhite/60 p-6 md:p-8">
                    <ShieldCheck className="mb-5 text-navy/25" size={18} strokeWidth={1.25} aria-hidden />
                    <h3 className="font-semibold text-navy">Transparence</h3>
                    <p className="mt-1 text-sm leading-relaxed text-navy/50">
                      Suivi des revenus et des interventions — une équipe locale réactive.
                    </p>
                  </div>
                </ScrollReveal>
              </div>

              <p className="pt-2">
                <Link
                  href="/prestations"
                  className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/55 underline-offset-8 transition-colors hover:text-navy hover:underline"
                >
                  Découvrir notre conciergerie
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
