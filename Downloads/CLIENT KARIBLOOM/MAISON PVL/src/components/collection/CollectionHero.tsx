'use client';

import { useTranslation } from 'react-i18next';

interface CollectionHeroProps {
  gender: string;
  title: string;
  description?: string;
}

export function CollectionHero({ gender, title, description }: CollectionHeroProps) {
  const { t } = useTranslation();

  return (
    <section className="relative h-[50vh] min-h-[400px] bg-pvl-cream overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pvl-cream via-pvl-warm to-pvl-cream">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pvl-black/5 via-transparent to-transparent" />
      </div>

      <div className="absolute inset-0 flex items-center">
        <div className="container-pvl">
          <div className="max-w-2xl">
            <p className="text-pvl-kicker mb-4">
              {gender === 'homme' ? t('nav.homme') : t('nav.femme')}
            </p>
            <h1 className="text-pvl-hero-title text-pvl-black mb-4">
              {title}
            </h1>
            {description && (
              <p className="text-[0.9375rem] text-pvl-slate leading-relaxed max-w-lg">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
