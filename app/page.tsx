import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";
import { HomeAudienceScroll } from "@/components/home/HomeAudienceScroll";
import { HomeAudienceGate } from "@/components/home/HomeAudienceGate";
import { HomeBottomCta } from "@/components/home/HomeBottomCta";
import { HomeTrustBand } from "@/components/home/HomeTrustBand";
import { HomeFeaturedAudience, type HomeFeaturedVilla } from "@/components/home/HomeFeaturedAudience";
import { HomeLifestyleAudience } from "@/components/home/HomeLifestyleAudience";
import { HeroWordmarkBaseline } from "@/components/marketing/HeroWordmarkBaseline";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  noStore();
  let featuredVillas: HomeFeaturedVilla[] = [];
  let featuredError: string | null = null;
  let featuredCount = 0;

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("villas")
      .select("id,name,price_per_night,location,image_url,image_urls,created_at,is_published")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    featuredCount = data?.length || 0;

    if (!error && data && data.length > 0) {
      featuredVillas = data.map((villa, index) => ({
        id: villa.id,
        name: villa.name,
        price: villa.price_per_night,
        rating: 4.9 + index * 0.03,
        loc: villa.location || "Martinique",
        tags: ["Vue Mer", "Piscine Infinity"],
        image: villa.image_url || villa.image_urls?.[0] || "/villa-hero.jpg",
      }));
    } else if (error) {
      featuredError = error.message || "Erreur Supabase";
    } else if (data && data.length === 0) {
      featuredError = "Aucune villa retournée par Supabase.";
    }
  } catch (error) {
    console.error("Supabase fetch error (home):", error);
    featuredError = "Supabase non configuré ou indisponible.";
  }

  return (
    <main className="min-h-screen bg-offwhite">
      <HomeAudienceGate />
      {/* Hero — vidéo /public/hero.webm (WebM) + poster : mot « DIAMANT NOIR » + baseline (header = pictogramme) */}
      <section
        className="relative flex min-h-[min(72vh,720px)] w-full flex-col justify-center overflow-hidden bg-black py-24 pt-28 md:min-h-[min(68vh,680px)] md:py-20 md:pt-24"
        aria-labelledby="hero-title"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/villa-hero.jpg"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        >
          <source src="/hero.webm" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/80" />

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-5 text-center sm:px-6">
          <Suspense fallback={null}>
            <HomeAudienceScroll />
          </Suspense>
          <HeroWordmarkBaseline
            headingId="hero-title"
            titleLabel="Diamant Noir — Confiance, réactivité, excellence"
          />
        </div>

        <div className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/25">
          <div className="h-6 w-px bg-gradient-to-b from-white/40 to-transparent" aria-hidden />
        </div>
      </section>

      <HomeTrustBand />

      <HomeFeaturedAudience
        featuredVillas={featuredVillas}
        featuredError={featuredError}
        featuredCount={featuredCount}
      />

      <HomeLifestyleAudience />

      <HomeBottomCta />
    </main>
  );
}
