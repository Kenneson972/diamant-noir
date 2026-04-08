import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Évite que Next utilise un lockfile parent (ex. home) pour le tracing quand plusieurs existent.
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Supabase Storage — all paths
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      // Airbnb CDN
      {
        protocol: "https",
        hostname: "a0.muscache.com",
      },
      {
        protocol: "https",
        hostname: "**.muscache.com",
      },
      // Airbnb www
      {
        protocol: "https",
        hostname: "www.airbnb.com",
      },
      // Images hébergées ailleurs (Cloudinary, imgbb, etc.)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        // Immutable cache for Next.js static assets (chunks, fonts, etc.)
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Long cache for public images (villa photos, etc.)
        source: "/:path*.{jpg,jpeg,png,webp,avif,svg,ico}",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
