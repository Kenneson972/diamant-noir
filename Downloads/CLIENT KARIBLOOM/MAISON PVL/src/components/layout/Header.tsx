'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, User, Heart, Search, Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCart } from '@/store/cartStore';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { NAV_ITEMS, COLLECTION_TABS } from '@/lib/constants';

export function Header() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user } = useAuth();
  const { itemCount, toggleCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const count = itemCount();
  const isGendered = pathname.startsWith('/homme') || pathname.startsWith('/femme');

  return (
    <>
      <header
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        className={cn(
          'sticky top-0 z-50 bg-pvl-white transition-shadow duration-300',
          scrolled && 'border-b border-pvl-black/8 shadow-[0_1px_12px_rgba(0,0,0,0.04)]'
        )}
      >
        <div className="container-pvl">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 -ml-2 text-pvl-black"
              aria-label={mobileOpen ? t('nav.fermer') : t('nav.menu')}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Desktop nav - left */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-[0.75rem] font-medium uppercase tracking-[0.18em] transition-colors',
                    pathname.startsWith(item.href)
                      ? 'text-pvl-black'
                      : 'text-pvl-slate hover:text-pvl-black'
                  )}
                >
                  {t(item.label)}
                </Link>
              ))}
            </nav>

            {/* Logo */}
            <Link
              href="/"
              className="font-display text-xl md:text-2xl tracking-[-0.02em] text-pvl-black"
            >
              Maison PVL
            </Link>

            {/* Right actions */}
            <div className="flex items-center gap-3 md:gap-5">
              <Link
                href="/recherche"
                className="hidden md:flex p-1.5 text-pvl-slate hover:text-pvl-black transition-colors"
                aria-label={t('nav.recherche')}
              >
                <Search size={18} />
              </Link>

              <Link
                href={user ? '/mon-compte/favoris' : '/connexion'}
                className="hidden md:flex p-1.5 text-pvl-slate hover:text-pvl-black transition-colors"
                aria-label={t('nav.favoris')}
              >
                <Heart size={18} />
              </Link>

              <Link
                href={user ? '/mon-compte' : '/connexion'}
                className="p-1.5 text-pvl-slate hover:text-pvl-black transition-colors"
                aria-label={t('nav.mon-compte')}
              >
                <User size={18} />
              </Link>

              <button
                onClick={toggleCart}
                className="relative p-1.5 text-pvl-slate hover:text-pvl-black transition-colors"
                aria-label={t('nav.panier')}
              >
                <ShoppingBag size={18} />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-pvl-black text-pvl-white text-[0.625rem] font-medium w-4 h-4 flex items-center justify-center rounded-full">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>

              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>

        {/* Sub-navigation for gender pages */}
        {isGendered && (
          <div className="border-t border-pvl-black/6">
            <div className="container-pvl">
              <div className="flex items-center gap-6 h-11 overflow-x-auto scrollbar-hide">
                {COLLECTION_TABS.map((tab) => (
                  <Link
                    key={tab.slug}
                    href={`/${pathname.split('/')[1]}/${tab.slug}`}
                    className={cn(
                      'text-[0.625rem] uppercase tracking-[0.2em] whitespace-nowrap transition-colors',
                      pathname.includes(tab.slug)
                        ? 'text-pvl-black font-medium'
                        : 'text-pvl-stone hover:text-pvl-black'
                    )}
                  >
                    {t(tab.label)}
                  </Link>
                ))}
                <span className="w-px h-3 bg-pvl-black/10" />
                <Link
                  href={`/${pathname.split('/')[1]}/accessoires`}
                  className="text-[0.625rem] uppercase tracking-[0.2em] text-pvl-stone hover:text-pvl-black transition-colors whitespace-nowrap"
                >
                  {t('nav.accessoires')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile navigation overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-pvl-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-pvl-white p-6 pt-24 overflow-y-auto shadow-2xl">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <p className="text-[0.625rem] uppercase tracking-[0.2em] text-pvl-stone font-medium">
                  {t('nav.collections')}
                </p>
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-lg font-display text-pvl-black hover:text-pvl-slate transition-colors"
                  >
                    {t(item.label)}
                  </Link>
                ))}
              </div>

              <div className="border-t border-pvl-black/8 pt-6">
                <p className="text-[0.625rem] uppercase tracking-[0.2em] text-pvl-stone font-medium mb-4">
                  {t('nav.categorie')}
                </p>
                <div className="flex flex-col gap-3">
                  {COLLECTION_TABS.map((tab) => (
                    <Link
                      key={tab.slug}
                      href={`/${pathname.startsWith('/femme') ? 'femme' : 'homme'}/${tab.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="text-sm text-pvl-slate hover:text-pvl-black transition-colors"
                    >
                      {t(tab.label)}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-pvl-black/8 pt-6">
                <Link
                  href={user ? '/mon-compte' : '/connexion'}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-sm text-pvl-slate hover:text-pvl-black transition-colors"
                >
                  <User size={16} />
                  {t('nav.mon-compte')}
                </Link>
                <Link
                  href={user ? '/mon-compte/favoris' : '/connexion'}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-sm text-pvl-slate hover:text-pvl-black transition-colors mt-3"
                >
                  <Heart size={16} />
                  {t('nav.favoris')}
                </Link>
              </div>

              <div className="border-t border-pvl-black/8 pt-6">
                <LanguageSwitcher />
              </div>
            </div>
          </nav>
        </div>
      )}

      <CartDrawer />
    </>
  );
}
