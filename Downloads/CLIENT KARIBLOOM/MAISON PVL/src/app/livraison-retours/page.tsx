import type { Metadata } from 'next';
import { Truck, RotateCcw, PackageCheck, Clock, Euro, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Livraison & Retours — Maison PVL',
  description:
    'Informations sur les délais de livraison et la politique de retours de Maison PVL.',
};

const SHIPPING_INFO = [
  {
    icon: Truck,
    title: 'Livraison standard',
    details: '3 à 5 jours ouvrés',
    price: '5,90 €',
    freeFrom: 'Offerte dès 200 €',
  },
  {
    icon: Clock,
    title: 'Livraison express',
    details: '24 à 48 heures',
    price: '12,90 €',
    freeFrom: null,
  },
  {
    icon: Globe,
    title: 'International',
    details: '5 à 10 jours ouvrés',
    price: 'À partir de 15 €',
    freeFrom: 'Offerte dès 300 €',
  },
  {
    icon: PackageCheck,
    title: 'Point relais',
    details: '3 à 5 jours ouvrés',
    price: '3,90 €',
    freeFrom: 'Offerte dès 200 €',
  },
];

const RETURN_STEPS = [
  {
    step: '01',
    title: 'Connectez-vous',
    description:
      'Accédez à votre espace personnel et sélectionnez la commande concernée.',
  },
  {
    step: '02',
    title: 'Sélectionnez les articles',
    description:
      'Choisissez les articles que vous souhaitez retourner et indiquez le motif.',
  },
  {
    step: '03',
    title: 'Imprimez l\'étiquette',
    description:
      'Recevez votre étiquette de retour par email et imprimez-la.',
  },
  {
    step: '04',
    title: 'Déposez le colis',
    description:
      'Déposez votre colis dans un point relais ou à La Poste sous 14 jours.',
  },
];

export default function ShippingReturnsPage() {
  return (
    <div className="container-pvl py-section-md md:py-section-lg">
      {/* Header */}
      <div className="max-w-3xl mb-14">
        <p className="text-pvl-kicker mb-4">Service client</p>
        <h1 className="text-pvl-section-title mb-4">
          Livraison & Retours
        </h1>
        <p className="text-pvl-manifesto">
          Nous mettons tout en œuvre pour que vos commandes vous parviennent
          rapidement et en parfait état.
        </p>
      </div>

      {/* Shipping options */}
      <section className="mb-16">
        <h2 className="text-pvl-kicker mb-6">Modes de livraison</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SHIPPING_INFO.map(({ icon: Icon, title, details, price, freeFrom }) => (
            <div key={title} className="border border-pvl-black/12 p-6">
              <Icon
                size={20}
                className="text-pvl-slate mb-4"
                strokeWidth={1.5}
              />
              <h3 className="text-sm font-medium mb-1">{title}</h3>
              <p className="text-xs text-pvl-slate mb-3">{details}</p>
              <p className="text-pvl-price">{price}</p>
              {freeFrom && (
                <p className="text-[0.5625rem] uppercase tracking-[0.1em] text-pvl-success mt-2">
                  {freeFrom}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Shipping details */}
      <section className="mb-16 max-w-3xl">
        <h2 className="text-pvl-kicker mb-6">Informations complémentaires</h2>
        <div className="space-y-6 text-sm text-pvl-slate leading-relaxed">
          <div>
            <h3 className="font-medium text-pvl-black mb-2">
              Zones de livraison
            </h3>
            <p>
              Nous livrons en France métropolitaine, en Union européenne, au
              Royaume-Uni, en Suisse, au Canada et aux États-Unis. Pour toute
              autre destination, contactez notre service client.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-pvl-black mb-2">
              Suivi de commande
            </h3>
            <p>
              Un email contenant votre numéro de suivi vous est envoyé dès que
              votre colis est pris en charge par le transporteur. Vous pouvez
              également suivre votre commande depuis votre espace personnel.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-pvl-black mb-2">
              En cas de problème
            </h3>
            <p>
              Si votre colis arrive endommagé ou si vous constatez une anomalie,
              contactez notre service client dans les 48 heures suivant la
              réception. Nous nous engageons à trouver une solution rapidement.
            </p>
          </div>
        </div>
      </section>

      {/* Returns section */}
      <section className="bg-pvl-cream p-8 md:p-12">
        <div className="flex items-center gap-3 mb-6">
          <RotateCcw size={20} className="text-pvl-slate" strokeWidth={1.5} />
          <h2 className="text-pvl-kicker">Retours & Échanges</h2>
        </div>
        <div className="max-w-3xl mb-10">
          <p className="text-sm text-pvl-slate mb-4">
            Vous disposez de <strong className="text-pvl-black">30 jours</strong> à compter de la
            réception de votre commande pour retourner un article. Les articles
            doivent être neufs, non portés, avec leurs étiquettes et dans leur
            emballage d&apos;origine.
          </p>
          <p className="text-sm text-pvl-slate">
            Les frais de retour sont offerts pour les commandes supérieures à
            200 €. Pour les commandes inférieures, les frais de retour sont de
            4,90 € (déduits du remboursement).
          </p>
        </div>

        <h3 className="text-sm font-medium mb-6">Comment retourner un article ?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {RETURN_STEPS.map(({ step, title, description }) => (
            <div key={step}>
              <span className="text-pvl-meta block mb-2">{step}</span>
              <h4 className="text-sm font-medium mb-1">{title}</h4>
              <p className="text-xs text-pvl-slate leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
