import Link from "next/link";
import { ArrowRight, Compass, Gem, Heart, MapPin, Shield, Sparkles } from "lucide-react";
import {
  LandingShell,
  LandingSection,
  LandingCtaBand,
  LandingBlockTitle,
} from "@/components/marketing/landing-sections";
import {
  EditorialImageSplit,
  EditorialIntro,
  EditorialServiceGrid,
} from "@/components/marketing/editorial-blocks";
import { PageHero } from "@/components/marketing/PageHero";
import { ScrollReveal } from "@/components/marketing/ScrollRevealWrapper";

export const metadata = {
  title: "Qui sommes-nous | Kayvila",
  description:
    "La mission de Kayvila : conciergerie de luxe, entretien et gestion de villas d'exception en Martinique.",
};

const ADN = [
  { icon: Shield, label: "Exigence & discrétion" },
  { icon: Gem, label: "Patrimoine & valeur" },
  { icon: MapPin, label: "Ancrage martiniquais" },
  { icon: Compass, label: "Ouverture sur l'île" },
  { icon: Sparkles, label: "Détail & finition" },
  { icon: Heart, label: "Confiance & relation" },
] as const;

export default function QuiSommesNousPage() {
  return (
    <LandingShell>
      <PageHero
        eyebrow="Martinique — collection privée"
        title="Kayvila"
        subtitle="Une conciergerie de luxe née du désir de révéler les plus belles adresses de l'île — avec la même rigueur qu'une maison de voyage internationale."
        imageSrc="/villa-hero.jpg"
        imageOpacity={0.5}
      />

      <ScrollReveal>
        <EditorialIntro title="Une maison, une vision">
          <p>
            Kayvila accompagne les propriétaires exigeants qui souhaitent confier leur bien à une équipe
            capable d&apos;aligner rentabilité, entretien impeccable et expérience voyageur haut de gamme.
          </p>
          <p>
            Nous croyons que le luxe n&apos;est pas une surcharge de promesses — c&apos;est la justesse des gestes, la
            fluidité des séjours et le respect du lieu. Du Rocher du Diamant aux plages du soleil, chaque
            collaboration est pensée pour durer.
          </p>
        </EditorialIntro>
      </ScrollReveal>

      <ScrollReveal>
        <EditorialServiceGrid
          eyebrow="Notre ADN"
          title="Ce qui nous rassemble"
          subtitle="Six axes qui structurent notre manière de travailler — comme des chapitres d'une même histoire."
          items={[...ADN]}
        />
      </ScrollReveal>

      <ScrollReveal>
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
                Le luxe, pour nous, c&apos;est la cohérence — entre ce que vous promettez en ligne et ce que vivent
                vos voyageurs sur place.
              </p>
            </>
          }
        />
      </ScrollReveal>

      <ScrollReveal>
        <LandingSection bg="white">
          <LandingBlockTitle eyebrow="L'esprit du nom" title="Rocher, plage, élégance" />
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="space-y-6 text-base leading-relaxed text-navy/80 lg:col-span-7">
              <p>
                Symbole de rareté et d&apos;élégance, Kayvila évoque la force du Rocher du Diamant et la
                douceur des plages ensoleillées. C&apos;est cette alliance que nous cultivons dans chaque détail.
              </p>
            </div>
            <aside className="flex flex-col justify-center border-t border-navy/10 pt-10 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
              <p className="font-display text-2xl leading-snug text-navy md:text-3xl">
                Le luxe, ce n&apos;est pas l&apos;excès — c&apos;est la justesse de chaque détail.
              </p>
              <span className="mt-8 block h-px w-12 bg-gold" aria-hidden />
            </aside>
          </div>
        </LandingSection>
      </ScrollReveal>

      {/* Section éditoriale — philosophie de la maison */}
      <ScrollReveal>
        <LandingSection bg="white">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/45">
              Notre vision
            </span>
            <h2 className="mt-4 font-display text-3xl font-normal leading-[1.08] text-navy md:text-4xl">
              Une conciergerie ancrée en Martinique
            </h2>
            <div className="mx-auto mt-4 h-px w-8 bg-gold/40" aria-hidden />
            <div className="mt-8 space-y-5 text-left text-[13px] leading-relaxed text-navy/60">
              <p>
                Kayvila est née d&apos;une conviction : chaque villa en Martinique possède un potentiel
                unique, trop souvent sous-exploité par une gestion standardisée. Notre approche est
                celle d&apos;une maison de voyage — chaque bien est traité comme une adresse d&apos;exception,
                chaque voyageur comme un invité.
              </p>
              <p>
                Basés au Diamant, nous connaissons le territoire, ses prestataires, ses artisans et
                ses spécificités. Cette connaissance locale est notre premier atout : elle nous permet
                d&apos;anticiper les besoins, de coordonner les interventions et de garantir une qualité
                constante, séjour après séjour.
              </p>
              <p>
                Notre modèle repose sur la transparence : commission de 20 % TTC sur les nuitées
                nettes, ménage et blanchisserie facturés aux voyageurs, réassort des consommables à
                nos frais dès la deuxième location. Pas de frais cachés, pas de mauvaise surprise.
              </p>
            </div>
          </div>
        </LandingSection>
      </ScrollReveal>

      <ScrollReveal>
        <LandingSection bg="offwhite">
          <LandingCtaBand title="Écrire au concierge">
            <p className="max-w-2xl text-center text-sm leading-relaxed text-navy/75 md:text-base">
              Projet de mise en location, exigences spécifiques, ou simple envie d&apos;échanger : nous vous répondons
              avec la même attention qu&apos;à nos voyages.
            </p>
            <Link href="/contact" className="btn-luxury bg-navy text-white">
              Nous contacter
              <ArrowRight size={16} strokeWidth={1} aria-hidden />
            </Link>
          </LandingCtaBand>
        </LandingSection>
      </ScrollReveal>
    </LandingShell>
  );
}
