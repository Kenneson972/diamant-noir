import type { ReactNode } from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";

type Props = {
  headingId: string;
  /** Libellé accessible du titre (ex. mention programme propriétaires) */
  titleLabel: string;
  /** Les trois mots micro *Confiance · Réactivité · Excellence* (masqués sur l’accueil : `false`) */
  showValuesTriplet?: boolean;
  /** `light` = hero blanc (accueil minimal) ; `dark` = fond sombre (propriétaires, etc.) */
  tone?: "light" | "dark";
  children?: ReactNode;
};

/**
 * Hero : « KAYVILA » + *Conciergerie privée* + optionnellement les trois mots *Confiance · Réactivité · Excellence* (micro-typo). `tone="light"` pour fond blanc minimal.
 * Optionnel : CTAs via `children`.
 */
export function HeroWordmarkBaseline({
  headingId,
  titleLabel,
  showValuesTriplet = true,
  tone = "dark",
  children,
}: Props) {
  const light = tone === "light";
  const logoVariant = light ? "onLight" : "onDark";
  const subtitleClass = light
    ? "font-display font-normal uppercase leading-[1.06] tracking-[0.26em] text-navy/70 sm:tracking-[0.32em] md:tracking-[0.38em] text-[clamp(0.62rem,1.35vw+0.28rem,1.05rem)] sm:text-[clamp(0.68rem,1.45vw+0.3rem,1.12rem)]"
    : "font-display font-normal uppercase leading-[1.06] tracking-[0.26em] text-white/[0.88] sm:tracking-[0.32em] md:tracking-[0.38em] text-[clamp(0.62rem,1.35vw+0.28rem,1.05rem)] sm:text-[clamp(0.68rem,1.45vw+0.3rem,1.12rem)]";
  const tripletWrap = light
    ? "flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 border-b border-navy/[0.08] pb-5 text-[7px] font-medium uppercase tracking-[0.38em] text-navy/45 sm:gap-x-3.5 sm:text-[8px] sm:tracking-[0.42em] md:gap-x-5 md:tracking-[0.46em]"
    : "flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 border-b border-white/[0.08] pb-5 text-[7px] font-medium uppercase tracking-[0.38em] text-white/[0.42] sm:gap-x-3.5 sm:text-[8px] sm:tracking-[0.42em] md:gap-x-5 md:tracking-[0.46em]";
  const tripletWord = light ? "text-navy/60" : "text-white/[0.55]";
  const tripletSep = light ? "select-none font-extralight text-navy/25" : "select-none font-extralight text-white/20";

  return (
    <div className="flex w-full flex-col items-center gap-5 md:gap-6">
      <h1
        id={headingId}
        className="m-0 flex max-w-[min(100%,40rem)] animate-in fade-in flex-col items-center justify-center duration-700"
        aria-label={titleLabel}
      >
        <BrandLogo
          variant={logoVariant}
          size="hero"
          showIcon={false}
          showWordmark
          linkToHome={false}
          priority
          className="max-w-full justify-center [&_span.font-display]:text-[clamp(1.75rem,5vw+0.5rem,4rem)] [&_span.font-display]:font-normal [&_span.font-display]:leading-[1.06] [&_span.font-display]:tracking-[0.26em] sm:[&_span.font-display]:tracking-[0.32em] md:[&_span.font-display]:tracking-[0.38em]"
        />
      </h1>

      {/* Même « voix » typographique que le wordmark KAYVILA : font-display, leading 1.06, tracking identique — taille plus basse */}
      <p
        className="animate-in fade-in slide-in-from-bottom-1 m-0 duration-700 delay-75 motion-reduce:delay-0"
        aria-hidden={false}
      >
        <span className={subtitleClass}>Conciergerie privée</span>
      </p>

      {showValuesTriplet ? (
        <p
          className="animate-in fade-in slide-in-from-bottom-2 m-0 max-w-2xl duration-1000 delay-150 motion-reduce:delay-0"
          aria-hidden={false}
        >
          <span className={tripletWrap}>
            <span className={tripletWord}>Confiance</span>
            <span className={tripletSep} aria-hidden>
              ·
            </span>
            <span className={tripletWord}>Réactivité</span>
            <span className={tripletSep} aria-hidden>
              ·
            </span>
            <span className={tripletWord}>Excellence</span>
          </span>
        </p>
      ) : null}
      {children}
    </div>
  );
}
