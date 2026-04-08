import Link from "next/link";
import {
  Anchor,
  Calendar,
  Car,
  Check,
  Clock,
  Home,
  Landmark,
  MessageCircle,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { VillaSubmissionForm } from "@/components/marketing/VillaSubmissionForm";
import {
  LandingShell,
  LandingSection,
  LandingBlockTitle,
} from "@/components/marketing/landing-sections";
import {
  EditorialFigureBand,
  EditorialHeroImmersive,
  EditorialImageSplit,
  EditorialIntro,
  EditorialQuotes,
  EditorialServiceGrid,
  type EditorialQuote,
} from "@/components/marketing/editorial-blocks";

export const metadata = {
  title: "Prestations — Gestion complète en conciergerie | Diamant Noir",
  description:
    "Gestion complète en conciergerie : commission 20 % TTC, prestations incluses et pack de démarrage. Diamant Noir, Martinique.",
};

const SERVICES_HIGHLIGHT = [
  { icon: Car, label: "Transferts & accueil" },
  { icon: UtensilsCrossed, label: "Chef & art de la table" },
  { icon: Anchor, label: "Nautisme & escapades" },
  { icon: ShoppingBag, label: "Courses & bienvenue" },
  { icon: Sparkles, label: "Entretien & linge" },
  { icon: Calendar, label: "Pilotage des séjours" },
] as const;

/** Témoignage propriétaire — remonté après les services pour crédibiliser tôt */
const TEMOIGNAGE_PROPRIO: EditorialQuote = {
  quote:
    "Au-delà de la location, c'est un partenaire qui sécurise le bien, les réservations et la relation voyageurs. Une vraie tranquillité pour un propriétaire exigeant.",
  author: "M. R.",
  place: "Propriétaire — Sud Martinique",
};

/** Témoignages voyageurs — section dédiée en bas de page */
const TEMOIGNAGES_VOYAGEURS: EditorialQuote[] = [
  {
    quote:
      "La conciergerie a coordonné chaque détail avant notre arrivée : maison impeccable, linge parfait, recommandations locales justes. Nous n'avions qu'à profiter.",
    author: "Mme V.",
    place: "Séjour au Diamant, Martinique",
  },
  {
    quote:
      "Réactivité, discrétion et sens du détail : l'équipe a su organiser un dîner sur mesure et une sortie en mer sans que nous ayons à courir après les interlocuteurs.",
    author: "Mme & M. L.",
    place: "Séjour en famille",
  },
];

/** Inclusions regroupées par catégorie thématique */
const CATEGORIES_INCLUSIONS: {
  icon: LucideIcon;
  title: string;
  items: string[];
}[] = [
  {
    icon: TrendingUp,
    title: "Marketing & visibilité",
    items: [
      "Estimation de valeur locative",
      "Prise de photos professionnelles",
      "Rédaction et diffusion d'annonces ou optimisation d'une annonce existante",
      "Gestion dynamique des prix",
    ],
  },
  {
    icon: Home,
    title: "Opérations & terrain",
    items: [
      "Check-in / Check-out",
      "Contrôles qualité",
      "Organisation des ménages, petites réparations et suivi des intervenants",
      "Entretien et mise en place du linge de maison",
      "Réassort des consommables de bienvenue (à nos frais)",
    ],
  },
  {
    icon: MessageCircle,
    title: "Relation voyageurs",
    items: [
      "Pilotage des réservations",
      "Échanges avec les locataires",
      "Suivi des commentaires et valorisation de ceux-ci",
    ],
  },
  {
    icon: Landmark,
    title: "Finance & reporting",
    items: ["Encaissement et reversement des loyers"],
  },
];

const REASSURANCES: { icon: LucideIcon; text: string }[] = [
  { icon: Shield, text: "Pas d'exclusivité obligatoire" },
  { icon: Clock, text: "Réponse sous 48h garantie" },
  { icon: Star, text: "Estimation gratuite et sans engagement" },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Y a-t-il un engagement de durée ?",
    a: "Nous travaillons avec une période de découverte de 3 mois, renouvelable. Résiliable avec 30 jours de préavis, sans frais ni pénalité.",
  },
  {
    q: "Puis-je bloquer des dates pour ma propre utilisation ?",
    a: "Bien sûr. Vous conservez un accès complet au calendrier pour bloquer des périodes à votre convenance, à tout moment.",
  },
  {
    q: "Comment se passe la gestion du calendrier ?",
    a: "Nous pilotons intégralement le calendrier sur toutes les plateformes (Airbnb, Booking, site direct) avec une synchronisation automatique en temps réel.",
  },
  {
    q: "Est-ce que je garde la propriété de mes annonces ?",
    a: "Oui, vos annonces vous appartiennent. Nous les optimisons et les gérons pour votre compte, sans transfert de propriété.",
  },
  {
    q: "Quelle est la première étape ?",
    a: "Soumettez votre villa via le formulaire ci-contre. Nous vous recontactons sous 48h pour une estimation gratuite et sans engagement.",
  },
];

