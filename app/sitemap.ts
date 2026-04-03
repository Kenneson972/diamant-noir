import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "https://diamantnoir.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, lastModified: new Date(), priority: 1.0 },
    { url: `${BASE}/villas`, lastModified: new Date(), priority: 0.9 },
    { url: `${BASE}/proprietaires`, lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/soumettre-ma-villa`, lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/prestations`, lastModified: new Date(), priority: 0.7 },
    { url: `${BASE}/qui-sommes-nous`, lastModified: new Date(), priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: new Date(), priority: 0.6 },
  ];
}
