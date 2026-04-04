"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, ShieldCheck, KeyRound } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useHomeAudience } from "@/contexts/HomeAudienceContext";

export function HomeLifestyleAudience() {
  const { audience } = useHomeAudience();

  if (audience === "proprietaire") {
    return (
      <section className="relative overflow-hidden bg-black py-32 text-white lg:py-48 cv-auto">
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-20">
          <Image src="/villa-hero.jpg" alt="" fill className="object-cover" aria-hidden />
        </div>
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-xl space-y-12">
            <div className="space-y-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/50">
                Pour les propriétaires
              </span>
              <h2 className="font-display text-5xl md:text-7xl">Sérénité &amp; performance.</h2>
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
                href="/proprietaires"
                className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55 underline-offset-8 transition-colors hover:text-white hover:underline"
              >
                Découvrir l&apos;offre propriétaires
              </Link>
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-black py-32 text-white lg:py-48 cv-auto">
      <div className="absolute right-0 top-0 h-full w-1/2 opacity-20">
        <Image src="/villa-hero.jpg" alt="Lifestyle" fill className="object-cover" />
      </div>
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-xl space-y-12">
          <div className="space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/50">Plus qu&apos;un séjour</span>
            <h2 className="font-display text-5xl md:text-7xl">Un Art de Vivre.</h2>
            <p className="text-lg font-light leading-relaxed text-white/60">
              Chaque propriété de notre collection est un sanctuaire pensé pour la déconnexion. Nos services de
              conciergerie privée s&apos;occupent de chaque détail pour que votre seule préoccupation soit
              l&apos;instant présent.
            </p>
          </div>

          <div className="grid gap-12 sm:grid-cols-2">
            <ScrollReveal delay={0}>
              <div className="space-y-4">
                <ShieldCheck className="text-white opacity-40" size={24} strokeWidth={1} />
                <h3 className="font-bold">Confidentialité Totale</h3>
                <p className="text-sm text-white/40">Accès privés et discrétion absolue pour votre sérénité.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <div className="space-y-4">
                <Calendar className="text-white opacity-40" size={24} strokeWidth={1} />
                <h3 className="font-bold">Services Sur-Mesure</h3>
                <p className="text-sm text-white/40">Chefs, chauffeurs et excursions privées à la demande.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
