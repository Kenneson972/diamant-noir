import https from "https";
import { HeroAudienceCards } from "@/components/home/HeroAudienceCards";
import { HomeBottomCta } from "@/components/home/HomeBottomCta";
import { HomeFeaturedAudience, type HomeFeaturedVilla } from "@/components/home/HomeFeaturedAudience";
import { HomeOwnersSection } from "@/components/home/HomeOwnersSection";
import { HomeServicesSection } from "@/components/home/HomeServicesSection";
import { HomeTrustBand } from "@/components/home/HomeTrustBand";
import { HeroWordmarkBaseline } from "@/components/marketing/HeroWordmarkBaseline";
import { HeroBackgroundMedia } from "@/components/home/HeroBackgroundMedia";

export const dynamic = "force-dynamic";

/** Petit helper pour fetch sans le fetch patched de Next.js */
function rawFetch(url: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let body = "";
      res.on("data", (chunk: string) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
        }
      });
    }).on("error", reject);
  });
}

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
    const body = await rawFetch(apiUrl, {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    });

    const villas = JSON.parse(body);
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
    console.error("Supabase rawFetch error:", msg);
    return { villas: [], error: msg, count: 0 };
  }
}

export default async function HomePage() {
  const { villas: featuredVillas, error: featuredError, count: featuredCount } =
    await fetchVillas();

  return (
    <main className="min-h-dvh bg-offwhite">
      {/* ① Hero */}
      <section
        className="relative flex min-h-[60dvh] w-full flex-col justify-center overflow-hidden bg-navy pt-24 md:min-h-[70dvh] md:py-16 md:pt-24 lg:min-h-[min(75vh,640px)]"
        aria-labelledby="hero-title"
      >
        <HeroBackgroundMedia />
        <div className="absolute inset-0 bg-gradient-to-b from-black/14 via-black/8 to-black/48" />
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 text-center sm:px-8">
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
