import { getSupabaseServer } from "@/lib/supabase-server";
import { HeroAudienceCards } from "@/components/home/HeroAudienceCards";
import { HomeBottomCta } from "@/components/home/HomeBottomCta";
import { HomeFeaturedAudience, type HomeFeaturedVilla } from "@/components/home/HomeFeaturedAudience";
import { HomeOwnersSection } from "@/components/home/HomeOwnersSection";
import { HomeServicesSection } from "@/components/home/HomeServicesSection";
import { HomeTrustBand } from "@/components/home/HomeTrustBand";
import { HeroWordmarkBaseline } from "@/components/marketing/HeroWordmarkBaseline";
import { HeroBackgroundMedia } from "@/components/home/HeroBackgroundMedia";

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
      {/* ① Hero — sombre, conciergerie-first */}
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

      {/* ② Les 5 piliers conciergerie */}
      <section className="cv-auto">
        <HomeServicesSection />
      </section>

      {/* ④ Propriétaires — texte gauche, photo droite bord à bord */}
      <section className="cv-auto">
        <HomeOwnersSection />
      </section>

      {/* ⑤ Villas — grille plein bord, zéro gap */}
      <section className="cv-auto">
        {featuredVillas.length > 0 && (
          <HomeFeaturedAudience
            featuredVillas={featuredVillas}
            featuredError={featuredError}
            featuredCount={featuredCount}
          />
        )}
      </section>

      {/* ⑥ Trust — stats + témoignage */}
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
