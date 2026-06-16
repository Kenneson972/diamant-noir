import Link from "next/link";
import { marketingSimpleLegal } from "@/lib/marketing-layout";
import {
  LandingShell,
  LandingHeroCompact,
  LandingSectionNarrow,
  LandingBlockTitle,
} from "@/components/marketing/landing-sections";

export const metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site Kayvila — éditeur, hébergeur et propriété intellectuelle.",
};

function MentionsLegalesSimple() {
  return (
    <main className="page-px min-h-dvh bg-offwhite pb-16 pt-24 md:pb-20 md:pt-28">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-5 font-display text-2xl text-navy sm:text-3xl">Mentions légales</h1>
        <h2 className="mb-2 mt-6 font-display text-lg text-navy">Éditeur</h2>
        <p className="mb-6 text-navy/70">
          Le site Kayvila est édité par Kayvila, conciergerie de villas d&apos;exception en Martinique.
          Pour toute question relative à l&apos;édition du site, contactez-nous via la page contact.
        </p>
        <h2 className="mb-2 mt-6 font-display text-lg text-navy">Hébergeur</h2>
        <p className="mb-6 text-navy/70">
          Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
        </p>
        <h2 className="mb-2 mt-6 font-display text-lg text-navy">Propriété intellectuelle</h2>
        <p className="mb-6 text-navy/70">
          L&apos;ensemble des contenus (textes, photographies, logos) présents sur ce site est la propriété
          de Kayvila ou de ses partenaires et est protégé par le droit d&apos;auteur. Toute reproduction sans
          autorisation est interdite.
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

export default function MentionsLegalesPage() {
  if (marketingSimpleLegal) {
    return <MentionsLegalesSimple />;
  }

  return (
    <LandingShell>
      <LandingHeroCompact
        eyebrow="Informations légales"
        title="Mentions légales"
        subtitle="Éditeur, hébergeur et propriété intellectuelle du site Kayvila."
      />

      <LandingSectionNarrow bg="white">
        <LandingBlockTitle eyebrow="Éditeur" title="Responsable de la publication" />
        <p className="text-navy/80 leading-relaxed">
          Le site Kayvila est édité par Kayvila, conciergerie de villas d&apos;exception en Martinique.
          Pour toute question relative à l&apos;édition du site, contactez-nous via la page contact.
        </p>
      </LandingSectionNarrow>

      <LandingSectionNarrow bg="offwhite">
        <LandingBlockTitle eyebrow="Hébergement" title="Hébergeur" />
        <p className="text-navy/80 leading-relaxed">
          Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
        </p>
      </LandingSectionNarrow>

      <LandingSectionNarrow bg="white">
        <LandingBlockTitle eyebrow="Droits" title="Propriété intellectuelle" />
        <p className="text-navy/80 leading-relaxed">
          L&apos;ensemble des contenus (textes, photographies, logos) présents sur ce site est la propriété
          de Kayvila ou de ses partenaires et est protégé par le droit d&apos;auteur. Toute reproduction sans
          autorisation préalable est interdite.
        </p>
      </LandingSectionNarrow>

      <LandingSectionNarrow bg="offwhite">
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
