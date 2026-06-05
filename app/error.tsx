"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur applicative :", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-offwhite px-5 text-center">
      {/* Ligne dorée discrète */}
      <div className="mb-8 h-px w-16 bg-gold/40" aria-hidden />

      <h1 className="font-display text-[clamp(2rem,8vw,3rem)] font-light leading-none tracking-[-0.02em] text-navy">
        Un incident technique
      </h1>

      <p className="mt-6 max-w-md font-body text-base leading-relaxed text-navy/60">
        Une erreur est survenue. Notre équipe a été informée.
        <br />
        Vous pouvez réessayer ou revenir à l&rsquo;accueil.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[48px] items-center gap-2 bg-navy px-8 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
        >
          Réessayer
        </button>

                    <Link
                      href="/"
                      className="inline-flex min-h-[48px] items-center gap-2 border border-navy/20 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-navy transition-colors hover:bg-navy/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                    >
                      Accueil
                    </Link>
      </div>
    </div>
  );
}
