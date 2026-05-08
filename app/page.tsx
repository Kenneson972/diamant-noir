import { getSupabaseServer } from "@/lib/supabase-server";
import { HeroAudienceCards } from "@/components/home/HeroAudienceCards";
import { HomeBottomCta } from "@/components/home/HomeBottomCta";
import { HomeFeaturedAudience, type HomeFeaturedVilla } from "@/components/home/HomeFeaturedAudience";
import { HomeOwnersSection } from "@/components/home/HomeOwnersSection";
import { HomeServicesSection } from "@/components/home/HomeServicesSection";
import { HeroWordmarkBaseline } from "@/components/marketing/HeroWordmarkBaseline";
import { HeroBackgroundMedia } from "@/components/home/HeroBackgroundMedia";

// ISR: revalidate every 60s, or immediately when revalidateVillas() is called from dashboard
export const revalidate = 60;

export default async function HomePage() {
  let featuredVillas: HomeFeaturedVilla[] = [];
  let featuredError: string | null = null;
  let featuredCount = 0;

  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("villas")
      .select("id,name,price_per_night,location,image_url,image_urls,created_at,is_published")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    featuredCount = data?.length || 0;

    if (!error && data && data.length > 0) {
      featuredVillas = data.map((villa) => {
        const raw =
          (typeof villa.image_url === "string" && villa.image_url.trim()) ||
          (Array.isArray(villa.image_urls) &&
            typeof villa.image_urls[0] === "string" &&
            villa.image_urls[0].trim()) ||
          "";
        return {
          id: villa.id,
          name: villa.name,
          price: villa.price_per_night ?? 0,
          loc: villa.location || "Martinique",
          image: raw || "/villa-hero.jpg",
        };
      });
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
    <main className="min-h-dvh bg-offwhite">
      {/* Hero — vidéo / poster + cartes audience (rétabli après essai hero blanc) */}
      <section
        className="relative flex min-h-[340px] w-full flex-col justify-center overflow-hidden bg-navy pt-24 xs:min-h-[380px] md:min-h-[min(65vh,580px)] md:py-16 md:pt-24"
        aria-labelledby="hero-title"
      >
        <HeroBackgroundMedia />
        <div className="absolute inset-0 bg-gradient-to-b from-black/14 via-black/8 to-black/48" />

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-5 text-center sm:px-6">
          <HeroWordmarkBaseline
            headingId="hero-title"
            titleLabel="Kayvila — Conciergerie privée"
            showValuesTriplet={false}
          />
          <HeroAudienceCards />
        </div>
      </section>

      {/* Nos services — 5 piliers */}
      <HomeServicesSection />

      {/* Offre propriétaires */}
      <HomeOwnersSection />

      {/* Villas — masquées si aucune villa publiée */}
      {featuredVillas.length > 0 && (
        <HomeFeaturedAudience
          featuredVillas={featuredVillas}
          featuredError={featuredError}
          featuredCount={featuredCount}
        />
      )}

      {/* CTA final */}
      <HomeBottomCta />
    </main>
  );
}
