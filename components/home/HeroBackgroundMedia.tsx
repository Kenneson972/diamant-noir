"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Fond hero : vidéo autoplay si le mouvement est autorisé ; sinon poster statique (perf + confort).
 *
 * SSR + premier rendu client : toujours le poster — évite mismatch d’hydratation
 * (`useSyncExternalStore` avec snapshot serveur ≠ `matchMedia` client si prefers-reduced-motion).
 * Après montage : passage vidéo si le mouvement est autorisé.
 */
export function HeroBackgroundMedia() {
  const [allowVideo, setAllowVideo] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAllowVideo(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!allowVideo) {
    return (
      <div className="absolute inset-0 h-full w-full" aria-hidden>
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
    <video
      autoPlay
      muted
      loop
      playsInline
      poster="/villa-hero.jpg"
      className="absolute inset-0 h-full w-full object-cover opacity-70"
      aria-hidden
    >
      <source src="/hero.webm" type="video/webm" />
    </video>
  );
}
