"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function VillaDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur page villa détail :", error);
  }, [error]);

  return (
    <main className="min-h-dvh bg-offwhite flex flex-col items-center justify-center px-5 text-center">
      <div className="mb-8 h-px w-16 bg-gold/40" aria-hidden />
      <h1 className="font-display text-[clamp(2rem,8vw,3rem)] font-light leading-none text-navy">
        Villa indisponible
      </h1>
      <p className="mt-6 max-w-md font-body text-base leading-relaxed text-navy/60">
        Cette villa est momentanément inaccessible. Réessayez ou contactez notre équipe.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[48px] items-center bg-navy px-8 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
        >
          Réessayer
        </button>
        <Link
          href="/villas"
          className="inline-flex min-h-[48px] items-center border border-navy/20 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-navy transition-colors hover:bg-navy/[0.04]"
        >
          Toutes les villas
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center border border-navy/20 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-navy transition-colors hover:bg-navy/[0.04]"
        >
          Accueil
        </Link>
      </div>
    </main>
  );
}
