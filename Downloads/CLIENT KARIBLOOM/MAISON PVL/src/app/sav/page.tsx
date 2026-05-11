'use client';

import Link from 'next/link';
import { HeadphonesIcon, MessageCircle, HelpCircle, RotateCcw, Truck, ArrowRight } from 'lucide-react';

const SAV_CARDS = [
  {
    href: '/sav/faq',
    label: 'Questions fréquentes',
    icon: HelpCircle,
    description:
      'Retrouvez les réponses aux questions les plus courantes sur nos produits, la livraison, les retours et plus encore.',
  },
  {
    href: '/sav/retour',
    label: 'Demande de retour',
    icon: RotateCcw,
    description:
      'Vous souhaitez retourner ou échanger un article ? Déposez une demande en quelques clics.',
  },
  {
    href: '/livraison-retours',
    label: 'Livraison & Retours',
    icon: Truck,
    description:
      'Consultez nos politiques de livraison et de retours pour en savoir plus sur les délais et conditions.',
  },
  {
    href: '/contact',
    label: 'Nous contacter',
    icon: MessageCircle,
    description:
      'Besoin d\'aide personnalisée ? Notre équipe est à votre écoute pour répondre à toutes vos questions.',
  },
];

const CONTACT_INFO = [
  { label: 'Téléphone', value: '+33 1 23 45 67 89' },
  { label: 'Email', value: 'contact@maisonpvl.com' },
  { label: 'Horaires', value: 'Lun–Ven, 9h–18h' },
];

export default function SAVPage() {
  return (
    <div className="container-pvl py-section-md md:py-section-lg">
      {/* Header */}
      <div className="max-w-2xl mb-14">
        <div className="flex items-center gap-3 mb-4">
          <HeadphonesIcon size={20} className="text-pvl-slate" strokeWidth={1.5} />
          <span className="text-pvl-kicker">Service client</span>
        </div>
        <h1 className="text-pvl-section-title mb-4">
          Nous sommes à votre écoute
        </h1>
        <p className="text-pvl-manifesto">
          Notre équipe est là pour vous accompagner à chaque étape, du choix de
          vos pièces jusqu&apos;à leur réception.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
        {SAV_CARDS.map(({ href, label, icon: Icon, description }) => (
          <Link
            key={href}
            href={href}
            className="group border border-pvl-black/12 p-8 hover:border-pvl-black transition-colors"
          >
            <Icon
              size={24}
              className="text-pvl-slate group-hover:text-pvl-black mb-4 transition-colors"
              strokeWidth={1.5}
            />
            <h3 className="font-display text-xl mb-2">{label}</h3>
            <p className="text-sm text-pvl-slate mb-4 leading-relaxed">
              {description}
            </p>
            <span className="inline-flex items-center gap-1 text-[0.625rem] uppercase tracking-[0.15em] text-pvl-stone group-hover:text-pvl-black transition-colors">
              En savoir plus
              <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>

      {/* Contact info */}
      <div className="border-t border-pvl-black/8 pt-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {CONTACT_INFO.map(({ label, value }) => (
            <div key={label}>
              <p className="text-[0.625rem] uppercase tracking-[0.15em] text-pvl-stone mb-1">
                {label}
              </p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
