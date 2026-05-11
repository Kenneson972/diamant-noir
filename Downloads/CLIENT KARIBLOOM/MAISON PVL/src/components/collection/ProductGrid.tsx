'use client';

import { useState } from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/types';

interface ProductGridProps {
  products: Product[];
}

const FILTERS = [
  { label: 'Taille', options: ['XS', 'S', 'M', 'L', 'XL'] },
  { label: 'Couleur', options: ['Noir', 'Blanc', 'Beige', 'Bleu'] },
  { label: 'Prix', options: ['Croissant', 'Décroissant'] },
  { label: 'Matière', options: ['Coton', 'Lin', 'Laine', 'Soie'] },
];

export function ProductGrid({ products }: ProductGridProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  return (
    <div>
      {/* Filter bar — discreet, editorial */}
      <div className="flex items-center gap-6 px-[1.25rem] md:px-[2rem] py-6 border-b border-pvl-stone/10">
        {FILTERS.map((filter) => (
          <div key={filter.label} className="relative">
            <button
              onClick={() => setOpenFilter(openFilter === filter.label ? null : filter.label)}
              className="text-pvl-kicker text-pvl-slate hover:text-pvl-black transition-colors"
            >
              {filter.label}
            </button>
            {openFilter === filter.label && (
              <div
                className="absolute top-full left-0 mt-2 bg-pvl-white border border-pvl-stone/10 py-2 min-w-[140px] z-20"
                style={{ borderRadius: 'var(--radius-card)' }}
              >
                {filter.options.map((opt) => (
                  <button
                    key={opt}
                    className="block w-full text-left px-4 py-2 text-[0.75rem] text-pvl-slate hover:text-pvl-black hover:bg-pvl-cream transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-[2px]">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
