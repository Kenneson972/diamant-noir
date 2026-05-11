'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Check,
  Minus,
  Plus,
  Ruler,
  Truck,
  RotateCcw,
  ChevronDown,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCart } from '@/store/cartStore';
import { useWishlist } from '@/store/wishlistStore';
import { formatPrice } from '@/lib/format';
import Image from 'next/image';

interface ProductDetailClientProps {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    gender: string;
    price: number;
    compareAtPrice: number | null;
    isNew: boolean;
    materials: string | null;
    careInstructions: string | null;
    images: Array<{
      id: string;
      url: string;
      alt: string;
      width: number;
      height: number;
      position: number;
    }>;
    variants: Array<{
      id: string;
      size: string;
      color: string;
      colorHex: string;
      sku: string;
      price: number;
      stock: number;
    }>;
  };
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { t } = useTranslation();
  const { addItem, openCart } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();

  const [selectedColor, setSelectedColor] = useState(product.variants[0]?.color || '');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [accordionOpen, setAccordionOpen] = useState<string | null>('description');

  const colors = Array.from(
    new Map(product.variants.map((v) => [v.color, { name: v.color, hex: v.colorHex }])).values()
  );

  const sizesForColor = product.variants.filter((v) => v.color === selectedColor);
  const selectedVariant = sizesForColor.find((v) => v.size === selectedSize);

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    const cartProduct = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      gender: product.gender as 'homme' | 'femme',
      category_id: '',
      collection_id: null,
      price: selectedVariant.price,
      compare_at_price: product.compareAtPrice,
      images: product.images.map((img) => ({
        ...img,
        alt: img.alt,
      })),
      variants: product.variants.map((v) => ({
        id: v.id,
        product_id: product.id,
        size: v.size,
        color: v.color,
        color_hex: v.colorHex,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
      })),
      materials: product.materials,
      care_instructions: product.careInstructions,
      is_new: product.isNew,
      featured: false,
      created_at: '',
      updated_at: '',
    };

    const cartVariant = {
      id: selectedVariant.id,
      product_id: product.id,
      size: selectedVariant.size,
      color: selectedVariant.color,
      color_hex: selectedVariant.colorHex,
      sku: selectedVariant.sku,
      price: selectedVariant.price,
      stock: selectedVariant.stock,
    };

    addItem(cartProduct, cartVariant, quantity);
    openCart();
  };

  const toggleAccordion = (key: string) => {
    setAccordionOpen(accordionOpen === key ? null : key);
  };

  const isWishlisted = isInWishlist(product.id);

  return (
    <div className="container-pvl py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[0.625rem] uppercase tracking-[0.15em] text-pvl-stone mb-8">
        <Link href="/" className="hover:text-pvl-black transition-colors">
          Accueil
        </Link>
        <span>/</span>
        <Link
          href={`/${product.gender}`}
          className="hover:text-pvl-black transition-colors"
        >
          {product.gender === 'homme' ? 'Homme' : 'Femme'}
        </Link>
        <span>/</span>
        <span className="text-pvl-black">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Gallery */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="aspect-[3/4] bg-pvl-cream overflow-hidden relative">
            <div className="w-full h-full bg-gradient-to-br from-pvl-cream to-pvl-warm" />

            {product.isNew && (
              <span className="absolute top-4 left-4 bg-pvl-black text-pvl-white text-[0.5rem] font-medium uppercase tracking-[0.15em] px-3 py-1.5">
                {t('product.nouveaute')}
              </span>
            )}
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {product.images.slice(0, 5).map((img, i) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(i)}
                className={cn(
                  'w-16 h-20 flex-shrink-0 bg-pvl-cream overflow-hidden border-2 transition-colors',
                  selectedImage === i
                    ? 'border-pvl-black'
                    : 'border-transparent hover:border-pvl-black/20'
                )}
              >
                <div className="w-full h-full bg-gradient-to-br from-pvl-cream to-pvl-warm" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="md:sticky md:top-28 md:self-start">
          <h1 className="font-display text-2xl md:text-3xl mb-3">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-xl tabular-nums">
              {formatPrice(selectedVariant?.price || product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-pvl-stone line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Color selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate">
                {t('product.couleurs')} —{' '}
                <span className="text-pvl-black">{selectedColor}</span>
              </span>
            </div>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setSelectedColor(color.name);
                    setSelectedSize('');
                  }}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    selectedColor === color.name
                      ? 'border-pvl-black scale-110'
                      : 'border-pvl-black/10 hover:border-pvl-black/30'
                  )}
                  style={{ backgroundColor: color.hex }}
                  aria-label={color.name}
                />
              ))}
            </div>
          </div>

          {/* Size selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate">
                {t('product.tailles')}
              </span>
              <button className="flex items-center gap-1 text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone hover:text-pvl-black transition-colors">
                <Ruler size={12} />
                {t('product.guide-tailles')}
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {sizesForColor.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedSize(v.size)}
                  disabled={v.stock === 0}
                  className={cn(
                    'py-3 text-[0.75rem] font-medium border transition-all',
                    selectedSize === v.size
                      ? 'bg-pvl-black text-pvl-white border-pvl-black'
                      : v.stock === 0
                      ? 'bg-pvl-cream text-pvl-stone border-pvl-black/6 line-through cursor-not-allowed'
                      : 'bg-pvl-white text-pvl-black border-pvl-black/12 hover:border-pvl-black'
                  )}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex gap-3 mb-6">
            <div className="flex items-center border border-pvl-black/12">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 text-pvl-slate hover:text-pvl-black transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="px-4 text-sm tabular-nums min-w-[3ch] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-3 text-pvl-slate hover:text-pvl-black transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock === 0}
              className="flex-1 bg-pvl-black text-pvl-white py-3 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors disabled:bg-pvl-stone/30 disabled:text-pvl-stone disabled:cursor-not-allowed"
            >
              {selectedVariant?.stock === 0
                ? t('product.rupture')
                : t('actions.ajouter-panier')}
            </button>
            <button
              onClick={() =>
                toggleItem({
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  description: product.description,
                  gender: product.gender as 'homme' | 'femme',
                  category_id: '',
                  collection_id: null,
                  price: product.price,
                  compare_at_price: product.compareAtPrice,
                  images: [],
                  variants: [],
                  materials: null,
                  care_instructions: null,
                  is_new: product.isNew,
                  featured: false,
                  created_at: '',
                  updated_at: '',
                })
              }
              className={cn(
                'p-3 border transition-colors',
                isWishlisted
                  ? 'border-pvl-black bg-pvl-black text-pvl-white'
                  : 'border-pvl-black/12 text-pvl-slate hover:text-pvl-black hover:border-pvl-black'
              )}
              aria-label={t('nav.favoris')}
            >
              <Heart size={16} className={isWishlisted ? 'fill-pvl-white' : ''} />
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 mb-8 py-4 border-t border-pvl-black/8">
            <div className="flex items-center gap-2">
              <Truck size={14} className="text-pvl-stone" />
              <span className="text-[0.5625rem] uppercase tracking-[0.1em] text-pvl-stone">
                Livraison offerte
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw size={14} className="text-pvl-stone" />
              <span className="text-[0.5625rem] uppercase tracking-[0.1em] text-pvl-stone">
                Retours 30 jours
              </span>
            </div>
          </div>

          {/* Accordion */}
          <div className="border-t border-pvl-black/8">
            {/* Description */}
            <div className="border-b border-pvl-black/8">
              <button
                onClick={() => toggleAccordion('description')}
                className="w-full flex items-center justify-between py-4 text-[0.6875rem] font-medium uppercase tracking-[0.15em]"
              >
                {t('product.description')}
                <ChevronDown
                  size={14}
                  className={cn(
                    'transition-transform',
                    accordionOpen === 'description' && 'rotate-180'
                  )}
                />
              </button>
              {accordionOpen === 'description' && (
                <div className="pb-4 text-sm text-pvl-slate leading-relaxed">
                  {product.description}
                </div>
              )}
            </div>

            {/* Materials */}
            {product.materials && (
              <div className="border-b border-pvl-black/8">
                <button
                  onClick={() => toggleAccordion('materials')}
                  className="w-full flex items-center justify-between py-4 text-[0.6875rem] font-medium uppercase tracking-[0.15em]"
                >
                  {t('product.compositions')}
                  <ChevronDown
                    size={14}
                    className={cn(
                      'transition-transform',
                      accordionOpen === 'materials' && 'rotate-180'
                    )}
                  />
                </button>
                {accordionOpen === 'materials' && (
                  <div className="pb-4 space-y-2 text-sm text-pvl-slate">
                    <p>{product.materials}</p>
                    {product.careInstructions && (
                      <p>{product.careInstructions}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Shipping */}
            <div className="border-b border-pvl-black/8">
              <button
                onClick={() => toggleAccordion('shipping')}
                className="w-full flex items-center justify-between py-4 text-[0.6875rem] font-medium uppercase tracking-[0.15em]"
              >
                {t('product.livraison-retours')}
                <ChevronDown
                  size={14}
                  className={cn(
                    'transition-transform',
                    accordionOpen === 'shipping' && 'rotate-180'
                  )}
                />
              </button>
              {accordionOpen === 'shipping' && (
                <div className="pb-4 text-sm text-pvl-slate space-y-2 leading-relaxed">
                  <p>Livraison offerte dès 200€ d&apos;achat. Délai de livraison : 3 à 5 jours ouvrés.</p>
                  <p>Retours gratuits sous 30 jours. Remboursement sous 14 jours après réception.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
