import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerLocale, tServer as ts } from "@/lib/i18n";
import { KayvilaPngIcon, type KayvilaPngName } from "@/components/icons/KayvilaPngIcon";
import {
  LandingShell,
  LandingSection,
} from "@/components/marketing/landing-sections";
import { FinanceCopilotSection } from "@/components/prestations/FinanceCopilotSection";
import {
  SERVICE_SLUGS,
  SERVICE_DETAILS,
  isServiceSlug,
  type ServiceSlug,
} from "@/data/prestations-service-details";
import { SCROLL_SECTIONS } from "@/data/prestations-scroll-sections";

const SERVICE_ICONS: Record<ServiceSlug, KayvilaPngName> = {
  marketing: "pilier-marketing",
  operations: "pilier-operations",
  voyageurs: "pilier-voyageurs",
  menage: "pilier-menage",
  finance: "pilier-finance",
};

export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isServiceSlug(slug)) return {};
  const { headers } = await import("next/headers");
  const locale = getServerLocale(await headers());
  const d = SERVICE_DETAILS[slug];
  const title = ts(locale, `services.${slug}.title`);
  const description = ts(locale, `services.${slug}.meta_description`);
  return {
    title: `${title} | Prestations`,
    description,
    alternates: { canonical: `https://kayvila.com/prestations/services/${slug}` },
    openGraph: {
      title,
      description,
      images: [{ url: d.image, width: 1200, height: 630, alt: ts(locale, `services.${slug}.image_alt`) }],
    },
  };
}

