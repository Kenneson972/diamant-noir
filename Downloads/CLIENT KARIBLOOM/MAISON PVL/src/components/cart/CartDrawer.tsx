'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useCart } from '@/store/cartStore';
import { formatPrice } from '@/lib/format';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { type: 'spring' as const, damping: 32, stiffness: 320 },
  },
  exit: {
    x: '100%',
    transition: { type: 'spring' as const, damping: 32, stiffness: 320 },
  },
};

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal } =
    useCart();
  const panelRef = useRef<HTMLDivElement>(null);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="cart-overlay"
            className="fixed inset-0 z-[60] bg-pvl-black/40"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={closeCart}
          />

          {/* Panel */}
          <motion.div
            key="cart-panel"
            ref={panelRef}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed top-0 right-0 bottom-0 z-[61] flex flex-col',
              'bg-pvl-white',
              'w-full md:w-[420px]'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} strokeWidth={1.5} />
                <span className="text-[0.8125rem] font-[family-name:var(--font-sans)] font-medium">
                  Panier
                  {items.length > 0 && (
                    <span className="text-pvl-stone ml-1">
                      ({items.reduce((n, i) => n + i.quantity, 0)})
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={closeCart}
                className="p-1 text-pvl-slate hover:text-pvl-black transition-colors"
                aria-label="Fermer"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag
                    size={32}
                    strokeWidth={1.5}
                    className="text-pvl-stone mb-4"
                  />
                  <p className="text-[0.8125rem] text-pvl-slate font-[family-name:var(--font-sans)]">
                    Votre panier est vide
                  </p>
                  <button
                    onClick={closeCart}
                    className="mt-4 text-[0.6875rem] uppercase tracking-[0.2em] text-pvl-black underline underline-offset-4"
                  >
                    Continuer mes achats
                  </button>
                </div>
              ) : (
                <div className="flex flex-col py-2">
                  {items.map((item) => {
                    const image = item.product.images?.[0];
                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 py-4 border-b border-pvl-black/6 last:border-0"
                      >
                        {/* Image thumbnail — 72px square */}
                        <div className="w-[72px] h-[72px] flex-shrink-0 overflow-hidden rounded-sm bg-pvl-cream">
                          {image ? (
                            <Image
                              src={image.url}
                              alt={image.alt || item.product.name}
                              width={72}
                              height={72}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-pvl-cream" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <Link
                              href={`/produit/${item.product.slug}`}
                              onClick={closeCart}
                              className="text-pvl-product-name text-pvl-black hover:text-pvl-slate transition-colors line-clamp-2"
                            >
                              {item.product.name}
                            </Link>
                            <p className="text-pvl-meta mt-0.5">
                              {item.variant.color} &mdash; {item.variant.size}
                            </p>
                            <p className="text-pvl-price text-pvl-black mt-1">
                              {formatPrice(item.variant.price)}
                            </p>
                          </div>

                          {/* Quantity + Delete */}
                          <div className="flex items-center justify-between mt-2">
                            {/* Minimal quantity selector — no borders */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                className="text-pvl-slate hover:text-pvl-black transition-colors"
                                aria-label="Diminuer la quantite"
                              >
                                <Minus size={14} strokeWidth={1.5} />
                              </button>
                              <span className="text-[0.8125rem] font-[family-name:var(--font-sans)] font-normal tabular-nums w-6 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="text-pvl-slate hover:text-pvl-black transition-colors"
                                aria-label="Augmenter la quantite"
                              >
                                <Plus size={14} strokeWidth={1.5} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-pvl-stone hover:text-pvl-error transition-colors"
                              aria-label="Supprimer"
                            >
                              <Trash2 size={16} strokeWidth={1.5} />
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
              <div className="border-t border-pvl-black/8 px-6 py-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[0.8125rem] font-[family-name:var(--font-sans)] font-normal text-pvl-slate">
                    Sous-total
                  </span>
                  <span className="text-[1rem] font-[family-name:var(--font-sans)] font-normal tabular-nums">
                    {formatPrice(subtotal())}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full bg-pvl-black text-pvl-white text-center py-3.5 text-[0.75rem] font-[family-name:var(--font-sans)] font-medium uppercase tracking-[0.2em] rounded-sm hover:bg-pvl-charcoal transition-colors"
                >
                  Passer commande
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
