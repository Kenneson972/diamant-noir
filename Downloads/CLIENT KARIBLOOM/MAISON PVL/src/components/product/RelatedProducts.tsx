import Link from 'next/link';
import { formatPrice } from '@/lib/format';

const RELATED_PRODUCTS = [
  {
    id: 'rel-1',
    slug: 'chemise-en-lin-blanc',
    name: 'Chemise en lin blanc',
    price: 190,
    colorCount: 3,
  },
  {
    id: 'rel-2',
    slug: 'mocassins-cuir-noir',
    name: 'Mocassins cuir noir',
    price: 350,
    colorCount: 2,
  },
  {
    id: 'rel-3',
    slug: 'ceinture-cuir-pleine-fleur',
    name: 'Ceinture cuir pleine fleur',
    price: 120,
    colorCount: 4,
  },
  {
    id: 'rel-4',
    slug: 'montre-edition-limitee',
    name: 'Montre édition limitée',
    price: 890,
    colorCount: 1,
  },
];

export function RelatedProducts() {
  return (
    <section className="py-section-md bg-pvl-warm">
      <div className="container-pvl">
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div>
            <span className="text-pvl-kicker block mb-2">Completez le Look</span>
            <h2 className="text-pvl-section-title">
              Pour aller avec
            </h2>
          </div>
          <Link
            href="/homme"
            className="hidden md:inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.2em] text-pvl-black border-b border-pvl-black/20 pb-1 hover:border-pvl-black transition-colors"
          >
            Voir tout
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {RELATED_PRODUCTS.map((item) => (
            <Link
              key={item.id}
              href={`/produit/${item.slug}`}
              className="group"
            >
              {/* Image placeholder */}
              <div className="aspect-[3/4] bg-gradient-to-br from-pvl-cream to-pvl-warm mb-4 overflow-hidden relative">
                <div className="w-full h-full bg-gradient-to-br from-pvl-cream to-pvl-warm group-hover:scale-[1.02] transition-transform duration-700" />
              </div>

              {/* Info */}
              <p className="text-pvl-product-name mb-1">{item.name}</p>
              <span className="text-pvl-price">{formatPrice(item.price)}</span>

              {/* Colour dots */}
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: Math.min(item.colorCount, 4) }, (_, i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full border border-pvl-black/10"
                    style={{
                      backgroundColor: [
                        '#1a1a1a',
                        '#d4c5a9',
                        '#8b4513',
                        '#2f4f4f',
                      ][i],
                    }}
                  />
                ))}
                {item.colorCount > 4 && (
                  <span className="text-[0.5rem] text-pvl-stone ml-1">
                    +{item.colorCount - 4}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile "See all" link */}
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/homme"
            className="inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.2em] text-pvl-black border-b border-pvl-black/20 pb-1 hover:border-pvl-black transition-colors"
          >
            Voir toute la collection
          </Link>
        </div>
      </div>
    </section>
  );
}
