import Link from 'next/link';
import { CollectionGrid } from '@/components/home/CollectionGrid';
import { EditorialBanner } from '@/components/home/EditorialBanner';

export default function HommePage() {
  return (
    <>
      {/* Section 1: Hero Collection */}
      <section
        className="relative h-screen flex items-end p-[clamp(2rem,5vw,6rem)]"
        style={{ background: 'linear-gradient(135deg, #5a4c3a, #3a2c1a)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative z-10 max-w-[600px]">
          <p className="text-pvl-kicker text-pvl-gold mb-4">
            COLLECTION &Eacute;T&Eacute; 2026
          </p>
          <h1 className="text-pvl-hero-title text-white mb-8">
            L&apos;allure<br />masculine
          </h1>
          <Link
            href="/homme/nouveautes"
            className="group inline-flex items-center gap-0 text-pvl-meta text-white uppercase"
          >
            D&Eacute;COUVRIR
            <span className="block w-0 group-hover:w-full h-px bg-white/50 ml-2 transition-all duration-400" />
          </Link>
        </div>
      </section>

      {/* Section 2: CollectionGrid */}
      <CollectionGrid
        blocks={[
          {
            title: 'Costumes',
            href: '/homme/nouveautes',
            imageStyle: { background: 'linear-gradient(135deg, #8b7d6b, #5a4c3a)' },
            span: 'tall',
          },
          {
            title: 'Manteaux',
            href: '/homme/essentiels',
            imageStyle: { background: 'linear-gradient(135deg, #6b5d4b, #4a3c2a)' },
          },
          {
            title: 'Maille',
            href: '/homme/silhouettes',
            imageStyle: { background: 'linear-gradient(135deg, #7b6d5b, #5a4c3a)' },
          },
        ]}
      />

      {/* Section 3: EditorialBanner */}
      <EditorialBanner
        kicker="SAVOIR-FAIRE"
        title="L&apos;art de la coupe"
        body="Chaque pièce est pensée et dessinée à Fort-de-France. Nous sélectionnons les plus belles matières — lin italien, coton égyptien, laine mérinos — pour des vêtements qui traversent les saisons sans perdre leur éclat."
        href="/a-propos"
        linkLabel="En savoir plus"
        imageStyle={{ background: 'linear-gradient(135deg, #a49585, #847565)' }}
      />
    </>
  );
}
