"use client";

/**
 * Page Prestations — Kayvila
 *
 * "use client" — metadata géré dans layout.tsx (App Router).
 *
 * Structure :
 *   1. Scroll-driven canvas animation (style Apple, GSAP + 561 frames)
 *      → Hero + scroll driver 500vh + transition 55vh si viewport **≥ md / 768px** et **pas** de prefers-reduced-motion
 *      → Sinon : hero statique (image), pas de canvas / GSAP / chargement des frames
 *   2. Hub sous le scroll (strip CTA, chiffres, grille #piliers → /prestations/services/[slug], FAQ)
 *      → Les sections à fond plein recouvrent le canvas fixe.
 */

import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Shield,
  Star,
  type LucideIcon,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SCROLL_SECTIONS, type ScrollSection } from "@/data/prestations-scroll-sections";
import {
  LandingShell,
  LandingSection,
  LandingBlockTitle,
} from "@/components/marketing/landing-sections";

// ─── Video scroll config ──────────────────────────────────────────────────────

const TOTAL_FRAMES = 561; // 37.4s × 15fps, extraits de LANDINGPAGE.mp4

/**
 * Calibrage frame ↔ plan (si la séquence WebP ne colle plus à la vidéo source) :
 * 1. Faire défiler /prestations en dev.
 * 2. Dans ScrollTrigger onUpdate, relever l'index `fi` au moment où chaque plan devient dominant.
 * 3. Ajuster startFrame / endFrame pour chaque entrée (bornes incluses, sans trou entre segments).
 * Option : dans la console navigateur, `window.__PVSH_LOG_FRAMES = true` pour logger chaque `fi`.
 */
/** Position verticale desktop (translate sur ce nœud — ne pas animer `y` GSAP ici). */
function scrollSectionVerticalClasses(v: ScrollSection["vertical"] | undefined) {
  switch (v) {
    case "upper":
      return "md:top-[30%] md:-translate-y-1/2";
    case "lower":
      return "md:top-[68%] md:-translate-y-1/2";
    case "center":
    default:
      return "md:top-1/2 md:-translate-y-1/2";
  }
}

// ─── Données page (hub — détail : /prestations/services/[slug]) ───────────────

const REASSURANCES: { icon: LucideIcon; text: string }[] = [
  { icon: Shield, text: "Pas d'exclusivité obligatoire" },
  { icon: Clock, text: "Réponse sous 48h garantie" },
  { icon: Star, text: "Estimation gratuite et sans engagement" },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Quelle est la première étape ?",
    a: "Soumettez votre villa en 5 minutes via notre dossier interactif. Notre équipe vous recontacte sous 48h pour une estimation gratuite et sans engagement.",
  },
  {
    q: "Y a-t-il un engagement de durée ?",
    a: "Nous travaillons avec une période de découverte de 3 mois, renouvelable. Résiliable avec 30 jours de préavis, sans frais ni pénalité.",
  },
  {
    q: "Est-ce que je garde la propriété de mes annonces ?",
    a: "Oui, vos annonces vous appartiennent. Nous les optimisons et les gérons pour votre compte, sans transfert de propriété.",
  },
  {
    q: "Puis-je bloquer des dates pour ma propre utilisation ?",
    a: "Vous conservez un accès complet au calendrier pour bloquer des périodes à votre convenance, à tout moment.",
  },
  {
    q: "Que se passe-t-il si un voyageur cause des dégâts ?",
    a: "Nous documentons et vous informons immédiatement avec photos. Nous intervenons auprès des plateformes pour les remboursements via Airbnb AirCover et caution Booking.",
  },
  {
    q: "Combien de temps avant la première mise en ligne ?",
    a: "En général 7 à 14 jours : shooting photo, création des annonces, et optimisation sur les plateformes clés.",
  },
];

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function reducedMotionServerSnapshot() {
  return false;
}

function reducedMotionClientSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrestationsPageClient() {
  const router = useRouter();

  // ── Refs ────────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const scrollArrowRef = useRef<HTMLDivElement>(null);
  const videoScrollZoneRef = useRef<HTMLDivElement>(null);
  const scrollDriverRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<(HTMLImageElement | null)[]>(Array(TOTAL_FRAMES).fill(null));
  const currentFrameRef = useRef(0);
  const currentSectionRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingFrameRef = useRef<number | null>(null);
  /** Évite getContext à chaque frame (coût sensible sur mobile). */
  const ctx2dRef = useRef<CanvasRenderingContext2D | null>(null);

  // ── State ───────────────────────────────────────────────────────────────
  const [isReady, setIsReady] = useState(false);
  const [arrowVisible, setArrowVisible] = useState(true);
  /** Parallax scroll + canvas : desktop uniquement (Tailwind `md` = 768px). */
  const [desktopParallax, setDesktopParallax] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : true
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setDesktopParallax(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const prefersReducedMotionUser = useSyncExternalStore(
    subscribeReducedMotion,
    reducedMotionClientSnapshot,
    reducedMotionServerSnapshot,
  );
  /** Scroll immersif + frames : grand écran uniquement, sans « reduced motion » système. */
  const immersiveParallax = desktopParallax && !prefersReducedMotionUser;

  // ── DPR (client-only) ───────────────────────────────────────────────────
  const dpr = useRef(1);
  useEffect(() => {
    dpr.current = Math.min(window.devicePixelRatio || 1, 2);
  }, []);

  // ── Render frame (RAF-batched) ──────────────────────────────────────────
  const renderFrame = useCallback((index: number) => {
    pendingFrameRef.current = index;
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const fi = Math.max(0, Math.min(pendingFrameRef.current ?? index, TOTAL_FRAMES - 1));
      const canvas = canvasRef.current;
      if (!canvas) return;
      let ctx = ctx2dRef.current;
      if (!ctx) {
        ctx = canvas.getContext("2d", { alpha: false });
        ctx2dRef.current = ctx;
      }
      if (!ctx) return;
      const img = framesRef.current[fi];
      if (!img || !img.complete || img.naturalWidth === 0) return;
      const cw = canvas.width / dpr.current;
      const ch = canvas.height / dpr.current;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = Math.ceil(img.naturalWidth * scale);
      const dh = Math.ceil(img.naturalHeight * scale);
      // Fond opaque : évite les bandes body/offwhite si arrondis cover laissent 1px sans peinture
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, Math.floor((cw - dw) / 2), Math.floor((ch - dh) / 2), dw, dh);
    });
  }, []);

  // ── Resize canvas ───────────────────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const d = dpr.current;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * d;
    canvas.height = h * d;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx2dRef.current = ctx;
    if (ctx) ctx.setTransform(d, 0, 0, d, 0, 0);
    renderFrame(currentFrameRef.current);
  }, [renderFrame]);

  // ── Preload frames (desktop parallax uniquement) ─────────────────────────
  useEffect(() => {
    if (!immersiveParallax) {
      setIsReady(true);
      return;
    }

    setIsReady(false);
    let loaded = 0;
    let errors = 0;
    const framesBase = "/frames";
    const loadOne = (i: number) => {
      const img = new window.Image();
      img.decoding = "async";
      img.src = `${framesBase}/frame_${String(i + 1).padStart(4, "0")}.webp`;
      img.onload = () => {
        framesRef.current[i] = img;
        loaded++;
        // Décode en arrière-plan : la prochaine frame dessinée est prête sans blocage decode sur le fil UI
        if (typeof img.decode === "function") {
          void img.decode().catch(() => {});
        }
        if (i === 0) {
          renderFrame(0);
          setIsReady(true); // frame 0 preloadée → page visible immédiatement
        }
      };
      img.onerror = () => {
        errors++;
        // Si la frame 0 échoue, débloquer quand même après 5 erreurs pour ne pas rester bloqué
        if (i === 0 || (loaded + errors >= 5)) setIsReady(true);
      };
    };

    // Eager identique mobile / desktop (150) : le scrub sans lissage + stagger 12ms suffisent sur mobile ; 80 laissait trop de trous
    const eagerCount = 150;
    for (let i = 0; i < Math.min(eagerCount, TOTAL_FRAMES); i++) loadOne(i);

    // Stagger le reste (desktop)
    let idx = eagerCount;
    let cancelled = false;
    const next = () => {
      if (cancelled || idx >= TOTAL_FRAMES) return;
      loadOne(idx++);
      requestAnimationFrame(next);
    };
    if (idx < TOTAL_FRAMES) {
      requestAnimationFrame(next);
    }

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // [FIX P2] Libérer les bitmaps décodés pour éviter la fuite mémoire lors des navigations SPA
      framesRef.current.forEach((img, i) => {
        if (img) { img.src = ""; framesRef.current[i] = null; }
      });
    };
  }, [immersiveParallax, renderFrame]);

  // ── GSAP scroll (desktop parallax uniquement) ───────────────────────────
  useEffect(() => {
    if (!immersiveParallax || !isReady) return;

    // Enregistrement ici — jamais au niveau module (crash SSR)
    gsap.registerPlugin(ScrollTrigger);

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const driver = scrollDriverRef.current;
    const transition = transitionRef.current;
    if (!driver) return;

    // Initial states — opacité sur le panneau, `y` sur l'enfant `.pvsh-motion` pour ne pas
    // écraser le translate-y Tailwind du conteneur (sinon les cartes « flottent » mal).
    SCROLL_SECTIONS.forEach((s) => {
      const el = document.getElementById(`pvsh-${s.id}`);
      const motion = el?.querySelector<HTMLElement>(".pvsh-motion");
      if (el) gsap.set(el, { opacity: 0, willChange: "opacity" });
      if (motion) gsap.set(motion, { y: 28, willChange: "transform" });
    });

    const getSEl = (id: string) => document.getElementById(`pvsh-${id}`);
    const getDot = (id: string) => document.getElementById(`pvsh-dot-${id}`);

    const activateSection = (id: string | null) => {
      currentSectionRef.current = id;
      SCROLL_SECTIONS.forEach((s) => {
        const el = getSEl(s.id);
        const dot = getDot(s.id);
        const active = s.id === id;
        const motion = el?.querySelector<HTMLElement>(".pvsh-motion");
        if (el) {
          gsap.to(el, {
            opacity: active ? 1 : 0,
            duration: active ? 0.55 : 0.15,
            ease: active ? "power3.out" : "power2.in",
            overwrite: "auto",
          });
        }
        if (motion) {
          gsap.to(motion, {
            y: active ? 0 : 20,
            duration: active ? 0.55 : 0.15,
            ease: active ? "power3.out" : "power2.in",
            overwrite: "auto",
          });
        }
        if (dot) {
          gsap.to(dot, {
            backgroundColor: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.32)",
            scale: active ? 1.7 : 1,
            duration: 0.3,
            overwrite: true,
          });
        }
      });
    };

    /** Tant que le scrub n'a pas commencé (haut de page / hero), aucune carte — évite le1er popup collé + disparition en remontant. */
    const POPUP_MIN_PROGRESS = 0.0001;

    const mainTrigger = ScrollTrigger.create({
      trigger: driver,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2,
      onUpdate: (self) => {
        const progress = self.progress;
        const fi = Math.min(Math.round(progress * (TOTAL_FRAMES - 1)), TOTAL_FRAMES - 1);
        currentFrameRef.current = fi;
        renderFrame(fi);
        if (typeof window !== "undefined" && (window as Window & { __PVSH_LOG_FRAMES?: boolean }).__PVSH_LOG_FRAMES) {
          console.log("[prestations scroll] frame", fi, "progress", progress);
        }
        const active =
          progress > POPUP_MIN_PROGRESS
            ? SCROLL_SECTIONS.find((s) => fi >= s.startFrame && fi <= s.endFrame)
            : undefined;
        const newId = active?.id ?? null;
        if (newId !== currentSectionRef.current) {
          activateSection(newId);
        }
      },
    });

    let fadeTrigger: ScrollTrigger | null = null;
    if (transition) {
      fadeTrigger = ScrollTrigger.create({
        trigger: transition,
        start: "top 65%",
        onEnter: () => activateSection(null),
        onLeaveBack: () => activateSection(SCROLL_SECTIONS[SCROLL_SECTIONS.length - 1].id),
      });
    }

    /** Canvas/vignette/popups sont `fixed` : sans masquage, la dernière frame reste visible sous tout le hub + footer. */
    const setVideoStackVisible = (visible: boolean) => {
      const vis = visible ? "visible" : "hidden";
      const canvas = canvasRef.current;
      const vig = vignetteRef.current;
      const dots = dotsRef.current;
      const arrow = scrollArrowRef.current;
      if (canvas) canvas.style.visibility = vis;
      if (vig) vig.style.visibility = vis;
      if (dots) dots.style.visibility = vis;
      if (arrow) arrow.style.visibility = vis;
      SCROLL_SECTIONS.forEach((s) => {
        const el = document.getElementById(`pvsh-${s.id}`);
        if (el) el.style.visibility = vis;
      });
    };

    const videoZone = videoScrollZoneRef.current;
    let videoHideTrigger: ScrollTrigger | null = null;
    if (videoZone) {
      videoHideTrigger = ScrollTrigger.create({
        trigger: videoZone,
        start: "top top",
        end: "bottom top",
        onLeave: () => setVideoStackVisible(false),
        onEnterBack: () => setVideoStackVisible(true),
      });
    }

    return () => {
      mainTrigger.kill();
      fadeTrigger?.kill();
      videoHideTrigger?.kill();
      setVideoStackVisible(true);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [immersiveParallax, isReady, renderFrame, resizeCanvas]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Preload : desktop immersif = frame 0 ; sinon hero statique */}
      {immersiveParallax ? (
        <link rel="preload" as="image" href="/frames/frame_0001.webp" media="(min-width: 768px)" />
      ) : (
        <link rel="preload" as="image" href="/prestations-hero.png" />
      )}

      {immersiveParallax ? (
        <>
          <canvas ref={canvasRef} className="fixed left-0 top-0 z-0 block" aria-hidden />


          <div
            ref={vignetteRef}
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[1]"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.08) 25%, rgba(0,0,0,0.08) 75%, rgba(0,0,0,0.6) 100%)",
            }}
          />

          {SCROLL_SECTIONS.map((section, idx) => {
            const left = section.position === "left";
            const vCls = scrollSectionVerticalClasses(section.vertical);
            return (
              <div
                key={section.id}
                id={`pvsh-${section.id}`}
                suppressHydrationWarning
                className={`pointer-events-none fixed z-20 w-[min(390px,calc(100vw-2rem))] will-change-[opacity,transform] max-md:bottom-[max(1.25rem,env(safe-area-inset-bottom))] max-md:top-auto max-md:max-h-[min(48vh,400px)] max-md:translate-y-0 max-md:overflow-y-auto ${vCls} ${
                  left
                    ? "left-4 sm:left-8 md:left-12 lg:left-16"
                    : "right-4 sm:right-8 md:right-12 lg:right-16"
                }`}
                style={{ opacity: 0, minHeight: "280px", contain: "layout style" }}
              >
                <div className="pvsh-motion relative">
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute select-none font-display text-[6rem] font-bold leading-none text-white md:text-[8rem] ${
                      left ? "-left-1 -top-10" : "-right-1 -top-10"
                    }`}
                    style={{ opacity: 0.03 }}
                  >
                    {section.label}
                  </div>

                  <div className="relative rounded-2xl border border-white/60 bg-[rgba(255,255,255,0.76)] p-5 max-md:bg-[rgba(255,255,255,0.92)] md:rounded-3xl md:p-7 md:backdrop-blur-md [box-shadow:0_18px_45px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.55)]">
                    {/* Indicateur de progression 360° */}
                    <div className="mb-5 flex items-center gap-2" aria-label={`Pilier ${idx + 1} sur 5`}>
                      {SCROLL_SECTIONS.map((_, si) => (
                        <div
                          key={si}
                          className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${si <= idx ? "bg-gold" : "bg-gold/20"}`}
                        />
                      ))}
                      <span className="ml-1 shrink-0 text-[9px] font-bold tabular-nums uppercase tracking-[0.18em] text-gold/75">
                        {idx + 1} / 5
                      </span>
                    </div>
                    <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.35em] text-navy/70">
                      {section.tagline}
                    </p>
                    <h2 className="mb-1 font-display text-xl font-bold leading-tight text-navy md:text-2xl">
                      {section.title}
                    </h2>
                    <button
                      type="button"
                      onClick={() => router.push(`/prestations/services/${section.id}`)}
                      className="pointer-events-auto mt-5 inline-flex min-h-[44px] items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-navy/75 underline-offset-4 transition-colors hover:text-navy hover:underline"
                    >
                      Voir le détail <ArrowRight size={11} strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div
            ref={dotsRef}
            aria-hidden="true"
            className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-2.5 md:flex"
          >
            {SCROLL_SECTIONS.map((s) => (
              <div
                key={s.id}
                id={`pvsh-dot-${s.id}`}
                className="h-1.5 w-1.5 rounded-full transition-all"
                style={{ backgroundColor: "rgba(255,255,255,0.32)" }}
              />
            ))}
          </div>
        </>
      ) : null}

      <div className="relative z-10">
        {immersiveParallax ? (
          <div ref={videoScrollZoneRef}>
            <section
              className="relative flex min-h-[45dvh] w-full flex-col items-center justify-center overflow-hidden bg-navy px-4 text-center"
              aria-labelledby="prestations-title"
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 70%)",
                }}
                aria-hidden
              />

              <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center pt-20">
                <div className="mb-6 h-px w-12 bg-gold/40" aria-hidden />

                <h1
                  id="prestations-title"
                  className="animate-in fade-in m-0 font-display font-normal leading-[1.06] text-white uppercase"
                  style={{
                    fontSize: "clamp(1.75rem, 5.5vw, 4rem)",
                    letterSpacing: "0.26em",
                  }}
                >
                  Nos Prestations
                </h1>

                <p className="animate-in fade-in slide-in-from-bottom-1 mt-4 m-0 font-display font-normal text-[10px] uppercase tracking-[0.3em] text-white/60 delay-75 duration-700 md:tracking-[0.35em]">
                  Gestion complète · Clé en main · Équipe locale
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setArrowVisible(false);
                    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
                  }}
                  className="animate-in fade-in slide-in-from-bottom-2 mt-8 inline-flex min-h-[44px] items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 delay-150 transition-colors duration-300 hover:text-white"
                >
                  Explorer les cinq piliers <ArrowRight size={16} strokeWidth={2} aria-hidden />
                </button>

                {arrowVisible && (
                  <div
                    aria-hidden
                    className="mt-8 motion-safe:animate-[scrollFloat_3s_ease-in-out_infinite] transition-opacity duration-300"
                  >
                    <svg width="80" height="50" viewBox="0 0 80 50" fill="none">
                      <path
                        d="M0 40L40 10L80 40"
                        stroke="white"
                        strokeOpacity="0.8"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>

            </section>

            <div ref={scrollDriverRef} style={{ height: "500vh" }} aria-hidden />

            <div
              ref={transitionRef}
              className="relative flex h-[55vh] flex-col items-center justify-end pb-10"
              aria-hidden
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.22) 22%, rgba(0,0,0,0.55) 48%, rgba(0,0,0,0.88) 78%, #000 100%)",
                }}
              />
              <div className="relative flex flex-col items-center gap-2 text-white/30">
                <p className="text-[8px] uppercase tracking-[0.4em]">Gestion clé en main</p>
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
        ) : (
          <section
            className="relative w-full overflow-hidden bg-navy"
            aria-labelledby="prestations-title"
          >
            <div className="relative aspect-[4/5] max-h-[min(80vh,640px)] w-full sm:aspect-[16/10] sm:max-h-[min(56vh,520px)]">
              <Image
                src="/prestations-hero.png"
                alt=""
                fill
                priority
                className="object-cover object-center"
                sizes="100vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-b from-navy/75 via-navy/50 to-navy"
                aria-hidden
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-12 pt-20 text-center">
                <div className="mx-auto mb-5 h-px w-12 bg-gold/50" aria-hidden />
                <h1
                  id="prestations-title"
                  className="m-0 max-w-3xl font-display font-normal leading-[1.08] text-white uppercase"
                  style={{
                    fontSize: "clamp(1.5rem, 6vw, 2.75rem)",
                    letterSpacing: "0.2em",
                  }}
                >
                  Nos Prestations
                </h1>
                <p className="mt-4 max-w-md font-display text-[10px] uppercase tracking-[0.28em] text-white/65">
                  Gestion complète · Clé en main · Équipe locale
                </p>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
                  className="mt-8 inline-flex min-h-[48px] items-center gap-2 border border-white/25 bg-white/10 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  Explorer les cinq piliers<ArrowRight size={16} strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── CONTENU DÉTAILLÉ (fond plein — cache le canvas) ───────── */}

        <LandingShell>

          {/* ── 2. Strip CTA ── */}
          <section className="bg-navy px-5 py-4 sm:px-6 md:py-5">
            <div className="mx-auto max-w-4xl text-center">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 md:gap-x-5">
                <Link
                  href="/soumettre-ma-villa"
                  className="inline-flex min-h-[44px] items-center justify-center border border-white bg-white px-5 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-navy transition-colors hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Confier ma villa
                </Link>
              </div>
              <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30 md:mt-3">
                Commission 20&nbsp;% TTC · Équipe locale 7j/7 · Présence en Martinique
              </p>
            </div>
          </section>

          {/* ── 3. Bandeau 4 chiffres ── */}
          <section className="border-b border-black/[0.07] bg-offwhite px-5 py-10 sm:px-6">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-5 text-center">
              {[
                { val: "13", label: "prestations incluses" },
                { val: "20\u202f%", label: "commission TTC" },
                { val: "100+", label: "séjours gérés" },
                { val: "7j/7", label: "équipe locale" },
              ].map(({ val, label }, i, arr) => (
                <div key={label} className="flex items-center gap-10">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-display text-3xl text-navy">{val}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-navy/45">
                      {label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <span className="hidden h-6 w-px bg-navy/10 sm:block" aria-hidden />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Hub : piliers en mode editorial (alternance image/texte) ── */}
          <LandingSection id="piliers" bg="offwhite">
            <ScrollReveal>
              <div className="mx-auto max-w-2xl text-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/45">
                  Gestion clé en main
                </span>
                <h2 className="mt-4 font-display text-4xl font-light leading-[1.04] text-navy md:text-5xl lg:text-6xl">
                  Cinq piliers,<br />une seule équipe
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-navy/55 md:text-[15px]">
                  Chaque pilier est un chapitre à part entière — découvrez leur identité et ce qu'ils incluent.
                </p>
              </div>
            </ScrollReveal>

            <div className="mt-16 space-y-20 md:space-y-28">
              {SCROLL_SECTIONS.map((s, idx) => {
                const visual = (() => {
                  switch (s.id) {
                    case "marketing": return { src: "/marketing.png", alt: "Piscine villa luxe coucher soleil — Marketing Kayvila", pos: "center 30%" };
                    case "operations": return { src: "/terrain.png", alt: "Entrée villa vue extérieure — Opérations Kayvila", pos: "center 35%" };
                    case "voyageurs": return { src: "/relation.png", alt: "Couple en terrasse face océan — Relation voyageurs Kayvila", pos: "center 50%" };
                    case "menage": return { src: "/menage.png", alt: "Lit impeccable drap blanc — Ménage Kayvila", pos: "center 40%" };
                    case "finance": return { src: "/finance.png", alt: "Bureau terrasse MacBook café — Finance Kayvila", pos: "center 30%" };
                    default: return null;
                  }
                })();
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={s.id}
                    id={`pilier-${s.id}`}
                    className="grid grid-cols-1 items-center gap-10 border-b border-navy/[0.06] pb-20 last:border-0 last:pb-0 scroll-mt-28 md:grid-cols-5 md:gap-14 lg:gap-20"
                  >
                    {/* Image — 3/5 de la largeur */}
                    <ScrollReveal className={`${isEven ? "" : "md:order-2"} md:col-span-3`}>
                      <Link
                        href={`/prestations/services/${s.id}`}
                        className="group relative block aspect-[3/2] w-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                      >
                        {visual && (
                          <Image
                            src={visual.src}
                            alt={visual.alt}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                            style={{ objectPosition: visual.pos }}
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
                        <span className="absolute bottom-4 left-5 font-display text-[12px] font-bold tracking-[0.3em] text-white/0 transition-all duration-300 group-hover:text-white/80">
                          Voir le détail →
                        </span>
                      </Link>
                    </ScrollReveal>

                    {/* Texte — 2/5 de la largeur */}
                    <ScrollReveal className={`${isEven ? "md:order-2" : ""} md:col-span-2`} delay={100}>
                      <div className="mb-5 flex items-center gap-4">
                        <span className="font-display text-[11px] font-bold tracking-[0.2em] text-gold/50">
                          {s.label}
                        </span>
                        <div className="h-px flex-1 bg-navy/[0.06]" aria-hidden />
                      </div>

                      <span className="text-[9px] font-bold uppercase tracking-[0.32em] text-navy/35">
                        {s.tagline}
                      </span>

                      <h3 className="mt-3 font-display text-2xl font-normal leading-[1.08] text-navy md:text-3xl">
                        {s.title}
                      </h3>

                      <div className="mt-5 h-px w-10 bg-gold/30" aria-hidden />

                      <ul className="mt-6 space-y-3">
                        {s.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-3 text-sm leading-relaxed text-navy/65 stagger-item">
                            <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy/[0.04] text-[9px] font-bold text-navy/35">
                              {j + 1}
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={`/prestations/services/${s.id}`}
                        className="mt-8 inline-flex min-h-[44px] items-center gap-2 border border-navy/20 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.24em] text-navy transition-all hover:border-navy hover:bg-navy hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                      >
                        Voir le détail complet <ArrowRight size={12} strokeWidth={1.75} aria-hidden />
                      </Link>
                    </ScrollReveal>
                  </div>
                );
              })}
            </div>
          </LandingSection>

          {/* ── FAQ dédiée ── */}
          <LandingSection bg="white">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/45">
                Questions fréquentes
              </span>
              <h2 className="mt-4 font-display text-3xl font-light leading-[1.08] text-navy md:text-4xl">
                Tout ce qu&apos;il faut savoir
              </h2>
              <p className="mt-3 text-sm text-navy/55">Consultez notre FAQ ou contactez-nous directement.</p>
            </div>
            <div className="mx-auto mt-10 max-w-2xl space-y-0 border-t border-navy/10">
              {FAQ_ITEMS.map(({ q, a }) => (
                <details key={q} className="group border-b border-navy/10 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[12px] font-bold uppercase tracking-[0.2em] text-navy outline-none transition-colors hover:text-navy/70 [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="shrink-0 text-navy/40 transition-transform duration-200 group-open:rotate-180" aria-hidden>▾</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-navy/60">{a}</p>
                </details>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/faq" className="text-[10px] font-medium uppercase tracking-[0.22em] text-navy underline-offset-4 hover:underline">
                Voir toutes les questions →
              </Link>
            </div>
          </LandingSection>

          {/* ── 14. Section soumettre (simplifiée) ── */}
          <LandingSection id="soumettre" bg="offwhite">
            <LandingBlockTitle eyebrow="Devenez partenaire" title="Confiez-nous votre villa" />
            <div className="grid gap-14 md:grid-cols-2 md:gap-20">
              <div className="space-y-10">
                <p className="text-[15px] leading-relaxed text-navy/65">
                  Rejoignez les propriétaires qui font confiance à Kayvila pour gérer leur bien
                  avec exigence — et transformez votre villa en une expérience mémorable.
                </p>
                <ul className="space-y-4">
                  {REASSURANCES.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-4">
                      <Icon size={18} strokeWidth={1.25} className="shrink-0 text-gold" aria-hidden />
                      <span className="text-[13px] font-semibold text-navy/75">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col justify-center">
                <div className="border border-navy/10 bg-navy px-8 py-12 text-center">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-gold/70">
                    Estimation gratuite · Sans engagement
                  </p>
                  <p className="font-display text-2xl font-normal text-white md:text-3xl">Votre villa mérite mieux.</p>
                  <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-white/55">
                    Dossier interactif en 4 étapes — 5 minutes. Notre équipe vous recontacte sous 48h avec une estimation personnalisée.
                  </p>
                  <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left">
                    {["Pas d'exclusivité obligatoire", "Commission 20\u202f% TTC tout compris", "Réponse sous 48h garantie"].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-[11px] text-white/50">
                        <Check size={12} strokeWidth={2} className="shrink-0 text-gold" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/soumettre-ma-villa"
                    className="mt-8 inline-flex min-h-[52px] items-center gap-3 border border-gold bg-gold px-8 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-navy transition-colors hover:bg-gold/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    Déposer mon dossier <ArrowRight size={15} aria-hidden />
                  </Link>
                </div>
                <p className="mt-6 text-center text-sm text-navy/50">
                  Une question avant de soumettre ?{" "}
                  <Link href="/contact" className="font-medium text-navy underline-offset-4 hover:underline">
                    Contactez-nous directement
                  </Link>
                </p>
              </div>
            </div>
          </LandingSection>

          {/* ── Lien vers la FAQ dédiée ── */}
          <LandingSection bg="offwhite">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto mb-5 h-px w-8 bg-gold/40" aria-hidden />
              <p className="text-sm text-navy/60">
                Consultez notre{" "}
                <Link href="/faq" className="font-medium text-navy underline-offset-4 hover:underline">
                  FAQ dédiée
                </Link>{" "}
                pour toutes les questions sur la commission, les services inclus, les prix, le pack de démarrage et le contrat.
              </p>
            </div>
          </LandingSection>

        </LandingShell>
      </div>
    </>
  );
}
