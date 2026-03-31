import Link from "next/link";
import { marketingSimpleLegal } from "@/lib/marketing-layout";
import {
  LandingShell,
  LandingHeroCompact,
  LandingSectionNarrow,
  LandingBlockTitle,
} from "@/components/marketing/landing-sections";

export const metadata = {
  title: "Gestion des cookies",
  description: "Information sur les cookies utilisés sur le site Diamant Noir.",
};

function CookiesSimple() {
  return (
    <main className="min-h-screen bg-offwhite px-6 pb-20 pt-28">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 font-display text-3xl text-navy">Gestion des cookies</h1>
        <p className="mb-6 text-navy/70">
          Ce site peut utiliser des cookies pour le bon fonctionnement de la session (connexion, préférences de
          langue et devise) et, le cas échéant, pour l&apos;analyse d&apos;audience. Vous pouvez configurer votre
          navigateur pour refuser les cookies non essentiels.
        </p>
        <Link href="/" className="font-medium text-gold hover:underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}

export default function CookiesPage() {
  if (marketingSimpleLegal) {
    return <CookiesSimple />;
  }

  return (
    <LandingShell>
      <LandingHeroCompact
        eyebrow="Transparence"
        title="Cookies"
        subtitle="Cookies techniques et, le cas échéant, mesure d&apos;audience."
      />

      <LandingSectionNarrow bg="white">
        <LandingBlockTitle eyebrow="Fonctionnement" title="À quoi servent les cookies ?" />
        <p className="text-navy/80 leading-relaxed">
          Ce site peut utiliser des cookies pour le bon fonctionnement de la session (connexion, préférences de
          langue et devise) et, le cas échéant, pour l&apos;analyse d&apos;audience.
        </p>
      </LandingSectionNarrow>

      <LandingSectionNarrow bg="offwhite">
        <LandingBlockTitle eyebrow="Votre choix" title="Paramétrage navigateur" />
        <p className="text-navy/80 leading-relaxed">
          Vous pouvez configurer votre navigateur pour refuser les cookies non essentiels.
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
