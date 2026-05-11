'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '@/store/cartStore';
import { formatPrice } from '@/lib/format';

export default function CartPage() {
  const { t } = useTranslation();
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const count = items.reduce((n, i) => n + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="container-pvl py-20 text-center">
        <ShoppingBag size={40} className="mx-auto text-pvl-stone mb-6" />
        <h1 className="font-display text-2xl mb-3">{t('cart.vide')}</h1>
        <p className="text-sm text-pvl-slate mb-8">
          {t('cart.continuer-achats')}
        </p>
        <Link
          href="/homme"
          className="inline-block bg-pvl-black text-pvl-white px-8 py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
        >
          {t('actions.decouvrir')} {t('nav.homme')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-pvl py-10 md:py-16">
      <h1 className="font-display text-2xl md:text-3xl mb-10">
        {t('cart.titre')} ({count})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-6 pb-6 border-b border-pvl-black/8"
            >
              <div className="w-24 h-32 bg-pvl-cream flex-shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <Link
                      href={`/produit/${item.product.slug}`}
                      className="text-sm font-medium hover:text-pvl-slate transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-[0.625rem] text-pvl-stone mt-1 uppercase tracking-[0.1em]">
                      {item.variant.color} — {item.variant.size}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {formatPrice(item.variant.price)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-pvl-black/12">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                      className="p-2 text-pvl-slate hover:text-pvl-black"
                      aria-label={t('common.quantite')}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-4 text-sm tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                      className="p-2 text-pvl-slate hover:text-pvl-black"
                      aria-label={t('common.quantite')}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-pvl-stone hover:text-pvl-error transition-colors"
                    aria-label={t('cart.supprimer')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={clearCart}
            className="text-[0.625rem] uppercase tracking-[0.15em] text-pvl-stone hover:text-pvl-error transition-colors"
          >
            Vider le panier
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-pvl-cream p-6 md:p-8 space-y-4 sticky top-28">
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em]">
              Récapitulatif
            </h2>
            <div className="space-y-3 pt-4 border-t border-pvl-black/8">
              <div className="flex justify-between text-sm">
                <span className="text-pvl-slate">{t('cart.sous-total')}</span>
                <span className="tabular-nums">
                  {formatPrice(subtotal())}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-pvl-slate">{t('cart.livraison')}</span>
                <span className="text-pvl-slate text-[0.625rem] uppercase tracking-[0.1em]">
                  Offerte
                </span>
              </div>
            </div>
            <div className="flex justify-between font-medium pt-4 border-t border-pvl-black/8">
              <span>{t('cart.total')}</span>
              <span className="tabular-nums">
                {formatPrice(subtotal())}
              </span>
            </div>
            <Link
              href="/checkout"
              className="block w-full bg-pvl-black text-pvl-white text-center py-4 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors mt-4"
            >
              {t('cart.commander')}
            </Link>
            <Link
              href="/homme"
              className="block text-center text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate hover:text-pvl-black transition-colors"
            >
              <ArrowLeft size={12} className="inline mr-1" />
              {t('cart.continuer-achats')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
