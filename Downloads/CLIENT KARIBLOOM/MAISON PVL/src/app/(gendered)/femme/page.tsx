import Link from 'next/link';
import { CollectionGrid } from '@/components/home/CollectionGrid';
import { EditorialBanner } from '@/components/home/EditorialBanner';

export default function FemmePage() {
  return (
    <>
      {/* Section 1: Hero Collection */}
      <section
        className="relative h-screen flex items-end p-[clamp(2rem,5vw,6rem)]"
        style={{ background: 'linear-gradient(135deg, #c4b5a5, #948575)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative z-10 max-w-[600px]">
          <p className="text-pvl-kicker text-pvl-gold mb-4">
            COLLECTION &Eacute;T&Eacute; 2026
          </p>
          <h1 className="text-pvl-hero-title text-white mb-8">
            La silhouette<br />f&eacute;minine
          </h1>
          <Link
            href="/femme/nouveautes"
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
            title: 'Robes',
            href: '/femme/nouveautes',
            imageStyle: { background: 'linear-gradient(135deg, #d4c5b5, #a49585)' },
            span: 'tall',
          },
          {
            title: 'Tailleurs',
            href: '/femme/essentiels',
            imageStyle: { background: 'linear-gradient(135deg, #b4a595, #847565)' },
          },
          {
            title: 'Soie',
            href: '/femme/silhouettes',
            imageStyle: { background: 'linear-gradient(135deg, #c4b5a5, #948575)' },
          },
        ]}
      />

      {/* Section 3: EditorialBanner */}
      <EditorialBanner
        kicker="ARTISANAT"
        title="L&apos;elegance feminine"
        body="Chaque creation est imaginee a Fort-de-France avec une exigence absolue. Dentelle de Calais, soie sauvage, lin francais — des matieres d'exception pour des pieces qui epousent le mouvement de la vie."
        href="/a-propos"
        linkLabel="En savoir plus"
        imageStyle={{ background: 'linear-gradient(135deg, #d4c5b5, #b4a595)' }}
      />
    </>
  );
}
