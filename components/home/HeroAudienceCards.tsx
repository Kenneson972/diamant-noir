"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Building2 } from "lucide-react";
import {
  HOME_AUDIENCE_STORAGE_KEY,
  notifyHomeAudienceChange,
  useHomeAudience,
} from "@/contexts/HomeAudienceContext";
import { HeroSearchWidget } from "@/components/HeroSearchWidget";
import { SITE_BRAND_DISPLAY } from "@/data/site-brand";

type HeroAudienceCardsProps = {
  /** Accueil minimal clair vs ancien hero sombre */
  surface?: "light" | "dark";
};

export function HeroAudienceCards({ surface = "dark" }: HeroAudienceCardsProps) {
  const router = useRouter();
  const { audience, ready, clearAudience } = useHomeAudience();

  const chooseVoyageur = useCallback(() => {
    try {
      sessionStorage.setItem(HOME_AUDIENCE_STORAGE_KEY, "voyageur");
    } catch {
      /* private mode */
    }
    notifyHomeAudienceChange();
  }, []);

  const chooseProprio = useCallback(() => {
    router.push("/prestations");
  }, [router]);

  const showVoyageurSearch = ready && audience === "voyageur";

  /* Après choix voyageur : petite flèche de retour + recherche */
  if (showVoyageurSearch) {
    const isLight = surface === "light";

    return (
      <div className="mx-auto mt-6 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="relative mb-2 flex items-center">
          <button
            type="button"
            onClick={clearAudience}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 active:scale-95 ${
              isLight
                ? "text-navy/40 hover:bg-navy/5 focus-visible:ring-navy/20"
                : "text-white/50 hover:bg-white/10 focus-visible:ring-white/25"
            }`}
            aria-label="Retour au choix voyageur ou propriétaire"
          >
            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
        <HeroSearchWidget surface={surface} />
      </div>
    );
  }

  const cardLight =
    "border-navy/10 bg-white hover:border-navy/16 focus-visible:ring-navy/20";
  const cardDark =
    "border-white/20 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06] focus-visible:ring-white/25";
  const cardLightSecondary =
    "border-navy/10 bg-white hover:border-navy/16 focus-visible:ring-navy/20";
  const cardDarkSecondary =
    "border-white/18 bg-white/[0.025] hover:border-white/28 hover:bg-white/[0.05] focus-visible:ring-white/22";
  const titleLight = "text-navy";
  const titleDark = "text-white";
  const iconLight = "text-navy/40 group-hover:text-navy/55";
  const iconLight2 = "text-navy/35 group-hover:text-navy/50";
  const iconDark = "text-white/55";
  const iconDark2 = "text-white/50";

  const isLight = surface === "light";

  return (
    <div className="mx-auto mt-6 flex w-full max-w-full flex-col gap-2 sm:mt-8 sm:max-w-2xl sm:gap-3">
      <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={chooseProprio}
          aria-label={`Conciergerie privée — Gérer ma villa avec ${SITE_BRAND_DISPLAY}`}
          className={`group flex min-h-[min(104px,22dvh)] min-w-0 flex-col items-start gap-1.5 border px-3 py-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 active:scale-[0.98] sm:min-h-[104px] sm:gap-2 sm:px-6 sm:py-6 ${isLight ? cardLight : cardDark}`}
        >
          <span
            className={`text-[9px] font-bold uppercase leading-tight tracking-[0.2em] sm:tracking-[0.38em] ${isLight ? "text-navy/50" : "text-white/55"}`}
          >
            Conciergerie Privée
          </span>
          <span
            className={`w-full min-w-0 break-words font-display text-[0.8125rem] leading-snug sm:text-[1.1rem] ${isLight ? titleLight : titleDark}`}
          >
            {`Gérer ma villa avec ${SITE_BRAND_DISPLAY}`}
          </span>
          <Building2
            className={`mt-auto h-[14px] w-[14px] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 sm:h-[15px] sm:w-[15px] ${isLight ? iconLight : iconDark}`}
            strokeWidth={1.5}
            aria-hidden
          />
        </button>

        <button
          type="button"
          onClick={chooseVoyageur}
          aria-label="Espace voyageur — Réserver un séjour"
          className={`group flex min-h-[min(104px,22dvh)] min-w-0 flex-col items-start gap-1.5 border px-3 py-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 active:scale-[0.98] sm:min-h-[104px] sm:gap-2 sm:px-6 sm:py-6 ${isLight ? cardLightSecondary : cardDarkSecondary}`}
        >
          <span
            className={`text-[9px] font-bold uppercase leading-tight tracking-[0.2em] sm:tracking-[0.38em] ${isLight ? "text-navy/50" : "text-white/55"}`}
          >
            Espace Voyageur
          </span>
          <span className={`font-display text-[0.8125rem] leading-snug sm:text-[1.1rem] ${isLight ? titleLight : titleDark}`}>
            Réserver un séjour
          </span>
          <Search
            className={`mt-auto h-[14px] w-[14px] shrink-0 transition-transform duration-200 group-hover:scale-110 sm:h-[15px] sm:w-[15px] ${isLight ? iconLight2 : iconDark2}`}
            strokeWidth={1.5}
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}
