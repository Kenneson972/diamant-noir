"use client";

/**
 * CompareContext — Diamant Noir
 * ──────────────────────────────
 * Permet de sélectionner jusqu'à 3 villas à comparer.
 * Affiche une barre flottante en bas de page dès qu'une villa est ajoutée.
 *
 * Usage :
 *   const { isSelected, toggle, clear, items, canAdd } = useCompare();
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

const MAX = 3;

export interface CompareItem {
  id: string;
  name: string;
  image: string | null;
  price: number;
  location: string;
}

interface CompareCtx {
  items: CompareItem[];
  isSelected: (id: string) => boolean;
  toggle: (item: CompareItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  canAdd: boolean;
  count: number;
}

const CompareContext = createContext<CompareCtx>({
  items: [],
  isSelected: () => false,
  toggle: () => {},
  remove: () => {},
  clear: () => {},
  canAdd: true,
  count: 0,
});

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  const isSelected = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const toggle = useCallback((item: CompareItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        return prev.filter((i) => i.id !== item.id);
      }
      if (prev.length >= MAX) return prev; // silencieux, le bouton est disabled
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <CompareContext.Provider
      value={{
        items,
        isSelected,
        toggle,
        remove,
        clear,
        canAdd: items.length < MAX,
        count: items.length,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => useContext(CompareContext);
