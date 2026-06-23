import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { KayvilaPngIcon, type KayvilaPngName } from "@/components/icons/KayvilaPngIcon";
import { ScrollReveal } from "@/components/ScrollReveal";

const SERVICES: { icon: KayvilaPngName; label: string }[] = [
  { icon: "car", label: "Transferts & accueil" },
  { icon: "chef", label: "Chef & art de la table" },
  { icon: "anchor", label: "Nautisme & escapades" },
  { icon: "shopping-bag", label: "Courses & bienvenue" },
  { icon: "sparkle", label: "Entretien & linge" },
  { icon: "calendar", label: "Pilotage des séjours" },
];

export function HomeConciergeHighlight() {
  return (
    <section className="border-b border-black/[0.07] bg-white py-20 px-6 md:py-28">
      <div className="mx-auto max-w-5xl space-y-14">
        <ScrollReveal delay={0}>
          <div className="space-y-5 max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/45">
              Nos services
            </span>
            <h2 className="font-display text-4xl font-normal text-navy md:text-5xl">
              La conciergerie autrement.
            </h2>
            <p className="text-[15px] leading-relaxed text-navy/80">
              Bien plus que des gestionnaires — des passionnés ancrés en Martinique qui orchestrent
              chaque séjour avec exigence, de l&apos;annonce au départ du voyageur.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:gap-8">
          {SERVICES.map(({ icon, label }, i) => (
            <ScrollReveal key={label} delay={i * 60}>
              <div className="flex items-start gap-4">
                <KayvilaPngIcon
                  name={icon}
                  size={28}
                  alt=""
                  className="mt-0.5 shrink-0 opacity-70"
                />
                <span className="text-[13px] leading-snug text-navy/70">{label}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={120}>
          <Link
            href="/prestations"
            className="group inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/80 underline-offset-8 transition-colors hover:text-navy hover:underline"
          >
            DÉCOUVRIR LA CONCIERGERIE COMPLÈTE
            <ArrowRight
              size={14}
              strokeWidth={1.5}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
