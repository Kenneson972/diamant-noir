import Link from "next/link";
import { marketingSimpleLegal } from "@/lib/marketing-layout";
import {
  LandingShell,
  PageHero,
  LandingSectionNarrow,
  LandingBlockTitle,
} from "@/components/marketing/landing-sections";

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
        <h2 className="mb-2 mt-6 font-display text-lg text-navy">Objet</h2>
        <p className="mb-6 text-navy/70">
          Les présentes conditions régissent la réservation de séjours dans les villas proposées par Kayvila.
          Toute réservation implique l&apos;acceptation pleine et entière des présentes conditions.
        </p>
        <h2 className="mb-2 mt-6 font-display text-lg text-navy">Réservation &amp; paiement</h2>
        <p className="mb-6 text-navy/70">
          La réservation est confirmée après validation du paiement sécurisé. Les tarifs sont indiqués en
          euros, toutes taxes comprises, et incluent les frais de service précisés lors de la commande.
        </p>
        <h2 className="mb-2 mt-6 font-display text-lg text-navy">Annulation</h2>
        <p className="mb-6 text-navy/70">
          Les conditions d&apos;annulation propres à chaque villa sont indiquées sur sa fiche au moment de la
          réservation. Nous vous invitons à en prendre connaissance avant de valider votre séjour.
        </p>
        <h2 className="mb-2 mt-6 font-display text-lg text-navy">Responsabilité</h2>
        <p className="mb-6 text-navy/70">
          Kayvila agit en qualité d&apos;intermédiaire entre les voyageurs et les propriétaires. Le voyageur
          s&apos;engage à respecter le règlement intérieur de la villa louée.
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
        <LandingBlockTitle eyebrow="Objet" title="Champ d'application" />
        <p className="text-navy/80 leading-relaxed">
          Les présentes conditions régissent la réservation de séjours dans les villas proposées par Kayvila.
          Toute réservation implique l&apos;acceptation pleine et entière des présentes conditions.
        </p>
      </LandingSectionNarrow>

      <LandingSectionNarrow bg="offwhite">
        <LandingBlockTitle eyebrow="Commande" title="Réservation & paiement" />
        <p className="text-navy/80 leading-relaxed">
          La réservation est confirmée après validation du paiement sécurisé. Les tarifs sont indiqués en
          euros, toutes taxes comprises, et incluent les frais de service précisés lors de la commande.
        </p>
      </LandingSectionNarrow>

      <LandingSectionNarrow bg="white">
        <LandingBlockTitle eyebrow="Flexibilité" title="Annulation" />
        <p className="text-navy/80 leading-relaxed">
          Les conditions d&apos;annulation propres à chaque villa sont indiquées sur sa fiche au moment de la
          réservation. Nous vous invitons à en prendre connaissance avant de valider votre séjour.
        </p>
      </LandingSectionNarrow>

      <LandingSectionNarrow bg="offwhite">
        <LandingBlockTitle eyebrow="Cadre" title="Responsabilité" />
        <p className="text-navy/80 leading-relaxed">
          Kayvila agit en qualité d&apos;intermédiaire entre les voyageurs et les propriétaires. Le voyageur
          s&apos;engage à respecter le règlement intérieur de la villa louée.
        </p>
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
