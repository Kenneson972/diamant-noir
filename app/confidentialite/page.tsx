import Link from "next/link";
import { marketingSimpleLegal } from "@/lib/marketing-layout";
import {
  LandingShell,
  LandingSectionNarrow,
  LandingBlockTitle,
} from "@/components/marketing/landing-sections";
import { PageHero } from "@/components/marketing/PageHero";
import { ConfidentialiteContent } from "@/components/legal/ConfidentialiteContent";
import { CONFIDENTIALITE_TEXT } from "@/lib/legal";

export const metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité et protection des données personnelles, Kayvila.",
};

function ConfidentialiteSimple() {
  return (
    <main className="page-px min-h-dvh bg-offwhite pb-16 pt-24 md:pb-20 md:pt-28">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-5 font-display text-2xl text-navy sm:text-3xl">Politique de confidentialité</h1>
        <ConfidentialiteContent />
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

export default function ConfidentialitePage() {
  if (marketingSimpleLegal) {
    return <ConfidentialiteSimple />;
  }

  return (
    <LandingShell>
      <PageHero
        imageSrc="/confidentialite-hero.webp"
        eyebrow="Confiance & données"
        title="Politique de confidentialité"
        subtitle="Transparence sur l&apos;usage de vos informations personnelles."
      />

      <LandingSectionNarrow bg="white">
        <LandingBlockTitle eyebrow="Engagement" title="Protection des données" />
        <p className="text-navy/80 leading-relaxed">{CONFIDENTIALITE_TEXT.protection}</p>
      </LandingSectionNarrow>

      <LandingSectionNarrow bg="offwhite">
        <LandingBlockTitle eyebrow="Vos droits" title="RGPD" />
        <p className="text-navy/80 leading-relaxed">{CONFIDENTIALITE_TEXT.rgpd}</p>
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
