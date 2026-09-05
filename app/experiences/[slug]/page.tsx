import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerLocale, tServer as ts } from "@/lib/i18n";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { LandingShell, LandingSection } from "@/components/marketing/landing-sections";
import {
  EXPERIENCE_SLUGS,
  EXPERIENCE_DETAILS,
  isExperienceSlug,
} from "@/data/experiences";

export function generateStaticParams() {
  return EXPERIENCE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isExperienceSlug(slug)) return {};
  const { headers } = await import("next/headers");
  const locale = getServerLocale(await headers());
  const d = EXPERIENCE_DETAILS[slug];
  const title = ts(locale, `experiences.${slug}.title`);
  const description = ts(locale, `experiences.${slug}.meta_description`);
  return {
    title: `${title} | ${ts(locale, "experiences.meta_suffix")}`,
    description,
    alternates: { canonical: `https://kayvila.com/experiences/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://kayvila.com/experiences/${slug}`,
      type: "website",
      images: [
        {
          url: d.hero,
          width: 1200,
          height: 630,
          alt: ts(locale, `experiences.${slug}.image_alt`),
        },
      ],
    },
  };
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isExperienceSlug(slug)) notFound();

  const { headers } = await import("next/headers");
  const locale = getServerLocale(await headers());
  const d = EXPERIENCE_DETAILS[slug];

  const title = ts(locale, `experiences.${slug}.title`);
  const items = [1, 2, 3, 4].map((n) => ({
    title: ts(locale, `experiences.${slug}.item_${n}_title`),
    desc: ts(locale, `experiences.${slug}.item_${n}_desc`),
  }));
  const steps = [1, 2, 3].map((n) => ({
    num: String(n).padStart(2, "0"),
    title: ts(locale, `experiences.${slug}.step_${n}_title`),
    desc: ts(locale, `experiences.${slug}.step_${n}_desc`),
  }));
  const others = EXPERIENCE_SLUGS.filter((s) => s !== slug);

  return (
    <LandingShell>
      {/* ── ① Hero — bloc titre clair, puis image pleine largeur ─ */}
      <section className="bg-offwhite px-6 pb-10 pt-24 md:px-12 md:pb-14 md:pt-28">
        <div className="mx-auto max-w-5xl">
          <nav
            aria-label={ts(locale, "experiences.breadcrumb_aria")}
            className="mb-8 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-navy/45"
          >
            <Link href="/" className="transition-colors hover:text-navy">
              {ts(locale, "nav.home")}
            </Link>
            <span className="text-navy/25" aria-hidden>/</span>
            <span className="text-navy/70">{ts(locale, "experiences.breadcrumb_root")}</span>
          </nav>

          <span className="mb-4 inline-flex items-center border border-navy/20 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.28em] text-navy/70">
            {ts(locale, "experiences.badge_soon")}
          </span>
          <div className="mb-3 flex items-center gap-2.5">
            <KayvilaPngIcon name={d.icon} size={20} alt="" className="shrink-0" />
            <p className="text-[9px] font-bold uppercase tracking-[0.48em] text-navy/55">
              {ts(locale, `experiences.${slug}.eyebrow`)}
            </p>
          </div>
          <div className="mb-4 h-px w-10 bg-navy/20" aria-hidden />
          <h1
            className="font-display font-normal text-navy"
            style={{
              fontSize: "clamp(1.7rem, 4.5vw, 3.25rem)",
              letterSpacing: "0.07em",
              lineHeight: 1.08,
            }}
          >
            {title}
          </h1>
          <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-navy/60">
            {ts(locale, `experiences.${slug}.tagline`)}
          </p>
        </div>
      </section>

      <div className="relative w-full overflow-hidden bg-navy/5 aspect-[16/9] max-h-[520px]">
        <Image
          src={d.hero}
          alt={ts(locale, `experiences.${slug}.image_alt`)}
          fill
          className="object-cover"
          style={{ objectPosition: d.heroPosition }}
          sizes="100vw"
          priority
        />
      </div>

      {/* ── ② Intro : texte [gauche] | image [droite] ──────── */}
      <section className="border-b border-navy/[0.06] bg-offwhite px-5 py-16 sm:px-6 md:py-24 lg:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/60">
              {ts(locale, "experiences.approach_eyebrow")}
            </span>
            <h2 className="mt-4 font-display text-3xl font-normal leading-[1.08] text-navy md:text-4xl">
              {title}
            </h2>
            <div className="mt-4 h-px w-8 bg-navy/20" aria-hidden />
            <p className="mt-6 text-[15px] leading-relaxed text-navy/75 md:text-[17px]">
              {ts(locale, `experiences.${slug}.intro`)}
            </p>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={d.images.intro}
              alt={ts(locale, `experiences.${slug}.image_intro_alt`)}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* ── ③ Ce qui est inclus : image [gauche] | texte ───── */}
      <section className="border-b border-navy/[0.06] bg-white px-5 py-16 sm:px-6 md:py-24 lg:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-1">
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={d.images.included}
                alt={ts(locale, `experiences.${slug}.image_included_alt`)}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="min-w-0 lg:order-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/60">
              {ts(locale, "experiences.included_eyebrow")}
            </span>
            <h2 className="mt-4 font-display text-3xl font-normal leading-[1.08] text-navy md:text-4xl">
              {ts(locale, "experiences.included_title")}
            </h2>
            <div className="mt-4 h-px w-8 bg-navy/20" aria-hidden />
            <div className="mt-8 space-y-6 text-[13px] leading-relaxed text-navy/80">
              {items.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <KayvilaPngIcon
                    name="check-circle"
                    size={20}
                    alt=""
                    className="mt-[1px] shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-navy">
                      {item.title}
                    </h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ④ Comment ça se passe ─────────────────────────── */}
      <section className="border-b border-navy/[0.06] bg-offwhite px-5 py-16 sm:px-6 md:py-24 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/60">
            {ts(locale, "experiences.how_eyebrow")}
          </span>
          <h2 className="mt-4 font-display text-3xl font-normal leading-[1.08] text-navy md:text-4xl">
            {ts(locale, "experiences.how_title")}
          </h2>
          <div className="mt-4 h-px w-8 bg-navy/20" aria-hidden />
          <ol className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            {steps.map((step) => (
              <li key={step.num} className="min-w-0 border-t border-navy/10 pt-5">
                <span className="font-display text-2xl font-light text-navy/35">{step.num}</span>
                <h3 className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-navy">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-navy/75">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── ⑤ Bandeau « à venir » + navigation ────────────── */}
      <LandingSection bg="offwhite">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 h-px w-8 bg-navy/20" aria-hidden />
          <h2 className="font-display text-2xl font-normal text-navy md:text-3xl">
            {ts(locale, "experiences.soon_band_title")}
          </h2>
          <p className="mt-5 text-[13px] leading-relaxed text-navy/65">
            {ts(locale, "experiences.soon_band_text")}
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center gap-2 border border-navy bg-navy px-6 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/60"
            >
              {ts(locale, "experiences.soon_band_cta")}
              <KayvilaPngIcon name="arrow-right" size={18} invert alt="" />
            </Link>
          </div>

          <p className="mt-14 text-[10px] font-bold uppercase tracking-[0.4em] text-navy/45">
            {ts(locale, "experiences.other_experiences")}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {others.map((other) => (
              <Link
                key={other}
                href={`/experiences/${other}`}
                className="inline-flex min-h-[48px] items-center gap-2 border border-navy/20 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-navy/75 transition-colors hover:border-navy/50 hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/60"
              >
                {ts(locale, `experiences.${other}.title`)}
                <KayvilaPngIcon name="arrow-right" size={16} alt="" />
              </Link>
            ))}
          </div>
        </div>
      </LandingSection>
    </LandingShell>
  );
}
