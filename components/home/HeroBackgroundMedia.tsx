"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Fond hero : vidéo autoplay si le mouvement est autorisé ; sinon poster statique (perf + confort).
 *
 * SSR + premier rendu client : toujours le poster — évite mismatch d'hydratation
 * (`useSyncExternalStore` avec snapshot serveur ≠ `matchMedia` client si prefers-reduced-motion).
 * Après montage : passage vidéo si le mouvement est autorisé.
 * Fallback poster si autoplay bloqué (iOS Safari, politiques navigateur).
 */
export function HeroBackgroundMedia() {
  const [allowVideo, setAllowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAllowVideo(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (allowVideo && videoRef.current) {
      videoRef.current.play().catch(() => {
        setAllowVideo(false);
      });
    }
  }, [allowVideo]);

  if (!allowVideo) {
    return (
      <div className="absolute inset-0 h-full w-full overflow-hidden" aria-hidden>
        <Image
          src="/villa-hero.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-70"
          sizes="100vw"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden" aria-hidden>
      {/* Poster visible jusqu'à ce que la vidéo soit prête — fondu doux poster→vidéo */}
      <Image
        src="/villa-hero.jpg"
        alt=""
        fill
        priority
        className="object-cover opacity-70"
        sizes="100vw"
      />
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/villa-hero.jpg"
        onLoadedData={() => setVideoReady(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          videoReady ? "opacity-70" : "opacity-0"
        }`}
        aria-hidden
      >
        <source src="/hero.webm" type="video/webm" />
      </video>
    </div>
  );
}
