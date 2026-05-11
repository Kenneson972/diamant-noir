'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative h-[85vh] min-h-[600px] max-h-[900px] bg-pvl-cream overflow-hidden">
      {/* Background image placeholder / pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-pvl-cream via-pvl-warm to-pvl-cream">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pvl-black/3 via-transparent to-transparent" />
      </div>

      {/* Editorial content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container-pvl">
          <div className="max-w-xl">
            <p className="text-pvl-kicker mb-6">
              {t('common.nouveautes')} Été 2026
            </p>
            <h1 className="text-pvl-hero-title text-pvl-black mb-6">
              L&apos;élégance<br />
              <span className="italic">sur mesure</span>
            </h1>
            <p className="text-[0.9375rem] text-pvl-slate leading-relaxed max-w-md mb-10">
              Des collections pensées pour celles et ceux qui recherchent
              l&apos;exigence et la qualité. Chaque pièce raconte une histoire
              de savoir-faire et de raffinement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/homme"
                className="group inline-flex items-center gap-3 bg-pvl-black text-pvl-white px-8 py-4 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-all duration-300"
              >
                {t('nav.homme')}
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/femme"
                className="group inline-flex items-center gap-3 border border-pvl-black/20 text-pvl-black px-8 py-4 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-black hover:text-pvl-white transition-all duration-300"
              >
                {t('nav.femme')}
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-px h-12 bg-pvl-black/20 animate-pulse" />
      </div>
    </section>
  );
}
