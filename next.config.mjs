import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Évite que Next utilise un lockfile parent (ex. home) pour le tracing quand plusieurs existent.
  outputFileTracingRoot: path.join(__dirname),
  transpilePackages: ["@heroui-pro/react", "heroui-native-pro"],
  // Compression gzip/brotli pour toutes les réponses
  compress: true,
  // Désactiver les sourcemaps en production (réduit le bundle JS)
  productionBrowserSourceMaps: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // Réduire le nombre d'watchers en ignorant node_modules
      config.watchOptions = {
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**"],
        poll: false,
      };
    }
    return config;
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "leaflet",
      "shiki",
      "date-fns",
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://js.stripe.com https://maps.googleapis.com https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://*.supabase.co https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.supabase.co https://a0.muscache.com https://*.muscache.com https://res.cloudinary.com https://images.unsplash.com https://i.ibb.co https://www.airbnb.com https://*.basemaps.cartocdn.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://maps.googleapis.com https://*.googleapis.com https://vercel.live wss://ws-us3.pusher.com",
              "frame-src 'self' https://js.stripe.com https://maps.googleapis.com https://www.openstreetmap.org https://vercel.live",
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
      // Désactiver le cache navigateur en développement (évite les refreshes manuels)
      // ⚠️ En dev, ce bloc doit COUVRIR _next/static aussi : les chunks Turbopack
      // ne sont pas garantis content-hashés d'une recompilation à l'autre, donc le
      // cache "immutable" plus bas (destiné à la prod) rendait des changements de
      // code invisibles tant que le cache navigateur n'était pas vidé manuellement.
      ...(process.env.NODE_ENV === "development"
        ? [
            {
              source: "/:path((?!favicon|brand/).*)",
              headers: [
                {
                  key: "Cache-Control",
                  value: "no-cache, no-store, must-revalidate, no-transform",
                },
              ],
            },
          ]
        : []),
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      ...(process.env.NODE_ENV !== "development"
        ? [
            {
              // Immutable cache for Next.js static assets (chunks, fonts, etc.) — prod only.
              // Sûr car ces fichiers sont content-hashés en build de production.
              source: "/_next/static/:path*",
              headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
            },
          ]
        : []),
      {
        // Cache image raisonnable en prod (1h + revalidation en arrière-plan), aucun cache en dev.
        // Auparavant 86400/604800 (jusqu'à 8 jours) : trop long pour voir une photo
        // de villa remplacée sans vider le cache.
        source: "/:path*.{jpg,jpeg,png,webp,avif,svg,ico}",
        headers: [
          {
            key: "Cache-Control",
            value:
              process.env.NODE_ENV === "development"
                ? "no-cache, no-store, must-revalidate"
                : "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
