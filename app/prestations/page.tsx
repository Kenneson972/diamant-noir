import Link from "next/link";
import {
  Anchor,
  ArrowRight,
  Calendar,
  Car,
  Check,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
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
import { INCLUSIONS_COL_A, INCLUSIONS_COL_B } from "@/lib/proprietaires-data";

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

const TEMOIGNAGES: EditorialQuote[] = [
  {
    quote:
      "La conciergerie a coordonné chaque détail avant notre arrivée : maison impeccable, linge parfait, recommandations locales justes. Nous n’avions qu’à profiter.",
    author: "Mme V.",
    place: "Séjour au Diamant, Martinique",
  },
  {
    quote:
      "Au-delà de la location, c’est un partenaire qui sécurise le bien, les réservations et la relation voyageurs. Une vraie tranquillité pour un propriétaire exigeant.",
    author: "M. R.",
    place: "Propriétaire — Sud Martinique",
  },
  {
    quote:
      "Réactivité, discrétion et sens du détail : l’équipe a su organiser un dîner sur mesure et une sortie en mer sans que nous ayons à courir après les interlocuteurs.",
    author: "Mme & M. L.",
    place: "Séjour en famille",
  },
];

export default function PrestationsPage() {
  return (
    <LandingShell>
      <EditorialHeroImmersive
        eyebrow="Conciergerie de luxe — Martinique"
        title="Conciergerie"
        subtitle="Des experts locaux pour imaginer des séjours sur mesure, gérer votre bien avec exigence et offrir à vos voyageurs une expérience fluide du premier contact au départ."
        imageAlt="Villa de prestige en Martinique"
      />

      <EditorialIntro title="La conciergerie autrement">
        <p>
          Bien plus que des gestionnaires, nous sommes des passionnés qui connaissent le terrain : partenaires
          de confiance, exigence sur la qualité des prestations, et sens du détail pour chaque réservation.
        </p>
        <p>
          Notre mission est à la fois simple et exigeante : orchestrer des séjours d’une fluidité parfaite —
          annonces, calendrier, accueil, entretien, relation voyageurs — pour que votre villa exprime tout le
          standing de la Martinique.
        </p>
      </EditorialIntro>

      <EditorialServiceGrid
        eyebrow="Au-delà des fondamentaux"
        title="Des services pensés pour l’insouciance"
        subtitle="Une sélection de leviers que nous activons selon votre bien et vos voyageurs — au même titre qu’une maison de voyage d’exception."
        items={[...SERVICES_HIGHLIGHT]}
      />

      <EditorialImageSplit
        eyebrow="Présence locale"
        title="Une équipe ancrée dans l’île"
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

      <EditorialFigureBand
        label="Transparence"
        figure="20%"
        caption="TTC sur le montant net des nuitées collectées — frais de ménage et blanchisserie facturés aux voyageurs, hors commission."
      />

      <LandingSection bg="offwhite">
        <LandingBlockTitle eyebrow="Gestion complète" title="Inclus dans la formule" />
        <p className="-mt-4 mb-12 max-w-2xl text-sm leading-relaxed text-navy/65 md:text-[15px]">
          Le périmètre contractuel détaillé que nous mettons en œuvre pour votre villa lorsque vous nous
          confiez la gestion clé en main.
        </p>
        <div className="grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          <ul className="space-y-4">
            {INCLUSIONS_COL_A.map((line) => (
              <li key={line} className="flex gap-3 text-sm text-navy/85 md:text-[15px]">
                <span className="mt-0.5 shrink-0 text-gold" aria-hidden>
                  <Check size={18} strokeWidth={1} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <ul className="space-y-4">
            {INCLUSIONS_COL_B.map((line) => (
              <li key={line} className="flex gap-3 text-sm text-navy/85 md:text-[15px]">
                <span className="mt-0.5 shrink-0 text-gold" aria-hidden>
                  <Check size={18} strokeWidth={1} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </LandingSection>

      <EditorialQuotes
        eyebrow="Des séjours mémorables"
        title="Ce que disent nos voyageurs & propriétaires"
        quotes={TEMOIGNAGES}
      />

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

        <div className="mx-auto mt-20 flex max-w-2xl flex-col items-center gap-8 text-center">
          <Link href="/soumettre-ma-villa" className="btn-luxury bg-black text-white">
            Soumettre ma villa
            <ArrowRight size={16} strokeWidth={1} />
          </Link>
          <p className="text-xs text-navy/45">
            Une question sur cette formule ?{" "}
            <Link href="/contact" className="font-medium text-navy underline-offset-4 hover:underline">
              Contactez-nous
            </Link>
          </p>
        </div>
      </LandingSection>
    </LandingShell>
  );
}
