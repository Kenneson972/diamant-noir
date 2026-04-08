"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2 } from "lucide-react";
import {
  HOME_AUDIENCE_STORAGE_KEY,
  notifyHomeAudienceChange,
} from "@/contexts/HomeAudienceContext";
import { HeroSearchWidget } from "@/components/HeroSearchWidget";

type Selection = "voyageur" | "proprietaire" | null;

export function HeroAudienceCards() {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(HOME_AUDIENCE_STORAGE_KEY);
      if (stored === "voyageur" || stored === "proprietaire") {
        setSelection(stored);
      }
    } catch {
      /* private mode */
    }
  }, []);

  const chooseVoyageur = useCallback(() => {
    try {
      sessionStorage.setItem(HOME_AUDIENCE_STORAGE_KEY, "voyageur");
    } catch {
      /* private mode */
    }
    notifyHomeAudienceChange();
    setSelection("voyageur");
  }, []);

  const chooseProprio = useCallback(() => {
    router.push("/prestations");
  }, [router]);

  /* Après choix voyageur : uniquement la barre de recherche (cartes masquées) */
  if (selection === "voyageur") {
    return (
      <div className="mx-auto mt-8 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
        <HeroSearchWidget />
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Carte gauche — Conciergerie Privée (priorité) */}
        <button
          type="button"
          onClick={chooseProprio}
          className="group flex min-h-[104px] flex-col items-start gap-2 border border-gold/30 bg-black/20 px-6 py-6 text-left backdrop-blur-sm transition-all duration-200 hover:border-gold/60 hover:bg-black/28 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 active:scale-[0.98]"
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-gold/80">
            Conciergerie Privée
          </span>
          <span className="font-display text-[1.1rem] leading-snug text-white">
            Gérer ma villa avec Diamant Noir
          </span>
          <Building2
            className="mt-auto h-[15px] w-[15px] text-gold/55 transition-transform duration-200 group-hover:translate-x-0.5"
            strokeWidth={1.5}
            aria-hidden
          />
        </button>

        {/* Carte droite — Espace Voyageur (secondaire) */}
        <button
          type="button"
          onClick={chooseVoyageur}
          className="group flex min-h-[104px] flex-col items-start gap-2 border border-white/15 bg-black/15 px-6 py-6 text-left backdrop-blur-sm transition-all duration-200 hover:border-white/28 hover:bg-black/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-[0.98]"
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-white/45">
            Espace Voyageur
          </span>
          <span className="font-display text-[1.1rem] leading-snug text-white">
            Réserver un séjour
          </span>
          <Search
            className="mt-auto h-[15px] w-[15px] text-white/30 transition-transform duration-200 group-hover:scale-110"
            strokeWidth={1.5}
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}
