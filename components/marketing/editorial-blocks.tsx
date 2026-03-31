import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Hero plein impact — image + dégradé, titre display en capitales (réf. style magazine / LC) */
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
    <section className="relative min-h-[72vh] w-full overflow-hidden bg-black md:min-h-[88vh]">
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
      <div className="relative z-10 flex min-h-[72vh] flex-col justify-end px-6 pb-14 pt-24 md:min-h-[88vh] md:px-10 md:pb-24 md:pt-28 lg:px-16 lg:pb-28">
        <div className="mx-auto w-full max-w-6xl">
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.34em] text-gold md:text-[11px]">{eyebrow}</p>
          <h1 className="max-w-5xl font-display text-[clamp(2.25rem,6vw,4.75rem)] font-normal uppercase leading-[1.05] tracking-[0.08em] text-white">
            {title}
          </h1>
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
    <section className="bg-white px-6 py-20 md:py-28 lg:py-36">
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
    <section className="bg-offwhite px-6 py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-navy/40">{eyebrow}</p>
        <h2 className="mt-4 font-display text-3xl text-navy md:text-4xl lg:text-[2.75rem]">{title}</h2>
        {subtitle ? (
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-navy/65 md:text-[17px]">{subtitle}</p>
        ) : null}
        <span className="mt-8 block h-px w-12 bg-gold" aria-hidden />
        <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-start border-t border-navy/10 pt-8">
              <Icon className="h-7 w-7 text-gold" strokeWidth={1} aria-hidden />
              <span className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-navy leading-snug">
                {label}
              </span>
            </div>
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
}: {
  title: string;
  eyebrow: string;
  body: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right";
}) {
  const imgBlock = (
    <div className="relative min-h-[260px] w-full overflow-hidden bg-navy/5 md:min-h-[460px]">
      <Image
        src={imageSrc}
        alt={imageAlt || title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
  const textBlock = (
    <div className="flex flex-col justify-center px-6 py-12 md:px-12 lg:px-16 lg:py-16">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-navy/40">{eyebrow}</p>
      <h2 className="mt-4 font-display text-2xl text-navy md:text-3xl lg:text-4xl">{title}</h2>
      <span className="mt-6 block h-px w-12 bg-gold" aria-hidden />
      <div className="mt-8 space-y-5 text-base leading-relaxed text-navy/75 md:text-[17px]">{body}</div>
    </div>
  );
  return (
    <section className="bg-white py-0">
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
    <section className="bg-navy px-6 py-20 text-white md:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold/90">{eyebrow}</p>
        <h2 className="mt-4 max-w-3xl font-display text-3xl leading-tight md:text-4xl">{title}</h2>
        <span className="mt-8 block h-px w-12 bg-gold" aria-hidden />
        <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
          {quotes.map((q) => (
            <blockquote key={q.author} className="flex flex-col border-t border-white/15 pt-8">
              <p className="flex-1 text-sm font-light leading-relaxed text-white/85 md:text-[15px]">
                &ldquo;{q.quote}&rdquo;
              </p>
              <footer className="mt-8">
                <cite className="not-italic font-display text-base text-white">{q.author}</cite>
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/45">{q.place}</p>
              </footer>
            </blockquote>
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
}: {
  label: string;
  figure: string;
  caption: string;
}) {
  return (
    <section className="border-y border-navy/10 bg-offwhite px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl text-center md:text-left">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-navy/40">{label}</p>
        <p className="mt-4 font-display text-5xl text-navy md:text-7xl lg:text-8xl">{figure}</p>
        <p className="mt-4 max-w-xl text-sm uppercase tracking-[0.18em] text-navy/55 md:mx-0">{caption}</p>
      </div>
    </section>
  );
}
