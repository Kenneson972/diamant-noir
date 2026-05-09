import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Évite que Next utilise un lockfile parent (ex. home) pour le tracing quand plusieurs existent.
  outputFileTracingRoot: path.join(__dirname),
  // Compression gzip/brotli pour toutes les réponses
  compress: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
    ],
  },
  // Désactiver le watching webpack en mode dev pour éviter EMFILE
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
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
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://js.stripe.com https://maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://*.supabase.co https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.supabase.co https://a0.muscache.com https://*.muscache.com https://res.cloudinary.com https://images.unsplash.com https://i.ibb.co https://www.airbnb.com https://*.basemaps.cartocdn.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://maps.googleapis.com https://*.googleapis.com",
              "frame-src 'self' https://js.stripe.com https://maps.googleapis.com",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
      {
        // Désactiver le cache navigateur en développement (évite les refreshes manuels)
        source: "/:path((?!_next/static|favicon|brand/).*)",
        headers: [
          {
            key: "Cache-Control",
            value:
              process.env.NODE_ENV === "development"
                ? "no-cache, no-store, must-revalidate"
                : undefined,
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
        // Long cache for public images (villa photos, etc.) — mais PAS en mode dev
        source: "/:path*.{jpg,jpeg,png,webp,avif,svg,ico}",
        headers: [
          {
            key: "Cache-Control",
            value:
              process.env.NODE_ENV === "development"
                ? "no-cache, no-store, must-revalidate"
                : "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
