"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, Mail, Heart, User } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useLocale } from "@/contexts/LocaleContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { SUPPORTED_LOCALES, SUPPORTED_CURRENCIES, type Locale, type Currency } from "@/lib/i18n";

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/", label: "Accueil" },
  { href: "/villas", label: "Nos villas" },
  { href: "/prestations", label: "Prestations" },
  { href: "/qui-sommes-nous", label: "À propos" },
  { href: "/contact", label: "Contact" },
  { href: "/proprietaires", label: "Propriétaires" },
];

const CONCIERGE_TEL = "+596 96 00 00 00";
const CONCIERGE_TEL_HREF = "tel:+59696000000";

export const Navbar = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const supabase = getSupabaseBrowser();
  const { locale, setLocale, currency, setCurrency } = useLocale();
  const { count: wishlistCount } = useWishlist();

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
      return () => subscription.unsubscribe();
    }
  }, [supabase]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/login")) {
    return null;
  }

  const isTransparentPage = pathname === "/";
  const isSolid = !isTransparentPage || isScrolled;

  const routeActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const barText = isSolid ? "text-navy" : "text-white";
  const utility = isSolid ? "text-navy hover:text-navy/75" : "text-white hover:text-white/85";
  const utilityFocus = isSolid
    ? "focus-visible:ring-navy/40"
    : "focus-visible:ring-white/60";
  const divider = isSolid ? "bg-navy/20" : "bg-white/35";

  return (
    <>
      {/* Overlay drawer — fond flouté façon vitrine luxe */}
      {menuOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-[55] bg-black/45 backdrop-blur-sm transition-opacity duration-300"
          onClick={closeMenu}
        />
      ) : null}

      {/* Panneau latéral — même pattern mobile & desktop */}
      <aside
        id="site-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        inert={!menuOpen ? true : undefined}
        className={`fixed inset-y-0 left-0 z-[60] flex w-full max-w-[min(100vw,26rem)] flex-col bg-white shadow-[4px_0_40px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          menuOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-end border-b border-black/6 px-4 py-3">
          <button
            type="button"
            onClick={closeMenu}
            className="tap-target flex h-11 w-11 items-center justify-center text-navy transition-colors hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            aria-label="Fermer le menu"
          >
            <X size={22} strokeWidth={1.25} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Navigation principale">
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = routeActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={closeMenu}
                    className={`block px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-navy transition-colors ${
                      active ? "bg-black/[0.06]" : "hover:bg-black/[0.04]"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
            {session ? (
              <li>
                <Link
                  href="/espace-client"
                  onClick={closeMenu}
                  className={`block px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-navy transition-colors ${
                    routeActive("/espace-client") ? "bg-black/[0.06]" : "hover:bg-black/[0.04]"
                  }`}
                >
                  Espace client
                </Link>
              </li>
            ) : null}
            <li className="pt-2">
              <Link
                href="/book"
                onClick={closeMenu}
                className="mx-4 block border border-navy bg-navy px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-colors hover:bg-navy/90"
              >
                Réserver
              </Link>
            </li>
          </ul>
        </nav>

        <div className="border-t border-black/8 bg-[#f4f4f4] px-5 py-6 text-[13px] leading-relaxed text-navy/75">
          <div className="flex gap-3">
            <Phone size={18} strokeWidth={1.25} className="mt-0.5 shrink-0 text-navy/45" aria-hidden />
            <div>
              <p>
                Nos conseillers vous répondent au{" "}
                <a href={CONCIERGE_TEL_HREF} className="text-navy underline-offset-4 hover:underline">
                  {CONCIERGE_TEL}
                </a>
              </p>
              <p className="mt-1 text-[12px] text-navy/50">
                Lun. au sam. · 9h30 – 18h30 (heure de Paris)
              </p>
            </div>
          </div>
          <Link
            href="/contact"
            onClick={closeMenu}
            className="mt-5 inline-flex items-center gap-2 text-[12px] font-medium text-navy underline-offset-4 hover:underline"
          >
            <Mail size={16} strokeWidth={1.25} className="text-navy/45" aria-hidden />
            Contactez-nous
          </Link>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-black/8 pt-5">
            <label className="sr-only" htmlFor="drawer-locale">
              Langue
            </label>
            <select
              id="drawer-locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="min-h-11 flex-1 rounded-none border border-black/15 bg-white px-3 py-2 text-[11px] uppercase tracking-wider text-navy focus:outline-none focus:ring-1 focus:ring-navy"
            >
              {SUPPORTED_LOCALES.map((l) => (
                <option key={l} value={l}>
                  {l === "fr" ? "Français" : l === "en" ? "English" : "Español"}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="drawer-currency">
              Devise
            </label>
            <select
              id="drawer-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="min-h-11 flex-1 rounded-none border border-black/15 bg-white px-3 py-2 text-[11px] uppercase tracking-wider text-navy focus:outline-none focus:ring-1 focus:ring-navy"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      {/* Barre supérieure — logo centré, menu à gauche, CTA à droite */}
      <header
        className={`fixed top-0 z-50 w-full transition-[background,box-shadow,padding] duration-300 ${
          isSolid
            ? "border-b border-black/[0.06] bg-white/95 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md"
            : "bg-transparent py-4 md:py-5"
        }`}
      >
        <div className="relative mx-auto flex h-12 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={`tap-target relative z-10 flex shrink-0 items-center gap-2 ${barText}`}
            aria-expanded={menuOpen}
            aria-controls="site-nav-drawer"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <Menu size={22} strokeWidth={1.25} aria-hidden />
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.35em] sm:inline">
              Menu
            </span>
          </button>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-24 sm:px-32">
            <div className="pointer-events-auto">
              <BrandLogo
                variant={isSolid ? "onLight" : "onDark"}
                size="md"
                showIcon={false}
                priority={pathname === "/"}
              />
            </div>
          </div>

          {/* Rangée utilitaire type vitrine : téléphone | favoris | compte | réserver (sans « Obtenir l’app ») */}
          <div className="relative z-10 flex min-w-0 shrink-0 items-center justify-end gap-2 sm:gap-3 md:gap-4">
            <a
              href={CONCIERGE_TEL_HREF}
              className={`tap-target hidden items-center text-[12px] font-medium tracking-[0.02em] transition-colors md:inline-flex ${utility} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${utilityFocus} focus-visible:ring-offset-0`}
            >
              {CONCIERGE_TEL}
            </a>
            <a
              href={CONCIERGE_TEL_HREF}
              className={`tap-target flex h-11 w-11 items-center justify-center md:hidden ${utility} focus:outline-none focus-visible:ring-2 ${utilityFocus}`}
              aria-label={`Appeler le ${CONCIERGE_TEL}`}
            >
              <Phone size={20} strokeWidth={1.25} aria-hidden />
            </a>

            <span
              className={`hidden h-3 w-px shrink-0 sm:block ${divider}`}
              aria-hidden
            />

            <Link
              href="/villas"
              className={`tap-target relative flex h-11 w-11 items-center justify-center transition-opacity ${utility} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${utilityFocus} focus-visible:ring-offset-0`}
              aria-label={
                wishlistCount > 0
                  ? `Favoris, ${wishlistCount} villa${wishlistCount > 1 ? "s" : ""}`
                  : "Favoris"
              }
            >
              <Heart size={20} strokeWidth={1.25} aria-hidden />
              {wishlistCount > 0 ? (
                <span
                  className={`absolute right-1 top-1.5 h-2 w-2 rounded-full ring-2 ${
                    isSolid ? "bg-navy ring-white" : "bg-white ring-black/20"
                  }`}
                  aria-hidden
                />
              ) : null}
            </Link>

            <Link
              href="/login?redirect=/espace-client"
              className={`tap-target flex h-11 w-11 items-center justify-center transition-opacity ${utility} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${utilityFocus} focus-visible:ring-offset-0`}
              aria-label="Connexion / Inscription"
            >
              <User size={20} strokeWidth={1.25} aria-hidden />
            </Link>

            <Link
              href="/book"
              className={`tap-target shrink-0 border px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:px-5 sm:text-[10px] sm:tracking-[0.22em] ${
                isSolid
                  ? "border-navy bg-navy text-white hover:bg-navy/90 focus-visible:ring-navy"
                  : "border-white/90 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus-visible:ring-white"
              }`}
            >
              Réserver
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};
