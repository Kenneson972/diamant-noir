"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const ENABLE_PARALLAX = true; // mettre false pour désactiver

/**
 * Fond hero : vidéo autoplay (muted + playsInline) avec poster fallback.
 *
 * Stratégie mobile-friendly :
 * - Toujours tenter l'autoplay (muted + playsInline + webkit-playsinline)
 * - Si le navigateur bloque → fallback poster statique
 * - prefers-reduced-motion : la vidéo est masquée mais le poster reste visible
 * - iOS Safari Low Power Mode / Data Saver → le play().catch() gère naturellement
 */
export function HeroBackgroundMedia() {
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!ENABLE_PARALLAX) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Tente l'autoplay au montage — ne gate PAS sur prefers-reduced-motion
  // car iOS active ce flag en Low Power Mode même si l'utilisateur n'a rien demandé.
  // On laisse le navigateur décider : s'il bloque, on tombe sur le poster.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = async () => {
      try {
        // iOS Safari exige que play() soit appelé dans un contexte user-gesture
        // ou que la vidéo soit muted + playsInline. On a les deux.
        await video.play();
        setVideoFailed(false);
      } catch {
        // Autoplay bloqué (iOS, Data Saver, etc.) → poster visible
        setVideoFailed(true);
      }
    };

    // Petit délai pour laisser le navigateur parser la vidéo
    const timer = setTimeout(tryPlay, 100);
    return () => clearTimeout(timer);
  }, []);

  // Si prefers-reduced-motion est explicitement activé, on cache la vidéo
  // mais on garde le poster (pas de flash).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => {
      if (mq.matches && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className="absolute inset-0 h-full w-full overflow-hidden"
      style={ENABLE_PARALLAX ? { transform: `translateY(${scrollY * 0.06}px)`, willChange: "transform" } : undefined}
      aria-hidden
    >
      {/* Poster — toujours présent, la vidéo passe par-dessus si prête */}
      <Image
        src="/villa-hero.jpg"
        alt="Villa de luxe avec piscine en Martinique — Kayvila"
        fill
        priority
        className="object-cover opacity-70"
        sizes="100vw"
      />

      {/* Vidéo — masquée si échec autoplay ou prefers-reduced-motion */}
      {!videoFailed && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          // iOS-specific
          webkit-playsinline="true"
          x-webkit-airplay="deny"
          disableRemotePlayback
          preload="metadata"
          poster="/villa-hero.jpg"
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            videoReady ? "opacity-70" : "opacity-0"
          }`}
          aria-hidden
        >
          <source src="/hero.webm" type="video/webm" />
        </video>
      )}
    </div>
  );
}
