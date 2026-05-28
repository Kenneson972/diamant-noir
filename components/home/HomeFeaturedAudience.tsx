import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { formatPrice } from "@/lib/i18n";

export type HomeFeaturedVilla = {
  id: string;
  name: string;
  price: number;
  loc: string;
  image: string | null;
};

type Props = {
  featuredVillas: HomeFeaturedVilla[];
  featuredError: string | null;
  featuredCount: number;
};

export function HomeFeaturedAudience({ featuredVillas, featuredError, featuredCount }: Props) {
  return (
    <section id="nos-villas" tabIndex={-1} className="scroll-mt-24 bg-white">
      {/* En-tête — centré, titre grand */}
      <ScrollReveal>
        <div className="px-6 pb-10 pt-14 text-center md:px-8 md:pb-12 md:pt-20 lg:px-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-navy/35">
            Nos villas
          </span>
          <h2 className="mx-auto mt-3 font-display text-4xl font-light leading-[1.04] text-navy md:text-5xl lg:text-6xl">
            Une sélection d&apos;exception
          </h2>
          <div className="mt-6">
            <Link
              href="/villas"
              className="group inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-navy/45 transition-colors hover:text-navy"
            >
              Voir toutes les villas
              <ArrowRight size={11} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </ScrollReveal>

      {/* Grille plein bord — zéro gap */}
      {featuredVillas.length === 0 ? (
        <div className="border border-navy/10 bg-offwhite mx-8 mb-14 px-8 py-12 text-center">
          <p className="text-sm font-semibold text-navy">Aucune villa disponible pour le moment.</p>
          <p className="mt-2 text-xs text-navy/50">
            {featuredError ? `Statut: ${featuredError}` : "Ajoutez des villas dans Supabase pour les afficher ici."}
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="mt-3 text-[10px] uppercase tracking-widest text-navy/40">
              Supabase: {featuredCount} ligne(s) reçue(s)
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 md:grid-cols-3">
          {featuredVillas.slice(0, 3).map((villa, index) => (
            <Link
              key={villa.id}
              href={`/villas/${villa.id}`}
              aria-label={`Voir ${villa.name}`}
              className="group relative block aspect-[4/5] overflow-hidden bg-navy/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-inset stagger-item"
            >
              <Image
                src={villa.image || "/villa-hero.jpg"}
                alt={villa.name}
                fill
                priority={index === 0}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pb-6 pt-16 px-5 translate-y-1 transition-transform duration-300 group-hover:translate-y-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/50">
                  {villa.loc}
                </p>
                <p className="font-display text-xl font-light text-white leading-snug mt-0.5">
                  {villa.name}
                </p>
                {villa.price > 0 && (
                  <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.15em] text-white/60">
                    {formatPrice(villa.price)} / nuit
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
