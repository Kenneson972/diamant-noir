"use client";

/**
 * HomeAudienceGate — Écran de choix d'audience au premier chargement de `/`
 *
 * STORAGE: sessionStorage (clé `dn_home_audience`)
 *   - "voyageur"     → expérience réservation
 *   - "proprietaire" → navigation vers /proprietaires
 * Le gate réapparaît à chaque nouvelle session navigateur.
 * Pour persister entre sessions, remplacer sessionStorage par localStorage (3 occurrences ci-dessous).
 *
 * DEEPLINK: si l'URL contient `?pour=`, le gate est ignoré
 * (HomeAudienceScroll gère déjà le routage par query param).
 *
 * Z-INDEX: z-40 — sous la Navbar (z-50). Le logo Diamant Noir reste accessible.
 *
 * ANIMATION: CSS/Tailwind uniquement — pas de framer-motion.
 * REDUCED-MOTION: classes `motion-reduce:transition-none` sur toutes les transitions.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

const STORAGE_KEY = "dn_home_audience";
const REVEAL_EVENT = "diamant-reveal-booking";

export function HomeAudienceGate() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false); // controls scale/opacity enter transition
  const [exiting, setExiting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  // Client-only: check storage + URL
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    const hasPour = new URLSearchParams(window.location.search).has("pour");
    if (!stored && !hasPour) {
      setVisible(true);
      // Trigger enter animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (mounted.current) setEntered(true);
        });
      });
    }
  }, []);

  // Focus first card when gate becomes visible
  useEffect(() => {
    if (visible && entered) {
      firstFocusRef.current?.focus();
    }
  }, [visible, entered]);

  // Focus trap
  useEffect(() => {
    if (!visible || !dialogRef.current) return;
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
  }, [visible]);

  // Escape key
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const animateOut = useCallback((onDone: () => void, delay = 300) => {
    setExiting(true);
    setTimeout(() => {
      if (mounted.current) {
        setVisible(false);
        setExiting(false);
        setEntered(false);
        onDone();
      }
    }, delay);
  }, []);

  const dismiss = useCallback(() => {
    animateOut(() => {}, 300);
  }, [animateOut]);

  const chooseVoyageur = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, "voyageur");
    animateOut(() => {
      window.dispatchEvent(new Event(REVEAL_EVENT));
    }, 300);
  }, [animateOut]);

  const chooseProprio = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, "proprietaire");
    animateOut(() => {
      router.push("/proprietaires");
    }, 250);
  }, [animateOut, router]);

  if (!visible) return null;

  const isVisible = entered && !exiting;

  return (
    <div
      className={[
        "fixed inset-0 z-40 flex items-center justify-center px-5",
        "transition-opacity duration-300 ease-in motion-reduce:transition-none",
        isVisible ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[1.5px]" aria-hidden />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        className={[
          "relative z-10 flex w-full max-w-2xl flex-col items-center gap-6",
          "transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none motion-reduce:transform-none",
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0",
        ].join(" ")}
      >
        {/* Eyebrow */}
        <p className="text-[9px] font-bold uppercase tracking-[0.45em] text-white/50">
          Bienvenue · Diamant Noir
        </p>

        {/* Title */}
        <h2
          id="gate-title"
          className="text-center font-display text-3xl text-white/95 md:text-4xl"
        >
          Comment pouvons-nous<br />vous aider ?
        </h2>

        {/* Cards */}
        <div className="mt-2 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Voyageur */}
          <button
            ref={firstFocusRef}
            onClick={chooseVoyageur}
            className="group flex min-h-[120px] flex-col items-start gap-2 border border-gold/45 bg-gold/[0.08] px-6 py-7 text-left backdrop-blur-md transition-all duration-200 hover:bg-gold/[0.14] hover:shadow-[0_0_0_1px_rgba(212,175,55,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 active:scale-[0.98] motion-reduce:transition-none"
          >
            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-gold/70">
              Voyageurs
            </span>
            <span className="font-display text-xl leading-tight text-white">
              Je réserve un séjour
            </span>
            <ArrowRight
              className="mt-auto h-4 w-4 text-gold/60 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
              strokeWidth={1.25}
              aria-hidden
            />
          </button>

          {/* Propriétaire */}
          <button
            onClick={chooseProprio}
            className="group flex min-h-[120px] flex-col items-start gap-2 border border-white/22 bg-white/[0.07] px-6 py-7 text-left backdrop-blur-md transition-all duration-200 hover:bg-white/[0.13] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-[0.98] motion-reduce:transition-none"
          >
            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/45">
              Propriétaires
            </span>
            <span className="font-display text-xl leading-tight text-white">
              Je suis propriétaire
            </span>
            <ArrowRight
              className="mt-auto h-4 w-4 text-white/45 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
              strokeWidth={1.25}
              aria-hidden
            />
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={dismiss}
          className="text-[9px] font-medium uppercase tracking-[0.28em] text-white/30 underline-offset-4 transition-colors duration-150 hover:text-white/55 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
        >
          Continuer sans choisir
        </button>
      </div>
    </div>
  );
}
