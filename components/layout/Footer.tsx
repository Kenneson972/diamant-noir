"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { SUPPORTED_LOCALES, SUPPORTED_CURRENCIES, type Locale, type Currency } from "@/lib/i18n";

export const Footer = () => {
  const pathname = usePathname();
  const { locale, setLocale, currency, setCurrency, t } = useLocale();

  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/login")) {
    return null;
  }

  return (
    <footer className="border-t border-black/10 bg-white py-12 text-navy md:py-16">
      <div className="page-px mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-4">
          <div className="space-y-4">
            <BrandLogo variant="onLight" size="sm" className="self-start" />
            <p className="text-sm leading-relaxed text-navy/55">
              Un sanctuaire côtier exclusif conçu pour ceux qui recherchent
              la rareté, la tranquillité et une élégance raffinée.
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-xs uppercase tracking-[0.2em] text-black/40">{t("footer.explore")}</h4>
            <ul className="space-y-4 text-sm text-navy/70">
              <li>
                <Link href="/villas" className="transition-colors hover:text-black">
                  {t("nav.villas")}
                </Link>
              </li>
              <li>
                <Link href="/prestations" className="transition-colors hover:text-black">
                  {t("nav.prestations")}
                </Link>
              </li>
              <li>
                <Link href="/qui-sommes-nous" className="transition-colors hover:text-black">
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link href="/soumettre-ma-villa" className="transition-colors hover:text-black">
                  {t("footer.submit_villa")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-xs uppercase tracking-[0.2em] text-black/40">{t("footer.support")}</h4>
            <ul className="space-y-4 text-sm text-navy/70">
              <li>
                <Link href="/contact" className="transition-colors hover:text-black">
                  {t("footer.contact_faq")}
                </Link>
              </li>
              <li>
                <Link href="/contact#faq" className="transition-colors hover:text-black">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-black">
                  {t("footer.terms")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs uppercase tracking-[0.2em] text-black/40">Suivez-nous</h4>
            <div className="mb-4 flex items-center gap-3">
              <a
                href="https://instagram.com/diamantnoir_villas"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Diamant Noir"
                className="tap-target border border-black/10 text-navy/50 transition-colors hover:border-black hover:text-black"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://wa.me/33600000000"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Diamant Noir"
                className="tap-target border border-black/10 text-navy/50 transition-colors hover:border-black hover:text-black"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
            <h4 className="mb-2 mt-4 text-xs uppercase tracking-[0.2em] text-black/40">Langue / Devise</h4>
            <div className="flex flex-wrap gap-2">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="min-h-11 rounded border border-black/15 bg-offwhite px-2 py-1 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-black"
              >
                {SUPPORTED_LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {l === "fr" ? "FR" : l === "en" ? "EN" : "ES"}
                  </option>
                ))}
              </select>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="min-h-11 rounded border border-black/15 bg-offwhite px-2 py-1 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-black"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-black/10 pt-7 text-xs uppercase tracking-[0.1em] text-navy/40 md:mt-16 md:flex-row md:pt-8">
          <p>© 2026 Diamant Noir. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link href="/confidentialite" className="transition-colors hover:text-black">
              Politique de confidentialité
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-black">
              Gestion des cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
