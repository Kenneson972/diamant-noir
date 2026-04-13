import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ArrowRight, Home, Landmark, MessageCircle, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";
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

const SERVICE_ICONS: Record<ServiceSlug, LucideIcon> = {
  marketing: TrendingUp,
  operations: Home,
  voyageurs: MessageCircle,
  menage: Sparkles,
  finance: Landmark,
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
  const d = SERVICE_DETAILS[slug];
  return {
    title: `${d.title} | Prestations — Diamant Noir`,
    description: d.metaDescription,
    openGraph: {
      title: `${d.title} | Diamant Noir`,
      description: d.metaDescription,
      images: [{ url: d.image, width: 1200, height: 630, alt: d.imageAlt }],
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

  const d = SERVICE_DETAILS[slug];
  const Icon = SERVICE_ICONS[slug];

  return (
    <LandingShell>

      {/* ── Hero — image plein format, titre superposé ────────────── */}
      <section
        className="relative overflow-hidden bg-navy"
        style={{ minHeight: "min(68vh, 560px)" }}
      >
        <Image
          src={d.image}
          alt={d.imageAlt}
          fill
          className="object-cover"
          style={{ objectPosition: d.imagePosition }}
          sizes="100vw"
          priority
        />

        {/* Vignette : claire en haut, sombre en bas pour lisibilité du titre */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.18) 40%, rgba(0,0,0,0.78) 100%)",
          }}
          aria-hidden
        />

        {/* Fil d'Ariane — en haut à gauche */}
        <nav
          aria-label="Fil d'Ariane"
          className="absolute left-6 top-6 z-10 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60 md:left-10 md:top-8"
        >
          <Link href="/prestations" className="transition-colors hover:text-white">
            Prestations
          </Link>
          <span className="text-white/25" aria-hidden>/</span>
          <span className="text-white/90">{d.title}</span>
        </nav>

        {/* Titre superposé en bas de l'image */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-10 md:px-12 md:pb-14">
          <div className="mx-auto max-w-5xl">
            {/* Eyebrow + icône */}
            <div className="mb-3 flex items-center gap-2.5">
              <Icon size={13} strokeWidth={1.5} className="shrink-0 text-gold" aria-hidden />
              <p className="text-[9px] font-bold uppercase tracking-[0.48em] text-gold/90">
                {d.eyebrow}
              </p>
            </div>

            {/* Ligne décorative or */}
            <div className="mb-4 h-px w-10 bg-gold/55" aria-hidden />

            {/* Titre principal */}
            <h1
              className="font-display font-normal text-white"
              style={{
                fontSize: "clamp(1.7rem, 4.5vw, 3.25rem)",
                letterSpacing: "0.07em",
                lineHeight: 1.08,
              }}
            >
              {d.title}
            </h1>

            {/* Tagline */}
            <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-white/60">
              {d.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* ── Items — grille 2 colonnes ──────────────────────────────── */}
      <LandingSection bg="offwhite">
        <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
          {d.items.map(({ title: iTitle, desc }) => (
            <div
              key={iTitle}
              className="group border border-navy/8 bg-white p-7 transition-all duration-300 hover:border-navy/18 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
            >
              {/* Ligne décorative or */}
              <div
                className="mb-4 h-px w-8 bg-gold/40 transition-colors duration-300 group-hover:bg-gold/70"
                aria-hidden
              />

              {/* Titre item */}
              <div className="mb-3 flex items-start gap-2.5">
                <Check
                  size={11}
                  strokeWidth={2.5}
                  className="mt-px shrink-0 text-gold"
                  aria-hidden
                />
                <h2 className="text-[10px] font-bold uppercase leading-snug tracking-[0.2em] text-navy">
                  {iTitle}
                </h2>
              </div>

              {/* Description */}
              <p className="pl-5 text-[13px] leading-relaxed text-navy/60">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </LandingSection>

      {/* ── Section Copilot Finance (si slug finance) ─────────────── */}
      {slug === "finance" && <FinanceCopilotSection />}

      {/* ── CTA bas de page ───────────────────────────────────────── */}
      <LandingSection bg="offwhite">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 h-px w-8 bg-gold/40" aria-hidden />
          <p className="text-[13px] leading-relaxed text-navy/60">
            Retour à la vue d&apos;ensemble des piliers ou passez à l&apos;étape suivante — estimation gratuite de votre villa.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/prestations#piliers"
              className="inline-flex min-h-[48px] items-center gap-2 border border-navy px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              Tous les piliers
            </Link>
            <Link
              href="/soumettre-ma-villa"
              className="inline-flex min-h-[48px] items-center gap-2 border border-navy bg-navy px-6 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              Soumettre ma villa <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </LandingSection>

    </LandingShell>
  );
}
