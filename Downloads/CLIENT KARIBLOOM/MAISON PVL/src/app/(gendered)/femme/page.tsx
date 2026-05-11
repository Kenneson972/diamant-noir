'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CollectionGrid } from '@/components/home/CollectionGrid';
import { EditorialBanner } from '@/components/home/EditorialBanner';
import { NewArrivals } from '@/components/home/NewArrivals';

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] as const },
  },
};

export default function FemmePage() {
  return (
    <>
      {/* Section 1: Hero Collection */}
      <section
        className="relative h-screen flex items-end p-[clamp(2rem,5vw,6rem)]"
        style={{ background: 'linear-gradient(135deg, #c4b5a5, #948575)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } },
          }}
          className="relative z-10 max-w-[600px]"
        >
          <motion.p variants={staggerItem} className="text-pvl-kicker text-pvl-gold mb-4">
            COLLECTION &Eacute;T&Eacute; 2026
          </motion.p>
          <motion.h1 variants={staggerItem} className="text-pvl-hero-title text-white mb-8">
            La silhouette<br />f&eacute;minine
          </motion.h1>
          <motion.div variants={staggerItem}>
            <Link
              href="/femme/nouveautes"
              className="group inline-flex items-center gap-0 text-pvl-meta text-white uppercase"
            >
              D&Eacute;COUVRIR
              <span className="block w-0 group-hover:w-full h-px bg-white/50 ml-2 transition-all duration-400" />
            </Link>
          </motion.div>
        </motion.div>
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

      {/* Section 3: EditorialBanner + NewArrivals */}
      <EditorialBanner
        kicker="ARTISANAT"
        title="L'élégance féminine"
        body="Chaque création est imaginée à Fort-de-France avec une exigence absolue. Dentelle de Calais, soie sauvage, lin français — des matières d'exception pour des pièces qui épousent le mouvement de la vie."
        href="/a-propos"
        linkLabel="En savoir plus"
        imageStyle={{ background: 'linear-gradient(135deg, #d4c5b5, #b4a595)' }}
      />
      <NewArrivals title="NOUVEAUTÉS" products={[]} />
    </>
  );
}
