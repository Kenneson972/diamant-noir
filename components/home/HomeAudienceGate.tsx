"use client";

/**
 * HomeAudienceGate — Choix d'audience au premier chargement de `/`
 *
 * STRATÉGIE D'ANIMATION :
 *
 * → Propriétaire (/proprietaires — page différente) :
 *   Le gate ne se ferme PAS sur clic. Il reste en couverture blanche opaque
 *   pendant que Next.js charge la nouvelle page. Quand /proprietaires est prêt,
 *   React démonte tout l'arbre du home (gate inclus) et monte la nouvelle page.
 *   Le gate disparaît exactement au moment où la page apparaît → zéro flash.
 *
 * → Voyageur (?pour=locataire — même page) :
 *   Navigation same-page : le gate doit se fermer lui-même pour révéler le contenu
 *   de la page d'accueil. Animation de sortie (150ms) concurrent à la navigation.
 *
 * → Apparition initiale :
 *   useLayoutEffect (synchrone avant paint) élimine le flash de contenu.
 *   Pendant la vérification : fond blanc opaque = aucun contenu visible.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  HOME_AUDIENCE_STORAGE_KEY,
  notifyHomeAudienceChange,
} from "@/contexts/HomeAudienceContext";

export function HomeAudienceGate() {
  const router = useRouter();
  // null = vérification en cours | true = afficher | false = masquer
  const [decision, setDecision] = useState<boolean | null>(null);
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  // "proprio" | "voyageur" — indique quel bouton est en cours de chargement
  const [loadingChoice, setLoadingChoice] = useState<"proprio" | "voyageur" | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  // ── Vérification synchrone AVANT le premier paint ─────────────────────────
  useLayoutEffect(() => {
    const stored = sessionStorage.getItem(HOME_AUDIENCE_STORAGE_KEY);
    const hasPour = new URLSearchParams(window.location.search).has("pour");
    const show = !stored && !hasPour;
    setDecision(show);
    if (show) {
      requestAnimationFrame(() => {
        if (mounted.current) setEntered(true);
      });
    }
  }, []);

  // ── Prefetch des destinations ─────────────────────────────────────────────
  useEffect(() => {
    router.prefetch("/proprietaires");
    router.prefetch("/villas");
  }, [router]);

  // ── Scroll lock ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (decision !== true) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [decision]);

  // ── Focus initial ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (decision === true && entered) {
      firstFocusRef.current?.focus();
    }
  }, [decision, entered]);

  // ── Focus trap ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (decision !== true || !dialogRef.current) return;
    const getFocusable = () =>
      Array.from(
        dialogRef.current!.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])'
        )
      );
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [decision]);

  // ── Escape ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (decision !== true || loadingChoice) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decision, loadingChoice]);

  // ── Animation de sortie (same-page uniquement) ────────────────────────────
  const startExit = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      if (mounted.current) {
        setDecision(false);
        setExiting(false);
        setEntered(false);
      }
    }, 150);
  }, []);

  const dismiss = useCallback(() => {
    startExit();
  }, [startExit]);

  // ── Voyageur — navigation same-page ──────────────────────────────────────
  // Le gate doit se fermer lui-même pour révéler la page d'accueil.
  // Sortie (150ms) + navigation déclenchées simultanément.
  const chooseVoyageur = useCallback(() => {
    if (loadingChoice) return;
    sessionStorage.setItem(HOME_AUDIENCE_STORAGE_KEY, "voyageur");
    notifyHomeAudienceChange();
    setLoadingChoice("voyageur");
    startExit();
    router.replace("/?pour=locataire");
  }, [loadingChoice, router, startExit]);

  // ── Propriétaire — navigation vers une page différente ───────────────────
  // Le gate reste visible (couverture blanche) pendant le chargement de /proprietaires.
  // Next.js démonte le home entier (gate inclus) quand la nouvelle page est prête.
  // Résultat : gate disparaît exactement au moment où la page apparaît, sans flash.
  const chooseProprio = useCallback(() => {
    if (loadingChoice) return;
    sessionStorage.setItem(HOME_AUDIENCE_STORAGE_KEY, "proprietaire");
    notifyHomeAudienceChange();
    setLoadingChoice("proprio");
    router.push("/proprietaires");
    // Sécurité : si la navigation échoue ou prend trop longtemps (>8s), on ferme le gate.
    setTimeout(() => {
      if (mounted.current) startExit();
    }, 8000);
  }, [loadingChoice, router, startExit]);

  // ── Rendu ─────────────────────────────────────────────────────────────────

  // Couverture blanche opaque pendant la vérification initiale (avant paint)
  if (decision === null) {
    return (
      <div
        className="fixed inset-0 z-[110] bg-white"
        aria-hidden="true"
        suppressHydrationWarning
      />
    );
  }

  if (decision === false) return null;

  const isVisible = entered && !exiting;

  return (
    <div
      className={[
        "fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto px-5 py-10 bg-white",
        // Propriétaire en cours : fond blanc fixe, pas d'animation de sortie
        loadingChoice === "proprio"
          ? "opacity-100 pointer-events-none"
          : [
              "transition-opacity duration-[180ms] ease-out motion-reduce:transition-none",
              isVisible ? "opacity-100" : "opacity-0",
            ].join(" "),
      ].join(" ")}
      aria-hidden={!isVisible}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        className={[
          "relative z-10 flex w-full max-w-2xl flex-col items-center gap-8",
          // Propriétaire en cours : contenu sort doucement (signal visuel) — le fond blanc reste
          loadingChoice === "proprio"
            ? "transition-all duration-[220ms] ease-in -translate-y-2 opacity-0 scale-[0.97] motion-reduce:transition-none"
            : [
                "transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none",
                isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.98] opacity-0",
              ].join(" "),
        ].join(" ")}
      >
        <p
          className="text-[9px] font-bold uppercase tracking-[0.45em] text-navy/40 animate-stagger-fade [animation-fill-mode:backwards]"
          style={{ animationDelay: "60ms" }}
        >
          Bienvenue · Diamant Noir
        </p>

        <h2
          id="gate-title"
          className="text-center font-display text-3xl leading-tight text-navy md:text-[2.25rem] animate-stagger-fade [animation-fill-mode:backwards]"
          style={{ animationDelay: "120ms" }}
        >
          Comment pouvons-nous
          <br />
          vous aider ?
        </h2>
        <span className="-mt-4 block h-px w-12 bg-navy/12" aria-hidden />

        <div
          className="mt-1 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 animate-stagger-fade [animation-fill-mode:backwards]"
          style={{ animationDelay: "180ms" }}
        >
          {/* ── Voyageur ── */}
          <button
            ref={firstFocusRef}
            type="button"
            onClick={chooseVoyageur}
            disabled={!!loadingChoice}
            className="group flex min-h-[120px] flex-col items-start gap-2 border border-gold/35 bg-white px-6 py-7 text-left shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-gold/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-gold/80">
              Voyageurs
            </span>
            <span className="font-display text-xl leading-tight text-navy">
              Je réserve un séjour
            </span>
            {loadingChoice === "voyageur" ? (
              <LoadingDots className="mt-auto" />
            ) : (
              <ArrowRight
                className="mt-auto h-4 w-4 text-gold/70 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                strokeWidth={1.25}
                aria-hidden
              />
            )}
          </button>

          {/* ── Propriétaire ── */}
          <button
            type="button"
            onClick={chooseProprio}
            disabled={!!loadingChoice}
            className="group flex min-h-[120px] flex-col items-start gap-2 border border-navy/12 bg-offwhite px-6 py-7 text-left shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-navy/20 hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-navy/45">
              Propriétaires
            </span>
            <span className="font-display text-xl leading-tight text-navy">
              Je suis propriétaire
            </span>
            {loadingChoice === "proprio" ? (
              <LoadingDots className="mt-auto" />
            ) : (
              <ArrowRight
                className="mt-auto h-4 w-4 text-navy/40 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                strokeWidth={1.25}
                aria-hidden
              />
            )}
          </button>
        </div>

        {!loadingChoice && (
          <button
            type="button"
            onClick={dismiss}
            className="text-[9px] font-medium uppercase tracking-[0.28em] text-navy/35 underline-offset-4 transition-colors duration-150 hover:text-navy/55 focus:outline-none focus-visible:ring-1 focus-visible:ring-navy/30 animate-stagger-fade [animation-fill-mode:backwards]"
            style={{ animationDelay: "260ms" }}
          >
            Continuer sans choisir
          </button>
        )}
      </div>
    </div>
  );
}

// ── Indicateur de chargement minimaliste ──────────────────────────────────────
function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-[3px] ${className ?? ""}`} aria-label="Chargement">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-[3px] w-[3px] rounded-full bg-current opacity-40 animate-pulse"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
        />
      ))}
    </span>
  );
}
