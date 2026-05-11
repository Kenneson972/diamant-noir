'use client';

import { Product } from '@/types';
import { ProductCard } from '@/components/collection/ProductCard';

interface NewArrivalsProps {
  title: string;
  products: Product[];
}

export function NewArrivals({ title, products }: NewArrivalsProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="container-pvl mb-8 md:mb-12">
        <h2 className="text-pvl-kicker text-pvl-slate">{title}</h2>
      </div>
      <div className="flex gap-0 overflow-x-auto scrollbar-hide scroll-snap-x-mandatory pl-[max(1.25rem,env(safe-area-inset-left))]">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-[clamp(220px,30vw,320px)] mr-0 scroll-snap-align-start"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
