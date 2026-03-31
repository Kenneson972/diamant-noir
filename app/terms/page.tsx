import Link from "next/link";
import { marketingSimpleLegal } from "@/lib/marketing-layout";
import {
  LandingShell,
  LandingHeroCompact,
  LandingSectionNarrow,
  LandingBlockTitle,
} from "@/components/marketing/landing-sections";

export const metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions d'utilisation du site Diamant Noir.",
};

function TermsSimple() {
  return (
    <main className="page-px min-h-screen bg-offwhite pb-16 pt-24 md:pb-20 md:pt-28">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-5 font-display text-2xl text-navy sm:text-3xl">Conditions d&apos;utilisation</h1>
        <p className="mb-6 text-navy/70">
          Les présentes conditions régissent l&apos;utilisation du site Diamant Noir et des services de
          réservation et de conciergerie associés. En utilisant ce site, vous acceptez ces conditions. Pour toute
          question, contactez-nous via la page{" "}
          <Link href="/contact" className="text-gold hover:underline">
            Contact
          </Link>
          .
        </p>
        <p className="text-sm text-navy/60">Dernière mise à jour : 2026. Diamant Noir — Conciergerie de luxe, Martinique.</p>
        <Link href="/" className="mt-8 inline-block font-medium text-gold hover:underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}

export default function TermsPage() {
  if (marketingSimpleLegal) {
    return <TermsSimple />;
  }

  return (
    <LandingShell>
      <LandingHeroCompact
        eyebrow="Cadre légal"
        title={"Conditions d'utilisation"}
        subtitle="Modalités d&apos;usage du site et des services Diamant Noir."
      />

      <LandingSectionNarrow bg="white">
        <LandingBlockTitle eyebrow="Acceptation" title="Utilisation du site" />
        <p className="text-navy/80 leading-relaxed">
          Les présentes conditions régissent l&apos;utilisation du site Diamant Noir et des services de
          réservation et de conciergerie associés. En utilisant ce site, vous acceptez ces conditions.
        </p>
        <p className="mt-6 text-navy/80 leading-relaxed">
          Pour toute question, contactez-nous via la page{" "}
          <Link href="/contact" className="font-medium text-gold underline-offset-4 hover:underline">
            Contact
          </Link>
          .
        </p>
      </LandingSectionNarrow>

      <LandingSectionNarrow bg="offwhite">
        <LandingBlockTitle eyebrow="Mise à jour" title="Mentions" />
        <p className="text-sm text-navy/65">
          Dernière mise à jour : 2026. Diamant Noir — Conciergerie de luxe, Martinique.
        </p>
      </LandingSectionNarrow>

      <LandingSectionNarrow bg="white">
        <Link href="/" className="link-underline text-sm font-medium text-navy/80">
          Retour à l&apos;accueil
        </Link>
      </LandingSectionNarrow>
    </LandingShell>
  );
}
