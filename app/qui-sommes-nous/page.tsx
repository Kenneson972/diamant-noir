import Link from "next/link";
import { ArrowRight, Compass, Gem, Heart, MapPin, Shield, Sparkles } from "lucide-react";
import {
  LandingShell,
  LandingSection,
  LandingCtaBand,
  LandingBlockTitle,
} from "@/components/marketing/landing-sections";
import {
  EditorialHeroImmersive,
  EditorialImageSplit,
  EditorialIntro,
  EditorialQuotes,
  EditorialServiceGrid,
  type EditorialQuote,
} from "@/components/marketing/editorial-blocks";

export const metadata = {
  title: "Qui sommes-nous | Diamant Noir",
  description:
    "La mission de Diamant Noir : conciergerie de luxe, entretien et gestion de villas d'exception en Martinique.",
};

const ADN = [
  { icon: Shield, label: "Exigence & discrétion" },
  { icon: Gem, label: "Patrimoine & valeur" },
  { icon: MapPin, label: "Ancrage martiniquais" },
  { icon: Compass, label: "Ouverture sur l’île" },
  { icon: Sparkles, label: "Détail & finition" },
  { icon: Heart, label: "Confiance & relation" },
] as const;

const TEMOIGNAGES: EditorialQuote[] = [
  {
    quote:
      "Une approche très « maison de voyage » : le niveau de soin sur la villa et les voyageurs dépasse ce que nous attendions d’un gestionnaire classique.",
    author: "M. D.",
    place: "Propriétaire — Le Diamant",
  },
  {
    quote:
      "Nous cherchions une équipe capable de parler le même langage que nos hôtes internationaux. Réactivité, élégance dans les échanges, zéro friction.",
    author: "Mme B.",
    place: "Gestion locative premium",
  },
  {
    quote:
      "Le Rocher, les plages du Sud : ils savent mettre en récit le lieu sans tomber dans le marketing creux. C’est précis, beau, honnête.",
    author: "M. & Mme T.",
    place: "Séjour & inspiration",
  },
];

export default function QuiSommesNousPage() {
  return (
    <LandingShell>
      <EditorialHeroImmersive
        eyebrow="Martinique — collection privée"
        title="Diamant Noir"
        subtitle="Une conciergerie de luxe née du désir de révéler les plus belles adresses de l’île — avec la même rigueur qu’une maison de voyage internationale."
        imageAlt="Villa et horizon martiniquais"
      />

      <EditorialIntro title="Une maison, une vision">
        <p>
          Diamant Noir accompagne les propriétaires exigeants qui souhaitent confier leur bien à une équipe
          capable d’aligner rentabilité, entretien impeccable et expérience voyageur haut de gamme.
        </p>
        <p>
          Nous croyons que le luxe n’est pas une surcharge de promesses — c’est la justesse des gestes, la
          fluidité des séjours et le respect du lieu. Du Rocher du Diamant aux plages du soleil, chaque
          collaboration est pensée pour durer.
        </p>
      </EditorialIntro>

      <EditorialServiceGrid
        eyebrow="Notre ADN"
        title="Ce qui nous rassemble"
        subtitle="Six axes qui structurent notre manière de travailler — comme des chapitres d’une même histoire."
        items={[...ADN]}
      />

      <EditorialImageSplit
        eyebrow="Mission"
        title="Préserver, sublimer, accueillir"
        imagePosition="right"
        imageAlt="Intérieur et lumière naturelle"
        body={
          <>
            <p>
              Conciergerie haut de gamme, entretien des espaces et des piscines, ménage et remise en état,
              états des lieux rigoureux : nous protégeons votre patrimoine tout en offrant à vos hôtes une
              expérience mémorable.
            </p>
            <p>
              Le luxe, pour nous, c’est la cohérence — entre ce que vous promettez en ligne et ce que vivent
              vos voyageurs sur place.
            </p>
          </>
        }
      />

      <LandingSection bg="white">
        <LandingBlockTitle eyebrow="L’esprit du nom" title="Rocher, plage, élégance" />
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-6 text-base leading-relaxed text-navy/80 lg:col-span-7">
            <p>
              Symbole de rareté et d’élégance, le diamant noir évoque la force du Rocher du Diamant et la
              douceur des plages ensoleillées. C’est cette alliance que nous cultivons dans chaque détail.
            </p>
          </div>
          <aside className="flex flex-col justify-center border-t border-navy/10 pt-10 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            <p className="font-display text-2xl leading-snug text-navy md:text-3xl">
              Le luxe, ce n’est pas l’excès — c’est la justesse de chaque détail.
            </p>
            <span className="mt-8 block h-px w-12 bg-gold" aria-hidden />
          </aside>
        </div>
      </LandingSection>

      <EditorialQuotes
        eyebrow="Récits"
        title="Ce qui nous ressemble"
        quotes={TEMOIGNAGES}
      />

      <LandingSection bg="offwhite">
        <LandingCtaBand title="Écrire au concierge">
          <p className="max-w-2xl text-center text-sm leading-relaxed text-navy/75 md:text-base">
            Projet de mise en location, exigences spécifiques, ou simple envie d’échanger : nous vous répondons
            avec la même attention qu’à nos voyages.
          </p>
          <Link href="/contact" className="btn-luxury bg-black text-white">
            Nous contacter
            <ArrowRight size={16} strokeWidth={1} aria-hidden />
          </Link>
        </LandingCtaBand>
      </LandingSection>
    </LandingShell>
  );
}
