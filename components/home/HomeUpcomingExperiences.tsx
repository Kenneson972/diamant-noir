import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { EXPERIENCE_SLUGS, EXPERIENCE_DETAILS } from "@/data/experiences";
import { tServer as ts } from "@/lib/i18n";

/**
 * Bloc teaser « Nos prestations à venir » — inséré sur la home juste après
 * la grille des villas. Fond blanc épuré, dans la continuité de la section
 * villas. Chaque carte mène à `/experiences/<slug>`.
 */
export function HomeUpcomingExperiences({ locale }: { locale: string }) {
  return (
    <section
      id="prestations-a-venir"
      tabIndex={-1}
      className="scroll-mt-24 bg-white"
      aria-labelledby="upcoming-title"
    >
      <ScrollReveal>
        <div className="px-6 pb-10 pt-14 text-center md:px-8 md:pb-12 md:pt-20 lg:px-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-navy/50">
            {ts(locale, "home.upcoming_eyebrow")}
          </span>
          <h2
            id="upcoming-title"
            className="mx-auto mt-3 font-display text-4xl font-light leading-[1.04] text-navy md:text-5xl lg:text-6xl"
          >
            {ts(locale, "home.upcoming_title")}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[13px] leading-relaxed text-navy/55">
            {ts(locale, "home.upcoming_subtitle")}
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
        {EXPERIENCE_SLUGS.map((slug) => {
          const d = EXPERIENCE_DETAILS[slug];
          const name = ts(locale, `experiences.${slug}.title`);
          return (
            <Link
              key={slug}
              href={`/experiences/${slug}`}
              aria-label={ts(locale, "home.upcoming_card_aria", { name })}
              className="stagger-item group relative block aspect-[4/5] overflow-hidden bg-navy/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-inset"
            >
              <Image
                src={d.hero}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                style={{ objectPosition: d.heroPosition }}
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/20 to-navy/5"
                aria-hidden
              />
              <span className="absolute left-4 top-4 z-10 border border-white/50 bg-navy/55 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.24em] text-white">
                {ts(locale, "experiences.badge_soon_short")}
              </span>
              <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6 pt-16">
                <p className="font-display text-xl font-light leading-snug text-white">
                  {name}
                </p>
                <p className="mt-1.5 min-w-0 text-[11px] leading-relaxed text-white/60">
                  {ts(locale, `experiences.${slug}.tagline`)}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.28em] text-white/85">
                  {ts(locale, "common.learn_more")}
                  <ArrowRight
                    size={13}
                    strokeWidth={1.5}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
