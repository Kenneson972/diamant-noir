'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCart } from '@/store/cartStore';
import { formatPrice } from '@/lib/format';

export function CartDrawer() {
  const { t } = useTranslation();
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal } =
    useCart();
  const overlayRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-pvl-black/30 backdrop-blur-sm"
        onClick={closeCart}
      />
      <div className="absolute top-0 right-0 bottom-0 w-full max-w-lg bg-pvl-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-pvl-black/8">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} />
            <span className="text-sm font-medium">
              {t('cart.titre')}
              {items.length > 0 && (
                <span className="text-pvl-stone ml-1">
                  ({items.reduce((n, i) => n + i.quantity, 0)})
                </span>
              )}
            </span>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 text-pvl-slate hover:text-pvl-black transition-colors"
            aria-label={t('nav.fermer')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={32} className="text-pvl-stone mb-4" />
              <p className="text-sm text-pvl-slate">{t('cart.vide')}</p>
              <button
                onClick={closeCart}
                className="mt-4 text-[0.6875rem] uppercase tracking-[0.2em] text-pvl-black underline underline-offset-4"
              >
                {t('cart.continuer-achats')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 py-4 border-b border-pvl-black/6 last:border-0"
                >
                  {/* Image placeholder */}
                  <div className="w-20 h-24 bg-pvl-cream flex-shrink-0 rounded-sm" />

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/produit/${item.product.slug}`}
                      onClick={closeCart}
                      className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-pvl-black hover:text-pvl-slate transition-colors line-clamp-2"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-[0.625rem] text-pvl-stone mt-1 uppercase tracking-[0.1em]">
                      {item.variant.color} — {item.variant.size}
                    </p>
                    <p className="text-[0.75rem] text-pvl-black mt-1">
                      {formatPrice(item.variant.price)}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-pvl-black/12 rounded-sm">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="p-1.5 text-pvl-slate hover:text-pvl-black transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-[0.6875rem] font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="p-1.5 text-pvl-slate hover:text-pvl-black transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone hover:text-pvl-error transition-colors"
                      >
                        {t('actions.supprimer')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-pvl-black/8 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[0.75rem] uppercase tracking-[0.12em] text-pvl-slate">
                {t('cart.sous-total')}
              </span>
              <span className="text-sm font-medium tabular-nums">
                {formatPrice(subtotal())}
              </span>
            </div>
            <p className="text-[0.625rem] text-pvl-stone">
              {t('product.livraison-retours')}
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-pvl-black text-pvl-white text-center py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
            >
              {t('cart.commander')}
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
