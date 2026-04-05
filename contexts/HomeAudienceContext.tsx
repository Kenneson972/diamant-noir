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

/** Flag lu au montage du gate (navigation vers `/` sans passer par React au tick précédent). */
export const HOME_AUDIENCE_GATE_REOPEN_PENDING_KEY = "dn_gate_reopen_pending";

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
 * Aligne `sessionStorage` sur `/?pour=` quand il n’y a pas encore de choix persisté.
 * Sinon le gate est masqué (`hasPour`) mais le contexte reste `null` → nav / blocs home / scroll `#offre-proprietaire` incohérents.
 * Idempotent : ne remplace pas une valeur déjà stockée.
 */
export function hydrateAudienceFromUrlIfNeeded(): boolean {
  if (typeof window === "undefined") return false;
  /** Pendant « Changer de parcours », ne pas réinjecter l’audience depuis `?pour=` avant que `replace("/")` ait nettoyé l’URL. */
  try {
    if (sessionStorage.getItem(HOME_AUDIENCE_GATE_REOPEN_PENDING_KEY) === "1") {
      return false;
    }
  } catch {
    /* private mode */
  }
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
  /** Valeur lue depuis sessionStorage après montage ; `null` = neutre ou pas encore lu */
  audience: HomeAudience;
  /** `false` jusqu’au premier read — traiter comme expérience neutre (les deux parcours). */
  ready: boolean;
  clearAudience: () => void;
  /**
   * Compteur **strictement croissant** (jamais remis à 0) — chaque « Changer de parcours » incrémente.
   * Évite que `consume → 0` + doubles bumps ne fassent perdre un nouveau tick à l’effet du gate.
   */
  gateReopenSignal: number;
  /**
   * « Changer de parcours » : incrémente le signal dans le même geste que le clic (pas de CustomEvent).
   * La séquence complète est centralisée dans `replaceHomeAndRequestGateReopen`.
   */
  requestGateReopen: () => void;
};

const HomeAudienceContext = createContext<Ctx | null>(null);

export function HomeAudienceProvider({ children }: { children: ReactNode }) {
  const [audience, setAudience] = useState<HomeAudience>(null);
  const [ready, setReady] = useState(false);
  const [gateReopenSignal, setGateReopenSignal] = useState(0);

  const sync = useCallback(() => {
    setAudience(readAudience());
  }, []);

  /** Avant premier paint : URL `/` + `?pour=` → storage, puis état React aligné (évite sections / nav « neutres » avec deep link). */
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

  const requestGateReopen = useCallback(() => {
    try {
      sessionStorage.setItem(HOME_AUDIENCE_GATE_REOPEN_PENDING_KEY, "1");
    } catch {
      /* private mode */
    }
    setGateReopenSignal((n) => n + 1);
  }, []);

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
      gateReopenSignal,
      requestGateReopen,
    }),
    [audience, ready, clearAudience, gateReopenSignal, requestGateReopen]
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
