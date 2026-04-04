import type { ReactNode } from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";

type Props = {
  headingId: string;
  /** Libellé accessible du titre (ex. mention programme propriétaires) */
  titleLabel: string;
  children?: ReactNode;
};

/**
 * Hero vidéo : mot « DIAMANT NOIR » + baseline *Confiance · Réactivité · Excellence*
 * (aligné accueil / landing propriétaires). Optionnel : CTAs ou autre sous la baseline.
 */
export function HeroWordmarkBaseline({ headingId, titleLabel, children }: Props) {
  return (
    <div className="flex w-full flex-col items-center gap-8 md:gap-10">
      <h1
        id={headingId}
        className="m-0 flex max-w-[min(100%,40rem)] animate-in fade-in flex-col items-center justify-center duration-700"
        aria-label={titleLabel}
      >
        <BrandLogo
          variant="onDark"
          size="hero"
          showIcon={false}
          showWordmark
          linkToHome={false}
          priority
          className="max-w-full justify-center [&_span.font-display]:text-[clamp(1.25rem,3.6vw+0.35rem,2.85rem)] [&_span.font-display]:font-normal [&_span.font-display]:leading-[1.06] [&_span.font-display]:tracking-[0.26em] sm:[&_span.font-display]:tracking-[0.32em] md:[&_span.font-display]:tracking-[0.38em]"
        />
      </h1>
      <p
        className="animate-in fade-in slide-in-from-bottom-2 m-0 max-w-2xl duration-1000 delay-150"
        aria-hidden={false}
      >
        <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-b border-white/[0.12] pb-6 text-[9px] font-medium uppercase tracking-[0.42em] text-white/[0.72] sm:gap-x-5 sm:text-[10px] sm:tracking-[0.46em] md:gap-x-7 md:text-[11px]">
          <span className="text-white/[0.88]">Confiance</span>
          <span className="select-none font-light text-white/25" aria-hidden>
            ·
          </span>
          <span className="text-white/[0.88]">Réactivité</span>
          <span className="select-none font-light text-white/25" aria-hidden>
            ·
          </span>
          <span className="text-white/[0.88]">Excellence</span>
        </span>
      </p>
      {children}
    </div>
  );
}
