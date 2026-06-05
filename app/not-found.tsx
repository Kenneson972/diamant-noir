import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable — Kayvila Conciergerie",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-offwhite px-5 text-center">
      {/* Ligne dorée discrète */}
      <div className="mb-8 h-px w-16 bg-gold/40" aria-hidden />

      <h1 className="font-display text-[clamp(3rem,10vw,5rem)] font-light leading-none tracking-[-0.03em] text-navy">
        404
      </h1>

      <p className="mt-6 max-w-md font-body text-base leading-relaxed text-navy/60">
        Cette page n&rsquo;existe pas ou a été déplacée.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center gap-2 bg-navy px-8 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
        >
          Retour à l&rsquo;accueil
        </Link>

        <Link
          href="/prestations"
          className="inline-flex min-h-[48px] items-center gap-2 border border-navy/20 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-navy transition-colors hover:bg-navy/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
        >
          Nos services
        </Link>
      </div>

      <p className="mt-12 font-body text-xs text-navy/30">
        Kayvila — Conciergerie de luxe en Martinique
      </p>
    </div>
  );
}