export default function PrestationsPage() {
  return (
    <LandingShell>

      {/* ── 1. Hero immersif ── */}
      <EditorialHeroImmersive
        eyebrow="Conciergerie de luxe — Martinique"
        title="Conciergerie"
        subtitle="Des experts locaux pour imaginer des séjours sur mesure, gérer votre bien avec exigence et offrir à vos voyageurs une expérience fluide du premier contact au départ."
        imageAlt="Villa de prestige en Martinique"
      />

      {/* ── 2. Strip CTA sous le hero ── */}
      <section className="bg-black px-5 py-8 sm:px-6 md:py-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="#soumettre"
              className="inline-flex min-h-[44px] items-center justify-center border border-white bg-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.24em] text-navy transition-colors hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Soumettre ma villa
            </Link>
            <Link
              href="#inclusions"
              className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50 underline-offset-8 transition-colors hover:text-white hover:underline"
            >
              Découvrir les inclusions ↓
            </Link>
          </div>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30">
            Commission 20&nbsp;% TTC · Équipe locale 7j/7 · Présence en Martinique
          </p>
        </div>
      </section>

      {/* ── 3. Bandeau 4 chiffres ── */}
      <section className="border-b border-black/[0.07] bg-offwhite px-5 py-10 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-5 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-3xl text-navy">13</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-navy/45">
              prestations incluses
            </span>
          </div>
          <span className="hidden h-6 w-px bg-black/10 sm:block" aria-hidden />
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-3xl text-navy">20&thinsp;%</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-navy/45">
              commission TTC
            </span>
          </div>
          <span className="hidden h-6 w-px bg-black/10 sm:block" aria-hidden />
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-3xl text-navy">100+</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-navy/45">
              séjours gérés
            </span>
          </div>
          <span className="hidden h-6 w-px bg-black/10 sm:block" aria-hidden />
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-3xl text-navy">7j/7</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-navy/45">
              équipe locale
            </span>
          </div>
        </div>
      </section>

      {/* ── 4. Intro éditoriale ── */}
      <EditorialIntro title="La conciergerie autrement">
        <p>
          Bien plus que des gestionnaires, nous sommes des passionnés qui connaissent le terrain : partenaires
          de confiance, exigence sur la qualité des prestations, et sens du détail pour chaque réservation.
        </p>
        <p>
          Notre mission est à la fois simple et exigeante : orchestrer des séjours d&apos;une fluidité parfaite —
          annonces, calendrier, accueil, entretien, relation voyageurs — pour que votre villa exprime tout le
          standing de la Martinique.
        </p>
      </EditorialIntro>

      {/* ── 5. Grille services ── */}
      <EditorialServiceGrid
        eyebrow="Au-delà des fondamentaux"
        title="Des services pensés pour l'insouciance"
        subtitle="Une sélection de leviers que nous activons selon votre bien et vos voyageurs — au même titre qu'une maison de voyage d'exception."
        items={[...SERVICES_HIGHLIGHT]}
      />

      {/* ── 6. Témoignage proprio remonté ── */}
      <section className="border-y border-black/[0.07] bg-white px-5 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          <blockquote className="space-y-6">
            <p className="font-display text-xl font-light leading-relaxed text-navy md:text-2xl md:leading-relaxed">
              &ldquo;{TEMOIGNAGE_PROPRIO.quote}&rdquo;
            </p>
            <footer>
              <cite className="not-italic text-[10px] font-bold uppercase tracking-[0.28em] text-navy/55">
                {TEMOIGNAGE_PROPRIO.author}
                <span className="mx-3 text-navy/25">·</span>
                {TEMOIGNAGE_PROPRIO.place}
              </cite>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ── 7. Image split présence locale ── */}
      <EditorialImageSplit
        eyebrow="Présence locale"
        title="Une équipe ancrée dans l'île"
        imageAlt="Paysage et littoral martiniquais"
        body={
          <>
            <p>
              Nous testons et sélectionnons les intervenants, harmonisons les créneaux et sécurisons la chaîne
              de confiance : ménage, petites réparations, accueil, fournisseurs. Résultat : une qualité stable
              et un discours unique pour vos voyageurs.
            </p>
            <p>
              Du Rocher du Diamant aux plages du Sud, nous adaptons le niveau de service à chaque adresse — en
              gardant la même exigence de discrétion.
            </p>
          </>
        }
      />

      {/* ── 8. Bande 20% ── */}
      <EditorialFigureBand
        label="Transparence"
        figure="20%"
        caption="TTC sur le montant net des nuitées collectées — frais de ménage et blanchisserie facturés aux voyageurs, hors commission."
      />

      {/* ── 9. Inclusions en catégories ── */}
      <LandingSection id="inclusions" bg="offwhite">
        <LandingBlockTitle eyebrow="Gestion complète" title="Inclus dans la formule" />
        <p className="-mt-4 mb-14 max-w-2xl text-sm leading-relaxed text-navy/65 md:text-[15px]">
          Le périmètre contractuel complet que nous mettons en œuvre pour votre villa, clé en main.
        </p>
        <div className="grid gap-10 md:grid-cols-2 md:gap-x-16 md:gap-y-12">
          {CATEGORIES_INCLUSIONS.map(({ icon: Icon, title, items }) => (
            <div key={title} className="space-y-5">
              <div className="flex items-center gap-3">
                <Icon size={18} strokeWidth={1.25} className="shrink-0 text-gold" aria-hidden />
                <h3 className="text-[11px] font-bold uppercase tracking-[0.28em] text-navy">
                  {title}
                </h3>
              </div>
              <ul className="space-y-3 border-l border-navy/8 pl-6">
                {items.map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-snug text-navy/75">
                    <Check size={14} strokeWidth={1} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </LandingSection>

      {/* ── 10. Témoignages voyageurs ── */}
      <EditorialQuotes
        eyebrow="Des séjours mémorables"
        title="Ce que disent nos voyageurs"
        quotes={TEMOIGNAGES_VOYAGEURS}
      />

      {/* ── 11. Pack de démarrage ── */}
      <LandingSection bg="white">
        <div className="mx-auto max-w-3xl border border-navy/10 bg-offwhite/40 px-8 py-14 md:px-14 md:py-16">
          <LandingBlockTitle eyebrow="Première location" title="Pack de démarrage (en supplément)" />
          <p className="-mt-4 text-sm leading-relaxed text-navy/75 md:text-[15px]">
            <span className="font-semibold text-navy">En supplément</span> — uniquement pour la{" "}
            <span className="font-semibold">première location</span> réalisée par notre conciergerie — un{" "}
            <span className="font-semibold">pack de démarrage</span> vous sera facturé (sucre, café, eau,
            poivre, huile, épices, papier toilette, savon, boîte à clefs, inventaire).
          </p>
        </div>
      </LandingSection>

      {/* ── 12. Section soumettre — rassurances + FAQ + formulaire ── */}
      <LandingSection id="soumettre" bg="offwhite">
        <LandingBlockTitle eyebrow="Devenez partenaire" title="Confiez-nous votre villa" />

        <div className="grid gap-14 md:grid-cols-2 md:gap-20">

          {/* Colonne gauche : rassurances + FAQ */}
          <div className="space-y-10">
            <p className="text-[15px] leading-relaxed text-navy/65">
              Rejoignez les propriétaires qui font confiance à Diamant Noir pour gérer leur bien
              avec exigence — et transformez votre villa en une expérience mémorable.
            </p>

            {/* Rassurances */}
            <ul className="space-y-4">
              {REASSURANCES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-4">
                  <Icon size={18} strokeWidth={1.25} className="shrink-0 text-gold" aria-hidden />
                  <span className="text-[13px] font-semibold text-navy/75">{text}</span>
                </li>
              ))}
            </ul>

            {/* FAQ accordéon */}
            <div className="space-y-0 border-t border-navy/10">
              {FAQ_ITEMS.map(({ q, a }) => (
                <details
                  key={q}
                  className="group border-b border-navy/10 py-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[12px] font-bold uppercase tracking-[0.2em] text-navy outline-none transition-colors hover:text-navy/70 [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="shrink-0 text-navy/40 transition-transform duration-200 group-open:rotate-180" aria-hidden>
                      ▾
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-navy/60">{a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Colonne droite : formulaire */}
          <div>
            <VillaSubmissionForm />
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-navy/50">
          Une question avant de soumettre ?{" "}
          <Link href="/contact" className="font-medium text-navy underline-offset-4 hover:underline">
            Contactez-nous directement
          </Link>
        </p>
      </LandingSection>

    </LandingShell>
  );
}
