import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions générales de vente — Maison PVL',
  description:
    'Consultez les conditions générales de vente de Maison PVL.',
};

const SECTIONS = [
  {
    title: '1. Objet',
    content:
      'Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre Maison PVL et tout client souhaitant effectuer un achat sur le site www.maisonpvl.com. Toute commande implique l\'acceptation sans réserve des présentes conditions.',
  },
  {
    title: '2. Produits',
    content:
      'Les produits proposés à la vente sont ceux figurant sur le site internet de Maison PVL, dans la limite des stocks disponibles. Les photographies illustrant les produits n\'entrent pas dans le champ contractuel. En cas d\'indisponibilité d\'un produit après passation de la commande, le client en sera informé par email et pourra obtenir soit un remboursement, soit un avoir.',
  },
  {
    title: '3. Prix',
    content:
      'Les prix sont indiqués en euros, toutes taxes comprises (TTC), hors frais de livraison. Maison PVL se réserve le droit de modifier ses prix à tout moment, les produits étant facturés sur la base des tarifs en vigueur au moment de la validation de la commande.',
  },
  {
    title: '4. Commande',
    content:
      'La commande est validée après confirmation du paiement par l\'établissement bancaire. Le client recevra un email de confirmation récapitulant les articles commandés, le montant total et les délais de livraison estimés. Maison PVL se réserve le droit de refuser ou d\'annuler toute commande d\'un client avec lequel il existerait un litige antérieur.',
  },
  {
    title: '5. Paiement',
    content:
      'Le paiement s\'effectue en ligne par carte bancaire (Visa, Mastercard, American Express) ou par PayPal. Les transactions sont sécurisées via Stripe. Le débit est effectué au moment de la validation de la commande.',
  },
  {
    title: '6. Livraison',
    content:
      'Les commandes sont livrées à l\'adresse indiquée par le client lors de la commande. Les délais de livraison sont donnés à titre indicatif. En France métropolitaine, les délais sont de 3 à 5 jours ouvrés en standard et de 24 à 48 heures en express. Pour l\'international, les délais varient selon la destination.',
  },
  {
    title: '7. Droit de rétractation',
    content:
      'Conformément à la législation en vigueur, le client dispose d\'un délai de 14 jours à compter de la réception de sa commande pour exercer son droit de rétractation, sans avoir à justifier de motifs ni à payer de pénalité. Les frais de retour sont à la charge du client.',
  },
  {
    title: '8. Retours et remboursements',
    content:
      'Les articles doivent être retournés dans leur état d\'origine, non portés, avec leurs étiquettes et dans leur emballage d\'origine. Le remboursement sera effectué sous 14 jours à compter de la réception du retour dans nos entrepôts, sur le même moyen de paiement que celui utilisé lors de l\'achat.',
  },
  {
    title: '9. Garantie',
    content:
      'Tous nos produits bénéficient de la garantie légale de conformité (articles L. 217-4 à L. 217-14 du Code de la consommation) et de la garantie des vices cachés (articles 1641 à 1649 du Code civil).',
  },
  {
    title: '10. Données personnelles',
    content:
      'Les informations collectées lors de la commande sont nécessaires à son traitement et font l\'objet d\'un traitement informatisé. Conformément au Règlement Général sur la Protection des Données (RGPD), le client dispose d\'un droit d\'accès, de rectification et de suppression de ses données.',
  },
  {
    title: '11. Propriété intellectuelle',
    content:
      'L\'ensemble des éléments présents sur le site (textes, images, logos, marques) sont la propriété exclusive de Maison PVL. Toute reproduction ou représentation, totale ou partielle, sans autorisation préalable est interdite.',
  },
  {
    title: '12. Droit applicable',
    content:
      'Les présentes conditions générales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.',
  },
];

export default function CGVPage() {
  return (
    <div className="container-pvl py-section-md md:py-section-lg">
      <div className="max-w-3xl">
        <p className="text-pvl-kicker mb-4">Informations légales</p>
        <h1 className="text-pvl-section-title mb-4">
          Conditions générales de vente
        </h1>
        <p className="text-sm text-pvl-slate mb-10">
          Dernière mise à jour : mai 2026
        </p>
      </div>

      <div className="max-w-3xl space-y-8">
        {SECTIONS.map(({ title, content }) => (
          <div key={title}>
            <h2 className="font-display text-xl mb-3">{title}</h2>
            <p className="text-sm text-pvl-slate leading-relaxed">{content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
