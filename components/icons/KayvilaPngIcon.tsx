import Image from "next/image";

// Pack d'icônes PNG monoline Kayvila (Higgsfield) — trait noir, fond transparent.
// Fichiers dans public/brand/icons-png/. Sur fond sombre, utiliser la prop `invert`.
const ICONS = {
  "arrow-right": "arrow-right",
  "bell": "bell",
  "calendar": "calendar",
  "check-circle": "check-circle",
  "clock": "clock",
  "clock-247": "clock-247",
  "euro": "euro",
  "handshake": "handshake",
  "heart": "heart",
  "home": "home",
  "key": "key",
  "location": "location",
  "mail": "mail",
  "message": "message",
  "phone": "phone",
  "pilier-finance": "pilier-finance",
  "pilier-marketing": "pilier-marketing",
  "pilier-menage": "pilier-menage",
  "pilier-operations": "pilier-operations",
  "pilier-voyageurs": "pilier-voyageurs",
  "shield-check": "shield-check",
  "sparkle": "sparkle",
  "star": "star",
  "users": "users",
  "villa": "villa",
  "camera": "camera",
} as const;

export type KayvilaPngName = keyof typeof ICONS;

interface KayvilaPngIconProps {
  name: KayvilaPngName;
  size?: number;
  alt?: string;
  invert?: boolean;
  className?: string;
}

/**
 * Icône PNG Kayvila (next/image, lazy-load auto).
 * @example <KayvilaPngIcon name="pilier-finance" size={40} alt="Finance" />
 * Sur fond navy/sombre : <KayvilaPngIcon name="shield-check" invert /> (rend l'icône blanche).
 */
export function KayvilaPngIcon({
  name,
  size = 32,
  alt = "",
  invert = false,
  className = "",
}: KayvilaPngIconProps) {
  return (
    <Image
      src={`/brand/icons-png/${ICONS[name]}.png`}
      width={size}
      height={size}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      className={`${invert ? "invert" : ""} ${className}`.trim()}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

export default KayvilaPngIcon;
