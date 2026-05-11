'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const footerLinks = {
  aide: [
    { label: 'sav', href: '/sav' },
    { label: 'faq', href: '/sav/faq' },
    { label: 'livraison', href: '/livraison-retours' },
    { label: 'contact', href: '/contact' },
  ],
  marque: [
    { label: 'a-propos', href: '/a-propos' },
    { label: 'boutiques', href: '/contact' },
  ],
  legal: [
    { label: 'cgv', href: '/cgv' },
    { label: 'mentions', href: '/mentions-legales' },
    { label: 'confidentialite', href: '/confidentialite' },
  ],
};

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-pvl-cream text-pvl-black">
      <div className="container-pvl py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="font-display text-xl tracking-[-0.02em] text-pvl-black"
            >
              Maison PVL
            </Link>
            <p className="mt-3 text-[0.75rem] text-pvl-slate leading-relaxed max-w-xs">
              {t('site.tagline')}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                className="p-2 text-pvl-slate hover:text-pvl-black transition-colors"
                aria-label="Instagram"
              >
                <Globe size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-pvl-slate mb-6">
              {t('footer.aide')}
            </h4>
            <ul className="space-y-3">
              {footerLinks.aide.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.8125rem] text-pvl-slate hover:text-pvl-black transition-colors"
                  >
                    {t(`footer.${link.label}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-pvl-slate mb-6">
              {t('footer.marque')}
            </h4>
            <ul className="space-y-3">
              {footerLinks.marque.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.8125rem] text-pvl-slate hover:text-pvl-black transition-colors"
                  >
                    {t(`footer.${link.label}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-pvl-slate mb-6">
              {t('footer.legal')}
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.8125rem] text-pvl-slate hover:text-pvl-black transition-colors"
                  >
                    {t(`footer.${link.label}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-16 pt-10 border-t border-pvl-black/6">
          <div className="max-w-md">
            <h4 className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-pvl-slate mb-3">
              {t('footer.newsletter')}
            </h4>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex gap-2"
            >
              <input
                type="email"
                placeholder={t('footer.newsletter-placeholder')}
                className="flex-1 bg-transparent border border-pvl-black/20 px-4 py-3 text-[0.8125rem] text-pvl-black placeholder:text-pvl-slate focus:outline-none focus:border-pvl-black transition-colors"
              />
              <button
                type="submit"
                className="bg-pvl-black text-pvl-white px-6 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
              >
                {t('footer.newsletter-cta')}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-pvl-black/6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[0.6875rem] text-pvl-slate">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/cgv"
              className="text-[0.6875rem] text-pvl-slate hover:text-pvl-black transition-colors"
            >
              {t('footer.cgv')}
            </Link>
            <Link
              href="/confidentialite"
              className="text-[0.6875rem] text-pvl-slate hover:text-pvl-black transition-colors"
            >
              {t('footer.confidentialite')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
