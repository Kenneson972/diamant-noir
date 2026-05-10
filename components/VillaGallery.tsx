"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";

type VillaGalleryProps = {
  images: string[];
  title?: string;
};

export const VillaGallery = ({ images, title = "Villa" }: VillaGalleryProps) => {
  const galleryImages = images.filter(Boolean);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);

  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const swipeStateRef = useRef({ startX: 0, deltaX: 0, isDragging: false });
  const [swipeDelta, setSwipeDelta] = useState(0);

  const openAt = (index: number) => { setActiveIndex(index); setIsOpen(true); };
  const close = () => setIsOpen(false);
  const showPrev = useCallback(() => setActiveIndex((p) => (p - 1 + galleryImages.length) % galleryImages.length), [galleryImages.length]);
  const showNext = useCallback(() => setActiveIndex((p) => (p + 1) % galleryImages.length), [galleryImages.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, showPrev, showNext]);

  useEffect(() => {
    if (isOpen && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [isOpen]);

  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    swipeStateRef.current = {
      startX: e.touches[0].clientX,
      deltaX: 0,
      isDragging: true,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeStateRef.current.isDragging) return;
    const deltaX = e.touches[0].clientX - swipeStateRef.current.startX;
    swipeStateRef.current.deltaX = deltaX;
    setSwipeDelta(deltaX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    const { deltaX, isDragging } = swipeStateRef.current;
    if (!isDragging) return;
    swipeStateRef.current.isDragging = false;

    const threshold = 50;
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        setMobileIndex((p) => (p - 1 + galleryImages.length) % galleryImages.length);
      } else {
        setMobileIndex((p) => (p + 1) % galleryImages.length);
      }
    }
    setSwipeDelta(0);
  }, [galleryImages.length]);

  if (galleryImages.length === 0) {
    return (
      <div className="relative h-[60vh] w-full overflow-hidden bg-navy/5 flex items-center justify-center">
        <Image src="/villa-hero.jpg" alt="Villa" fill className="object-cover opacity-30" />
        <p className="relative z-10 text-navy/30 font-display text-2xl tracking-widest">Kayvila</p>
      </div>
    );
  }

  const extras = galleryImages.length - 5;

  return (
    <>
      {/* ── Mosaic Grid ── */}
      <div className="relative w-full">
        {/* Mobile : swipeable carousel */}
        <div className="md:hidden relative h-[55vw] min-h-[260px] overflow-hidden">
          <div
            ref={swipeContainerRef}
            className="relative h-full w-full cursor-grab active:cursor-grabbing"
            onTouchStart={galleryImages.length > 1 ? handleTouchStart : undefined}
            onTouchMove={galleryImages.length > 1 ? handleTouchMove : undefined}
            onTouchEnd={galleryImages.length > 1 ? handleTouchEnd : undefined}
            onClick={() => openAt(mobileIndex)}
          >
            {/* Image courante */}
            <div
              className="absolute inset-0"
              style={{
                transform: `translateX(${swipeDelta}px)`,
                transition:
                  swipeStateRef.current.isDragging || prefersReducedMotion
                    ? "none"
                    : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
            >
              <Image
                key={`mobile-${mobileIndex}`}
                src={galleryImages[mobileIndex]}
                alt={`${title} — photo ${mobileIndex + 1}`}
                fill
                className="object-cover pointer-events-none"
                priority={mobileIndex === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/50 to-transparent pointer-events-none" />
            </div>

            {/* Flèche gauche */}
            {galleryImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileIndex((p) => (p - 1 + galleryImages.length) % galleryImages.length);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 backdrop-blur-sm p-2 text-navy shadow-md hover:bg-white transition-colors tap-target"
                aria-label="Photo précédente"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            {/* Flèche droite */}
            {galleryImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileIndex((p) => (p + 1) % galleryImages.length);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 backdrop-blur-sm p-2 text-navy shadow-md hover:bg-white transition-colors tap-target"
                aria-label="Photo suivante"
              >
                <ChevronRight size={18} />
              </button>
            )}

            {/* Compteur */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-5 left-5 z-10">
                <span
                  className="rounded-full bg-navy/70 text-white/90 px-3 py-1 text-[11px] font-semibold tracking-wider font-display"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {mobileIndex + 1}
                  <span className="text-white/40 mx-1">/</span>
                  {galleryImages.length}
                </span>
              </div>
            )}

            {/* Bouton toutes les photos */}
            <button
              onClick={(e) => { e.stopPropagation(); openAt(mobileIndex); }}
              className="absolute bottom-5 right-5 z-10 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-navy shadow-lg tap-target"
            >
              <Images size={14} />
              {galleryImages.length} photos
            </button>
          </div>
        </div>

        {/* Desktop : grille mosaïque 1 grande + 4 petites */}
        <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-1 h-[70vh] max-h-[640px]">
          {/* Grande image */}
          <button
            type="button"
            onClick={() => openAt(0)}
            className="col-span-2 row-span-2 relative overflow-hidden group focus:outline-none"
          >
            <Image src={galleryImages[0]} alt={`${title} 1`} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100" priority />
            <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/10 transition-colors duration-300" />
          </button>

          {/* 4 images secondaires */}
          {Array.from({ length: 4 }).map((_, i) => {
            const img = galleryImages[i + 1];
            const isLast = i === 3 && extras > 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => openAt(i + 1)}
                className="relative overflow-hidden group focus:outline-none"
                disabled={!img}
              >
                {img ? (
                  <>
                    <Image src={img} alt={`${title} ${i + 2}`} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:hover:scale-100" />
                    <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/15 transition-colors duration-300" />
                    {isLast && (
                      <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                        <span className="font-display text-3xl text-white">+{extras}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-navy/5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bouton "Afficher toutes" — desktop */}
        <button
          onClick={() => openAt(0)}
          className="hidden md:flex absolute bottom-6 right-6 items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-navy shadow-lg hover:bg-white transition-colors border border-navy/10"
        >
          <Images size={14} />
          Toutes les photos
        </button>
      </div>

      {/* ── Lightbox ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galerie photos — ${title}`}
          className="fixed inset-0 z-[1100] bg-navy/95 backdrop-blur-xl flex flex-col modal-enter"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 shrink-0">
            <span className="font-display text-white/60 text-sm tracking-widest">
              {activeIndex + 1} <span className="text-white/30">/</span> {galleryImages.length}
            </span>
            <span className="font-display text-white text-lg tracking-[0.2em]">{title}</span>
            <button
              ref={closeBtnRef}
              onClick={close}
              className="tap-target rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Image principale */}
          <div className="relative flex-1 flex items-center justify-center px-4 md:px-20">
            {galleryImages.length > 1 && (
              <button
                onClick={showPrev}
                className="tap-target absolute left-4 md:left-6 z-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Précédent"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <div className="relative w-full h-full max-w-5xl">
              <Image
                key={activeIndex}
                src={galleryImages[activeIndex]}
                alt={`${title} ${activeIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            </div>

            {galleryImages.length > 1 && (
              <button
                onClick={showNext}
                className="tap-target absolute right-4 md:right-6 z-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Suivant"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Thumbnails */}
          <div className="shrink-0 pb-6 pt-4 px-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar justify-center">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                    activeIndex === i ? "border-gold scale-105 opacity-100" : "border-transparent opacity-30 hover:opacity-60"
                  }`}
                >
                  <Image src={img} alt={`${title} — aperçu photo ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
