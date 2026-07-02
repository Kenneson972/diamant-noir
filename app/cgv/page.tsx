import Link from "next/link";
import { marketingSimpleLegal } from "@/lib/marketing-layout";
import {
  LandingShell,
  LandingSectionNarrow,
} from "@/components/marketing/landing-sections";
import { PageHero } from "@/components/marketing/PageHero";
import { CgvContent } from "@/components/legal/CgvContent";

export const metadata = {
  title: "Conditions générales de vente",
  description: "Conditions générales de vente Kayvila — réservation, paiement et annulation.",
  alternates: { canonical: "https://kayvila.com/cgv" },
};

function CgvSimple() {
  return (
    <main className="page-px min-h-dvh bg-offwhite pb-16 pt-24 md:pb-20 md:pt-28">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-5 font-display text-2xl text-navy sm:text-3xl">Conditions générales de vente</h1>
        <CgvContent />
        <Link href="/contact" className="font-medium text-gold hover:underline">
          Nous contacter
        </Link>
        <br />
        <Link href="/" className="mt-6 inline-block font-medium text-gold hover:underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}

export default function CgvPage() {
  if (marketingSimpleLegal) {
    return <CgvSimple />;
  }

  return (
    <LandingShell>
      <PageHero
        imageSrc="/cgv-hero.webp"
        eyebrow="Conditions"
        title="Conditions générales de vente"
        subtitle="Réservation, paiement et annulation des séjours Kayvila."
      />

      <LandingSectionNarrow bg="white">
        <CgvContent />
      </LandingSectionNarrow>

      <LandingSectionNarrow bg="white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <Link href="/contact" className="btn-luxury bg-navy text-white">
            Nous contacter
          </Link>
          <Link href="/" className="link-underline text-sm font-medium text-navy/70">
            Retour à l&apos;accueil
          </Link>
        </div>
      </LandingSectionNarrow>
    </LandingShell>
  );
}
