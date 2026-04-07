import type { ReactNode } from "react";

/** Conteneur page marketing — fond global offwhite */
export function LandingShell({ children }: { children: ReactNode }) {
  return <main className="min-h-dvh bg-offwhite">{children}</main>;
}

type HeroVariant = "navy" | "black";

export function LandingHero({
  eyebrow,
  title,
  subtitle,
  variant = "navy",
  align = "split",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  variant?: HeroVariant;
  align?: "center" | "split";
}) {
  const bg = variant === "black" ? "bg-black" : "bg-navy";
  /** Aligné accueil / propriétaires : pt-24 sous navbar fixe, colonne max-w-4xl, px-5 sm:px-6 */
  const inner =
    align === "center"
      ? "mx-auto w-full max-w-4xl text-center"
      : "mx-auto w-full max-w-4xl text-center md:mx-0 md:max-w-3xl md:text-left";
  const goldRule = align === "center" ? "mx-auto" : "mx-auto md:mx-0";
  return (
    <section
      className={`relative flex min-h-[220px] w-full flex-col justify-center overflow-hidden ${bg} pt-24 pb-14 xs:min-h-[260px] xs:pb-16 md:min-h-[min(68vh,680px)] md:pb-20 md:pt-24`}
    >
      <div className={`${inner} px-5 sm:px-6`}>
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.45em] text-gold">{eyebrow}</p>
        <h1 className="font-display text-4xl text-balance text-white md:text-5xl lg:text-6xl">{title}</h1>
        <span className={`mt-6 block h-px w-10 bg-gold/90 md:mt-8 ${goldRule}`} aria-hidden />
        {subtitle ? (
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 md:mx-0 md:mt-8">
            {subtitle}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/** Hero plus bas — pages légales / secondaires */
export function LandingHeroCompact({
  eyebrow,
  title,
  subtitle,
  variant = "navy",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  variant?: HeroVariant;
}) {
  const bg = variant === "black" ? "bg-black" : "bg-navy";
  return (
    <section
      className={`relative flex min-h-[200px] w-full flex-col justify-center overflow-hidden ${bg} pt-24 pb-12 xs:min-h-[240px] md:min-h-[min(48vh,520px)] md:pb-16 md:pt-24`}
    >
      <div className="mx-auto w-full max-w-4xl px-5 text-center sm:px-6 md:text-left">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.45em] text-gold">{eyebrow}</p>
        <h1 className="font-display text-3xl text-white md:text-4xl lg:text-5xl">{title}</h1>
        <span className="mx-auto mt-6 block h-px w-10 bg-gold/90 md:mx-0 md:mt-7" aria-hidden />
        {subtitle ? (
          <p className="mx-auto mt-6 max-w-2xl text-white/65 md:mx-0 md:mt-8">{subtitle}</p>
        ) : null}
      </div>
    </section>
  );
}

type SectionBg = "white" | "offwhite" | "navy";

export function LandingSection({
  bg = "white",
  children,
  className = "",
  id,
  innerClassName = "max-w-6xl",
}: {
  bg?: SectionBg;
  children: ReactNode;
  className?: string;
  id?: string;
  /** largeur du conteneur interne */
  innerClassName?: string;
}) {
  const map: Record<SectionBg, string> = {
    white: "bg-white",
    offwhite: "bg-offwhite",
    navy: "bg-navy text-white",
  };
  return (
    <section id={id} className={`${map[bg]} px-5 py-16 sm:px-6 md:py-24 lg:py-28 ${className}`}>
      <div className={`mx-auto ${innerClassName}`}>{children}</div>
    </section>
  );
}

/** Section contenu étroit — texte éditorial / légal */
export function LandingSectionNarrow({
  bg = "white",
  children,
  className = "",
}: {
  bg?: SectionBg;
  children: ReactNode;
  className?: string;
}) {
  return (
    <LandingSection bg={bg} innerClassName="max-w-3xl" className={className}>
      {children}
    </LandingSection>
  );
}

/** Titre de section + ligne or (alignement gauche par défaut, luxe éditorial) */
export function LandingBlockTitle({
  eyebrow,
  title,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  align?: "left" | "center";
}) {
  const a = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`mb-10 md:mb-14 ${a}`}>
      {eyebrow ? (
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-navy/55">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-3xl text-navy md:text-4xl">{title}</h2>
      <span className={`mt-4 block h-px w-12 bg-gold ${align === "center" ? "mx-auto" : ""}`} aria-hidden />
    </div>
  );
}

/** Bandeau CTA pleine largeur */
export function LandingCtaBand({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-navy/10 bg-navy/[0.03] px-5 py-12 sm:px-6 md:px-10 md:py-16">
      <h2 className="mb-6 text-center font-display text-2xl text-navy md:text-3xl">{title}</h2>
      <div className="flex flex-col items-center justify-center gap-6">{children}</div>
    </div>
  );
}
