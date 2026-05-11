'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

const PLACEHOLDER_PRODUCTS = [
  { name: 'Costume deux pièces', price: 490, gender: 'Homme' },
  { name: 'Veste structurée', price: 350, gender: 'Femme' },
  { name: 'Chemise en coton égyptien', price: 165, gender: 'Homme' },
  { name: 'Pantalon tailleur', price: 220, gender: 'Femme' },
];

export function NewArrivals() {
  const { t } = useTranslation();

  return (
    <section className="py-section-md md:py-section-lg">
      <div className="container-pvl">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-pvl-kicker mb-3">{t('common.nouveautes')}</p>
            <h2 className="text-pvl-section-title">
              Nouveautés de la saison
            </h2>
          </div>
          <Link
            href="/homme/nouveautes"
            className="hidden md:flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.2em] text-pvl-slate hover:text-pvl-black transition-colors"
          >
            {t('actions.voir-tout')}
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {PLACEHOLDER_PRODUCTS.map((product) => (
            <Link
              key={product.name}
              href="/produit/demo"
              className="group"
            >
              <div className="aspect-[3/4] bg-pvl-cream mb-4 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-pvl-cream to-pvl-warm group-hover:scale-[1.02] transition-transform duration-700" />
              </div>
              <p className="text-pvl-product-name mb-1">{product.name}</p>
              <div className="flex items-center justify-between">
                <p className="text-pvl-price">{product.price} €</p>
                <span className="text-pvl-meta">{product.gender}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            href="/homme/nouveautes"
            className="inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.2em] text-pvl-slate hover:text-pvl-black transition-colors"
          >
            {t('actions.voir-tout')}
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
}
