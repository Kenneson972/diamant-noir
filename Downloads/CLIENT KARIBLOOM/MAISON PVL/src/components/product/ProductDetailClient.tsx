'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/store/cartStore';

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
    <div className="flex flex-col md:flex-row">
      {/* LEFT: Image stack (58%) */}
      <div className="md:w-[58%]">
        {/* Desktop: vertical image stack */}
        <div className="hidden md:flex md:flex-col gap-[2px]">
          {product.images.map((img, i) => (
            <div
              key={img.id}
              className="w-full"
              style={{ aspectRatio: i === 0 ? '3/4' : '4/5' }}
            >
              {img.url ? (
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background: `linear-gradient(135deg, hsl(${i * 30}, 20%, 70%), hsl(${i * 30 + 30}, 15%, 50%))`,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Mobile: horizontal snap carousel */}
        <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {product.images.map((img, i) => (
            <div
              key={img.id}
              className="flex-shrink-0 w-screen snap-center"
              style={{ aspectRatio: '3/4' }}
            >
              {img.url ? (
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background: `linear-gradient(135deg, hsl(${i * 30}, 20%, 70%), hsl(${i * 30 + 30}, 15%, 50%))`,
                  }}
                />
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
                    className="min-w-[3rem] px-3 py-2 text-[0.75rem] uppercase border transition-all duration-150"
                    style={{
                      borderColor:
                        selectedSize === size
                          ? 'var(--color-pvl-black)'
                          : 'oklch(62% 0.008 60 / 0.3)',
                      backgroundColor:
                        selectedSize === size
                          ? 'var(--color-pvl-black)'
                          : 'transparent',
                      color:
                        selectedSize === size
                          ? 'var(--color-pvl-white)'
                          : 'var(--color-pvl-black)',
                      borderRadius: 'var(--radius-card)',
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
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
            className="w-full py-4 text-pvl-kicker uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-30"
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

          {/* Materials / care */}
          {(product.materials || product.care_instructions) && (
            <p className="mt-8 text-pvl-meta text-pvl-stone leading-relaxed">
              {product.materials}
              {product.materials && product.care_instructions && ' — '}
              {product.care_instructions}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
