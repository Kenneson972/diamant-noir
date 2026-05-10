import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Home, Landmark, MessageCircle, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";
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

const SERVICE_CONTEXT: Record<ServiceSlug, { intro: string; body: string; market: string }> = {
  marketing: {
    intro:
      "En Martinique, la visibilité d'une villa ne se décrète pas — elle se construit. Entre la concurrence des locations saisonnières et les attentes croissantes des voyageurs internationaux, une annonce standard ne suffit plus.",
    body:
      "Notre approche du marketing locatif repose sur un principe simple : votre villa doit être visible au bon endroit, au bon prix, avec les bonnes images. Nous ne nous contentons pas de publier une annonce — nous étudions le marché, la saisonnalité, le positionnement de votre bien et les tarifs pratiqués par les villas comparables. Cette analyse permet de définir une stratégie de prix dynamiques qui maximise votre taux d'occupation sans brader votre bien.",
    market:
      "Le marché martiniquais est marqué par une forte saisonnalité (haute saison de décembre à avril, basse saison de juin à novembre). Un prix unique à l'année est rarement optimal. Nos algorithmes ajustent les tarifs en temps réel selon la demande, les événements locaux et le comportement des voyageurs.",
  },
  operations: {
    intro:
      "La réussite d'une location saisonnière tient dans les détails opérationnels. Un voyageur qui arrive dans une villa impeccable, avec un accueil chaleureux et des équipements fonctionnels, est un voyageur qui revient et qui laisse une bonne note.",
    body:
      "Nous prenons en charge l'intégralité des opérations terrain : check-in et check-out avec remise des clés en main, visite de la villa, présentation des équipements et des bons plans locaux. Entre chaque séjour, une équipe dédiée inspecte la villa — équipements, électroménager, piscine, extérieurs — et coordonne le ménage, le linge et le réassort des consommables. Tout problème est identifié et résolu avant la prochaine arrivée.",
    market:
      "En Martinique, la coordination des prestataires est un enjeu clé : artisans, piscinistes, jardiniers, femmes de ménage. Notre carnet d'adresses local nous permet d'intervenir rapidement et de garantir une qualité constante — là où un propriétaire distant perdrait un temps précieux à chercher un intervenant de confiance.",
  },
  voyageurs: {
    intro:
      "La relation avec les voyageurs est souvent ce qui rebute les propriétaires : les messages à toute heure, les demandes spéciales, les imprévus de dernière minute. Notre mission est de vous libérer totalement de cette charge mentale.",
    body:
      "Nous sommes l'unique interlocuteur des voyageurs, de la première demande de réservation au message de remerciement après le séjour. Modifications, annulations, demandes particulières, urgences — tout passe par notre équipe, 7 jours sur 7. Vous ne recevez aucune notification, aucun appel, aucun message. Notre taux de réponse moyen est inférieur à 2 heures, et nous maintenons une note moyenne de 4,9 sur l'ensemble des villas que nous gérons.",
    market:
      "Les voyageurs qui choisissent la Martinique viennent du monde entier : France métropolitaine, Europe, Amérique du Nord, parfois Asie. Chaque marché a ses codes, ses attentes et ses fuseaux horaires. Notre équipe maîtrise ces différences culturelles et adapte sa communication en conséquence.",
  },
  menage: {
    intro:
      "Le ménage et la blanchisserie sont des services souvent sous-estimés dans leur impact sur la note et le taux de retour des voyageurs. Une villa impeccable est le premier critère de satisfaction — et le premier motif de plainte quand ce n'est pas le cas.",
    body:
      "Notre modèle est simple et transparent : les frais de ménage et de blanchisserie sont facturés aux voyageurs, pas à vous. Vous ne les avancez jamais, et ils ne sont pas soumis à notre commission de 20 % — vous conservez 100 % de ces montants. Le réassort des consommables de bienvenue (café, eau, savon, gel douche) est également à nos frais dès la deuxième location. Nous coordonnons et supervisons également l'entretien de la piscine et du jardin via des prestataires agréés (service facturé en sus, sur abonnement).",
    market:
      "En Martinique, l'humidité et la végétation tropicale imposent un rythme d'entretien plus soutenu qu'en métropole. Piscine, jardin, traitement anti-moustiques : un planning rigoureux est essentiel pour maintenir la villa au standard attendu par les voyageurs haut de gamme.",
  },
  finance: {
    intro:
      "La gestion financière d'une location saisonnière peut rapidement devenir complexe : encaissements multiples, commissions variables, devises, déclarations. Notre objectif est de rendre cette partie aussi transparente que possible.",
    body:
      "Nous collectons l'intégralité des paiements voyageurs et vous reversons vos revenus chaque mois, avec un relevé détaillé. Notre commission est de 20 % TTC sur les nuitées nettes — pas de frais cachés, pas de surprise. Le ménage et la blanchisserie, facturés aux voyageurs, sont hors commission. Vous disposez d'un espace propriétaire en ligne pour consulter réservations, revenus et interventions à tout moment. Pour les premières mises en location, un pack de démarrage est facturé une seule fois (inventaire, consommables initiaux, boîte à clés).",
    market:
      "Le marché locatif martiniquais connaît des fluctuations saisonnières marquées. Notre outil Copilot (inclus dans votre espace propriétaire) vous donne une visibilité précise sur les revenus prévisionnels, l'évolution de votre taux d'occupation et les tendances du marché local — de quoi piloter votre investissement en toute connaissance de cause.",
  },
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
    title: `${d.title} | Prestations — Kayvila`,
    description: d.metaDescription,
    openGraph: {
      title: `${d.title} | Kayvila`,
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
  const ctx = SERVICE_CONTEXT[slug];

  return (
    <LandingShell>
      {/* ── Hero — image plein format, titre superposé ─── */}
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

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.18) 40%, rgba(0,0,0,0.78) 100%)",
          }}
          aria-hidden
        />

        <nav
          aria-label="Fil d'Ariane"
          className="absolute left-6 top-20 z-10 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60 md:left-10 md:top-24"
        >
          <Link href="/prestations" className="transition-colors hover:text-white">
            Prestations
          </Link>
          <span className="text-white/25" aria-hidden>/</span>
          <span className="text-white/90">{d.title}</span>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-10 md:px-12 md:pb-14">
          <div className="mx-auto max-w-5xl">
            <div className="mb-3 flex items-center gap-2.5">
              <Icon size={13} strokeWidth={1.5} className="shrink-0 text-gold" aria-hidden />
              <p className="text-[9px] font-bold uppercase tracking-[0.48em] text-gold/90">
                {d.eyebrow}
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
              {d.title}
            </h1>
            <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-white/60">
              {d.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 1 — Intro : Texte [gauche] | Image [droite] ═══ */}
      <section className="border-b border-navy/[0.06] bg-offwhite px-5 py-16 sm:px-6 md:py-24 lg:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Texte */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/45">
              Notre approche
            </span>
            <h2 className="mt-4 font-display text-3xl font-normal leading-[1.08] text-navy md:text-4xl">
              {d.title}
            </h2>
            <div className="mt-4 h-px w-8 bg-gold/40" aria-hidden />
            <p className="mt-6 text-[15px] leading-relaxed text-navy/75 md:text-[17px]">
              {ctx.intro}
            </p>
          </div>
          {/* Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={d.images.sectionIntro}
              alt={d.images.sectionIntroAlt}
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
                alt={d.images.sectionDetailsAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
          {/* Texte */}
          <div className="lg:order-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/45">
              Comment nous travaillons
            </span>
            <h2 className="mt-4 font-display text-3xl font-normal leading-[1.08] text-navy md:text-4xl">
              Ce que nous incluons
            </h2>
            <div className="mt-4 h-px w-8 bg-gold/40" aria-hidden />
            <div className="mt-8 space-y-6 text-[13px] leading-relaxed text-navy/60">
              {d.items.map(({ title: iTitle, desc }, idx) => (
                <div key={iTitle}>
                  <span className="mr-2 text-[10px] font-bold text-gold/60">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-navy">
                    {iTitle}
                  </h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3 — Contexte : Texte [gauche] | Image [droite] ═══ */}
      <section className="border-b border-navy/[0.06] bg-offwhite px-5 py-16 sm:px-6 md:py-24 lg:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Texte */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/45">
              Contexte local
            </span>
            <h2 className="mt-4 font-display text-3xl font-normal leading-[1.08] text-navy md:text-4xl">
              La Martinique, un marché singulier
            </h2>
            <div className="mt-4 h-px w-8 bg-gold/40" aria-hidden />
            <div className="mt-8 space-y-5 text-[13px] leading-relaxed text-navy/60">
              <p>{ctx.market}</p>
            </div>
          </div>
          {/* Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={d.images.sectionMarket}
              alt={d.images.sectionMarketAlt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* ── Section Copilot Finance (si slug finance) ─── */}
      {slug === "finance" && <FinanceCopilotSection />}

      {/* ── CTA bas de page ───────────────────────────── */}
      <LandingSection bg="white">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 h-px w-8 bg-gold/40" aria-hidden />
          <p className="text-[13px] leading-relaxed text-navy/60">
            Prêt à passer à l&apos;étape suivante ? Recevez une estimation gratuite de votre villa
            et découvrez ce que Kayvila peut apporter à votre patrimoine.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/prestations"
              scroll={true}
              className="inline-flex min-h-[48px] items-center gap-2 border border-navy px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              Tous les piliers
            </Link>
            {(() => {
              const currentIdx = SERVICE_SLUGS.indexOf(slug as ServiceSlug);
              const nextIdx = (currentIdx + 1) % SERVICE_SLUGS.length;
              const nextSlug = SERVICE_SLUGS[nextIdx];
              const next = SERVICE_DETAILS[nextSlug as ServiceSlug];
              const isLoop = nextIdx === 0;
              return (
                <Link
                  href={`/prestations/services/${nextSlug}`}
                  className="inline-flex min-h-[48px] items-center gap-2 border border-navy/25 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                >
                  {isLoop ? "Retour au pilier 1 :" : "Pilier suivant :"} {next.title} <ArrowRight size={14} aria-hidden />
                </Link>
              );
            })()}
            <Link
              href="/soumettre-ma-villa"
              className="inline-flex min-h-[48px] items-center gap-2 border border-navy bg-navy px-6 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              Confier ma villa <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </LandingSection>
    </LandingShell>
  );
}
