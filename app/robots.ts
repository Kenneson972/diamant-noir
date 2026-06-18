import { MetadataRoute } from "next";

const baseUrl = "https://kayvila.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/dashboard/", "/login", "/api/", "/espace-client/", "/success", "/share/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
