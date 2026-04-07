import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";

/** Hero plein impact — aligné accueil : min-h index, colonne max-w-4xl, px-5 sm:px-6, ligne or */
export function EditorialHeroImmersive({
  eyebrow,
  title,
  subtitle,
  imageSrc = "/villa-hero.jpg",
  imageAlt = "",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageSrc?: string;
  imageAlt?: string;
}) {
  return (
    <section className="relative flex min-h-[220px] w-full flex-col justify-end overflow-hidden bg-black xs:min-h-[260px] md:min-h-[min(68vh,680px)]">
      <Image
        src={imageSrc}
        alt={imageAlt || "Ambiance villa de luxe"}
        fill
        priority
        fetchPriority="high"
        className="object-cover opacity-[0.42]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" aria-hidden />
      <div className="relative z-10 w-full px-5 pb-12 pt-24 sm:px-6 md:pb-20 md:pt-24">
        <div className="mx-auto w-full max-w-4xl">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.45em] text-gold md:text-[11px]">{eyebrow}</p>
          <h1 className="font-display text-[clamp(2.25rem,6vw,4.75rem)] font-normal uppercase leading-[1.05] tracking-[0.08em] text-white">
            {title}
          </h1>
          <span className="mt-6 block h-px w-10 bg-gold/90 md:mt-8" aria-hidden />
          <p className="mt-8 max-w-2xl text-base font-light leading-relaxed text-white/85 md:text-lg md:leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}

/** Bloc éditorial centré — gros intertitre + textes (section « La conciergerie autrement ») */
export function EditorialIntro({
  title,
  children,
  align = "center",
}: {
  title: string;
  children: ReactNode;
  align?: "center" | "left";
}) {
  const head = align === "center" ? "text-center" : "text-left";
  const line = align === "center" ? "mx-auto" : "";
  const body = align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-3xl";
  return (
    <section className="bg-white px-5 py-20 sm:px-6 md:py-28 lg:py-36">
      <div className={`mx-auto max-w-5xl ${head}`}>
        <h2 className="font-display text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] text-navy">{title}</h2>
        <span className={`mt-6 block h-px w-14 bg-gold ${line}`} aria-hidden />
        <div
          className={`mt-12 space-y-8 text-base leading-[1.85] text-navy/78 md:text-[17px] md:leading-[1.9] ${body}`}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

/** Grille de services type « best-sellers » — icône + label court */
export function EditorialServiceGrid({
  eyebrow,
  title,
  subtitle,
  items,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  items: { icon: LucideIcon; label: string }[];
}) {
  return (
    <section className="bg-offwhite px-5 py-20 sm:px-6 md:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-navy/55">{eyebrow}</p>
        <h2 className="mt-4 font-display text-3xl text-navy md:text-4xl lg:text-[2.75rem]">{title}</h2>
        {subtitle ? (
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-navy/65 md:text-[17px]">{subtitle}</p>
        ) : null}
        <span className="mt-8 block h-px w-12 bg-gold" aria-hidden />
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-3 lg:gap-x-12">
          {items.map(({ icon: Icon, label }, index) => (
            <ScrollReveal key={label} delay={index * 80}>
            <div className="flex flex-col items-start border-t border-navy/10 pt-8">
              <Icon className="h-7 w-7 text-gold" strokeWidth={1} aria-hidden />
              <span className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-navy leading-snug">
                {label}
              </span>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Split image / texte — « présence locale » */
export function EditorialImageSplit({
  title,
  eyebrow,
  body,
  imageSrc = "/villa-hero.jpg",
  imageAlt = "",
  imagePosition = "left",
  imageClassName = "",
  imageWrapperClassName = "",
  sectionClassName = "bg-white",
  textColClassName = "",
}: {
  title: string;
  eyebrow?: string;
  body: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right";
  /** Variante de cadrage sur la même image (ex. object-[center_30%]) */
  imageClassName?: string;
  /** Classes sur le bloc image (hauteur min, ratio) */
  imageWrapperClassName?: string;
  /** Remplace le fond `bg-white` par ex. `bg-offwhite` */
  sectionClassName?: string;
  /** Largeur / alignement colonne texte (ex. lg:max-w-xl lg:mr-auto) */
  textColClassName?: string;
}) {
  const imgBlock = (
    <div
      className={`relative min-h-[260px] w-full overflow-hidden bg-navy/[0.06] md:min-h-[min(72vh,580px)] ${imageWrapperClassName}`.trim()}
    >
      <Image
        src={imageSrc}
        alt={imageAlt || title}
        fill
        className={`object-cover ${imageClassName}`.trim()}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
  const textBlock = (
    <div
      className={`flex flex-col justify-center px-5 py-14 sm:px-6 md:px-10 md:py-16 lg:px-12 lg:py-20 ${textColClassName}`.trim()}
    >
      {eyebrow ? (
        <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-navy/55">{eyebrow}</p>
      ) : null}
      <h2
        className={`max-w-prose font-display text-2xl leading-snug text-navy md:text-3xl lg:text-[2.25rem] ${eyebrow ? "mt-4" : ""}`}
      >
        {title}
      </h2>
      <span className="mt-6 block h-px w-12 bg-gold" aria-hidden />
      <div className="mt-8 space-y-6 text-base leading-relaxed text-navy/75 md:text-[17px]">{body}</div>
    </div>
  );
  return (
    <section className={`py-0 ${sectionClassName}`.trim()}>
      <div className="mx-auto grid max-w-7xl md:grid-cols-2 md:items-stretch">
        {imagePosition === "left" ? (
          <>
            {imgBlock}
            {textBlock}
          </>
        ) : (
          <>
            {textBlock}
            {imgBlock}
          </>
        )}
      </div>
    </section>
  );
}

export type EditorialQuote = {
  quote: string;
  author: string;
  place: string;
};

/** Bandeau témoignages — style magazine */
export function EditorialQuotes({
  eyebrow,
  title,
  quotes,
}: {
  eyebrow: string;
  title: string;
  quotes: EditorialQuote[];
}) {
  return (
    <section className="bg-navy px-5 py-20 text-white sm:px-6 md:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-gold/90">{eyebrow}</p>
        <h2 className="mt-4 max-w-3xl font-display text-3xl leading-tight md:text-4xl">{title}</h2>
        <span className="mt-8 block h-px w-12 bg-gold" aria-hidden />
        <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
          {quotes.map((q, index) => (
            <ScrollReveal key={q.author} delay={index * 120}>
            <blockquote className="flex flex-col border-t border-white/15 pt-8">
              <p className="flex-1 text-sm font-light leading-relaxed text-white/85 md:text-[15px]">
                &ldquo;{q.quote}&rdquo;
              </p>
              <footer className="mt-8">
                <cite className="not-italic font-display text-base text-white">{q.author}</cite>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45">{q.place}</p>
              </footer>
            </blockquote>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Bande chiffre clé — pleine largeur, très éditorial */
export function EditorialFigureBand({
  label,
  figure,
  caption,
  /** Si défini, `caption` reste la ligne visible ; le texte long est dans un `<details>`. */
  detailsCaption,
  detailsSummaryLabel = "En savoir plus",
}: {
  label: string;
  figure: string;
  caption: string;
  detailsCaption?: string;
  detailsSummaryLabel?: string;
}) {
  return (
    <section className="border-y border-navy/10 bg-offwhite px-5 py-16 sm:px-6 md:py-20">
      <div className="mx-auto max-w-6xl text-center md:text-left">
        <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-navy/55">{label}</p>
        <p className="mt-4 font-display text-6xl text-navy md:text-7xl lg:text-8xl">{figure}</p>
        <p className="mt-4 max-w-xl text-sm uppercase tracking-[0.18em] text-navy/55 md:mx-0">{caption}</p>
        {detailsCaption ? (
          <details className="mt-5 max-w-xl text-left">
            <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.28em] text-navy/50 outline-none transition-colors hover:text-navy [&::-webkit-details-marker]:hidden">
              {detailsSummaryLabel}
            </summary>
            <p className="mt-4 text-sm normal-case leading-relaxed tracking-normal text-navy/65 md:text-[15px]">
              {detailsCaption}
            </p>
          </details>
        ) : null}
      </div>
    </section>
  );
}
