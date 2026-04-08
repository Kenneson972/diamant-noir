import type { Metadata } from "next";
import { VillaWizard } from "@/components/marketing/VillaWizard";

export const metadata: Metadata = {
  title: "Soumettre ma villa — Diamant Noir Conciergerie",
  description:
    "Confiez votre villa à Diamant Noir. Remplissez notre formulaire en quelques minutes et recevez une réponse sous 48 h.",
};

export default function SoumettreMaVillaPage() {
  return (
    <main className="min-h-screen bg-offwhite">
      {/* ── Hero strip ── */}
      <div className="border-b border-black/[0.07] bg-navy px-6 py-16 text-center">
        <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.4em] text-gold/60">
          Conciergerie propriétaire
        </span>
        <h1 className="font-display text-4xl font-normal text-white md:text-5xl">
          Confiez-nous votre villa.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
          Un processus simple en 4 étapes. Réponse garantie sous 48 h.
        </p>
      </div>

      {/* ── Wizard ── */}
      <div className="px-4 py-14 md:py-20">
        <VillaWizard />
      </div>
    </main>
  );
}
