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
  size?: "sm" | "md" | "lg" | "auth" | "hero";
};

const sizeClasses: Record<
  NonNullable<BrandLogoProps["size"]>,
  { box: string; wordmark: string }
> = {
  sm: { box: "h-7 w-7 md:h-8 md:w-8", wordmark: "text-sm tracking-[0.16em] sm:text-base sm:tracking-[0.2em]" },
  md: {
    box: "h-9 w-9 md:h-10 md:w-10",
    wordmark:
      "text-sm tracking-[0.14em] sm:text-base sm:tracking-[0.18em] md:text-xl md:tracking-[0.3em]",
  },
  lg: { box: "h-12 w-12 md:h-14 md:w-14", wordmark: "text-2xl tracking-[0.32em]" },
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

  const wrapClass = `inline-flex items-center gap-2 whitespace-nowrap md:gap-3 ${className}`;

  if (linkToHome) {
    return (
      <Link href="/" className={wrapClass}>
        {inner}
      </Link>
    );
  }
  return <span className={wrapClass}>{inner}</span>;
}
