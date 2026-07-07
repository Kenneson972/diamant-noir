import { MetadataRoute } from "next";

const baseUrl = "https://kayvila.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/login", "/api/", "/espace-client/", "/success", "/share/"],
      },
      { userAgent: "ChatGPT-User", allow: "/", disallow: ["/admin/", "/dashboard/", "/login", "/api/"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/admin/", "/dashboard/", "/login", "/api/"] },
      { userAgent: "Google-Extended", allow: "/", disallow: ["/admin/", "/dashboard/", "/login", "/api/"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
