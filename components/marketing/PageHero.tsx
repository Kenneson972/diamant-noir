import type { ReactNode } from "react";

type PageHeroProps = {
  /** Texte court en or en haut */
  eyebrow: string;
  /** Titre principal (H1) */
  title: string;
  /** Sous-titre optionnel */
  subtitle?: string;
  /** Éléments additionnels sous le sous-titre (CTA, etc.) */
  children?: ReactNode;
  /** Image de fond optionnelle (par défaut: fond navy sans image) */
  imageSrc?: string;
  /** Opacité de l'image de fond (défaut 0.42) */
  imageOpacity?: number;
  /** Gradient overlay personnalisé */
  overlayGradient?: string;
};

/**
 * Hero de page standard — aligné visuellement sur la homepage.
 * Fond navy + image de fond optionnelle + titre Sora + ligne or + sous-titre.
 * Les éléments apparaissent séquentiellement avec blur-fade-in.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
  imageSrc,
  imageOpacity = 0.42,
  overlayGradient,
}: PageHeroProps) {
  return (
    <section
      className="relative flex min-h-[42dvh] w-full flex-col justify-center overflow-hidden bg-navy pt-24 md:min-h-[50dvh] md:py-16 md:pt-24 lg:min-h-[min(55vh,520px)]"
      aria-labelledby="page-hero-title"
    >
      {/* Image de fond */}
      {imageSrc && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: imageOpacity }}
          />
        </>
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            overlayGradient ??
            (imageSrc
              ? "linear-gradient(to bottom, rgba(10,10,10,0.14) 0%, rgba(10,10,10,0.08) 50%, rgba(10,10,10,0.48) 100%)"
              : "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 70%)"),
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-5 text-center sm:px-6">
        {/* Eyebrow */}
        {eyebrow && (
          <p
            className="blur-fade-in mb-5 text-[10px] font-bold uppercase tracking-[0.4em] text-gold/80"
            style={{ animationDelay: "0ms" }}
          >
            {eyebrow}
          </p>
        )}

        {/* Titre */}
        <h1
          id="page-hero-title"
          className="blur-fade-in font-display text-balance text-[clamp(1.75rem,4.5vw,3.75rem)] font-normal uppercase leading-[1.06] tracking-[0.06em] text-white"
          style={{ animationDelay: "100ms" }}
        >
          {title}
        </h1>

        {/* Ligne or */}
        <span
          className="blur-fade-in mt-6 block h-px w-12 bg-gold/80 md:mt-8"
          style={{ animationDelay: "200ms" }}
          aria-hidden
        />

        {/* Sous-titre */}
        {subtitle && (
          <p
            className="blur-fade-in mt-6 max-w-2xl text-[15px] font-light leading-relaxed text-white/75 md:mt-8 md:text-base"
            style={{ animationDelay: "300ms" }}
          >
            {subtitle}
          </p>
        )}

        {/* Éléments additionnels */}
        {children && (
          <div
            className="blur-fade-in mt-10 w-full"
            style={{ animationDelay: "400ms" }}
          >
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
