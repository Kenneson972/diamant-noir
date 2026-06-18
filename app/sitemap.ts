import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://kayvila.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: new Date(), priority: 1.0, changeFrequency: "weekly" },
    { url: `${BASE}/villas`, lastModified: new Date(), priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE}/soumettre-ma-villa`, lastModified: new Date(), priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/prestations`, lastModified: new Date(), priority: 0.7, changeFrequency: "monthly" },
    { url: `${BASE}/qui-sommes-nous`, lastModified: new Date(), priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE}/contact`, lastModified: new Date(), priority: 0.5, changeFrequency: "monthly" },
    { url: `${BASE}/faq`, lastModified: new Date(), priority: 0.5, changeFrequency: "monthly" },
    { url: `${BASE}/villas/comparer`, lastModified: new Date(), priority: 0.5, changeFrequency: "monthly" },
    { url: `${BASE}/prestations/services/marketing`, lastModified: new Date(), priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE}/prestations/services/operations`, lastModified: new Date(), priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE}/prestations/services/voyageurs`, lastModified: new Date(), priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE}/prestations/services/menage`, lastModified: new Date(), priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE}/prestations/services/finance`, lastModified: new Date(), priority: 0.6, changeFrequency: "monthly" },
  ];

  // Pages villas dynamiques — dégradation gracieuse si Supabase est indisponible
  // (ex. variables d'env absentes au build sur une preview) : on renvoie au moins les pages statiques.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return staticPages;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
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
  } catch {
    return staticPages;
  }
}
