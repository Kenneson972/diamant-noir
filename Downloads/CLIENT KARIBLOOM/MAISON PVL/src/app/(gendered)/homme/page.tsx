import Link from 'next/link';
import Image from 'next/image';
import { ImagePair } from '@/components/home/ImagePair';
import { EditorialBanner } from '@/components/home/EditorialBanner';
import { NewArrivals } from '@/components/home/NewArrivals';
import type { Product } from '@/types';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1920&h=1080&fit=crop';

const PAIR_IMAGES = {
  costumes: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=1000&fit=crop',
  maille: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=800&h=1000&fit=crop',
  manteaux: 'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800&h=1000&fit=crop',
  chemises: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&h=1000&fit=crop',
};

const BANNER_IMAGE = 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1920&h=1080&fit=crop';
const EDITORIAL_IMAGE = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop';

const NEW_ARRIVALS_HOMME: Product[] = [
  {
    id: 'na-m-0', slug: 'costume-napoli', name: 'Costume Napoli', description: '', gender: 'homme',
    category_id: '', collection_id: null, price: 649, compare_at_price: null, is_new: true, featured: true,
    images: [{ id: 'na-m-0-0', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=750&fit=crop', alt: 'Costume Napoli', width: 600, height: 750, position: 0 }, { id: 'na-m-0-1', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=750&fit=crop', alt: 'Costume Napoli vue 2', width: 600, height: 750, position: 1 }],
    variants: [], materials: null, care_instructions: null, created_at: '', updated_at: '',
  },
  {
    id: 'na-m-1', slug: 'manteau-firenze', name: 'Manteau Firenze', description: '', gender: 'homme',
    category_id: '', collection_id: null, price: 549, compare_at_price: null, is_new: true, featured: false,
    images: [{ id: 'na-m-1-0', url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&h=750&fit=crop', alt: 'Manteau Firenze', width: 600, height: 750, position: 0 }, { id: 'na-m-1-1', url: 'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=600&h=750&fit=crop', alt: 'Manteau Firenze vue 2', width: 600, height: 750, position: 1 }],
    variants: [], materials: null, care_instructions: null, created_at: '', updated_at: '',
  },
  {
    id: 'na-m-2', slug: 'pull-cote-amalfitaine', name: 'Pull Côte Amalfitaine', description: '', gender: 'homme',
    category_id: '', collection_id: null, price: 189, compare_at_price: null, is_new: true, featured: false,
    images: [{ id: 'na-m-2-0', url: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=600&h=750&fit=crop', alt: 'Pull Côte Amalfitaine', width: 600, height: 750, position: 0 }, { id: 'na-m-2-1', url: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=600&h=750&fit=crop', alt: 'Pull Côte Amalfitaine vue 2', width: 600, height: 750, position: 1 }],
    variants: [], materials: null, care_instructions: null, created_at: '', updated_at: '',
  },
  {
    id: 'na-m-3', slug: 'chemise-riviera', name: 'Chemise Riviera', description: '', gender: 'homme',
    category_id: '', collection_id: null, price: 229, compare_at_price: null, is_new: true, featured: false,
    images: [{ id: 'na-m-3-0', url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&h=750&fit=crop', alt: 'Chemise Riviera', width: 600, height: 750, position: 0 }, { id: 'na-m-3-1', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=750&fit=crop', alt: 'Chemise Riviera vue 2', width: 600, height: 750, position: 1 }],
    variants: [], materials: null, care_instructions: null, created_at: '', updated_at: '',
  },
  {
    id: 'na-m-4', slug: 'pantalon-toscane', name: 'Pantalon Toscane', description: '', gender: 'homme',
    category_id: '', collection_id: null, price: 289, compare_at_price: null, is_new: false, featured: false,
    images: [{ id: 'na-m-4-0', url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&h=750&fit=crop', alt: 'Pantalon Toscane', width: 600, height: 750, position: 0 }, { id: 'na-m-4-1', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=750&fit=crop', alt: 'Pantalon Toscane vue 2', width: 600, height: 750, position: 1 }],
    variants: [], materials: null, care_instructions: null, created_at: '', updated_at: '',
  },
  {
    id: 'na-m-5', slug: 'blazer-milano', name: 'Blazer Milano', description: '', gender: 'homme',
    category_id: '', collection_id: null, price: 459, compare_at_price: null, is_new: false, featured: false,
    images: [{ id: 'na-m-5-0', url: 'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=600&h=750&fit=crop', alt: 'Blazer Milano', width: 600, height: 750, position: 0 }, { id: 'na-m-5-1', url: 'https://images.unsplash.com/photo-1521341057461-6eb5f40b07ab?w=600&h=750&fit=crop', alt: 'Blazer Milano vue 2', width: 600, height: 750, position: 1 }],
    variants: [], materials: null, care_instructions: null, created_at: '', updated_at: '',
  },
];

export default function HommePage() {
  return (
    <>
      {/* Section 1: Hero full-bleed */}
      <section className="relative w-screen h-[100dvh]">
        <Image
          src={HERO_IMAGE}
          alt="Collection Homme"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute bottom-[4vw] left-[4vw] z-10">
          <h1 className="font-display text-[clamp(2rem,4.5vw,4rem)] font-normal leading-[1.05] text-white mb-6">
            L&apos;allure<br />masculine
          </h1>
          <Link
            href="/homme/nouveautes"
            className="group inline-flex items-center text-[0.6875rem] text-white/90 hover:text-white uppercase tracking-[0.2em] transition-colors"
          >
            D&Eacute;COUVRIR
            <span className="block w-0 group-hover:w-12 h-px bg-white/40 ml-3 transition-all duration-500" />
          </Link>
        </div>
      </section>

      {/* Section 2: Image Pair — Costumes / Maille */}
      <ImagePair
        left={{
          src: PAIR_IMAGES.costumes,
          alt: 'Costumes',
          href: '/homme/nouveautes',
          label: 'Costumes',
        }}
        right={{
          src: PAIR_IMAGES.maille,
          alt: 'Maille',
          href: '/homme/silhouettes',
          label: 'Maille',
        }}
      />

      {/* Section 3: Full Banner — Savoir-faire */}
      <EditorialBanner
        kicker="SAVOIR-FAIRE"
        title="L&apos;art de la coupe"
        href="/a-propos"
        linkLabel="En savoir plus"
        imageUrl={BANNER_IMAGE}
      />

      {/* Section 4: Image Pair — Manteaux / Chemises */}
      <ImagePair
        left={{
          src: PAIR_IMAGES.manteaux,
          alt: 'Manteaux',
          href: '/homme/essentiels',
          label: 'Manteaux',
        }}
        right={{
          src: PAIR_IMAGES.chemises,
          alt: 'Chemises',
          href: '/homme/nouveautes',
          label: 'Chemises',
        }}
      />

      {/* Section 5: Editorial Banner 2 — full-width photo */}
      <EditorialBanner
        kicker="COLLECTION"
        title="L&apos;essence du style"
        href="/homme/essentiels"
        linkLabel="Explorer"
        imageUrl={EDITORIAL_IMAGE}
      />

      {/* Section 6: New Arrivals */}
      <NewArrivals title="Nouveautés" products={NEW_ARRIVALS_HOMME} />
    </>
  );
}
