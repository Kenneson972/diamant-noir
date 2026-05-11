'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ProductCard } from './ProductCard';
import type { Product, Gender } from '@/types';

const SORT_OPTIONS = [
  { value: 'relevance', labelKey: 'common.pertinence' },
  { value: 'price-asc', labelKey: 'common.prix-croissant' },
  { value: 'price-desc', labelKey: 'common.prix-decroissant' },
  { value: 'newest', labelKey: 'common.nouveautes' },
];

const CATEGORIES: { slug: string; name: string }[] = [
  { slug: 'costumes', name: 'Costumes' },
  { slug: 'vestes', name: 'Vestes' },
  { slug: 'pantalons', name: 'Pantalons' },
  { slug: 'chemises', name: 'Chemises' },
  { slug: 'accessoires', name: 'Accessoires' },
];

export function ProductGrid({ gender }: { gender: Gender }) {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState('relevance');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <section className="py-section-md">
      <div className="container-pvl">
        {/* Filters bar */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-pvl-black/8">
          <div className="flex items-center gap-4">
            {/* Desktop categories */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  'text-[0.625rem] uppercase tracking-[0.2em] transition-colors',
                  !activeCategory
                    ? 'text-pvl-black font-medium'
                    : 'text-pvl-stone hover:text-pvl-black'
                )}
              >
                Tout voir
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() =>
                    setActiveCategory(
                      activeCategory === cat.slug ? null : cat.slug
                    )
                  }
                  className={cn(
                    'text-[0.625rem] uppercase tracking-[0.2em] transition-colors',
                    activeCategory === cat.slug
                      ? 'text-pvl-black font-medium'
                      : 'text-pvl-stone hover:text-pvl-black'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-[0.625rem] uppercase tracking-[0.2em] text-pvl-slate bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>

            {/* Mobile filter button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="md:hidden p-1.5 text-pvl-slate hover:text-pvl-black transition-colors"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Active filters */}
        {activeCategory && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[0.625rem] text-pvl-slate uppercase tracking-[0.1em]">
              Filtre actif :
            </span>
            <span className="flex items-center gap-1.5 bg-pvl-cream px-3 py-1.5 text-[0.625rem] uppercase tracking-[0.1em]">
              {activeCategory}
              <button onClick={() => setActiveCategory(null)}>
                <X size={12} />
              </button>
            </span>
          </div>
        )}

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 12 }).map((_, i) => {
            const product: Product = {
              id: `demo-${i}`,
              slug: `produit-demo-${i}`,
              name: i % 2 === 0
                ? 'Costume deux pièces en laine peignée'
                : 'Veste de tailleur structurée',
              description: '',
              gender,
              category_id: 'cat-1',
              collection_id: null,
              price: i % 3 === 0 ? 490 : i % 3 === 1 ? 350 : 220,
              compare_at_price: i % 4 === 0 ? 590 : null,
              images: [],
              variants: [],
              materials: null,
              care_instructions: null,
              is_new: i < 4,
              featured: i < 2,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            return <ProductCard key={product.id} product={product} />;
          })}
        </div>
      </div>
    </section>
  );
}
