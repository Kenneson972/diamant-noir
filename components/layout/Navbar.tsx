"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, Mail, User, Sparkles } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useLocale } from "@/contexts/LocaleContext";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";
import { SUPPORTED_LOCALES, SUPPORTED_CURRENCIES, type Locale, type Currency } from "@/lib/i18n";

const NAV_KEYS: { href: string; key: string }[] = [
  { href: "/", key: "nav.home" },
  { href: "/prestations", key: "nav.prestations" },
  { href: "/villas", key: "nav.villas" },
  { href: "/faq", key: "nav.faq" },
  { href: "/qui-sommes-nous", key: "nav.about" },
  { href: "/contact", key: "nav.contact" },
];

const CONCIERGE_TEL = "+596 96 00 00 00";
const CONCIERGE_TEL_HREF = "tel:+59696000000";

/** Aligné avec `BrandLogo` (`wrapClass` + `className` nav). */
const NAVBAR_BRAND_HOME_LINK_CLASSES =
  "inline-flex items-center gap-2 md:gap-3 shrink-0 justify-center";

export function Navbar({ isDevelopment }: { isDevelopment: boolean }) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const supabase = getSupabaseBrowser();
  const { locale, setLocale, currency, setCurrency, t } = useLocale();

  const navItems = NAV_KEYS.map(({ href, key }) => ({ href, label: t(key) }));
  const navItemsNoHome = navItems.filter(({ href }) => href !== "/");
  const navLeft = navItemsNoHome.slice(0, 3);
  const navRight = navItemsNoHome.slice(3);

  const loginHref = "/login?redirect=/espace-client";

  const primaryCtaHref = "/soumettre-ma-villa";
  const primaryCtaLabel = t("nav.submit_villa");
  const primaryCtaAria = t("nav.submit_villa");

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
        setSession(session);
      });
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
        setSession(session);
      });
      return () => subscription.unsubscribe();
    }
  }, [supabase]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Scroll lock quand le drawer est ouvert
  useEffect(() => {
    if (!menuOpen) return;
    return acquireBodyScrollLock();
  }, [menuOpen]);

  // Escape key ferme le drawer
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
    if (p === "/") return true;
    if (p === "/book" || p.startsWith("/book/")) return true;
    if (p === "/contact") return true;
    if (p === "/villas") return true;
    if (p.startsWith("/villas/")) return false;
    if (p === "/soumettre-ma-villa") return true;
    if (p === "/prestations" || p.startsWith("/prestations/")) return true;
    if (p === "/qui-sommes-nous") return true;
    if (p === "/faq") return true;
    if (p === "/confidentialite") return true;
    if (p === "/terms") return true;
    if (p === "/cookies") return true;
    return false;
  }, [pathname]);

  /** Hub `/prestations` : pas de barre blanche au scroll (chrome clair sur fond sombre conservé). */
  const prestationsHubTransparentNav = pathname === "/prestations";

  useEffect(() => {
    setIsScrolled(typeof window !== "undefined" && window.scrollY > 24);
  }, [pathname]);

  if (
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/espace-client")
  ) {
    return null;
  }

  /** Barre blanche au scroll — sauf hub Prestations. */
  const isSolid = isScrolled && !prestationsHubTransparentNav;
  /** En haut de page transparente : chrome « sombre » (texte blanc) uniquement sur hero noir ; sinon chrome lisible sur fond clair. */
  const useLightTransparentChrome = !isSolid && !isDarkHeroRoute;
  const navLinkActiveColor = isSolid || useLightTransparentChrome ? "text-navy" : "text-white";
  const navLinkInactiveColor = isSolid || useLightTransparentChrome
    ? "text-navy/55 hover:text-navy"
    : "text-white/60 hover:text-white";

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
          className="fixed inset-0 z-[1030] bg-navy/50 backdrop-blur-none md:backdrop-blur-sm transition-opacity duration-300"
          onClick={closeMenu}
        />
      ) : null}

      {/* Panneau latéral — même pattern mobile & desktop */}
      <aside
        id="site-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        hidden={!menuOpen}
        className={`fixed inset-y-0 left-0 z-[1040] flex w-full max-w-[min(calc(100vw-env(safe-area-inset-left,0px)),26rem)] flex-col bg-white shadow-[4px_0_40px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          menuOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-end border-b border-black/6 px-4 py-3">
          <button
            type="button"
            onClick={closeMenu}
            className="tap-target flex h-11 w-11 items-center justify-center text-navy transition-colors hover:bg-navy/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
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
                      active ? "bg-navy/[0.06]" : "hover:bg-navy/[0.04]"
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
                    routeActive("/espace-client") ? "bg-navy/[0.06]" : "hover:bg-navy/[0.04]"
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

        <div className="border-t border-black/8 bg-navy/[0.03] px-5 pt-6 text-[13px] leading-relaxed text-navy/75" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
          <div className="flex gap-3">
            <Phone size={18} strokeWidth={1.25} className="mt-0.5 shrink-0 text-navy/45" aria-hidden />
            <div>
              <p>
                {t("nav.advisors")}{" "}
                <a href={CONCIERGE_TEL_HREF} className="text-navy underline-offset-4 hover:underline">
                  {CONCIERGE_TEL}
                </a>
              </p>
              <p className="mt-1 text-[12px] text-navy/50">
                {t("nav.hours")}
              </p>
            </div>
          </div>
          <Link
            href="/contact"
            onClick={closeMenu}
            className="mt-5 inline-flex items-center gap-2 text-[12px] font-medium text-navy underline-offset-4 hover:underline"
          >
            <Mail size={16} strokeWidth={1.25} className="text-navy/45" aria-hidden />
            {t("nav.contact_us")}
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

      {/* Barre supérieure — logo centré parfaitement via grid symétrique */}
      <header
        className={`fixed top-0 z-[1020] w-full transition-[background,box-shadow,border-color] duration-300 ${headerSurfaceClass}`}
      >
        <div className="mx-auto grid min-h-10 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-3 sm:px-6">
          {/* Gauche : burger (mobile) + nav gauche (desktop) */}
          <div className="flex items-center gap-3 lg:gap-5">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={`md:hidden flex h-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md ${barText} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${utilityFocus}`}
              aria-expanded={menuOpen}
              aria-controls="site-nav-drawer"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <Menu size={22} strokeWidth={1.25} aria-hidden className="shrink-0" />
            </button>
            <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-5 lg:gap-7">
              {navLeft.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-[10px] font-semibold uppercase tracking-[0.22em] whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 ${utilityFocus} ${routeActive(href) ? navLinkActiveColor : navLinkInactiveColor}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Centre : logo parfaitement centré */}
          <div className="flex justify-center">
            <BrandLogo
              variant={logoVariant}
              size="nav"
              showIcon
              showWordmark={false}
              linkAriaLabel="Accueil"
              priority={pathname === "/"}
              className="shrink-0"
            />
          </div>

          {/* Droite : nav droite (desktop) + icônes utilitaires + CTA */}
          <div className="flex items-center justify-end gap-1 sm:gap-2 md:gap-4">
            <nav className="hidden md:flex items-center gap-5 lg:gap-7">
              {navRight.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-[10px] font-semibold uppercase tracking-[0.22em] whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 ${utilityFocus} ${routeActive(href) ? navLinkActiveColor : navLinkInactiveColor}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <span className={`hidden h-3 w-px shrink-0 md:block ${divider}`} aria-hidden />
            <a
              href={CONCIERGE_TEL_HREF}
              title={CONCIERGE_TEL}
              className={`tap-target hidden h-10 w-10 shrink-0 items-center justify-center lg:flex lg:h-11 lg:w-11 ${utility} focus:outline-none focus-visible:ring-2 ${utilityFocus}`}
              aria-label={`Appeler le ${CONCIERGE_TEL}`}
            >
              <Phone size={20} strokeWidth={1.25} aria-hidden />
            </a>

            <span className={`hidden h-3 w-px shrink-0 md:block ${divider}`} aria-hidden />

            <Link
              href={loginHref}
              className={`tap-target flex h-11 w-11 shrink-0 items-center justify-center transition-opacity sm:h-11 sm:w-11 ${utility} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${utilityFocus}`}
              aria-label="Connexion / Inscription"
            >
              <User size={20} strokeWidth={1.25} aria-hidden />
            </Link>

            <Link
              href={primaryCtaHref}
              aria-label={primaryCtaAria}
              className={`tap-target flex h-11 w-11 shrink-0 items-center justify-center border text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-11 sm:w-11 lg:h-auto lg:w-auto lg:px-5 lg:py-2 lg:text-[10px] lg:font-bold lg:uppercase lg:leading-snug lg:tracking-[0.22em] ${primaryCtaSolidStyle}`}
            >
              <Sparkles size={18} strokeWidth={1.25} className="lg:hidden" aria-hidden />
              <span className="hidden lg:inline">{primaryCtaLabel}</span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
