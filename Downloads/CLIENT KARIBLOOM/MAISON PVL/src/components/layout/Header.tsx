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

interface HeaderProps {
  variant?: 'solid' | 'transparent';
}

export function Header({ variant = 'solid' }: HeaderProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user } = useAuth();
  const { itemCount, toggleCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isTransparent = variant === 'transparent';

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

  return (
    <>
      <header
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          variant === 'transparent'
            ? cn(
                'bg-gradient-to-b from-black/40 to-transparent',
                scrolled && '!bg-pvl-black/95 backdrop-blur-sm'
              )
            : cn(
                scrolled
                  ? 'bg-pvl-white/98 border-b border-pvl-black/8 shadow-[0_1px_12px_rgba(0,0,0,0.04)]'
                  : 'bg-pvl-white border-b border-transparent'
              )
        )}
      >
        {/* Announcement bar - hidden in transparent mode */}
        {!isTransparent && (
          <div className="bg-pvl-black text-pvl-white text-center py-2 px-4">
            <p className="text-[0.625rem] font-medium uppercase tracking-[0.2em]">
              Livraison offerte dès 200€ — Retours sous 30 jours
            </p>
          </div>
        )}

        <div className="container-pvl">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                'md:hidden p-2 -ml-2 transition-colors',
                isTransparent ? 'text-white/50 hover:text-white' : ''
              )}
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
                      ? isTransparent ? 'text-white' : 'text-pvl-black'
                      : isTransparent
                        ? 'text-white/50 hover:text-white'
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
              className={cn(
                'font-display text-xl md:text-2xl tracking-[-0.02em]',
                isTransparent ? 'text-white' : 'text-pvl-black'
              )}
            >
              Maison PVL
            </Link>

            {/* Right actions */}
            <div className="flex items-center gap-3 md:gap-5">
              <Link
                href="/recherche"
                className={cn(
                  'hidden md:flex p-1.5 transition-colors',
                  isTransparent
                    ? 'text-white/50 hover:text-white'
                    : 'text-pvl-slate hover:text-pvl-black'
                )}
                aria-label={t('nav.recherche')}
              >
                <Search size={18} />
              </Link>

              <Link
                href={user ? '/mon-compte/favoris' : '/connexion'}
                className={cn(
                  'hidden md:flex p-1.5 transition-colors',
                  isTransparent
                    ? 'text-white/50 hover:text-white'
                    : 'text-pvl-slate hover:text-pvl-black'
                )}
                aria-label={t('nav.favoris')}
              >
                <Heart size={18} />
              </Link>

              <Link
                href={user ? '/mon-compte' : '/connexion'}
                className={cn(
                  'p-1.5 transition-colors',
                  isTransparent
                    ? 'text-white/50 hover:text-white'
                    : 'text-pvl-slate hover:text-pvl-black'
                )}
                aria-label={t('nav.mon-compte')}
              >
                <User size={18} />
              </Link>

              <button
                onClick={toggleCart}
                className={cn(
                  'relative p-1.5 transition-colors',
                  isTransparent
                    ? 'text-white/50 hover:text-white'
                    : 'text-pvl-slate hover:text-pvl-black'
                )}
                aria-label={t('nav.panier')}
              >
                <ShoppingBag size={18} />
                {count > 0 && (
                  <span className={cn(
                    'absolute -top-0.5 -right-0.5 text-[0.5rem] font-medium w-4 h-4 flex items-center justify-center rounded-full',
                    isTransparent ? 'bg-white text-pvl-black' : 'bg-pvl-black text-pvl-white'
                  )}>
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
        {pathname.startsWith('/homme') || pathname.startsWith('/femme') ? (
          <div className={cn(
            'border-t',
            isTransparent ? 'border-white/10' : 'border-pvl-black/6'
          )}>
            <div className="container-pvl">
              <div className="flex items-center gap-6 h-11 overflow-x-auto scrollbar-hide">
                {COLLECTION_TABS.map((tab) => (
                  <Link
                    key={tab.slug}
                    href={`/${pathname.split('/')[1]}/${tab.slug}`}
                    className={cn(
                      'text-[0.625rem] uppercase tracking-[0.2em] whitespace-nowrap transition-colors',
                      pathname.includes(tab.slug)
                        ? isTransparent ? 'text-white font-medium' : 'text-pvl-black font-medium'
                        : isTransparent ? 'text-white/50 hover:text-white' : 'text-pvl-stone hover:text-pvl-black'
                    )}
                  >
                    {t(tab.label)}
                  </Link>
                ))}
                <span className={cn(
                  'w-px h-3',
                  isTransparent ? 'bg-white/20' : 'bg-pvl-black/10'
                )} />
                <Link
                  href={`/${pathname.split('/')[1]}/accessoires`}
                  className={cn(
                    'text-[0.625rem] uppercase tracking-[0.2em] transition-colors whitespace-nowrap',
                    isTransparent ? 'text-white/50 hover:text-white' : 'text-pvl-stone hover:text-pvl-black'
                  )}
                >
                  {t('nav.accessoires')}
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* Mobile navigation overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-pvl-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <nav className={cn(
            'absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] p-6 pt-24 overflow-y-auto shadow-2xl',
            isTransparent ? 'bg-pvl-black/95 text-white' : 'bg-pvl-white'
          )}>
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
                    className={cn(
                      'text-lg font-display transition-colors',
                      isTransparent ? 'text-white hover:text-white/70' : 'text-pvl-black hover:text-pvl-slate'
                    )}
                  >
                    {t(item.label)}
                  </Link>
                ))}
              </div>

              <div className={cn(
                'border-t pt-6',
                isTransparent ? 'border-white/10' : 'border-pvl-black/8'
              )}>
                <p className="text-[0.625rem] uppercase tracking-[0.2em] text-pvl-stone font-medium mb-4">
                  {t('nav.categorie')}
                </p>
                <div className="flex flex-col gap-3">
                  {COLLECTION_TABS.map((tab) => (
                    <Link
                      key={tab.slug}
                      href={`/homme/${tab.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'text-sm transition-colors',
                        isTransparent ? 'text-white/70 hover:text-white' : 'text-pvl-slate hover:text-pvl-black'
                      )}
                    >
                      {t(tab.label)}
                    </Link>
                  ))}
                </div>
              </div>

              <div className={cn(
                'border-t pt-6',
                isTransparent ? 'border-white/10' : 'border-pvl-black/8'
              )}>
                <Link
                  href={user ? '/mon-compte' : '/connexion'}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 text-sm transition-colors',
                    isTransparent ? 'text-white/70 hover:text-white' : 'text-pvl-slate hover:text-pvl-black'
                  )}
                >
                  <User size={16} />
                  {t('nav.mon-compte')}
                </Link>
                <Link
                  href={user ? '/mon-compte/favoris' : '/connexion'}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 text-sm transition-colors mt-3',
                    isTransparent ? 'text-white/70 hover:text-white' : 'text-pvl-slate hover:text-pvl-black'
                  )}
                >
                  <Heart size={16} />
                  {t('nav.favoris')}
                </Link>
              </div>

              <div className={cn(
                'border-t pt-6',
                isTransparent ? 'border-white/10' : 'border-pvl-black/8'
              )}>
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
