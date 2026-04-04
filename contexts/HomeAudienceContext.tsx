"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

/** Call after sessionStorage.setItem(HOME_AUDIENCE_STORAGE_KEY, …) in the same tab. */
export function notifyHomeAudienceChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HOME_AUDIENCE_EVENT));
}

type Ctx = {
  /** Valeur lue depuis sessionStorage après montage ; `null` = neutre ou pas encore lu */
  audience: HomeAudience;
  /** `false` jusqu’au premier read — traiter comme expérience neutre (les deux parcours). */
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

  useEffect(() => {
    sync();
    setReady(true);
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
    () => ({
      audience: ready ? audience : null,
      ready,
      clearAudience,
    }),
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
