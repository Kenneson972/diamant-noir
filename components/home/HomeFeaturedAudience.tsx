import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

export type HomeFeaturedVilla = {
  id: string;
  name: string;
  price: number;
  rating: number;
  loc: string;
  tags: string[];
  image: string | null;
};

type Props = {
  featuredVillas: HomeFeaturedVilla[];
  featuredError: string | null;
  featuredCount: number;
};

export function HomeFeaturedAudience({ featuredVillas, featuredError, featuredCount }: Props) {
  return (
    <section
      id="nos-villas"
      tabIndex={-1}
      className="scroll-mt-24 bg-white py-14 px-6 md:py-20"
    >
      <div className="mx-auto max-w-6xl space-y-10 md:space-y-14">
        <div className="flex items-center justify-between border-b border-navy/8 pb-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-navy/40">
            Nos villas
          </span>
          <Link
            href="/villas"
            className="group flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/60 transition-colors hover:text-navy"
          >
            Tout voir
            <ArrowRight size={12} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {featuredVillas.length === 0 ? (
          <div className="border border-navy/10 bg-offwhite px-8 py-12 text-center">
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {featuredVillas.slice(0, 3).map((villa, index) => (
              <ScrollReveal key={villa.id} delay={index * 100}>
                <Link
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
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent pb-5 pt-16 px-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
                        {villa.loc}
                      </p>
                      <p className="font-display text-lg text-white leading-snug mt-1">
                        {villa.name}
                      </p>
                      {villa.price > 0 && (
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                          {villa.price.toLocaleString("fr-FR")} € / nuit
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
