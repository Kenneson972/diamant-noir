"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, Mail, Heart, User, Sparkles } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useLocale } from "@/contexts/LocaleContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";
import { SUPPORTED_LOCALES, SUPPORTED_CURRENCIES, type Locale, type Currency } from "@/lib/i18n";

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/", label: "Accueil" },
  { href: "/villas", label: "Nos villas" },
  { href: "/prestations", label: "Conciergerie" },
  { href: "/qui-sommes-nous", label: "À propos" },
  { href: "/contact", label: "Contact" },
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

  const navItems = NAV_ITEMS;

  const loginHref = "/login?redirect=/espace-client";

  const primaryCtaHref = "/prestations";
  const primaryCtaLabel = "Conciergerie";
  const primaryCtaAria = "Découvrir la conciergerie";

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
    return acquireBodyScrollLock();
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

  /**
   * Hero sombre sous la nav (vidéo, bg-navy, image pleine largeur) : chrome clair + barre transparente en haut.
   * Sans ça, `text-navy` sur vitrage au-dessus d’un fond sombre reste illisible (même encré #0A0A0A).
   *
   * `/villas` seul = bandeau navy → texte blanc OK. `/villas/[id]` = galerie + offwhite en tête → navy + vitrage,
   * sinon icônes blanches sur photo claire = invisibles.
   */
  const isDarkHeroRoute = useMemo(() => {
    const p = pathname ?? "";
    if (p === "/" || p === "/proprietaires") return true;
    if (p === "/book" || p.startsWith("/book/")) return true;
    if (p === "/contact") return true;
    if (p === "/villas") return true;
    if (p.startsWith("/villas/")) return false;
    if (p === "/soumettre-ma-villa") return true;
    if (p === "/prestations" || p.startsWith("/prestations/")) return true;
    if (p === "/qui-sommes-nous") return true;
    return false;
  }, [pathname]);

  /** Hub `/prestations` : pas de barre blanche au scroll (chrome clair sur fond sombre conservé). */
  const prestationsHubTransparentNav = pathname === "/prestations";

  useEffect(() => {
    setIsScrolled(typeof window !== "undefined" && window.scrollY > 24);
  }, [pathname]);

  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/login")) {
    return null;
  }

  /** Barre blanche au scroll — sauf hub Prestations. */
  const isSolid = isScrolled && !prestationsHubTransparentNav;
  /** En haut de page transparente : chrome « sombre » (texte blanc) uniquement sur hero noir ; sinon chrome lisible sur fond clair. */
  const useLightTransparentChrome = !isSolid && !isDarkHeroRoute;

  const routeActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const barText = isSolid || useLightTransparentChrome ? "text-navy" : "text-white";
  const utility =
    isSolid || useLightTransparentChrome
      ? "text-navy hover:text-navy/75"
      : "text-white hover:text-white/85";
  const utilityFocus =
    isSolid || useLightTransparentChrome
      ? "focus-visible:ring-navy/40"
      : "focus-visible:ring-white/60";
  const divider =
    isSolid || useLightTransparentChrome ? "bg-navy/20" : "bg-white/35";

  const logoVariant: "onLight" | "onDark" =
    !isSolid && isDarkHeroRoute ? "onDark" : "onLight";

  const primaryCtaSolidStyle =
    isSolid || useLightTransparentChrome
      ? "border-navy bg-navy text-white hover:bg-navy/90 focus-visible:ring-navy"
      : "border-white/90 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus-visible:ring-white";

  /** Pages fond clair : jamais `bg-transparent` seul (illisible) — léger vitrage ; hero sombre : vraie transparence. */
  const headerSurfaceClass = isSolid
    ? "border-b border-black/[0.06] bg-white/95 pb-2 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-none md:backdrop-blur-md pt-[calc(0.5rem+env(safe-area-inset-top,0px))]"
    : useLightTransparentChrome
      ? "border-b border-black/[0.06] bg-white/92 pb-3 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-none md:backdrop-blur-md pt-[calc(0.75rem+env(safe-area-inset-top,0px))] md:pb-4 md:pt-[calc(1rem+env(safe-area-inset-top,0px))]"
      : "border-b border-transparent bg-transparent pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] md:pb-4 md:pt-[calc(1rem+env(safe-area-inset-top,0px))]";

  return (
    <>
      {/* Overlay drawer — fond flouté façon vitrine luxe */}
      {menuOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-[1030] bg-black/50 backdrop-blur-none md:backdrop-blur-sm transition-opacity duration-300"
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
        className={`fixed inset-y-0 left-0 z-[1040] flex w-full max-w-[min(100vw,26rem)] flex-col bg-white shadow-[4px_0_40px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
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
            {navItems.map(({ href, label }) => {
              const active = routeActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={closeMenu}
                    className={`flex min-h-[44px] items-center px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-navy transition-colors ${
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
                  className={`flex min-h-[44px] items-center px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-navy transition-colors ${
                    routeActive("/espace-client") ? "bg-black/[0.06]" : "hover:bg-black/[0.04]"
                  }`}
                >
                  Espace client
                </Link>
              </li>
            ) : null}
            <li className="pt-2">
              <Link
                href={primaryCtaHref}
                onClick={closeMenu}
                className="mx-4 flex min-h-[44px] items-center justify-center border border-navy bg-navy px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-colors hover:bg-navy/90"
              >
                {primaryCtaLabel}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="border-t border-black/8 bg-[#f4f4f4] px-5 pt-6 text-[13px] leading-relaxed text-navy/75" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
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
        className={`fixed top-0 z-[1020] w-full transition-[background,box-shadow,padding,border-color] duration-300 ${headerSurfaceClass}`}
      >
        {/*
          Deux demi-ranges flexibles (1fr / 1fr) + colonne centrale auto : le logo reste
          au centre *de l’écran*, même si la rangée droite est plus chargée que le menu.
          L’ancien auto–1fr–auto poussait le wordmark sous le hamburger (traits sur le « D »).
        */}
        <div className="mx-auto grid min-h-10 max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 px-3 sm:gap-x-4 sm:px-6">
          <div className="flex min-w-0 items-center justify-start">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={`flex h-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-md sm:min-w-0 sm:justify-start sm:gap-2 ${barText} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${utilityFocus} focus-visible:ring-offset-0`}
              aria-expanded={menuOpen}
              aria-controls="site-nav-drawer"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <Menu size={22} strokeWidth={1.25} aria-hidden className="shrink-0" />
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.35em] sm:inline">
                Menu
              </span>
            </button>
          </div>

          <div className="relative z-[1030] flex min-w-0 max-w-[calc(100vw-8rem)] justify-center px-1 sm:max-w-[calc(100vw-13rem)] sm:px-2 md:max-w-[calc(100vw-20rem)] lg:max-w-none">
            <BrandLogo
              variant={logoVariant}
              size="nav"
              showIcon
              showWordmark={false}
              priority={pathname === "/"}
              className="shrink-0 justify-center"
            />
          </div>

          {/*
            Barre : jamais de numéro en texte ici (largeur fixe → wrap / chevauchement logo sur tablette).
            Appel : icône seule (sm+) + numéro lisible dans le menu / footer. Touch 44px (kb-mobile-responsive).
          */}
          <div className="flex min-w-0 items-center justify-end gap-0.5 overflow-x-clip min-[400px]:gap-1 sm:gap-2 md:gap-4">
            <a
              href={CONCIERGE_TEL_HREF}
              title={CONCIERGE_TEL}
              className={`tap-target hidden h-10 w-10 shrink-0 items-center justify-center sm:flex sm:h-11 sm:w-11 ${utility} focus:outline-none focus-visible:ring-2 ${utilityFocus}`}
              aria-label={`Appeler le ${CONCIERGE_TEL}`}
            >
              <Phone size={20} strokeWidth={1.25} aria-hidden />
            </a>

            <span className={`hidden h-3 w-px shrink-0 md:block ${divider}`} aria-hidden />

            <Link
              href="/villas"
              className={`tap-target relative hidden h-10 w-10 shrink-0 items-center justify-center transition-opacity sm:flex sm:h-11 sm:w-11 ${utility} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${utilityFocus} focus-visible:ring-offset-0`}
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
                    isSolid || useLightTransparentChrome
                      ? "bg-navy ring-white"
                      : "bg-white ring-black/20"
                  }`}
                  aria-hidden
                />
              ) : null}
            </Link>

            <Link
              href={loginHref}
              className={`tap-target flex h-9 w-9 shrink-0 items-center justify-center transition-opacity min-[400px]:h-10 min-[400px]:w-10 sm:h-11 sm:w-11 ${utility} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${utilityFocus} focus-visible:ring-offset-0`}
              aria-label="Connexion / Inscription"
            >
              <User size={20} strokeWidth={1.25} aria-hidden />
            </Link>

            <Link
              href={primaryCtaHref}
              aria-label={primaryCtaAria}
              className={`tap-target flex h-9 w-9 shrink-0 items-center justify-center border text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-11 sm:w-11 md:h-auto md:w-auto md:max-w-none md:px-5 md:py-2 md:text-[10px] md:font-bold md:uppercase md:leading-snug md:tracking-[0.22em] ${primaryCtaSolidStyle}`}
            >
              <Sparkles size={18} strokeWidth={1.25} className="md:hidden" aria-hidden />
              <span className="hidden md:inline">{primaryCtaLabel}</span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};
