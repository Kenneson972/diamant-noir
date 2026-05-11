'use client';

import Link from 'next/link';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { useWishlist } from '@/store/wishlistStore';
import { formatPrice } from '@/lib/format';

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlist();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl md:text-3xl mb-2">
            Mes favoris
          </h2>
          <p className="text-sm text-pvl-slate">
            {items.length} article{items.length !== 1 ? 's' : ''} sauvegardé
            {items.length !== 1 ? 's' : ''}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearWishlist}
            className="text-[0.625rem] uppercase tracking-[0.15em] text-pvl-stone hover:text-pvl-error transition-colors"
          >
            Tout supprimer
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={40} className="mx-auto text-pvl-stone mb-6" strokeWidth={1.5} />
          <h3 className="font-display text-xl mb-2">
            Votre liste de favoris est vide
          </h3>
          <p className="text-sm text-pvl-slate mb-8 max-w-sm mx-auto">
            Sauvegardez vos articles préférés et retrouvez-les facilement
            depuis votre espace personnel.
          </p>
          <Link
            href="/homme"
            className="inline-block bg-pvl-black text-pvl-white px-8 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
          >
            Découvrir la collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((product) => {
            const price =
              product.variants?.[0]?.price ?? product.price ?? 0;
            const image =
              product.images?.[0]?.url ?? '';
            const imageAlt =
              product.images?.[0]?.alt ?? product.name;

            return (
              <div
                key={product.id}
                className="group border border-pvl-black/12 p-4 hover:border-pvl-black transition-colors"
              >
                <Link href={`/produit/${product.slug}`}>
                  <div className="aspect-[4/5] bg-pvl-cream mb-4 overflow-hidden">
                    {image ? (
                      <img
                        src={image}
                        alt={imageAlt}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag
                          size={24}
                          className="text-pvl-stone"
                          strokeWidth={1}
                        />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/produit/${product.slug}`}
                      className="text-pvl-product-name hover:text-pvl-slate transition-colors"
                    >
                      {product.name}
                    </Link>
                    <p className="text-pvl-price mt-1">
                      {formatPrice(price)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(product.id)}
                    className="p-2 text-pvl-stone hover:text-pvl-error transition-colors flex-shrink-0"
                    aria-label="Retirer des favoris"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
