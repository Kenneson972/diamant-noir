import Link from 'next/link';
import Image from 'next/image';
import { ImagePair } from '@/components/home/ImagePair';
import { EditorialBanner } from '@/components/home/EditorialBanner';
import { NewArrivals } from '@/components/home/NewArrivals';
import type { Product } from '@/types';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&h=1080&fit=crop';

const PAIR_IMAGES = {
  robes: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1000&fit=crop',
  tailleurs: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800&h=1000&fit=crop',
  soie: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=1000&fit=crop',
  manteau: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1000&fit=crop',
};

const BANNER_IMAGE = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop';
const EDITORIAL_IMAGE = 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1920&h=1080&fit=crop';

const NEW_ARRIVALS_FEMME: Product[] = [
  {
    id: 'na-f-0', slug: 'robe-capri', name: 'Robe Capri', description: '', gender: 'femme',
    category_id: '', collection_id: null, price: 349, compare_at_price: null, is_new: true, featured: true,
    images: [{ id: 'na-f-0-0', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=750&fit=crop', alt: 'Robe Capri', width: 600, height: 750, position: 0 }, { id: 'na-f-0-1', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=750&fit=crop', alt: 'Robe Capri vue 2', width: 600, height: 750, position: 1 }],
    variants: [], materials: null, care_instructions: null, created_at: '', updated_at: '',
  },
  {
    id: 'na-f-1', slug: 'tailleur-parisienne', name: 'Tailleur Parisienne', description: '', gender: 'femme',
    category_id: '', collection_id: null, price: 449, compare_at_price: null, is_new: true, featured: false,
    images: [{ id: 'na-f-1-0', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=750&fit=crop', alt: 'Tailleur Parisienne', width: 600, height: 750, position: 0 }, { id: 'na-f-1-1', url: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&h=750&fit=crop', alt: 'Tailleur Parisienne vue 2', width: 600, height: 750, position: 1 }],
    variants: [], materials: null, care_instructions: null, created_at: '', updated_at: '',
  },
  {
    id: 'na-f-2', slug: 'blouse-soie-naturelle', name: 'Blouse Soie Naturelle', description: '', gender: 'femme',
    category_id: '', collection_id: null, price: 249, compare_at_price: null, is_new: true, featured: false,
    images: [{ id: 'na-f-2-0', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=750&fit=crop', alt: 'Blouse Soie Naturelle', width: 600, height: 750, position: 0 }, { id: 'na-f-2-1', url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=750&fit=crop', alt: 'Blouse Soie Naturelle vue 2', width: 600, height: 750, position: 1 }],
    variants: [], materials: null, care_instructions: null, created_at: '', updated_at: '',
  },
  {
    id: 'na-f-3', slug: 'jupe-plissee-cote-azur', name: 'Jupe Plissée Côte d\'Azur', description: '', gender: 'femme',
    category_id: '', collection_id: null, price: 199, compare_at_price: null, is_new: true, featured: false,
    images: [{ id: 'na-f-3-0', url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=750&fit=crop', alt: 'Jupe Plissée Côte d\'Azur', width: 600, height: 750, position: 0 }, { id: 'na-f-3-1', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=750&fit=crop', alt: 'Jupe Plissée Côte d\'Azur vue 2', width: 600, height: 750, position: 1 }],
    variants: [], materials: null, care_instructions: null, created_at: '', updated_at: '',
  },
  {
    id: 'na-f-4', slug: 'manteau-laine-cachemire', name: 'Manteau Laine Cachemire', description: '', gender: 'femme',
    category_id: '', collection_id: null, price: 549, compare_at_price: null, is_new: false, featured: false,
    images: [{ id: 'na-f-4-0', url: 'https://images.unsplash.com/photo-1581044777550-4cfa60707998?w=600&h=750&fit=crop', alt: 'Manteau Laine Cachemire', width: 600, height: 750, position: 0 }, { id: 'na-f-4-1', url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=750&fit=crop', alt: 'Manteau Laine Cachemire vue 2', width: 600, height: 750, position: 1 }],
    variants: [], materials: null, care_instructions: null, created_at: '', updated_at: '',
  },
  {
    id: 'na-f-5', slug: 'top-satin-riviera', name: 'Top Satin Riviera', description: '', gender: 'femme',
    category_id: '', collection_id: null, price: 179, compare_at_price: null, is_new: false, featured: false,
    images: [{ id: 'na-f-5-0', url: 'https://images.unsplash.com/photo-1502716119720-b23a1e3b2b23?w=600&h=750&fit=crop', alt: 'Top Satin Riviera', width: 600, height: 750, position: 0 }, { id: 'na-f-5-1', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=750&fit=crop', alt: 'Top Satin Riviera vue 2', width: 600, height: 750, position: 1 }],
    variants: [], materials: null, care_instructions: null, created_at: '', updated_at: '',
  },
];

export default function FemmePage() {
  return (
    <>
      {/* Section 1: Hero full-bleed */}
      <section className="relative w-screen h-[100dvh]">
        <Image
          src={HERO_IMAGE}
          alt="Collection Femme"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute bottom-[4vw] left-[4vw] z-10">
          <h1 className="font-display text-[clamp(2rem,4.5vw,4rem)] font-normal leading-[1.05] text-white mb-6">
            La silhouette<br />f&eacute;minine
          </h1>
          <Link
            href="/femme/nouveautes"
            className="group inline-flex items-center text-[0.6875rem] text-white/90 hover:text-white uppercase tracking-[0.2em] transition-colors"
          >
            D&Eacute;COUVRIR
            <span className="block w-0 group-hover:w-12 h-px bg-white/40 ml-3 transition-all duration-500" />
          </Link>
        </div>
      </section>

      {/* Section 2: Image Pair — Robes / Tailleurs */}
      <ImagePair
        left={{
          src: PAIR_IMAGES.robes,
          alt: 'Robes',
          href: '/femme/nouveautes',
          label: 'Robes',
        }}
        right={{
          src: PAIR_IMAGES.tailleurs,
          alt: 'Tailleurs',
          href: '/femme/essentiels',
          label: 'Tailleurs',
        }}
      />

      {/* Section 3: Full Banner — Artisanat */}
      <EditorialBanner
        kicker="ARTISANAT"
        title="L&apos;elegance feminine"
        href="/a-propos"
        linkLabel="En savoir plus"
        imageUrl={BANNER_IMAGE}
      />

      {/* Section 4: Image Pair — Soie / Manteaux */}
      <ImagePair
        left={{
          src: PAIR_IMAGES.soie,
          alt: 'Soie',
          href: '/femme/silhouettes',
          label: 'Soie',
        }}
        right={{
          src: PAIR_IMAGES.manteau,
          alt: 'Manteaux',
          href: '/femme/nouveautes',
          label: 'Manteaux',
        }}
      />

      {/* Section 5: Editorial Banner 2 */}
      <EditorialBanner
        kicker="COLLECTION"
        title="L&apos;essence du style"
        href="/femme/essentiels"
        linkLabel="Explorer"
        imageUrl={EDITORIAL_IMAGE}
      />

      {/* Section 6: New Arrivals */}
      <NewArrivals title="Nouveautés" products={NEW_ARRIVALS_FEMME} />
    </>
  );
}
