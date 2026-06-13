import { MetadataRoute } from "next";

const baseUrl = "https://kayvila.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/login/", "/api/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
