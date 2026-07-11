/**
 * Copie textuelle (title/eyebrow/tagline/metaDescription/items/alt images) déplacée vers
 * `lib/i18n.ts` sous les clés `services.<slug>.title` / `eyebrow` / `detail_tagline` /
 * `meta_description` / `item_N_title` / `item_N_desc` / `image_alt` / `image_intro_alt` /
 * `image_details_alt` — cette structure ne porte plus que les données non textuelles
 * (chemins d'images, mise en page). Source de vérité unique consommée par
 * `app/prestations/services/[slug]/page.tsx` (Task 3).
 */
export const SERVICE_SLUGS = ["marketing", "operations", "voyageurs", "menage", "finance"] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export function isServiceSlug(s: string): s is ServiceSlug {
  return (SERVICE_SLUGS as readonly string[]).includes(s);
}

export type ServiceDetail = {
  slug: ServiceSlug;
  image: string;
  imagePosition: string;
  overlay: string;
  imageAlign: "left" | "right";
  images: {
    sectionIntro: string;
    sectionDetails: string;
  };
};

export const SERVICE_DETAILS: Record<ServiceSlug, ServiceDetail> = {
  marketing: {
    slug: "marketing",
    image: "/marketing-old.webp",
    imagePosition: "center 40%",
    overlay: "bg-gradient-to-r from-black/70 via-black/40 to-black/10",
    imageAlign: "left",
    images: {
      sectionIntro: "/marketing-old.webp",
      sectionDetails: "/marketing.webp",
    },
  },
  operations: {
    slug: "operations",
    image: "/terrain-old.webp",
    imagePosition: "center 35%",
    overlay: "bg-gradient-to-l from-black/65 via-black/35 to-black/10",
    imageAlign: "right",
    images: {
      sectionIntro: "/terrain-old.webp",
      sectionDetails: "/terrain.webp",
    },
  },
  voyageurs: {
    slug: "voyageurs",
    image: "/relation-old.webp",
    imagePosition: "center 50%",
    overlay: "bg-gradient-to-r from-black/75 via-black/45 to-black/15",
    imageAlign: "left",
    images: {
      sectionIntro: "/relation-old.webp",
      sectionDetails: "/relation.webp",
    },
  },
  menage: {
    slug: "menage",
    image: "/menage-old.webp",
    imagePosition: "center 45%",
    overlay: "bg-gradient-to-r from-black/72 via-black/42 to-black/12",
    imageAlign: "right",
    images: {
      sectionIntro: "/menage-old.webp",
      sectionDetails: "/menage.webp",
    },
  },
  finance: {
    slug: "finance",
    image: "/finance-old.webp",
    imagePosition: "center 40%",
    overlay: "bg-gradient-to-l from-black/70 via-black/40 to-black/15",
    imageAlign: "right",
    images: {
      sectionIntro: "/finance-old.webp",
      sectionDetails: "/finance.webp",
    },
  },
};
