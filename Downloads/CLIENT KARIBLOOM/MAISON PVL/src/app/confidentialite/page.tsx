import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Maison PVL',
  description:
    'Politique de confidentialité de Maison PVL.',
};

const SECTIONS = [
  {
    title: '1. Collecte des données',
    content:
      'Nous collectons les données personnelles que vous nous fournissez lors de la création de votre compte, de la passation d\'une commande, de l\'inscription à notre newsletter ou lors de vos échanges avec notre service client. Ces données incluent notamment votre nom, prénom, adresse email, adresse postale, numéro de téléphone et informations de paiement.',
  },
  {
    title: '2. Utilisation des données',
    content:
      'Vos données sont utilisées pour traiter vos commandes, assurer la livraison des produits, gérer votre compte client, vous informer de l\'état de vos commandes, vous envoyer des communications marketing (avec votre consentement), et améliorer votre expérience sur notre site.',
  },
  {
    title: '3. Base légale du traitement',
    content:
      'Le traitement de vos données repose sur plusieurs bases légales : l\'exécution du contrat (traitement des commandes), votre consentement (communications marketing, cookies), notre intérêt légitime (amélioration de nos services), et le respect d\'obligations légales (facturation, comptabilité).',
  },
  {
    title: '4. Conservation des données',
    content:
      'Vos données sont conservées pendant la durée nécessaire à la réalisation des finalités pour lesquelles elles ont été collectées. Les données liées à votre compte sont conservées jusqu\'à sa suppression. Les données de commande sont conservées pendant 10 ans conformément aux obligations légales en matière de comptabilité.',
  },
  {
    title: '5. Partage des données',
    content:
      'Nous ne vendons pas vos données personnelles à des tiers. Vos données peuvent être partagées avec nos partenaires de confiance pour le traitement des commandes (transporteurs, prestataires de paiement) ou pour des obligations légales (autorités compétentes).',
  },
  {
    title: '6. Cookies',
    content:
      'Notre site utilise des cookies nécessaires au fonctionnement du site et à la réalisation des transactions. Avec votre consentement, nous utilisons également des cookies de mesure d\'audience et de personnalisation. Vous pouvez gérer vos préférences à tout moment depuis les paramètres de votre navigateur.',
  },
  {
    title: '7. Vos droits',
    content:
      'Conformément au RGPD, vous disposez d\'un droit d\'accès, de rectification, d\'effacement, de limitation, de portabilité et d\'opposition au traitement de vos données. Vous pouvez exercer ces droits en nous contactant à l\'adresse : privacy@maisonpvl.com.',
  },
  {
    title: '8. Sécurité',
    content:
      'Nous mettons en œuvre toutes les mesures techniques et organisationnelles appropriées pour garantir la sécurité de vos données personnelles et les protéger contre tout accès non autorisé, altération, divulgation ou destruction.',
  },
  {
    title: '9. Contact DPO',
    content:
      'Pour toute question relative à la protection de vos données, vous pouvez contacter notre Délégué à la Protection des Données (DPO) à l\'adresse : dpo@maisonpvl.com, ou par courrier postal à l\'adresse de notre siège social.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="container-pvl py-section-md md:py-section-lg">
      <div className="max-w-3xl">
        <p className="text-pvl-kicker mb-4">Informations légales</p>
        <h1 className="text-pvl-section-title mb-4">
          Politique de confidentialité
        </h1>
        <p className="text-sm text-pvl-slate mb-10">
          Dernière mise à jour : mai 2026
        </p>
      </div>

      <div className="max-w-3xl space-y-8">
        {SECTIONS.map(({ title, content }) => (
          <section key={title}>
            <h2 className="font-display text-xl mb-3">{title}</h2>
            <p className="text-sm text-pvl-slate leading-relaxed">{content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
