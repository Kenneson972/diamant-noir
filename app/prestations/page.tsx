"use client";

import dynamic from "next/dynamic";

const PrestationsPageClient = dynamic(
  () => import("./PrestationsPageClient"),
  {
    ssr: false,
    loading: PrestationsPageLoading,
  },
);

function PrestationsPageLoading() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center text-white"
      role="status"
      aria-live="polite"
      aria-label="Chargement de la page Prestations"
    >
      <p className="font-display text-[9px] uppercase tracking-[0.35em] text-gold/60">Diamant Noir</p>
      <p className="mt-3 font-display text-xl tracking-wide">Nos Prestations</p>
      <p className="mt-4 text-[10px] text-white/40">Chargement de l&apos;expérience…</p>
    </div>
  );
}

export default function PrestationsPage() {
  return <PrestationsPageClient />;
}
