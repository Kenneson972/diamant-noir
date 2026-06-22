import Image from "next/image";

// Pack d'icônes PNG monoline Kayvila (Higgsfield) — trait noir, fond transparent.
// Fichiers dans public/brand/icons-png/. Sur fond sombre, utiliser la prop `invert`.
const ICONS = {
  // Équipements villa
  "ac": "ac",
  "anchor": "anchor",
  "bed": "bed",
  "boat": "boat",
  "car": "car",
  "chef": "chef",
  "fireplace": "fireplace",
  "gym": "gym",
  "kitchen": "kitchen",
  "plane": "plane",
  "pool": "pool",
  "tree": "tree",
  "tv": "tv",
  "wash": "wash",
  "wifi": "wifi",
  // UI / navigation
  "arrow-right": "arrow-right",
  "bell": "bell",
  "book": "book",
  "calendar": "calendar",
  "chart": "chart",
  "check-circle": "check-circle",
  "clock": "clock",
  "clock-247": "clock-247",
  "compass": "compass",
  "credit-card": "credit-card",
  "doc": "doc",
  "door": "door",
  "download": "download",
  "euro": "euro",
  "euros": "euros",
  "gem": "gem",
  "handshake": "handshake",
  "heart": "heart",
  "home": "home",
  "key": "key",
  "location": "location",
  "lock": "lock",
  "login": "login",
  "logout": "logout",
  "mail": "mail",
  "maison": "maison",
  "message": "message",
  "phone": "phone",
  // Piliers
  "pilier-finance": "pilier-finance",
  "pilier-marketing": "pilier-marketing",
  "pilier-menage": "pilier-menage",
  "pilier-operations": "pilier-operations",
  "pilier-voyageurs": "pilier-voyageurs",
  // Sécurité / statut
  "shield-check": "shield-check",
  "shopping-bag": "shopping-bag",
  "sparkle": "sparkle",
  "star": "star",
  "trend-down": "trend-down",
  "trending-up": "trending-up",
  "upload": "upload",
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
