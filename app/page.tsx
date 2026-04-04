import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Star, Calendar, ShieldCheck } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase-server";
import { unstable_noStore as noStore } from "next/cache";
import { ScrollReveal } from "@/components/ScrollReveal";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { HomeAudienceScroll } from "@/components/home/HomeAudienceScroll";
import { HomeHeroPrimaryActions } from "@/components/home/HomeHeroPrimaryActions";
import { ProprietairesTransitionLink } from "@/components/home/ProprietairesTransitionLink";
import { HomeAudienceGate } from "@/components/home/HomeAudienceGate";

export const dynamic = "force-dynamic";

type FeaturedVilla = {
  id: string;
  name: string;
  price: number;
  rating: number;
  loc: string;
  tags: string[];
  image: string | null;
};

export default async function HomePage() {
  noStore();
  let featuredVillas: FeaturedVilla[] = [];
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
        rating: 4.9 + (index * 0.03),
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
      {/* Hero — vidéo /public/hero.webm (WebM) + poster */}
      <section className="relative flex min-h-[min(72vh,720px)] w-full flex-col justify-center overflow-hidden bg-black py-24 pt-28 md:min-h-[min(68vh,680px)] md:py-20 md:pt-24" aria-labelledby="hero-visually-hidden-title">
        <h1 id="hero-visually-hidden-title" className="sr-only">
          Diamant Noir — conciergerie de luxe, Martinique
        </h1>
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
          <div className="w-full space-y-4 md:space-y-5">
            <div className="flex justify-center animate-in fade-in duration-700">
              <BrandLogo
                variant="onDark"
                size="hero"
                showWordmark={false}
                linkToHome={false}
                priority
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-white/55 animate-in fade-in duration-700">
              Martinique · Collection privée
            </p>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-white/72 animate-in fade-in duration-700 delay-75 md:max-w-lg md:text-base">
              Réservez un séjour d&apos;exception au cœur de la Martinique — villas privées, conciergerie dédiée.
            </p>

            <HomeHeroPrimaryActions />
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/25">
          <div className="h-6 w-px bg-gradient-to-b from-white/40 to-transparent" aria-hidden />
        </div>
      </section>

      {/* Trust — bandeau discret type vitrine */}
      <section className="border-y border-black/[0.07] bg-white py-10 px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center">
          <div className="flex items-center gap-2">
            <Star size={14} className="fill-navy text-navy" strokeWidth={0} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/55">
              4,9 / 5
            </span>
          </div>
          <span className="hidden h-3 w-px bg-black/10 sm:block" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/45">
            100+ séjours
          </span>
          <span className="hidden h-3 w-px bg-black/10 sm:block" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/45">
            Conciergerie 24/7
          </span>
        </div>
      </section>

      {/* Section collection — titrage type « NOS MAISONS » + grille éditoriale */}
      <section className="bg-white py-20 px-6 md:py-28 cv-auto">
        <div className="mx-auto max-w-6xl space-y-14 md:space-y-20">
          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-5 text-center md:text-left">
              <h2 className="text-[clamp(1.125rem,2.4vw,1.5rem)] font-semibold uppercase tracking-[0.2em] text-navy">
                Nos villas
              </h2>
              <p className="font-display text-3xl leading-[1.12] text-navy md:text-5xl">
                Une collection privée d&apos;adresses d&apos;exception
              </p>
              <span className="mx-auto block h-px w-14 bg-black/15 md:mx-0" />
            </div>
            <Link
              href="/villas"
              className="group flex shrink-0 items-center justify-center gap-2 self-center text-[10px] font-semibold uppercase tracking-[0.28em] text-navy underline-offset-[10px] hover:underline md:self-end"
            >
              Voir tout le catalogue
              <ArrowRight size={14} strokeWidth={1.25} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {featuredVillas.length === 0 ? (
            <div className="border border-navy/10 bg-offwhite px-8 py-12 text-center">
              <p className="text-sm font-semibold text-navy">Aucune villa disponible pour le moment.</p>
              <p className="mt-2 text-xs text-navy/50">
                {featuredError ? `Statut: ${featuredError}` : "Ajoutez des villas dans Supabase pour les afficher ici."}
              </p>
              {process.env.NODE_ENV === 'development' && (
                <p className="mt-3 text-[10px] uppercase tracking-widest text-navy/40">
                  Supabase: {featuredCount} ligne(s) reçue(s)
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 md:gap-6">
              {featuredVillas.slice(0, 3).map((villa) => (
                <Link
                  key={villa.id}
                  href={`/villas/${villa.id}`}
                  aria-label={`Voir ${villa.name}`}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-navy/5">
                    <Image
                      src={villa.image || "/villa-hero.jpg"}
                      alt={villa.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-5 space-y-2 text-left px-0">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy md:text-[10px]">
                      {villa.name}
                    </h3>
                    <p className="text-sm font-normal text-navy/50 leading-snug">
                      {villa.loc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section Lifestyle Immersive */}
      <section className="relative overflow-hidden bg-black py-32 text-white lg:py-48 cv-auto">
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-20">
          <Image src="/villa-hero.jpg" alt="Lifestyle" fill className="object-cover" />
        </div>
        <div className="mx-auto max-w-7xl px-6 relative">
          <div className="max-w-xl space-y-12">
            <div className="space-y-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/50">Plus qu&apos;un séjour</span>
              <h2 className="font-display text-5xl md:text-7xl">Un Art de Vivre.</h2>
              <p className="text-lg text-white/60 font-light leading-relaxed">
                Chaque propriété de notre collection est un sanctuaire pensé pour 
                la déconnexion. Nos services de conciergerie privée s'occupent de 
                chaque détail pour que votre seule préoccupation soit l'instant présent.
              </p>
            </div>

            <div className="grid gap-12 sm:grid-cols-2">
              <ScrollReveal delay={0}>
                <div className="space-y-4">
                  <ShieldCheck className="text-white opacity-40" size={24} strokeWidth={1} />
                  <h4 className="font-bold">Confidentialité Totale</h4>
                  <p className="text-sm text-white/40">Accès privés et discrétion absolue pour votre sérénité.</p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <div className="space-y-4">
                  <Calendar className="text-white opacity-40" size={24} strokeWidth={1} />
                  <h4 className="font-bold">Services Sur-Mesure</h4>
                  <p className="text-sm text-white/40">Chefs, chauffeurs et excursions privées à la demande.</p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 text-center bg-offwhite px-6 cv-auto">
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="space-y-8">
            <h2 className="font-display text-4xl text-navy md:text-6xl">Prêt pour l&apos;exception ?</h2>
            <p className="leading-relaxed text-navy/60">
              Rejoignez le cercle Diamant Noir et vivez des moments hors du temps dans les plus belles résidences de la
              côte.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link href="/book" className="btn-luxury bg-black text-white">
                Réserver votre villa
              </Link>
              <ProprietairesTransitionLink className="inline-flex min-h-11 items-center justify-center border border-navy/25 px-6 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30">
                Confier ma villa
              </ProprietairesTransitionLink>
            </div>
          </div>
          <p className="border-t border-black/10 pt-10 text-sm text-navy/50">
            Propriétaire déjà accompagné ?{" "}
            <Link href="/login?redirect=/dashboard/proprio" className="font-medium text-navy underline-offset-4 hover:underline">
              Connexion espace propriétaire
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
