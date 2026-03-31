import type { ReactNode } from "react";

/** Conteneur page marketing — fond global offwhite */
export function LandingShell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-offwhite">{children}</main>;
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
  const textAlign =
    align === "center"
      ? "text-center mx-auto max-w-4xl"
      : "text-center md:text-left md:mx-0 max-w-4xl md:max-w-3xl";
  return (
    <section className={`relative page-px ${bg} py-16 md:py-24 lg:min-h-[42vh] lg:flex lg:items-end lg:pb-20`}>
      <div className={`mx-auto w-full ${textAlign}`}>
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.45em] text-gold">{eyebrow}</p>
        <h1 className="font-display text-3xl text-balance text-white sm:text-4xl md:text-5xl lg:text-6xl">{title}</h1>
        {subtitle ? (
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 md:mx-0 md:mt-6">{subtitle}</p>
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
    <section className={`relative page-px ${bg} section-y-compact`}>
      <div className="mx-auto max-w-3xl text-center md:text-left">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-gold">{eyebrow}</p>
        <h1 className="font-display text-[1.8rem] text-white sm:text-4xl md:text-4xl lg:text-5xl">{title}</h1>
        {subtitle ? <p className="mx-auto mt-4 max-w-2xl text-white/65 md:mx-0">{subtitle}</p> : null}
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
    <section id={id} className={`${map[bg]} page-px section-y ${className}`}>
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
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-navy/45">{eyebrow}</p>
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
    <div className="border border-navy/10 bg-navy/[0.03] px-5 py-9 sm:px-8 sm:py-12 md:px-12 md:py-16">
      <h2 className="mb-6 text-center font-display text-2xl text-navy md:text-3xl">{title}</h2>
      <div className="flex flex-col items-center justify-center gap-6">{children}</div>
    </div>
  );
}
