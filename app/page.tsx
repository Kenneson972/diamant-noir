import type { Metadata } from "next";
import { HeroAudienceCards } from "@/components/home/HeroAudienceCards";
import { HomeBottomCta } from "@/components/home/HomeBottomCta";
import { HomeFeaturedAudience, type HomeFeaturedVilla } from "@/components/home/HomeFeaturedAudience";
import { HomeOwnersSection } from "@/components/home/HomeOwnersSection";
import { HomeServicesSection } from "@/components/home/HomeServicesSection";
import { HomeTrustBand } from "@/components/home/HomeTrustBand";
import { HeroWordmarkBaseline } from "@/components/marketing/HeroWordmarkBaseline";
import { HeroBackgroundMedia } from "@/components/home/HeroBackgroundMedia";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kayvila | Conciergerie de standing en Martinique",
  description:
    "Kayvila — Conciergerie de standing en Martinique. Villas en bord de mer, réservation en ligne, entretien et gestion locative. Rocher du Diamant, plages du Soleil.",
  openGraph: {
    title: "Kayvila | Conciergerie de standing en Martinique",
    description:
      "Villas en bord de mer, réservation en ligne, entretien et gestion locative en Martinique.",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    url: "https://kayvila.com",
    type: "website",
  },
  alternates: { canonical: "https://kayvila.com" },
};

async function fetchVillas(): Promise<{
  villas: HomeFeaturedVilla[];
  error: string | null;
  count: number;
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { villas: [], error: "Variables Supabase manquantes", count: 0 };
  }

  try {
    const apiUrl = `${url}/rest/v1/villas?select=id,name,price_per_night,location,image_url,image_urls,created_at&order=created_at.desc&limit=9`;
    const res = await fetch(apiUrl, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const villas = await res.json();
    const list = (Array.isArray(villas) ? villas : []).map((v: Record<string, unknown>) => ({
      id: v.id as string,
      name: v.name as string,
      price: (v.price_per_night as number) ?? 0,
      loc: (v.location as string) || "Martinique",
      image:
        (typeof v.image_url === "string" && (v.image_url as string).trim()) ||
        (Array.isArray(v.image_urls) &&
          typeof v.image_urls[0] === "string" &&
          (v.image_urls[0] as string).trim()) ||
        "/villa-hero.jpg",
    }));

    return { villas: list, error: null, count: list.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Supabase fetch error:", msg);
    return { villas: [], error: msg, count: 0 };
  }
}

const LOCAL_BUSINESS_JSONLD = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "TravelAgency"],
  "name": "Kayvila Conciergerie",
  "description": "Conciergerie de villas de standing en Martinique — accueil voyageurs, entretien, ménage, piscine, jardin, création et optimisation d'annonces, photos, revenue management",
  "url": "https://kayvila.com",
  "telephone": "+596 696 68 18 69",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Quartier Palmène",
    "addressLocality": "Saint-Esprit",
    "postalCode": "97270",
    "addressCountry": "MQ",
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 14.5531,
    "longitude": -60.9219,
  },
  "vatID": "FR32106394489",
  "taxID": "FR32106394489",
  "foundingDate": "2026-06-19",
};

export default async function HomePage() {
  const { villas: featuredVillas, error: featuredError, count: featuredCount } =
    await fetchVillas();

  return (
    <main className="min-h-dvh bg-offwhite">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_JSONLD) }}
      />
      {/* ① Hero */}
      <section
        className="relative flex min-h-[50dvh] w-full flex-col justify-center bg-navy pt-24 md:min-h-[60dvh] md:py-12 md:pt-24 lg:min-h-[min(65vh,560px)]"
        aria-labelledby="hero-title"
      >
        <HeroBackgroundMedia />
        <div className="absolute inset-0 bg-gradient-to-b from-black/14 via-black/8 to-black/48" />
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-6 text-center sm:px-8">
          <HeroWordmarkBaseline
            headingId="hero-title"
            titleLabel="Kayvila — Conciergerie privée"
            showValuesTriplet={false}
          />
          <HeroAudienceCards />
        </div>
      </section>

      {/* ② Les 5 piliers */}
      <section className="cv-auto">
        <HomeServicesSection />
      </section>

      {/* ④ Propriétaires */}
      <section className="cv-auto">
        <HomeOwnersSection />
      </section>

      {/* ⑤ Villas */}
      <section className="cv-auto">
        <HomeFeaturedAudience
          featuredVillas={featuredVillas}
          featuredError={featuredError}
          featuredCount={featuredCount}
        />
      </section>

      {/* ⑥ Trust */}
      <section className="cv-auto">
        <HomeTrustBand />
      </section>

      {/* ⑦ CTA final */}
      <section className="cv-auto">
        <HomeBottomCta />
      </section>
    </main>
  );
}
