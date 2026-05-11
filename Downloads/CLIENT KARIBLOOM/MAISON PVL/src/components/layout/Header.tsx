'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  User,
  Heart,
  Search,
  Menu,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useCart } from '@/store/cartStore';
import { CartDrawer } from '@/components/cart/CartDrawer';

interface HeaderProps {
  variant?: 'solid' | 'transparent';
}

const NAV_LINKS = [
  { label: 'Nouveautés', href: '/nouveautes' },
  { label: 'Vêtements', href: '/vetements' },
  { label: 'Chaussures', href: '/chaussures' },
  { label: 'Accessoires', href: '/accessoires' },
  { label: 'Collections', href: '/collections' },
];

const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  Nouveautés: 'oklch(92% 0.01 80)',
  Vêtements: 'oklch(90% 0.015 70)',
  Chaussures: 'oklch(88% 0.01 60)',
  Accessoires: 'oklch(86% 0.02 50)',
  Collections: 'oklch(84% 0.015 40)',
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: (from: 'left' | 'right') => ({
    x: from === 'left' ? '-100%' : '100%',
  }),
  visible: {
    x: 0,
    transition: { type: 'spring' as const, damping: 32, stiffness: 320 },
  },
  exit: (from: 'left' | 'right') => ({
    x: from === 'left' ? '-100%' : '100%',
    transition: { type: 'spring' as const, damping: 32, stiffness: 320 },
  }),
};

const linkUnderlineVariants = {
  idle: { scaleX: 0 },
  hovered: { scaleX: 1 },
};

const previewVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

export function Header({ variant = 'solid' }: HeaderProps) {
  const pathname = usePathname();
  const { itemCount, toggleCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const isTransparent = variant === 'transparent';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const count = itemCount();
  const effectiveSolid = isTransparent && scrolled;
  const textColor = isTransparent && !scrolled ? 'text-white' : 'text-pvl-black';
  const mutedColor =
    isTransparent && !scrolled
      ? 'text-white/60 hover:text-white'
      : 'text-pvl-slate hover:text-pvl-black';

  return (
    <>
      <header
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        className={cn(
          'z-50 transition-all duration-300',
          isTransparent ? 'fixed top-0 left-0 right-0' : 'sticky top-0',
          effectiveSolid || variant === 'solid'
            ? 'bg-pvl-white border-b'
            : 'bg-transparent',
          effectiveSolid || variant === 'solid'
            ? 'border-[oklch(90%_0_0)]'
            : 'border-transparent'
        )}
      >
        <div className="flex items-center justify-between h-14 md:h-16 px-5 md:px-8 max-w-[1440px] mx-auto">
          {/* LEFT: Hamburger + Search */}
          <div className="flex items-center gap-5 md:gap-6">
            <button
              onClick={() => setMenuOpen(true)}
              className={cn('transition-colors', mutedColor)}
              aria-label="Menu"
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
            <Link
              href="/recherche"
              className={cn(
                'hidden md:flex transition-colors',
                mutedColor
              )}
              aria-label="Recherche"
            >
              <Search size={20} strokeWidth={1.5} />
            </Link>
          </div>

          {/* CENTER: Logo */}
          <Link
            href="/"
            className={cn(
              'font-[family-name:var(--font-sans)] font-medium uppercase tracking-[0.25em] text-[0.8125rem] transition-colors',
              textColor
            )}
          >
            MAISON PVL
          </Link>

          {/* RIGHT: User + Heart + ShoppingBag */}
          <div className="flex items-center gap-5 md:gap-6">
            <Link
              href="/connexion"
              className={cn(
                'hidden md:flex transition-colors',
                mutedColor
              )}
              aria-label="Compte"
            >
              <User size={20} strokeWidth={1.5} />
            </Link>
            <Link
              href="/favoris"
              className={cn(
                'hidden md:flex transition-colors',
                mutedColor
              )}
              aria-label="Favoris"
            >
              <Heart size={20} strokeWidth={1.5} />
            </Link>
            <button
              onClick={toggleCart}
              className={cn('relative transition-colors', mutedColor)}
              aria-label="Panier"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {count > 0 && (
                <span
                  className={cn(
                    'absolute -top-1.5 -right-1.5 text-[0.625rem] leading-none font-medium w-[18px] h-[18px] flex items-center justify-center rounded-full',
                    isTransparent && !scrolled
                      ? 'bg-white text-pvl-black'
                      : 'bg-pvl-black text-pvl-white'
                  )}
                >
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for transparent header to prevent content jump */}
      {isTransparent && (
        <div className="h-14 md:h-16" />
      )}

      {/* HAMBURGER MENU — Framer Motion slide-in from left */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="menu-overlay"
              className="fixed inset-0 z-[60] bg-pvl-black/40"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Panel */}
            <motion.div
              key="menu-panel"
              ref={menuPanelRef}
              custom="left"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'fixed top-0 left-0 bottom-0 z-[61] flex flex-col overflow-y-auto',
                'bg-pvl-white',
                'w-full md:w-[420px]'
              )}
            >
              {/* Close button */}
              <div className="flex justify-end px-6 pt-6 pb-2">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-pvl-slate hover:text-pvl-black transition-colors"
                  aria-label="Fermer"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              {/* Navigation links with preview area */}
              <div className="flex-1 flex">
                <nav className="flex flex-col gap-6 px-6 py-8 flex-1">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      onMouseEnter={() => setHoveredLink(link.label)}
                      onMouseLeave={() => setHoveredLink(null)}
                      className="relative w-fit"
                    >
                      <span
                        className={cn(
                          'font-[family-name:var(--font-display)] font-normal text-pvl-black',
                          'text-[clamp(1.5rem,3vw,2rem)]'
                        )}
                      >
                        {link.label}
                      </span>
                      {/* Animated underline — left to right on hover */}
                      <motion.span
                        className="absolute bottom-0 left-0 h-px bg-pvl-black origin-left"
                        style={{ width: '100%' }}
                        variants={linkUnderlineVariants}
                        initial="idle"
                        animate={
                          hoveredLink === link.label ? 'hovered' : 'idle'
                        }
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </Link>
                  ))}
                </nav>

                {/* Desktop preview image — right half of panel */}
                <div className="hidden md:flex w-1/2 p-6 items-center justify-center">
                  <AnimatePresence mode="wait">
                    {hoveredLink && CATEGORY_PLACEHOLDERS[hoveredLink] ? (
                      <motion.div
                        key={hoveredLink}
                        variants={previewVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="w-full h-3/4 rounded-sm"
                        style={{
                          backgroundColor:
                            CATEGORY_PLACEHOLDERS[hoveredLink],
                        }}
                      />
                    ) : (
                      <motion.div
                        key="empty"
                        variants={previewVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="text-pvl-stone text-[0.6875rem] uppercase tracking-[0.2em]"
                      >
                        {hoveredLink === null
                          ? 'Survolez une categorie'
                          : ''}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CartDrawer />
    </>
  );
}
