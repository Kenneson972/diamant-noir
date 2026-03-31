import Link from "next/link";
import { marketingSimpleLegal } from "@/lib/marketing-layout";
import {
  LandingShell,
  LandingHeroCompact,
  LandingSectionNarrow,
  LandingBlockTitle,
} from "@/components/marketing/landing-sections";

export const metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité et protection des données personnelles, Diamant Noir.",
};

function ConfidentialiteSimple() {
  return (
    <main className="min-h-screen bg-offwhite px-6 pb-20 pt-28">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 font-display text-3xl text-navy">Politique de confidentialité</h1>
        <p className="mb-6 text-navy/70">
          Diamant Noir s&apos;engage à protéger vos données personnelles. Les informations collectées via les
          formulaires (réservation, contact, soumission villa) sont utilisées uniquement pour traiter vos
          demandes et améliorer nos services. Nous ne vendons pas vos données à des tiers.
        </p>
        <p className="mb-6 text-sm text-navy/60">
          Conformément au RGPD, vous pouvez demander l&apos;accès, la rectification ou la suppression de vos
          données en nous contactant.
        </p>
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
      <LandingHeroCompact
        eyebrow="Confiance & données"
        title="Politique de confidentialité"
        subtitle="Transparence sur l&apos;usage de vos informations personnelles."
      />

      <LandingSectionNarrow bg="white">
        <LandingBlockTitle eyebrow="Engagement" title="Protection des données" />
        <p className="text-navy/80 leading-relaxed">
          Diamant Noir s&apos;engage à protéger vos données personnelles. Les informations collectées via les
          formulaires (réservation, contact, soumission villa) sont utilisées uniquement pour traiter vos
          demandes et améliorer nos services. Nous ne vendons pas vos données à des tiers.
        </p>
      </LandingSectionNarrow>

      <LandingSectionNarrow bg="offwhite">
        <LandingBlockTitle eyebrow="Vos droits" title="RGPD" />
        <p className="text-navy/80 leading-relaxed">
          Conformément au RGPD, vous pouvez demander l&apos;accès, la rectification ou la suppression de vos
          données en nous contactant.
        </p>
      </LandingSectionNarrow>

      <LandingSectionNarrow bg="white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <Link href="/contact" className="btn-luxury bg-black text-white">
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
