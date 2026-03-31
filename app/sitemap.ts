import { MetadataRoute } from "next";
import { getSupabaseServer } from "@/lib/supabase-server";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://diamantnoir.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/villas`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/book`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/prestations`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/qui-sommes-nous`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/soumettre-ma-villa`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  let villaPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from("villas")
      .select("id, updated_at, created_at")
      .eq("is_published", true);
    if (data?.length) {
      villaPages = data.map((v) => ({
        url: `${baseUrl}/villas/${v.id}`,
        lastModified: (v as { updated_at?: string; created_at?: string }).updated_at
          ? new Date((v as { updated_at: string }).updated_at)
          : (v as { created_at?: string }).created_at
          ? new Date((v as { created_at: string }).created_at)
          : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // ignore
  }

  return [...staticPages, ...villaPages];
}
