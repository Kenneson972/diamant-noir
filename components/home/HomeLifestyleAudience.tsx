import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";

export function HomeLifestyleAudience() {
  return (
    <section className="relative overflow-hidden bg-navy py-32 text-white lg:py-48">
      <div className="absolute right-0 top-0 h-full w-1/2 opacity-20" aria-hidden>
        <Image src="/villa-hero.jpg" alt="" fill className="object-cover" />
      </div>
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-xl space-y-12">
          <div className="space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/50">
              Plus qu&apos;un séjour
            </span>
            <h2 className="font-display text-5xl md:text-7xl">L&apos;art de recevoir</h2>
            <p className="text-lg font-light leading-relaxed text-white/60">
              Chaque propriété de notre collection est pensée pour la déconnexion. Notre conciergerie
              privée s&apos;occupe de chaque détail pour que votre seule préoccupation soit l&apos;instant présent.
            </p>
          </div>

          <div className="grid gap-12 sm:grid-cols-2">
            <ScrollReveal delay={0}>
              <div className="space-y-4">
                <KayvilaPngIcon name="shield-check" size={32} invert className="opacity-60" />
                <h3 className="font-bold">Confidentialité</h3>
                <p className="text-sm text-white/60">Accès privés et discrétion pour votre tranquillité.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <div className="space-y-4">
                <KayvilaPngIcon name="calendar" size={32} invert className="opacity-60" />
                <h3 className="font-bold">Services sur mesure</h3>
                <p className="text-sm text-white/60">Chefs, chauffeurs et excursions privées à la demande.</p>
              </div>
            </ScrollReveal>
          </div>

          <p className="pt-2">
            <Link
              href="/prestations"
              className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55 underline-offset-8 transition-colors hover:text-white hover:underline"
            >
              Découvrir nos services
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
