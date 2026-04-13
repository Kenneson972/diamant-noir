"use client";

/**
 * Page Conciergerie — Diamant Noir
 * Scroll-driven canvas animation (style Apple)
 * 561 frames @15fps | GSAP ScrollTrigger | Glassmorphism
 *
 * Mapping vidéo :
 *   0–111  → Extérieur / Piscine   (0–7.4s)
 *   112–223 → Salon / Vue Mer      (7.5–14.9s)
 *   224–336 → Chambre / Balcon     (14.9–22.4s)
 *   337–448 → Escalier / Hall      (22.5–29.9s)
 *   449–560 → Cuisine / Marbre     (29.9–37.4s)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { ChevronDown, ArrowRight, Sparkles } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// ── Frame config ──────────────────────────────────────────────────────────
const TOTAL_FRAMES = 561; // 37.4s × 15fps

// ── Section config ────────────────────────────────────────────────────────
type Section = {
  id: string;
  label: string;
  title: string;
  tagline: string;
  scene: string;
  startFrame: number; // 0-indexed
  endFrame: number;   // 0-indexed
  position: "left" | "right";
  items: string[];
};

const SECTIONS: Section[] = [
  {
    id: "marketing",
    label: "01",
    title: "Marketing & Visibilité",
    tagline: "Stratégie · Diffusion",
    scene: "Extérieur · Piscine",
    startFrame: 0,
    endFrame: 111,
    position: "left",
    items: [
      "Estimation de valeur locative",
      "Prise de photos professionnelles",
      "Rédaction et diffusion d'annonces multi-plateformes",
      "Optimisation d'annonces existantes",
      "Gestion dynamique des prix",
    ],
  },
  {
    id: "operations",
    label: "02",
    title: "Opérations & Terrain",
    tagline: "Logistique · Relation Voyageurs",
    scene: "Salon · Vue Mer",
    startFrame: 112,
    endFrame: 223,
    position: "right",
    items: [
      "Pilotage des réservations",
      "Échanges avec les locataires",
      "Check-in / Check-out",
      "Suivi des commentaires et valorisation",
    ],
  },
  {
    id: "entretien",
    label: "03",
    title: "Entretien & Qualité",
    tagline: "Exigence · Confort",
    scene: "Chambre · Balcon Océan",
    startFrame: 224,
    endFrame: 336,
    position: "left",
    items: [
      "Organisation des ménages et suivi des intervenants",
      "Entretien et mise en place du linge de maison",
      "Petites réparations prises en charge",
      "Contrôles qualité rigoureux",
    ],
  },
  {
    id: "menage",
    label: "04",
    title: "Ménage & Blanchisserie",
    tagline: "Facturés directement aux voyageurs · Hors commission",
    scene: "Escalier · Hall Intérieur",
    startFrame: 337,
    endFrame: 448,
    position: "right",
    items: [
      "Frais de ménage facturés aux voyageurs (hors commission de 20%)",
      "Blanchisserie incluse dans les frais de ménage",
      "Coordination complète des équipes de nettoyage",
      "Transparence totale pour le propriétaire",
    ],
  },
  {
    id: "experience",
    label: "05",
    title: "Expérience & Reversements",
    tagline: "Pack Bienvenue · Copilot Proprio",
    scene: "Cuisine · Plan de Travail Marbre",
    startFrame: 449,
    endFrame: 560,
    position: "left",
    items: [
      "Réassort des consommables de bienvenue à nos frais",
      "Pack démarrage 1ère location (café, épices, huile, savon…)",
      "Encaissement et reversement des loyers",
      "Accès exclusif à votre Assistant Copilot Proprio",
    ],
  },
];

// ── Helper ─────────────────────────────────────────────────────────────────
const MAX_DPR = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

// ── Main component ─────────────────────────────────────────────────────────
export default function ConciergeriePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollDriverRef = useRef<HTMLDivElement>(null);
  const ctaSectionRef = useRef<HTMLElement>(null);
  const framesRef = useRef<(HTMLImageElement | null)[]>(Array(TOTAL_FRAMES).fill(null));
  const currentFrameRef = useRef(0);
  const currentSectionRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingFrameRef = useRef<number | null>(null);

  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // ── Canvas render (RAF-batched) ─────────────────────────────────────────
  const renderFrame = useCallback((index: number) => {
    pendingFrameRef.current = index;
    if (rafRef.current !== null) return; // Already scheduled

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const frameIndex = pendingFrameRef.current ?? index;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = framesRef.current[Math.max(0, Math.min(frameIndex, TOTAL_FRAMES - 1))];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      // Cover-fit (fill canvas, maintain aspect ratio, center)
      const cw = canvas.width / MAX_DPR;
      const ch = canvas.height / MAX_DPR;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;

      ctx.drawImage(img, dx, dy, dw, dh);
    });
  }, []);

  // ── Resize canvas ───────────────────────────────────────────────────────
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

  // ── Preload frames ──────────────────────────────────────────────────────
  useEffect(() => {
    let loaded = 0;
    const total = TOTAL_FRAMES;

    const loadOne = (i: number) => {
      const img = new Image();
      img.decoding = "async";
      const num = String(i + 1).padStart(4, "0");
      img.src = `/frames/frame_${num}.webp`;

      img.onload = () => {
        framesRef.current[i] = img;
        loaded++;
        setLoadedCount(loaded);
        if (i === 0) renderFrame(0);
        if (loaded >= total) setIsReady(true);
      };
      img.onerror = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded >= total) setIsReady(true);
      };
    };

    // Priority: first 120 frames (covers section 1 fully)
    const EAGER = 120;
    for (let i = 0; i < Math.min(EAGER, total); i++) loadOne(i);

    // Rest: staggered to avoid network saturation
    let i = EAGER;
    const scheduleNext = () => {
      if (i >= total) return;
      loadOne(i++);
      requestAnimationFrame(scheduleNext);
    };
    requestAnimationFrame(scheduleNext);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [renderFrame]);

  // ── GSAP scroll setup ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady) return;

    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);

    const driver = scrollDriverRef.current;
    const ctaSection = ctaSectionRef.current;
    if (!driver) return;

    // Initial section state
    SECTIONS.forEach((s) => {
      const el = document.getElementById(`dn-section-${s.id}`);
      if (el) gsap.set(el, { opacity: 0, y: 28, willChange: "opacity, transform" });
    });

    // Helpers
    const getSectionEl = (id: string) => document.getElementById(`dn-section-${id}`);
    const getDotEl = (id: string) => document.getElementById(`dn-dot-${id}`);

    const activateSection = (id: string | null) => {
      SECTIONS.forEach((s) => {
        const el = getSectionEl(s.id);
        const dot = getDotEl(s.id);
        const isActive = s.id === id;

        if (el) {
          gsap.to(el, {
            opacity: isActive ? 1 : 0,
            y: isActive ? 0 : (id === null || SECTIONS.findIndex(x => x.id === id) > SECTIONS.findIndex(x => x.id === s.id) ? -20 : 20),
            duration: isActive ? 0.55 : 0.35,
            ease: isActive ? "power3.out" : "power2.in",
            overwrite: true,
          });
        }
        if (dot) {
          gsap.to(dot, {
            backgroundColor: isActive ? "#D4AF37" : "rgba(255,255,255,0.18)",
            scale: isActive ? 1.7 : 1,
            duration: 0.3,
            overwrite: true,
          });
        }
      });
    };

    // Main scroll driver
    const mainTrigger = ScrollTrigger.create({
      trigger: driver,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2,
      onUpdate: (self) => {
        const frameIndex = Math.min(
          Math.round(self.progress * (TOTAL_FRAMES - 1)),
          TOTAL_FRAMES - 1
        );

        currentFrameRef.current = frameIndex;
        renderFrame(frameIndex);

        const active = SECTIONS.find(
          (s) => frameIndex >= s.startFrame && frameIndex <= s.endFrame
        );
        const newId = active?.id ?? null;

        if (newId !== currentSectionRef.current) {
          currentSectionRef.current = newId;
          activateSection(newId);
        }
      },
    });

    // Hide sections when entering CTA
    let ctaTrigger: ScrollTrigger | null = null;
    if (ctaSection) {
      ctaTrigger = ScrollTrigger.create({
        trigger: ctaSection,
        start: "top 90%",
        onEnter: () => activateSection(null),
        onLeaveBack: () => {
          const last = SECTIONS[SECTIONS.length - 1];
          activateSection(last.id);
        },
      });
    }

    return () => {
      mainTrigger.kill();
      ctaTrigger?.kill();
      window.removeEventListener("resize", onResize);
    };
  }, [isReady, renderFrame, resizeCanvas]);

  const loadProgress = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  return (
    <>
      {/* ── Preloader ───────────────────────────────────────────────────── */}
      {!isReady && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A0A0A]">
          {/* Brand mark */}
          <div className="mb-10 space-y-1 text-center">
            <p className="font-display text-[9px] tracking-[0.55em] text-gold/40 uppercase">
              Martinique
            </p>
            <p className="font-display text-3xl tracking-[0.08em] text-white">
              Diamant Noir
            </p>
          </div>

          {/* Progress bar */}
          <div className="relative h-px w-56 overflow-hidden rounded-full bg-white/8">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gold transition-all duration-200"
              style={{ width: `${loadProgress}%` }}
            />
          </div>

          <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.4em] text-white/25">
            {loadProgress < 100 ? `${loadProgress}%` : "Prêt"}
          </p>
        </div>
      )}

      {/* ── Canvas — fixed fullscreen background ─────────────────────── */}
      <canvas
        ref={canvasRef}
        className="fixed left-0 top-0 z-0 block"
        aria-hidden
      />

      {/* ── Overlays — dark vignette ──────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* ── Fixed header ──────────────────────────────────────────────── */}
      <header className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between px-6 py-5 md:px-12 md:py-6">
        <Link
          href="/"
          className="font-display text-[10px] tracking-[0.5em] text-gold/75 transition-colors hover:text-gold uppercase"
        >
          Diamant Noir
        </Link>

        <div
          className="rounded-full border border-gold/35 px-5 py-2 text-[9px] font-bold uppercase tracking-[0.3em] text-gold"
          style={{
            background: "rgba(10,10,10,0.55)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          Commission 20% TTC
        </div>

        <Link
          href="/login"
          className="hidden rounded-full border border-white/12 px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-white/50 transition-all hover:border-gold/30 hover:text-gold md:block"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
          }}
        >
          Espace Proprio
        </Link>
      </header>

      {/* ── Section text overlays — fixed ─────────────────────────────── */}
      {SECTIONS.map((section) => {
        const left = section.position === "left";
        return (
          <div
            key={section.id}
            id={`dn-section-${section.id}`}
            aria-hidden={false}
            className={`pointer-events-none fixed top-1/2 z-20 w-[min(400px,calc(100vw-2.5rem))] -translate-y-1/2 will-change-transform ${
              left ? "left-5 md:left-12 lg:left-16" : "right-5 md:right-12 lg:right-16"
            }`}
            style={{ opacity: 0 }}
          >
            {/* Large decorative number */}
            <div
              aria-hidden
              className={`pointer-events-none absolute select-none font-display text-[7rem] font-bold leading-none text-white md:text-[9rem] ${
                left ? "-left-2 -top-10" : "-right-2 -top-10"
              }`}
              style={{ opacity: 0.035 }}
            >
              {section.label}
            </div>

            {/* Glass card */}
            <div
              className="relative rounded-2xl border border-white/10 p-6 md:rounded-3xl md:p-8"
              style={{
                background: "rgba(8, 8, 10, 0.64)",
                backdropFilter: "blur(28px) saturate(1.5)",
                WebkitBackdropFilter: "blur(28px) saturate(1.5)",
                boxShadow:
                  "0 12px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {/* Gold line */}
              <div className="mb-4 h-px w-10 rounded-full bg-gold/50" />

              {/* Tagline */}
              <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.35em] text-gold/65">
                {section.tagline}
              </p>

              {/* Title */}
              <h2 className="mb-1 font-display text-[1.4rem] font-bold leading-tight text-white md:text-[1.7rem]">
                {section.title}
              </h2>

              {/* Scene label */}
              <p className="mb-5 text-[8px] font-bold uppercase tracking-[0.3em] text-white/25">
                {section.scene}
              </p>

              {/* Items list */}
              <ul className="space-y-2.5">
                {section.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-3 text-[0.72rem] leading-relaxed text-white/72"
                  >
                    <span
                      className="mt-[0.4rem] h-1 w-1 shrink-0 rounded-full"
                      style={{ background: "#D4AF37" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}

      {/* ── Progress dots — right edge ─────────────────────────────────── */}
      <div className="fixed right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2.5 md:right-6">
        {SECTIONS.map((section) => (
          <div
            key={section.id}
            id={`dn-dot-${section.id}`}
            className="h-1.5 w-1.5 rounded-full will-change-transform"
            style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
            title={section.title}
          />
        ))}
      </div>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <div className="relative z-10">
        {/* Hero section */}
        <section className="flex h-screen flex-col items-center justify-center text-center">
          {/* Badge */}
          <div
            className="mb-6 rounded-full border border-white/10 px-6 py-2"
            style={{
              background: "rgba(10,10,10,0.5)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.45em] text-gold/70">
              Martinique · Conciergerie de Luxe
            </span>
          </div>

          {/* H1 */}
          <h1 className="font-display text-[2.8rem] font-bold leading-[1.05] text-white sm:text-6xl md:text-7xl lg:text-8xl">
            Gestion
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #D4AF37 0%, #F5E27A 50%, #D4AF37 100%)",
              }}
            >
              Complète
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-[11px] uppercase tracking-[0.45em] text-white/35">
            En Conciergerie · Commission 20% TTC
          </p>

          {/* Scroll CTA */}
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-white/30">
            <p className="text-[8px] uppercase tracking-[0.4em]">Défiler pour découvrir</p>
            <ChevronDown
              size={18}
              className="animate-bounce"
            />
          </div>
        </section>

        {/* ── Scroll driver — 500vh ─────────────────────────────────── */}
        <div ref={scrollDriverRef} style={{ height: "500vh" }} aria-hidden />

        {/* ── CTA section ───────────────────────────────────────────── */}
        <section
          ref={ctaSectionRef}
          className="flex h-screen flex-col items-center justify-center px-4 text-center"
        >
          <div
            className="w-full max-w-xl rounded-3xl border border-white/10 p-10 md:p-14"
            style={{
              background: "rgba(8,8,10,0.78)",
              backdropFilter: "blur(36px) saturate(1.5)",
              WebkitBackdropFilter: "blur(36px) saturate(1.5)",
              boxShadow:
                "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
              <Sparkles size={24} className="text-gold" />
            </div>

            {/* Copy */}
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.45em] text-gold/60">
              Votre villa mérite le meilleur
            </p>
            <h2 className="mb-3 font-display text-3xl font-bold text-white md:text-4xl">
              Confiez-nous votre bien
            </h2>
            <p className="mb-8 text-xs leading-relaxed text-white/45">
              Rejoignez le portefeuille Diamant Noir. Profitez d&apos;une gestion premium,
              d&apos;une transparence totale et d&apos;un accès exclusif à votre Copilot Proprio.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-3.5 text-[11px] font-bold uppercase tracking-widest text-navy transition-all hover:scale-[1.03] hover:bg-yellow-400"
              >
                Déposer ma villa <ArrowRight size={14} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-8 py-3.5 text-[11px] font-bold uppercase tracking-widest text-white/60 transition-all hover:border-gold/30 hover:text-gold"
              >
                Espace Proprio
              </Link>
            </div>

            {/* Trust line */}
            <p className="mt-8 text-[8px] uppercase tracking-widest text-white/20">
              Martinique · Conciergerie Premium · 20% Commission TTC
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
