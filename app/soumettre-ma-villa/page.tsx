import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { tServer } from "@/lib/i18n";
import { VillaWizard } from "@/components/marketing/VillaWizard";

export const metadata: Metadata = {
  title: "Confier ma villa — Kayvila Conciergerie",
  description:
    "Confiez votre villa à Kayvila. Remplissez notre formulaire en quelques minutes et recevez une réponse sous 24h.",
  alternates: { canonical: "https://kayvila.com/soumettre-ma-villa" },
  openGraph: {
    images: [{ url: "https://kayvila.com/og-image.jpg", width: 1200, height: 630, alt: "Confier ma villa à Kayvila" }],
  },
};

export default async function SoumettreMaVillaPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("dn_locale")?.value ?? "fr") as "fr" | "en" | "es";

  return (
    <main className="min-h-screen bg-offwhite">
      {/* ── Hero strip ── */}
      <div className="relative border-b border-black/[0.07] bg-navy px-6 py-16 text-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/soumettre-hero.webp" alt="" fill className="object-cover opacity-35" priority />
        </div>
        <div className="relative z-10">
        <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.4em] text-gold/60">
          Conciergerie propriétaire
        </span>
        <h1 className="font-display text-4xl font-normal text-white md:text-5xl">
          {tServer(locale, "submit.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
          Un processus simple en 4 étapes. Réponse garantie sous 24h.
        </p>
        </div>
      </div>

      {/* ── Wizard ── */}
      <div className="px-4 py-14 md:py-20">
        <VillaWizard />
      </div>
    </main>
  );
}
