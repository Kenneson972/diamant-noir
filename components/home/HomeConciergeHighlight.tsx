import Link from "next/link";
import { Car, UtensilsCrossed, Anchor, ShoppingBag, Sparkles, Calendar, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

const SERVICES = [
  { icon: Car, label: "Transferts & accueil" },
  { icon: UtensilsCrossed, label: "Chef & art de la table" },
  { icon: Anchor, label: "Nautisme & escapades" },
  { icon: ShoppingBag, label: "Courses & bienvenue" },
  { icon: Sparkles, label: "Entretien & linge" },
  { icon: Calendar, label: "Pilotage des séjours" },
] as const;

export function HomeConciergeHighlight() {
  return (
    <section className="border-b border-black/[0.07] bg-offwhite py-20 px-6 md:py-28">
      <div className="mx-auto max-w-5xl space-y-14">
        <ScrollReveal delay={0}>
          <div className="space-y-5 max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/40">
              Nos services
            </span>
            <h2 className="font-display text-4xl font-normal text-navy md:text-5xl">
              La conciergerie autrement.
            </h2>
            <p className="text-[15px] leading-relaxed text-navy/60">
              Bien plus que des gestionnaires — des passionnés ancrés en Martinique qui orchestrent
              chaque séjour avec exigence, de l&apos;annonce au départ du voyageur.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:gap-8">
          {SERVICES.map(({ icon: Icon, label }, i) => (
            <ScrollReveal key={label} delay={i * 60}>
              <div className="flex items-start gap-4">
                <Icon
                  size={20}
                  strokeWidth={1.25}
                  className="mt-0.5 shrink-0 text-navy/30"
                  aria-hidden
                />
                <span className="text-[13px] leading-snug text-navy/70">{label}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={120}>
          <Link
            href="/prestations"
            className="group inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/55 underline-offset-8 transition-colors hover:text-navy hover:underline"
          >
            Découvrir la conciergerie complète
            <ArrowRight
              size={12}
              strokeWidth={1.5}
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
