'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

const COLLECTIONS = [
  {
    title: 'Les Essentiels',
    description: 'Les pièces intemporelles de votre garde-robe',
    href: '/homme/essentiels',
    gender: 'Homme',
    className: 'md:col-span-2 md:row-span-2',
  },
  {
    title: 'Nouvelle Collection',
    description: 'Découvrez les silhouettes de la saison',
    href: '/femme/nouveautes',
    gender: 'Femme',
    className: 'md:col-span-2',
  },
  {
    title: 'Les Silhouettes',
    description: 'Des looks complets, pensés pour vous',
    href: '/homme/silhouettes',
    gender: 'Homme & Femme',
    className: 'md:col-span-2',
  },
  {
    title: 'Cérémonie',
    description: 'L\'élégance des grands jours',
    href: '/homme/ceremonie',
    gender: 'Homme',
    className: '',
  },
  {
    title: 'Bureau',
    description: 'L\'alliance du style et du professionnalisme',
    href: '/femme/bureau',
    gender: 'Femme',
    className: '',
  },
];

export function CollectionGrid() {
  const { t } = useTranslation();

  return (
    <section className="py-section-md md:py-section-lg">
      <div className="container-pvl">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-pvl-kicker mb-3">{t('nav.collections')}</p>
            <h2 className="text-pvl-section-title">
              Nos univers
            </h2>
          </div>
          <Link
            href="/homme"
            className="hidden md:flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.2em] text-pvl-slate hover:text-pvl-black transition-colors"
          >
            {t('actions.voir-tout')}
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLLECTIONS.map((collection) => (
            <Link
              key={collection.title}
              href={collection.href}
              className={`group relative h-[300px] md:h-auto ${collection.className} bg-pvl-cream overflow-hidden`}
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-pvl-cream to-pvl-warm group-hover:scale-105 transition-transform duration-700" />

              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-pvl-black/30 via-transparent to-transparent">
                <p className="text-[0.5625rem] font-medium uppercase tracking-[0.2em] text-pvl-white/70 mb-2">
                  {collection.gender}
                </p>
                <h3 className="font-display text-xl md:text-2xl text-pvl-white mb-2">
                  {collection.title}
                </h3>
                <p className="text-[0.8125rem] text-pvl-white/80 max-w-xs">
                  {collection.description}
                </p>
                <span className="inline-flex items-center gap-2 text-[0.625rem] uppercase tracking-[0.2em] text-pvl-white mt-4 border-b border-pvl-white/30 pb-0.5 w-fit group-hover:border-pvl-white transition-colors">
                  {t('actions.decouvrir')}
                  <ArrowRight size={10} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link
            href="/homme"
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
