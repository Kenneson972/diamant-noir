"use client";

/**
 * WishlistContext — Kayvila
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
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: any } }) => {
      if (!session) return;
      const { data, error } = await supabase
        .from("wishlist")
        .select("villa_id")
        .eq("user_id", session.user.id);
      if (error) return;
      if (data && data.length > 0) {
        const remoteIds = new Set<string>(data.map((r: { villa_id: string }) => r.villa_id));
        setIds((prev: Set<string>) => {
          const merged = new Set([...prev, ...remoteIds]);
          localStorage.setItem(LS_KEY, JSON.stringify([...merged]));
          return merged;
        });
      }
    });
  }, [supabase]);

  const toggle = useCallback(
    async (villaId: string) => {
      let removing = false;
      setIds((prev) => {
        const next = new Set(prev);
        removing = next.has(villaId);
        if (removing) next.delete(villaId);
        else next.add(villaId);
        localStorage.setItem(LS_KEY, JSON.stringify([...next]));
        return next;
      });

      if (!supabase) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      if (removing) {
        await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", session.user.id)
          .eq("villa_id", villaId);
      } else {
        await supabase
          .from("wishlist")
          .upsert({ user_id: session.user.id, villa_id: villaId });
      }
    },
    [supabase]
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
