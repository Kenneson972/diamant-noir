'use client';

import { useTranslation } from 'react-i18next';
import { useParams, usePathname, useRouter } from 'next/navigation';
import type { Locale } from '@/lib/constants';
import { LOCALES } from '@/lib/constants';

const FLAGS: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
  es: 'ES',
  it: 'IT',
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  const currentLang = (i18n.language?.split('-')[0] || 'fr') as Locale;

  const switchLanguage = (lang: Locale) => {
    i18n.changeLanguage(lang);

    const segments = pathname.split('/').filter(Boolean);
    if (LOCALES.includes(segments[0] as Locale)) {
      segments[0] = lang;
    } else {
      segments.unshift(lang);
    }

    router.push(`/${segments.join('/')}`);
  };

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLanguage(locale)}
          className={`px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.12em] transition-colors ${
            currentLang === locale
              ? 'text-pvl-black'
              : 'text-pvl-stone hover:text-pvl-black'
          }`}
          aria-label={`Switch language to ${locale}`}
        >
          {FLAGS[locale]}
        </button>
      ))}
    </div>
  );
}
