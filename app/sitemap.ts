import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://kayvila.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: new Date(), priority: 1.0, changeFrequency: "weekly" },
    { url: `${BASE}/villas`, lastModified: new Date(), priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE}/soumettre-ma-villa`, lastModified: new Date(), priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/prestations`, lastModified: new Date(), priority: 0.7, changeFrequency: "monthly" },
    { url: `${BASE}/qui-sommes-nous`, lastModified: new Date(), priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE}/contact`, lastModified: new Date(), priority: 0.5, changeFrequency: "monthly" },
    { url: `${BASE}/faq`, lastModified: new Date(), priority: 0.5, changeFrequency: "monthly" },
  ];

  // Pages villas dynamiques
  const { data: villas } = await supabase
    .from("villas")
    .select("id, updated_at")
    .eq("is_published", true);

  const villaPages: MetadataRoute.Sitemap = (villas || []).map((v) => ({
    url: `${BASE}/villas/${v.id}`,
    lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
    priority: 0.85,
    changeFrequency: "weekly",
  }));

  return [...staticPages, ...villaPages];
}
