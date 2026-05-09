import Image from "next/image";
import Link from "next/link";

export function HomeOwnersSection() {
  return (
    <section
      id="offre-proprietaire"
      tabIndex={-1}
      className="scroll-mt-20 overflow-hidden bg-offwhite"
    >
      <div className="flex min-h-[480px] flex-col lg:flex-row lg:min-h-[560px]">
        {/* Image gauche — saigne jusqu'au bord */}
        <div className="relative min-h-[320px] flex-1 lg:min-h-0 lg:order-2">
          <Image
            src="/notregestion.png"
            alt="Vue aérienne villa de luxe avec piscine à débordement — Votre villa notre gestion Kayvila"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 55vw"
            loading="lazy"
          />
        </div>

        {/* Texte droite */}
        <div className="flex flex-col justify-center px-8 py-16 lg:w-[42%] lg:px-16 lg:py-0 lg:order-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/35">
            Propriétaires
          </span>
          <h2 className="mt-5 font-display text-3xl font-light leading-[1.08] text-navy md:text-4xl">
            Votre villa,
            <br />
            notre gestion
          </h2>
          <div className="mt-5 h-px w-8 bg-gold/40" aria-hidden />
          <p className="mt-5 max-w-sm text-[13px] leading-relaxed text-navy/55">
            De la mise en ligne au reversement, nous prenons en charge chaque aspect de votre bien
            avec une équipe locale au Diamant. Vous recevez vos revenus, vos voyageurs sont comblés,
            vous ne gérez rien.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/prestations"
              className="inline-flex min-h-[48px] items-center border border-navy bg-navy px-7 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              Découvrir nos services
            </Link>
            <Link
              href="/soumettre-ma-villa"
              className="inline-flex min-h-[48px] items-center border border-navy/25 px-7 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              Soumettre ma villa
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