export default async function PrestationServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isServiceSlug(slug)) notFound();

  const { headers } = await import("next/headers");
  const locale = getServerLocale(await headers());

  const d = SERVICE_DETAILS[slug];
  const iconName = SERVICE_ICONS[slug];
  const itemCount = SCROLL_SECTIONS.find((s) => s.id === slug)?.itemCount ?? 0;
  const items = Array.from({ length: itemCount }, (_, j) => ({
    title: ts(locale, `services.${slug}.item_${j + 1}_title`),
    desc: ts(locale, `services.${slug}.item_${j + 1}_desc`),
  }));

  return (
    <LandingShell>
      {/* ── Hero — image plein format, titre superposé ─── */}
      <section
        className="relative overflow-hidden bg-navy"
        style={{ minHeight: "min(68vh, 560px)" }}
      >
        <Image
          src={d.image}
          alt={ts(locale, `services.${slug}.image_alt`)}
          fill
          className="object-cover"
          style={{ objectPosition: d.imagePosition }}
          sizes="100vw"
          priority
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.18) 40%, rgba(0,0,0,0.78) 100%)",
          }}
          aria-hidden
        />

        <nav
          aria-label={ts(locale, "prestations.breadcrumb_aria")}
          className="absolute left-6 top-20 z-10 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60 md:left-10 md:top-24"
        >
          <Link href="/prestations" className="transition-colors hover:text-white">
            {ts(locale, "prestations.breadcrumb_root")}
          </Link>
          <span className="text-white/25" aria-hidden>/</span>
          <span className="text-white/90">{ts(locale, `services.${slug}.title`)}</span>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-10 md:px-12 md:pb-14">
          <div className="mx-auto max-w-5xl">
            <div className="mb-3 flex items-center gap-2.5">
              <KayvilaPngIcon name={iconName} size={20} invert alt="" className="shrink-0" />
              <p className="text-[9px] font-bold uppercase tracking-[0.48em] text-gold/90">
                {ts(locale, `services.${slug}.eyebrow`)}
              </p>
            </div>
            <div className="mb-4 h-px w-10 bg-gold/55" aria-hidden />
            <h1
              className="font-display font-normal text-white"
              style={{
                fontSize: "clamp(1.7rem, 4.5vw, 3.25rem)",
                letterSpacing: "0.07em",
                lineHeight: 1.08,
              }}
            >
              {ts(locale, `services.${slug}.title`)}
            </h1>
            <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-white/60">
              {ts(locale, `services.${slug}.detail_tagline`)}
            </p>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 1 — Intro : Texte [gauche] | Image [droite] ═══ */}
      <section className="border-b border-navy/[0.06] bg-offwhite px-5 py-16 sm:px-6 md:py-24 lg:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Texte */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/60">
              {ts(locale, "prestations.detail_approach_eyebrow")}
            </span>
            <h2 className="mt-4 font-display text-3xl font-normal leading-[1.08] text-navy md:text-4xl">
              {ts(locale, `services.${slug}.title`)}
            </h2>
            <div className="mt-4 h-px w-8 bg-gold/40" aria-hidden />
            <p className="mt-6 text-[15px] leading-relaxed text-navy/75 md:text-[17px]">
              {ts(locale, `services.${slug}.intro`)}
            </p>
          </div>
          {/* Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={d.images.sectionIntro}
              alt={ts(locale, `services.${slug}.image_intro_alt`)}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2 — Détails : Image [gauche] | Texte [droite] ═══ */}
      <section className="border-b border-navy/[0.06] bg-white px-5 py-16 sm:px-6 md:py-24 lg:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Image (passe en premier dans le DOM mais visuellement à gauche) */}
          <div className="lg:order-1">
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={d.images.sectionDetails}
                alt={ts(locale, `services.${slug}.image_details_alt`)}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
          {/* Texte */}
          <div className="lg:order-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/60">
              {ts(locale, "prestations.detail_how_eyebrow")}
            </span>
            <h2 className="mt-4 font-display text-3xl font-normal leading-[1.08] text-navy md:text-4xl">
              {ts(locale, "prestations.detail_included_title")}
            </h2>
            <div className="mt-4 h-px w-8 bg-gold/40" aria-hidden />
            <div className="mt-8 space-y-6 text-[13px] leading-relaxed text-navy/80">
              {items.map(({ title: iTitle, desc }) => (
                <div key={iTitle} className="flex items-start gap-3">
                  <KayvilaPngIcon name="check-circle" size={20} alt="" className="mt-[1px] shrink-0" />
                  <div>
                    <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-navy">
                      {iTitle}
                    </h3>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ── Section Copilot Finance (si slug finance) ─── */}
      {slug === "finance" && <FinanceCopilotSection />}

      {/* ── CTA bas de page ───────────────────────────── */}
      <LandingSection bg="white">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 h-px w-8 bg-gold/40" aria-hidden />
          <p className="text-[13px] leading-relaxed text-navy/80">
            {ts(locale, "prestations.detail_cta_text")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/#piliers`}
              scroll={true}
              className="inline-flex min-h-[48px] items-center gap-2 border border-navy px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              {ts(locale, "prestations.detail_all_pillars")}
            </Link>
            {(() => {
              const currentIdx = SERVICE_SLUGS.indexOf(slug as ServiceSlug);
              const prevIdx = currentIdx > 0 ? currentIdx - 1 : -1;
              const nextIdx = (currentIdx + 1) % SERVICE_SLUGS.length;
              const prevSlug = prevIdx >= 0 ? SERVICE_SLUGS[prevIdx] : null;
              const nextSlug = SERVICE_SLUGS[nextIdx];
              const isLoop = nextIdx === 0;
              return (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {prevSlug && (
                    <Link
                      href={`/prestations/services/${prevSlug}`}
                      className="inline-flex min-h-[48px] items-center gap-2 border border-navy/25 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                    >
                      <KayvilaPngIcon name="arrow-right" size={18} alt="" className="rotate-180" /> {ts(locale, "prestations.detail_prev_pillar")} {ts(locale, `services.${prevSlug}.title`)}
                    </Link>
                  )}
                  <Link
                    href={`/prestations/services/${nextSlug}`}
                    className="inline-flex min-h-[48px] items-center gap-2 border border-navy/25 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                  >
                    {isLoop ? ts(locale, "prestations.detail_back_to_first") : ts(locale, "prestations.detail_next_pillar")} {ts(locale, `services.${nextSlug}.title`)} <KayvilaPngIcon name="arrow-right" size={18} alt="" />
                  </Link>
                </div>
              );
            })()}
            <Link
              href="/soumettre-ma-villa"
              className="inline-flex min-h-[48px] items-center gap-2 border border-navy bg-navy px-6 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              {ts(locale, "nav.submit_villa")} <KayvilaPngIcon name="arrow-right" size={18} alt="" />
            </Link>
          </div>
        </div>
      </LandingSection>
    </LandingShell>
  );
}
