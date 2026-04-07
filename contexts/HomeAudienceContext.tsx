"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const HOME_AUDIENCE_STORAGE_KEY = "dn_home_audience";

export type HomeAudience = "voyageur" | "proprietaire" | null;

export const HOME_AUDIENCE_EVENT = "dn-home-audience";

function readAudience(): HomeAudience {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(HOME_AUDIENCE_STORAGE_KEY);
    if (v === "voyageur" || v === "proprietaire") return v;
  } catch {
    /* private mode */
  }
  return null;
}

/**
 * Aligne `sessionStorage` sur `/?pour=` quand il n'y a pas encore de choix persisté.
 * Idempotent : ne remplace pas une valeur déjà stockée.
 */
export function hydrateAudienceFromUrlIfNeeded(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.pathname !== "/") return false;
  if (readAudience() !== null) return false;
  const pour = new URLSearchParams(window.location.search).get("pour")?.toLowerCase();
  if (!pour) return false;
  try {
    if (pour === "locataire" || pour === "locataires") {
      sessionStorage.setItem(HOME_AUDIENCE_STORAGE_KEY, "voyageur");
      return true;
    }
    if (pour === "proprietaire" || pour === "proprietaires") {
      sessionStorage.setItem(HOME_AUDIENCE_STORAGE_KEY, "proprietaire");
      return true;
    }
  } catch {
    /* private mode */
  }
  return false;
}

/** Call after sessionStorage.setItem(HOME_AUDIENCE_STORAGE_KEY, …) in the same tab. */
export function notifyHomeAudienceChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HOME_AUDIENCE_EVENT));
}

type Ctx = {
  audience: HomeAudience;
  ready: boolean;
  clearAudience: () => void;
};

const HomeAudienceContext = createContext<Ctx | null>(null);

export function HomeAudienceProvider({ children }: { children: ReactNode }) {
  const [audience, setAudience] = useState<HomeAudience>(null);
  const [ready, setReady] = useState(false);

  const sync = useCallback(() => {
    setAudience(readAudience());
  }, []);

  useLayoutEffect(() => {
    hydrateAudienceFromUrlIfNeeded();
    setAudience(readAudience());
    setReady(true);
  }, []);

  useEffect(() => {
    const onChange = () => sync();
    window.addEventListener(HOME_AUDIENCE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(HOME_AUDIENCE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [sync]);

  const clearAudience = useCallback(() => {
    try {
      sessionStorage.removeItem(HOME_AUDIENCE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    sync();
    notifyHomeAudienceChange();
  }, [sync]);

  const value = useMemo<Ctx>(
    () => ({ audience: ready ? audience : null, ready, clearAudience }),
    [audience, ready, clearAudience]
  );

  return <HomeAudienceContext.Provider value={value}>{children}</HomeAudienceContext.Provider>;
}

export function useHomeAudience(): Ctx {
  const ctx = useContext(HomeAudienceContext);
  if (!ctx) {
    throw new Error("useHomeAudience must be used within HomeAudienceProvider");
  }
  return ctx;
}
