"use client";

/**
 * VideoScrollHero — Page Prestations · Diamant Noir
 *
 * Scroll-driven canvas animation (style Apple) pour la page /prestations.
 * S'intègre dans LandingShell — pas de header propre.
 * Le canvas (position:fixed) est recouvert naturellement par les sections
 * à fond plein (bg-offwhite, bg-black) qui suivent dans la page.
 *
 * Mapping vidéo LANDINGPAGE.mp4 extraite à 15fps → 561 frames WebP
 *   0–111   → Extérieur · Piscine    → Marketing & Visibilité
 *   112–223 → Salon · Vue Mer        → Opérations & Terrain
 *   224–336 → Chambre · Balcon       → Entretien & Qualité
 *   337–420 → Escalier · Hall        → Ménage & Blanchisserie
 *   449–504 → Cuisine (travelling / plan large) → pas de carte
 *   505–560 → Café + tablette marbre → Finance & Reversements
 */

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown, ArrowRight } from "lucide-react";

// NE PAS appeler gsap.registerPlugin() au niveau module — crash SSR.
// L'enregistrement se fait dans le premier useEffect (client uniquement).

// ── Config ──────────────────────────────────────────────────────────────────
const TOTAL_FRAMES = 561;
const MAX_DPR = (() => {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, 2);
})();

// ── Sections ────────────────────────────────────────────────────────────────
type Section = {
  id: string;
  label: string;
  title: string;
  tagline: string;
  scene: string;
  startFrame: number;
  endFrame: number;
  position: "left" | "right";
  anchor: string; // route page détail (/prestations/services/[slug])
  items: string[];
};

const SECTIONS: Section[] = [
  {
    id: "marketing",
    label: "01",
    title: "Marketing & Visibilité",
    tagline: "Stratégie · Diffusion · Prix",
    scene: "Extérieur · Piscine",
    startFrame: 0,
    endFrame: 111,
    position: "left",
    anchor: "/prestations/services/marketing",
    items: [
      "Estimation de valeur locative",
      "Photos professionnelles",
      "Diffusion multi-plateformes",
      "Gestion dynamique des prix",
    ],
  },
  {
    id: "operations",
    label: "02",
    title: "Opérations & Terrain",
    tagline: "Check-in · Check-out · Zéro contrainte",
    scene: "Salon · Vue Mer",
    startFrame: 112,
    endFrame: 223,
    position: "right",
    anchor: "/prestations/services/operations",
    items: [
      "Check-in / Check-out pris en charge",
      "Contrôles qualité entre chaque séjour",
      "Coordination ménages & réparations",
      "Entretien du linge de maison",
    ],
  },
  {
    id: "voyageurs",
    label: "03",
    title: "Relation Voyageurs",
    tagline: "7j/7 · Aucune sollicitation",
    scene: "Chambre · Balcon Océan",
    startFrame: 224,
    endFrame: 336,
    position: "left",
    anchor: "/prestations/services/voyageurs",
    items: [
      "Pilotage des réservations",
      "Échanges avec les locataires",
      "Suivi et réponse aux avis",
      "Zéro notification pour vous",
    ],
  },
  {
    id: "menage",
    label: "04",
    title: "Ménage & Blanchisserie",
    tagline: "Facturés aux voyageurs",
    scene: "Escalier · Hall Intérieur",
    startFrame: 337,
    endFrame: 420,
    position: "right",
    anchor: "/prestations/services/menage",
    items: [
      "Ménage facturé aux voyageurs",
      "Blanchisserie hors commission",
      "Réassort consommables à nos frais",
      "Commission 20% sur nuitées nettes",
    ],
  },
  {
    id: "finance",
    label: "05",
    title: "Finance & Reversements",
    tagline: "Encaissement · Reporting · Copilot",
    scene: "Cuisine · Plan de Travail Marbre",
    startFrame: 505,
    endFrame: 560,
    position: "left",
    anchor: "/prestations/services/finance",
    items: [
      "Encaissement et reversement des loyers",
      "Pack démarrage 1ère location",
      "Reporting clair en ligne",
      "Accès exclusif Assistant Copilot Proprio",
    ],
  },
];

