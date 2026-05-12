'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/store/cartStore';
import { formatPrice } from '@/lib/format';

export function CartDrawer() {
  const { t } = useTranslation();
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal } =
    useCart();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-pvl-black/30 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div role="dialog" aria-modal="true" aria-label={t('cart.titre')} className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-pvl-white flex flex-col">
        {/* Header — 56px, aligned with site header */}
        <div className="flex items-center justify-between h-[56px] px-5 border-b border-pvl-black/6">
          <button
            onClick={closeCart}
            className="flex items-center gap-2 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-pvl-slate hover:text-pvl-black transition-colors"
            aria-label={t('nav.fermer')}
          >
            <X size={20} strokeWidth={1.5} />
            {t('nav.fermer')}
          </button>
          <span className="text-sm font-medium text-pvl-black">
            {t('cart.titre')} ({count})
          </span>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={32} strokeWidth={1} className="text-pvl-stone mb-4" />
              <p className="text-sm text-pvl-slate mb-6">{t('cart.vide')}</p>
              <button
                onClick={closeCart}
                className="text-[0.6875rem] uppercase tracking-[0.2em] text-pvl-black underline underline-offset-4 hover:text-pvl-slate transition-colors"
              >
                {t('cart.continuer-achats')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map((item) => {
                const image = item.product.images[0];
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 py-5 border-b border-pvl-black/6"
                  >
                    {/* Product image — 96x128, 3:4 ratio */}
                    <div className="relative w-[96px] h-[128px] flex-shrink-0">
                      {image?.url ? (
                        <Image
                          src={image.url}
                          alt={image.alt || item.product.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full bg-pvl-cream" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <Link
                          href={`/produit/${item.product.slug}`}
                          onClick={closeCart}
                          className="text-[0.75rem] font-medium text-pvl-black hover:text-pvl-slate transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-[0.625rem] text-pvl-stone mt-1 uppercase tracking-[0.1em]">
                          {item.variant.color} — {item.variant.size}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-[0.8125rem] tabular-nums text-pvl-black">
                          {formatPrice(item.variant.price)}
                        </p>

                        {/* Quantity controls */}
                        <div className="flex items-center border border-pvl-black/12">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 text-pvl-slate hover:text-pvl-black transition-colors"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus size={14} strokeWidth={1.5} />
                          </button>
                          <span className="w-8 text-center text-[0.75rem] font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 text-pvl-slate hover:text-pvl-black transition-colors"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus size={14} strokeWidth={1.5} />
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone hover:text-pvl-error transition-colors"
                        >
                          {t('actions.supprimer')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-pvl-black/8 px-5 py-5 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-pvl-slate">{t('cart.sous-total')}</span>
                <span className="tabular-nums text-pvl-black">
                  {formatPrice(subtotal())}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-pvl-slate">{t('cart.livraison')}</span>
                <span className="text-pvl-success text-[0.625rem] uppercase tracking-[0.1em]">
                  {t('cart.livraison-offerte')}
                </span>
              </div>
            </div>

            <div className="flex justify-between font-medium pt-3 border-t border-pvl-black/8">
              <span className="text-pvl-black">{t('cart.total')}</span>
              <span className="tabular-nums text-pvl-black">
                {formatPrice(subtotal())}
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex items-center justify-center gap-2 w-full bg-pvl-black text-pvl-white h-[52px] text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
            >
              {t('cart.commander')}
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>

            <button
              onClick={closeCart}
              className="block w-full text-center text-[0.625rem] uppercase tracking-[0.2em] text-pvl-slate hover:text-pvl-black transition-colors"
            >
              {t('cart.continuer-achats')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
