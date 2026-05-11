'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/format';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

const COLORS = ['#1a1a1a', '#d4c5a9', '#8b4513', '#2f4f4f', '#708090'];

export function ProductCard({ product, priority }: ProductCardProps) {
  return (
    <Link href={`/produit/${product.slug}`} className="group">
      {/* Image container */}
      <div className="aspect-[3/4] bg-pvl-cream mb-4 overflow-hidden relative">
        <div className="w-full h-full bg-gradient-to-br from-pvl-cream to-pvl-warm group-hover:scale-[1.02] transition-transform duration-700" />

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.preventDefault();
          }}
          className="absolute top-3 right-3 p-2 bg-pvl-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Ajouter aux favoris"
        >
          <Heart size={14} className="text-pvl-black" />
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.is_new && (
            <span className="bg-pvl-black text-pvl-white text-[0.5rem] font-medium uppercase tracking-[0.15em] px-2 py-1">
              Nouveau
            </span>
          )}
          {product.compare_at_price && (
            <span className="bg-pvl-error text-pvl-white text-[0.5rem] font-medium uppercase tracking-[0.15em] px-2 py-1">
              -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <p className="text-pvl-product-name mb-1">{product.name}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-pvl-price">
            {formatPrice(product.price)}
          </span>
          {product.compare_at_price && (
            <span className="text-[0.625rem] text-pvl-stone line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>

      {/* Color dots */}
      <div className="flex items-center gap-1 mt-2">
        {COLORS.slice(0, 4).map((color, i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full border border-pvl-black/10"
            style={{ backgroundColor: color }}
          />
        ))}
        {COLORS.length > 4 && (
          <span className="text-[0.5rem] text-pvl-stone ml-1">
            +{COLORS.length - 4}
          </span>
        )}
      </div>
    </Link>
  );
}
