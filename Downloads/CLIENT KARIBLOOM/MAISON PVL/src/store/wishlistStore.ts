'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface WishlistState {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleItem: (product: Product) => void;
  clearWishlist: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const exists = get().items.find((p) => p.id === product.id);
        if (!exists) {
          set({ items: [...get().items, product] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((p) => p.id !== productId) });
      },

      isInWishlist: (productId) => {
        return get().items.some((p) => p.id === productId);
      },

      toggleItem: (product) => {
        const exists = get().items.find((p) => p.id === product.id);
        if (exists) {
          get().removeItem(product.id);
        } else {
          get().addItem(product);
        }
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'maison-pvl-wishlist',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
