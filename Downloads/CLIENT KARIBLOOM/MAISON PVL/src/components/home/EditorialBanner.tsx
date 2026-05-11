'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

export function EditorialBanner() {
  const { t } = useTranslation();

  return (
    <section className="bg-pvl-cream">
      <div className="container-pvl py-section-md md:py-section-lg">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-pvl-kicker mb-6">Savoir-faire</p>
          <blockquote className="text-pvl-manifesto">
            &ldquo;Chaque pièce Maison PVL est le fruit d&apos;une recherche
            constante d&apos;équilibre entre tradition et modernité. Nous
            sélectionnons les meilleurs tissus, les coupes les plus justes,
            pour une silhouette qui vous ressemble.&rdquo;
          </blockquote>
          <div className="mt-10">
            <Link
              href="/a-propos"
              className="group inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.2em] text-pvl-black border-b border-pvl-black/20 pb-1 hover:border-pvl-black transition-colors"
            >
              {t('actions.en-savoir-plus')}
              <ArrowRight
                size={12}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