// ── Component ────────────────────────────────────────────────────────────────
export function VideoScrollHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollDriverRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<(HTMLImageElement | null)[]>(Array(TOTAL_FRAMES).fill(null));
  const currentFrameRef = useRef(0);
  const currentSectionRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingFrameRef = useRef<number | null>(null);

  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const errorCountRef = useRef(0);

  // ── Render frame (RAF-batched) ─────────────────────────────────────────
  const renderFrame = useCallback((index: number) => {
    pendingFrameRef.current = index;
    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const fi = pendingFrameRef.current ?? index;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = framesRef.current[Math.max(0, Math.min(fi, TOTAL_FRAMES - 1))];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      // Cover-fit
      const cw = canvas.width / MAX_DPR;
      const ch = canvas.height / MAX_DPR;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = Math.ceil(img.naturalWidth * scale);
      const dh = Math.ceil(img.naturalHeight * scale);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, Math.floor((cw - dw) / 2), Math.floor((ch - dh) / 2), dw, dh);
    });
  }, []);

  // ── Resize canvas ─────────────────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = MAX_DPR;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
    renderFrame(currentFrameRef.current);
  }, [renderFrame]);

  // ── Preload ────────────────────────────────────────────────────────────
  useEffect(() => {
    let loaded = 0;
    let errors = 0;

    const loadOne = (i: number) => {
      const img = new window.Image();
      img.decoding = "async";
      img.src = `/frames/frame_${String(i + 1).padStart(4, "0")}.webp`;

      img.onload = () => {
        framesRef.current[i] = img;
        loaded++;
        setLoadedCount(loaded);
        if (i === 0) renderFrame(0);
        // Show page when 60% of frames are loaded (rest load in background)
        if (loaded + errors >= Math.ceil(TOTAL_FRAMES * 0.6)) setIsReady(true);
      };
      img.onerror = () => {
        errors++;
        errorCountRef.current++;
        if (i === 0) setLoadError(true);
        // If > 50% of frames fail, enable fallback
        if (errorCountRef.current > Math.ceil(TOTAL_FRAMES * 0.5)) {
          setHasLoadError(true);
        }
        // Show page when 60% of frames are loaded
        if (loaded + errors >= Math.ceil(TOTAL_FRAMES * 0.6)) setIsReady(true);
      };
    };

    // Priority 1: frames 0-111 (section 1: Marketing)
    for (let i = 0; i < Math.min(112, TOTAL_FRAMES); i++) loadOne(i);

    // Priority 2: frames 112-223 (section 2: Opérations) in eager
    for (let i = 112; i < Math.min(224, TOTAL_FRAMES); i++) loadOne(i);

    // Priority 3: rest in background stagger via rAF
    let idx = 224;
    const next = () => {
      if (idx >= TOTAL_FRAMES) return;
      loadOne(idx++);
      requestAnimationFrame(next);
    };
    if (idx < TOTAL_FRAMES) requestAnimationFrame(next);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [renderFrame]);

  // ── GSAP scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady) return;

    // Enregistrement ici (client uniquement) — jamais au niveau module
    gsap.registerPlugin(ScrollTrigger);

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const driver = scrollDriverRef.current;
    const transitionEl = transitionRef.current;
    if (!driver) return;

    SECTIONS.forEach((s) => {
      const el = document.getElementById(`pvsh-section-${s.id}`);
      const motion = el?.querySelector<HTMLElement>(".pvsh-motion");
      if (el) gsap.set(el, { opacity: 0, willChange: "opacity" });
      if (motion) gsap.set(motion, { y: 12, willChange: "transform" });
    });

    const getSEl = (id: string) => document.getElementById(`pvsh-section-${id}`);
    const getDot = (id: string) => document.getElementById(`pvsh-dot-${id}`);

    // Calcul intelligent du timing pour chaque section
    const getActivationRange = (section: Section) => {
      const segmentLength = section.endFrame - section.startFrame;
      const offset = Math.round(segmentLength * 0.15);
      return {
        activationStart: section.startFrame + offset,
        activationEnd: section.endFrame - offset,
      };
    };

    const activateSection = (id: string | null) => {
      // TODO: PostHog tracking if available
      if (id && typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('prestations_section_viewed', {
          section_id: id,
          timestamp: Date.now(),
        });
      }
      // Placeholder console.log for development
      if (id) console.log(`[Analytics] Section viewed: ${id}`);

      SECTIONS.forEach((s) => {
        const el = getSEl(s.id);
        const dot = getDot(s.id);
        const isActive = s.id === id;
        const motion = el?.querySelector<HTMLElement>(".pvsh-motion");
        if (el) {
          gsap.to(el, {
            opacity: isActive ? 1 : 0,
            duration: isActive ? 0.7 : 0.4,
            ease: isActive ? "power2.out" : "power2.in",
            overwrite: "auto",
          });
        }
        if (motion) {
          gsap.to(motion, {
            y: isActive ? 0 : 12,
            duration: isActive ? 0.7 : 0.4,
            ease: isActive ? "power2.out" : "power2.in",
            overwrite: "auto",
          });
        }
        if (dot) {
          gsap.to(dot, {
            backgroundColor: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.32)",
            scale: isActive ? 1.5 : 1,
            duration: 0.3,
            overwrite: true,
          });
        }
      });
    };

    // Main scrub trigger
    const mainTrigger = ScrollTrigger.create({
      trigger: driver,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2,
      onUpdate: (self) => {
        const fi = Math.min(Math.round(self.progress * (TOTAL_FRAMES - 1)), TOTAL_FRAMES - 1);
        currentFrameRef.current = fi;
        renderFrame(fi);

        const active = SECTIONS.find((s) => {
          const range = getActivationRange(s);
          return fi >= range.activationStart && fi <= range.activationEnd;
        });
        const newId = active?.id ?? null;
        if (newId !== currentSectionRef.current) {
          currentSectionRef.current = newId;
          activateSection(newId);
        }
      },
    });

    // Hide overlays when transitioning to page content below
    let fadeTrigger: ScrollTrigger | null = null;
    if (transitionEl) {
      fadeTrigger = ScrollTrigger.create({
        trigger: transitionEl,
        start: "top 60%",
        onEnter: () => activateSection(null),
        onLeaveBack: () => activateSection(SECTIONS[SECTIONS.length - 1].id),
      });
    }

    return () => {
      mainTrigger.kill();
      fadeTrigger?.kill();
      window.removeEventListener("resize", resizeCanvas);
      // Supprimer will-change après les animations pour libérer GPU
      SECTIONS.forEach((s) => {
        const el = document.getElementById(`pvsh-section-${s.id}`);
        if (el) el.style.willChange = "auto";
      });
    };
  }, [isReady, renderFrame, resizeCanvas]);

  const loadProgress = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  // ── Fallback si frames manquantes ────────────────────────────────────
  if (loadError && loadedCount === 0) {
    return (
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-navy text-center">
        <div className="absolute inset-0 bg-[url('/prestations-hero.png')] bg-cover bg-center opacity-40" />
        <div className="relative z-10 px-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.5em] text-gold/70">
            Martinique · Conciergerie de Luxe
          </p>
          <h1 className="font-display text-5xl font-bold text-white md:text-7xl">
            Gestion Complète
          </h1>
          <p className="mt-4 text-sm uppercase tracking-[0.3em] text-white/40">
            Commission 20% TTC · Équipe locale 7j/7
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/soumettre-ma-villa"
              className="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-navy hover:scale-105 transition-transform"
            >
              Confier ma villa <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* ── Preloader — Design élégant inspiré du Hero index ─────────── */}
      {!isReady && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0A0A0A]"
          aria-live="polite"
          aria-label={`Chargement ${loadProgress}%`}
          style={{
            animation: "preloader-fade-out 0.4s ease-out forwards",
            animationDelay: `${loadProgress === 100 ? "0ms" : "999999ms"}`,
          }}
        >
          <style>{`
            @keyframes preloader-fade-out {
              from {
                opacity: 1;
              }
              to {
                opacity: 0;
              }
            }

            @keyframes blur-fade-in {
              from {
                opacity: 0;
                filter: blur(8px);
              }
              to {
                opacity: 1;
                filter: blur(0);
              }
            }

            @keyframes fade-in-slide-up {
              from {
                opacity: 0;
                transform: translateY(8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .preloader-logo {
              animation: blur-fade-in 0.8s ease-out forwards;
            }

            .preloader-title {
              animation: blur-fade-in 0.8s ease-out forwards;
            }

            .preloader-subtitle {
              animation: fade-in-slide-up 0.7s ease-out 0.3s forwards;
              opacity: 0;
            }

            .preloader-line {
              animation: fade-in-slide-up 0.7s ease-out 0.3s forwards;
              opacity: 0;
            }

            .preloader-progress {
              animation: fade-in-slide-up 0.7s ease-out 0.5s forwards;
              opacity: 0;
            }

            .preloader-percentage {
              animation: fade-in-slide-up 0.7s ease-out 0.6s forwards;
              opacity: 0;
            }
          `}</style>

          <div className="flex flex-col items-center gap-6">
            {/* Logo Brand */}
            <div className="preloader-logo">
              <Image
                src="/brand/diamant-noir-logo.png"
                alt="Diamant Noir"
                width={40}
                height={40}
                className="brightness-0 invert"
              />
            </div>

            {/* Ligne décorative fine or */}
            <div
              className="preloader-line h-px w-8 rounded-full"
              style={{ background: "rgba(212, 175, 55, 0.4)" }}
            />

            {/* Titre principal */}
            <div className="text-center">
              <h1
                className="preloader-title font-display font-normal uppercase text-white tracking-[0.38em] md:tracking-[0.4em]"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
              >
                DIAMANT NOIR
              </h1>
            </div>

            {/* Sous-titre */}
            <p className="preloader-subtitle font-display font-normal uppercase text-white/40 text-[10px] tracking-[0.35em] md:text-[11px]">
              Conciergerie privée
            </p>

            {/* Barre de progression fine */}
            <div className="preloader-progress relative h-px w-32 overflow-hidden rounded-full bg-white/8">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: "rgba(212, 175, 55, 0.6)",
                  width: `${loadProgress}%`,
                  transition: "width 0.3s ease-out",
                }}
              />
            </div>

            {/* Pourcentage discret */}
            <p className="preloader-percentage font-mono text-[9px] text-white/25 tracking-wider">
              {String(loadProgress).padStart(3, " ")}%
            </p>
          </div>
        </div>
      )}

      {/* ── Preview image derrière le canvas pendant le preload ── */}
      {!isReady && (
        <img
          src="/frames/frame_0001.webp"
          alt=""
          aria-hidden
          className="fixed left-0 top-0 z-0 w-full h-full object-cover opacity-60"
          style={{ filter: 'brightness(0.7)' }}
        />
      )}

      {/* ── Canvas fixe — fond de toute la section ─────────────────── */}
      <canvas
        ref={canvasRef}
        className="fixed left-0 top-0 z-0 block"
        aria-hidden
      />

      {/* ── Fallback image si > 50% des frames échouent ───────────── */}
      {hasLoadError && (
        <div className="fixed inset-0 z-0 bg-[#0A0A0A]">
          <Image
            src="/prestations-hero.png"
            alt="Villa de prestige — Fallback"
            fill
            className="object-cover opacity-50"
            priority
            quality={75}
          />
        </div>
      )}

      {/* ── Vignette sombre pour lisibilité du texte ──────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.08) 25%, rgba(0,0,0,0.08) 75%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* ── Overlays sections — position fixe ─────────────────────── */}
      {SECTIONS.map((section) => {
        const left = section.position === "left";
        return (
          <div
            key={section.id}
            id={`pvsh-section-${section.id}`}
            className={`pointer-events-none fixed top-1/2 z-20 w-[min(390px,calc(100vw-2rem))] -translate-y-1/2 will-change-transform ${
              left
                ? "left-4 sm:left-8 md:left-12 lg:left-16"
                : "right-4 sm:right-8 md:right-12 lg:right-16"
            }`}
            style={{ opacity: 0 }}
          >
            <div className="pvsh-motion relative">
            {/* Numéro décoratif */}
            <div
              aria-hidden
              className={`pointer-events-none absolute select-none font-display text-[6.5rem] font-bold leading-none text-white md:text-[8.5rem] ${
                left ? "-left-1 -top-10" : "-right-1 -top-10"
              }`}
              style={{ opacity: 0.03 }}
            >
              {section.label}
            </div>

            {/* Carte glass blanche lisible */}
            <div
              className="relative rounded-xl md:rounded-2xl p-4 md:p-5 ring-1 ring-white/[0.04] md:ring-1"
              style={{
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(16px)",
                borderWidth: "1px",
                borderColor: "rgba(255,255,255,0.75)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              }}
            >
              {/* Ligne décorative */}
              <div
                className="mb-4 h-px w-8 rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(31,45,70,0.45), transparent)" }}
              />

              {/* Tagline */}
              <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.35em]" style={{ color: "rgba(31,45,70,0.7)" }}>
                {section.tagline}
              </p>

              {/* Titre */}
              <h2 className="mb-1 font-display text-xl font-bold leading-tight text-navy md:text-2xl" style={{ fontWeight: 500 }}>
                {section.title}
              </h2>

              {/* Items */}
              <ul className="space-y-2.5">
                {section.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-3 text-sm leading-relaxed text-navy/90"
                  >
                    <span
                      className="mt-2 text-[10px]"
                      style={{ color: "rgba(31,45,70,0.45)" }}
                      aria-hidden
                    >
                      —
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* Lien vers la section détail */}
              <Link
                href={section.anchor}
                className="pointer-events-auto mt-5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-navy/75 transition-opacity hover:opacity-75"
              >
                Voir le détail <ArrowRight size={11} strokeWidth={1.75} aria-hidden />
              </Link>
            </div>
            </div>
          </div>
        );
      })}

      {/* ── Progress dots — bord droit — plus discrets ─────────────────────────────── */}
      <div className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-2.5 md:flex">
        {SECTIONS.map((section) => (
          <div
            key={section.id}
            id={`pvsh-dot-${section.id}`}
            className="h-1 w-1 rounded-full will-change-transform"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            title={section.title}
          />
        ))}
      </div>

      {/* ── Contenu scrollable ────────────────────────────────────── */}
      <div className="relative z-10">

        {/* Hero viewport — 100vh */}
        <section className="flex h-screen flex-col items-center justify-center px-4 text-center">
          {/* Badge */}
          <div
            className="mb-5 inline-flex items-center rounded-full border border-white/10 px-5 py-2"
            style={{
              background: "rgba(10,10,10,0.55)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-gold/75">
              Conciergerie de Luxe · Martinique
            </span>
          </div>

          {/* H1 */}
          <h1 className="font-display font-bold leading-[1.02] text-white"
            style={{ fontSize: "clamp(2.4rem, 7vw, 5.5rem)" }}
          >
            Gestion{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #D4AF37 0%, #F5E37A 50%, #D4AF37 100%)",
              }}
            >
              Complète
            </span>
            <br />
            en Conciergerie
          </h1>

          {/* Commission */}
          <p className="mt-4 text-[10px] uppercase tracking-[0.4em] text-white/35">
            Commission 20% TTC · 13 prestations incluses · Équipe locale
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/soumettre-ma-villa"
              className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full bg-gold px-8 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-navy transition-all hover:scale-[1.03] hover:bg-yellow-400"
            >
              Confier ma villa <ArrowRight size={13} />
            </Link>
            <button
              type="button"
              onClick={() =>
                document.querySelector("#inclusions")?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex min-h-[48px] items-center text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45 transition-colors hover:text-white"
            >
              Voir les inclusions ↓
            </button>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-white/25">
            <p className="text-[7px] uppercase tracking-[0.45em]">Défiler</p>
            <ChevronDown size={16} className="animate-bounce" />
          </div>
        </section>

        {/* ── Scroll driver — 500vh ──────────────────────────────── */}
        <div ref={scrollDriverRef} style={{ height: "500vh" }} aria-hidden />

        {/* ── Zone de transition vidéo → contenu ─────────────────── */}
        {/* Le dégradé vers le noir cache proprement le canvas avant
            les sections à fond plein qui suivent dans la page */}
        <div
          ref={transitionRef}
          className="relative flex h-[55vh] flex-col items-center justify-end pb-10"
          aria-hidden
        >
          {/* Dégradé descendant vers la couleur du strip CTA */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 60%, #000 100%)",
            }}
          />
          <div className="relative flex flex-col items-center gap-2 text-white/30">
            <p className="text-[8px] uppercase tracking-[0.4em]">
              Découvrir toutes les inclusions
            </p>
            <ChevronDown size={18} />
          </div>
        </div>

      </div>
    </>
  );
}
