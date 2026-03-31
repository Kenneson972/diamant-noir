"use client";

/**
 * WishlistContext — Diamant Noir
 * ──────────────────────────────
 * Persiste les villas favorites en localStorage (anonyme)
 * et sync vers Supabase si l'utilisateur est connecté.
 *
 * Usage :
 *   const { isFav, toggle, count } = useWishlist();
 *   toggle(villaId);
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

const LS_KEY = "dn_wishlist";

interface WishlistCtx {
  ids: Set<string>;
  isFav: (id: string) => boolean;
  toggle: (id: string) => void;
  count: number;
}

const WishlistContext = createContext<WishlistCtx>({
  ids: new Set(),
  isFav: () => false,
  toggle: () => {},
  count: 0,
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const supabase = getSupabaseBrowser();

  // Hydratation depuis localStorage (côté client uniquement)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setIds(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  // Sync Supabase → localStorage si utilisateur connecté
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase
        .from("wishlist")
        .select("villa_id")
        .eq("user_id", session.user.id);
      if (data && data.length > 0) {
        const remoteIds = new Set(data.map((r: { villa_id: string }) => r.villa_id));
        setIds((prev) => {
          const merged = new Set([...prev, ...remoteIds]);
          localStorage.setItem(LS_KEY, JSON.stringify([...merged]));
          return merged;
        });
      }
    });
  }, [supabase]);

  const toggle = useCallback(
    async (villaId: string) => {
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(villaId)) {
          next.delete(villaId);
        } else {
          next.add(villaId);
        }
        localStorage.setItem(LS_KEY, JSON.stringify([...next]));
        return next;
      });

      // Sync Supabase si connecté
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const isCurrent = ids.has(villaId);
      if (isCurrent) {
        await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", session.user.id)
          .eq("villa_id", villaId);
      } else {
        await (supabase as any)
          .from("wishlist")
          .upsert({ user_id: session.user.id, villa_id: villaId });
      }
    },
    [ids, supabase]
  );

  return (
    <WishlistContext.Provider
      value={{ ids, isFav: (id) => ids.has(id), toggle, count: ids.size }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
