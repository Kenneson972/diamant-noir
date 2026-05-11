import type { Metadata } from 'next';
import { Quote } from 'lucide-react';

export const metadata: Metadata = {
  title: 'À propos — Maison PVL',
  description:
    'Découvrez l\'histoire de Maison PVL, une maison de mode française dédiée à l\'élégance sur mesure et au savoir-faire artisanal.',
};

const VALUES = [
  {
    title: 'Savoir-faire artisanal',
    description:
      'Chaque pièce Maison PVL est le fruit d\'un savoir-faire transmis de génération en génération. Nos ateliers sélectionnés avec soin perpétuent l\'excellence de la confection française et italienne.',
  },
  {
    title: 'Matières d\'exception',
    description:
      'Nous sélectionnons les plus beaux tissus : laines peignées d\'Angleterre, cotons égyptiens, soies sauvages et cuirs italiens. Chaque matière est choisie pour sa qualité, sa tenue et sa capacité à traverser le temps.',
  },
  {
    title: 'Élégance intemporelle',
    description:
      'Nos collections sont pensées pour durer. Loin des tendances éphémères, chaque vêtement incarne une élégance sobre et raffinée qui transcende les saisons.',
  },
  {
    title: 'Engagement durable',
    description:
      'Nous croyons en une mode plus responsable. Production en petites séries, circuits courts, emballages recyclés et zéro plastique : chaque geste compte pour réduire notre empreinte.',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="container-pvl py-section-lg">
        <div className="max-w-3xl">
          <p className="text-pvl-kicker mb-4">La Maison</p>
          <h1 className="text-pvl-hero-title mb-6">
            L&apos;élégance
            <br />
            sur mesure
          </h1>
          <p className="text-pvl-manifesto">
            Maison PVL est née d&apos;une conviction : le vêtement est bien plus
            qu&apos;un accessoire. C&apos;est une expression de soi, un geste,
            une signature.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-pvl-cream py-section-md">
        <div className="container-pvl">
          <div className="max-w-3xl mx-auto">
            <div className="relative mb-10">
              <Quote
                size={32}
                className="text-pvl-stone/30 absolute -top-2 -left-2"
                strokeWidth={1}
              />
              <p className="text-pvl-manifesto italic pl-10">
                La mode est une architecture : une affaire de proportions, de
                lignes et de silence.
              </p>
            </div>
            <div className="space-y-4 text-sm text-pvl-slate leading-relaxed">
              <p>
                Fondée à Paris en 2020, Maison PVL est le fruit d&apos;une
                rencontre entre la tradition couturière française et une vision
                résolument contemporaine de la mode masculine et féminine.
              </p>
              <p>
                Chaque collection explore l&apos;équilibre subtil entre la
                structure et le mouvement, le classicisme et l&apos;audace. Nos
                pièces sont conçues pour celles et ceux qui recherchent une
                élégance sans effort, une qualité irréprochable et une
                singularité discrète.
              </p>
              <p>
                De l&apos;esquisse au prototype, du choix du tissu aux finitions,
                chaque étape de la création est pensée avec la même exigence :
                offrir des vêtements qui accompagnent nos clients dans les
                moments importants de leur vie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container-pvl py-section-lg">
        <div className="max-w-3xl">
          <p className="text-pvl-kicker mb-4">Notre philosophie</p>
          <h2 className="text-pvl-section-title mb-12">
            Ce qui fait notre différence
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {VALUES.map(({ title, description }, index) => (
            <div key={index}>
              <span className="text-pvl-meta block mb-2">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display text-xl mb-3">{title}</h3>
              <p className="text-sm text-pvl-slate leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-pvl-black text-pvl-white py-section-md">
        <div className="container-pvl text-center">
          <h2 className="font-display text-2xl md:text-3xl mb-4">
            Prêt à découvrir la collection ?
          </h2>
          <p className="text-sm text-pvl-stone mb-8 max-w-md mx-auto">
            Parcourez nos pièces pensées pour celles et ceux qui recherchent
            l&apos;excellence.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/homme"
              className="inline-block border border-pvl-white/30 text-pvl-white px-8 py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-white hover:text-pvl-black transition-colors"
            >
              Collection Homme
            </a>
            <a
              href="/femme"
              className="inline-block border border-pvl-white/30 text-pvl-white px-8 py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-white hover:text-pvl-black transition-colors"
            >
              Collection Femme
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
