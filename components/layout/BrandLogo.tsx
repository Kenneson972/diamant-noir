import Image from "next/image";
import Link from "next/link";

export type BrandLogoVariant = "onDark" | "onLight";

type BrandLogoProps = {
  /** onDark = fond sombre (nav transparente, hero, login) — logo traité en clair */
  variant?: BrandLogoVariant;
  /** Pictogramme montagne / vagues (fichier brand) */
  showIcon?: boolean;
  showWordmark?: boolean;
  className?: string;
  linkToHome?: boolean;
  priority?: boolean;
  size?: "sm" | "md" | "lg" | "nav" | "auth" | "hero";
};

const sizeClasses: Record<
  NonNullable<BrandLogoProps["size"]>,
  { box: string; wordmark: string }
> = {
  sm: { box: "h-7 w-7 md:h-8 md:w-8", wordmark: "text-base tracking-[0.22em]" },
  md: { box: "h-9 w-9 md:h-10 md:w-10", wordmark: "text-xl tracking-[0.3em]" },
  lg: { box: "h-12 w-12 md:h-14 md:w-14", wordmark: "text-2xl tracking-[0.32em]" },
  /** Pictogramme header — lisible sans dominer la barre (icône seule, pas de wordmark) */
  nav: {
    box: "h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 lg:h-14 lg:w-14",
    wordmark: "text-2xl tracking-[0.32em]",
  },
  auth: { box: "h-16 w-16", wordmark: "text-2xl tracking-[0.32em]" },
  hero: {
    box: "h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-52 lg:w-52",
    wordmark: "text-2xl tracking-[0.32em]",
  },
};

export function BrandLogo({
  variant = "onLight",
  showIcon = true,
  showWordmark = true,
  className = "",
  linkToHome = true,
  priority = false,
  size = "md",
}: BrandLogoProps) {
  const s = sizeClasses[size];
  const onDark = variant === "onDark";
  const wordmarkColor = onDark ? "text-white" : "text-navy";

  const imageSizes =
    size === "auth"
      ? "64px"
      : size === "hero"
        ? "(max-width: 640px) 112px, (max-width: 1024px) 176px, 208px"
        : size === "nav"
          ? "(max-width: 640px) 40px, (max-width: 768px) 44px, (max-width: 1024px) 48px, 56px"
          : "(max-width: 768px) 36px, 40px";

  const inner = (
    <>
      {showIcon ? (
        <span className={`relative block shrink-0 ${s.box}`}>
          <Image
            src="/brand/diamant-noir-logo.png"
            alt={showWordmark ? "" : "Diamant Noir"}
            fill
            className={`object-contain object-center ${onDark ? "brightness-0 invert" : ""}`}
            sizes={imageSizes}
            priority={priority}
          />
        </span>
      ) : null}
      {showWordmark ? (
        <span
          className={`font-display ${s.wordmark} transition-colors duration-300 ${wordmarkColor}`}
        >
          DIAMANT NOIR
        </span>
      ) : null}
    </>
  );

  const wrapClass = `inline-flex items-center gap-2 md:gap-3 ${className}`;

  if (linkToHome) {
    return (
      <Link href="/" className={wrapClass} aria-label="Diamant Noir — Accueil" scroll>
        {inner}
      </Link>
    );
  }
  return <span className={wrapClass}>{inner}</span>;
}
