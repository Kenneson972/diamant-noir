"use client";

/**
 * HomeAudienceGate — Choix d'audience au premier chargement de `/`
 *
 * STORAGE: sessionStorage (`dn_home_audience`)
 * Z-INDEX: z-[100] — au-dessus de la navbar (z-50), fond opaque pour masquer tout le site.
 * DEEPLINK: `?pour=` présent → gate ignoré (ex. `?pour=locataire` depuis le choix voyageur)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

const STORAGE_KEY = "dn_home_audience";

export function HomeAudienceGate() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    const hasPour = new URLSearchParams(window.location.search).has("pour");
    if (!stored && !hasPour) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (mounted.current) setEntered(true);
        });
      });
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  useEffect(() => {
    if (visible && entered) {
      firstFocusRef.current?.focus();
    }
  }, [visible, entered]);

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

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const animateOut = useCallback((onDone: () => void, delay = 200) => {
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
      router.replace("/?pour=locataire");
    }, 300);
  }, [animateOut, router]);

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
        "fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-5 py-10",
        "bg-white",
        "transition-opacity duration-[200ms] ease-in motion-reduce:transition-none",
        isVisible ? "opacity-100" : "opacity-0",
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
          "transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none motion-reduce:transform-none",
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0",
        ].join(" ")}
      >
        <p
          className="text-[9px] font-bold uppercase tracking-[0.45em] text-navy/40 animate-stagger-fade [animation-fill-mode:backwards]"
          style={{ animationDelay: '150ms' }}
        >
          Bienvenue · Diamant Noir
        </p>

        <h2
          id="gate-title"
          className="text-center font-display text-3xl leading-tight text-navy md:text-[2.25rem] animate-stagger-fade [animation-fill-mode:backwards]"
          style={{ animationDelay: '220ms' }}
        >
          Comment pouvons-nous
          <br />
          vous aider ?
        </h2>
        <span className="-mt-4 block h-px w-12 bg-navy/12" aria-hidden />

        <div
          className="mt-1 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 animate-stagger-fade [animation-fill-mode:backwards]"
          style={{ animationDelay: '300ms' }}
        >
          <button
            ref={firstFocusRef}
            type="button"
            onClick={chooseVoyageur}
            className="group flex min-h-[120px] flex-col items-start gap-2 border border-gold/35 bg-white px-6 py-7 text-left shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-gold/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 active:scale-[0.98] motion-reduce:transition-none"
          >
            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-gold/80">
              Voyageurs
            </span>
            <span className="font-display text-xl leading-tight text-navy">
              Je réserve un séjour
            </span>
            <ArrowRight
              className="mt-auto h-4 w-4 text-gold/70 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
              strokeWidth={1.25}
              aria-hidden
            />
          </button>

          <button
            type="button"
            onClick={chooseProprio}
            className="group flex min-h-[120px] flex-col items-start gap-2 border border-navy/12 bg-offwhite px-6 py-7 text-left shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-navy/20 hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 active:scale-[0.98] motion-reduce:transition-none"
          >
            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-navy/45">
              Propriétaires
            </span>
            <span className="font-display text-xl leading-tight text-navy">
              Je suis propriétaire
            </span>
            <ArrowRight
              className="mt-auto h-4 w-4 text-navy/40 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
              strokeWidth={1.25}
              aria-hidden
            />
          </button>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="text-[9px] font-medium uppercase tracking-[0.28em] text-navy/35 underline-offset-4 transition-colors duration-150 hover:text-navy/55 focus:outline-none focus-visible:ring-1 focus-visible:ring-navy/30 animate-stagger-fade [animation-fill-mode:backwards]"
          style={{ animationDelay: '420ms' }}
        >
          Continuer sans choisir
        </button>
      </div>
    </div>
  );
}
