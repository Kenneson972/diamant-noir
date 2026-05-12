'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/cn';
import { useCart } from '@/store/cartStore';
import { ShopTheLook } from '@/components/product/ShopTheLook';
import { YouMayLike } from '@/components/product/YouMayLike';

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addItem } = useCart();
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.variants[0]?.color ?? null
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const currentVariant = product.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const uniqueColors = Array.from(
    new Map(product.variants.map((v) => [v.color, v.color_hex])).entries()
  );

  const availableSizes = Array.from(
    new Set(
      product.variants
        .filter((v) => v.color === selectedColor)
        .map((v) => v.size)
    )
  );

  const handleAddToCart = () => {
    if (!currentVariant) return;
    addItem(product, currentVariant, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Fil d'ariane" className="container-pvl pt-28 pb-4">
        <ol className="flex items-center gap-1.5 text-[0.625rem] uppercase tracking-[0.15em] text-pvl-stone">
          <li>
            <Link href={`/${product.gender}`} className="hover:text-pvl-black transition-colors">
              {product.gender === 'femme' ? 'Femme' : 'Homme'}
            </Link>
          </li>
          <li aria-hidden="true" className="text-pvl-stone/40">/</li>
          <li>
            <Link href={`/${product.gender}/nouveautes`} className="hover:text-pvl-black transition-colors">
              Collection
            </Link>
          </li>
          <li aria-hidden="true" className="text-pvl-stone/40">/</li>
          <li className="text-pvl-black" aria-current="page">{product.name}</li>
        </ol>
      </nav>
    <div className="flex flex-col md:flex-row">
      {/* LEFT: Image stack (58%) */}
      <div className="md:w-[58%]">
        {/* Desktop: vertical image stack */}
        <div className="hidden md:flex md:flex-col gap-[2px]">
          {product.images.map((img, i) => (
            <div
              key={img.id}
              className="relative w-full"
              style={{ aspectRatio: '3/4' }}
            >
              {img.url ? (
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="58vw"
                  priority={i === 0}
                />
              ) : (
                <div className="w-full h-full bg-pvl-cream" />
              )}
            </div>
          ))}
        </div>

        {/* Mobile: horizontal snap carousel */}
        <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {product.images.map((img) => (
            <div
              key={img.id}
              className="relative flex-shrink-0 w-screen snap-center"
              style={{ aspectRatio: '3/4' }}
            >
              {img.url ? (
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              ) : (
                <div className="w-full h-full bg-pvl-cream" />
              )}
            </div>
          ))}
        </div>

        {/* Mobile dots indicator */}
        {product.images.length > 1 && (
          <div className="flex md:hidden justify-center gap-2 py-4">
            {product.images.map((_, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-pvl-stone/40"
              />
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Product info (42%) — sticky */}
      <div className="md:w-[42%]">
        <div className="md:sticky md:top-20 p-[clamp(2rem,4vw,4rem)]">
          {/* Kicker — collection/season */}
          <p className="text-pvl-kicker text-pvl-gold-dim mb-4">
            {product.collection_id ? 'COLLECTION' : 'NOUVEAUTÉ'}
          </p>

          {/* Product name */}
          <h1 className="font-display text-[clamp(1.5rem,2.5vw,2.25rem)] text-pvl-black leading-tight mb-4">
            {product.name}
          </h1>

          {/* Price */}
          <p className="text-pvl-price text-pvl-slate mb-8">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
            }).format(currentVariant?.price ?? product.price)}
          </p>

          {/* Color swatches */}
          {uniqueColors.length > 1 && (
            <div className="mb-8">
              <p className="text-pvl-meta text-pvl-slate mb-3">Couleur</p>
              <div className="flex gap-3">
                {uniqueColors.map(([color, hex]) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      setSelectedSize(null);
                    }}
                    className="relative w-6 h-6 rounded-full border transition-all duration-150"
                    style={{
                      backgroundColor: hex,
                      borderColor:
                        selectedColor === color
                          ? 'var(--color-pvl-black)'
                          : 'oklch(62% 0.008 60 / 0.3)',
                      borderWidth: selectedColor === color ? '2px' : '1px',
                    }}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {availableSizes.length > 0 && (
            <div className="mb-8">
              <p className="text-pvl-meta text-pvl-slate mb-3">Taille</p>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      'min-w-[3rem] h-10 px-3 text-[0.75rem] uppercase border transition-colors',
                      selectedSize === size
                        ? 'border-pvl-black bg-pvl-black text-pvl-white'
                        : 'border-pvl-stone/30 text-pvl-black hover:border-pvl-black'
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <button className="mt-3 text-[0.625rem] uppercase tracking-[0.1em] text-pvl-stone underline underline-offset-4 hover:text-pvl-black transition-colors">
                Guide des tailles
              </button>
            </div>
          )}

          {/* Quantity selector */}
          <div className="mb-8">
            <p className="text-pvl-meta text-pvl-slate mb-3">Quantité</p>
            <div
              className="flex items-center gap-4 border border-pvl-stone/20 w-fit"
              style={{ borderRadius: 'var(--radius-card)' }}
            >
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 text-pvl-slate hover:text-pvl-black transition-colors"
              >
                <Minus size={14} strokeWidth={1.5} />
              </button>
              <span className="font-sans tabular-nums text-[0.875rem] text-pvl-black min-w-[2ch] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-3 text-pvl-slate hover:text-pvl-black transition-colors"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={!currentVariant}
            className="w-full h-[52px] font-sans font-medium uppercase tracking-widest text-sm transition-all duration-300 disabled:opacity-30"
            style={{
              backgroundColor: added
                ? 'var(--color-pvl-success)'
                : 'var(--color-pvl-black)',
              color: 'var(--color-pvl-white)',
              borderRadius: 'var(--radius-card)',
            }}
          >
            {added
              ? 'Ajouté au panier'
              : currentVariant
                ? 'Ajouter au panier'
                : 'Sélectionnez une taille'}
          </button>

          {/* Trust signals */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-center">
            <div className="border border-pvl-black/6 py-3 px-2">
              <p className="text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone">
                Livraison offerte
              </p>
            </div>
            <div className="border border-pvl-black/6 py-3 px-2">
              <p className="text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone">
                Retours 30 jours
              </p>
            </div>
          </div>

          {/* Accordions */}
          <div className="mt-8 pt-8 border-t border-pvl-black/6 space-y-1">
            <details className="group" open>
              <summary className="flex items-center justify-between py-3 text-[0.6875rem] uppercase tracking-[0.15em] font-medium cursor-pointer text-pvl-black list-none">
                Description
                <span className="text-pvl-stone group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="pb-4 text-[0.8125rem] text-pvl-slate leading-relaxed">
                {product.description}
              </p>
            </details>

            {product.materials && (
              <details className="group">
                <summary className="flex items-center justify-between py-3 text-[0.6875rem] uppercase tracking-[0.15em] font-medium cursor-pointer text-pvl-black list-none">
                  Matières
                  <span className="text-pvl-stone group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="pb-4 text-[0.8125rem] text-pvl-slate leading-relaxed">
                  {product.materials}
                </p>
              </details>
            )}

            {product.care_instructions && (
              <details className="group">
                <summary className="flex items-center justify-between py-3 text-[0.6875rem] uppercase tracking-[0.15em] font-medium cursor-pointer text-pvl-black list-none">
                  Entretien
                  <span className="text-pvl-stone group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="pb-4 text-[0.8125rem] text-pvl-slate leading-relaxed">
                  {product.care_instructions}
                </p>
              </details>
            )}

            <details className="group">
              <summary className="flex items-center justify-between py-3 text-[0.6875rem] uppercase tracking-[0.15em] font-medium cursor-pointer text-pvl-black list-none">
                Livraison & retours
                <span className="text-pvl-stone group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="pb-4 text-[0.8125rem] text-pvl-slate leading-relaxed space-y-2">
                <p>Livraison standard offerte en 3–5 jours ouvrés.</p>
                <p>Retours gratuits sous 30 jours.</p>
                <p>Click & Collect disponible en boutique.</p>
              </div>
            </details>
          </div>

          {/* Shop the Look */}
          <div className="mt-8 pt-8 border-t border-pvl-black/6">
            <ShopTheLook gender={product.gender as 'homme' | 'femme'} />
          </div>
        </div>
      </div>
    </div>

    {/* You May Also Like — full-width carousel */}
    <YouMayLike gender={product.gender as 'homme' | 'femme'} />
  </>
  );
}
