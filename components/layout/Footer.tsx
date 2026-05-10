"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { useHomeAudience } from "@/contexts/HomeAudienceContext";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SUPPORTED_LOCALES, SUPPORTED_CURRENCIES, type Locale, type Currency } from "@/lib/i18n";

export const Footer = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, currency, setCurrency, t } = useLocale();
  const { audience, clearAudience } = useHomeAudience();

  if (
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/espace-client")
  ) {
    return null;
  }

  return (
    <footer className="border-t border-black/10 bg-white py-12 text-navy md:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">

        {/* ──── Desktop: grille 4 colonnes ──── */}
        <div className="hidden md:grid md:grid-cols-4 md:gap-10 lg:gap-14">

          {/* Colonne 1 : Logo + description */}
          <div className="flex flex-col items-start gap-4">
            <BrandLogo variant="onLight" size="sm" />
            <p className="text-sm leading-relaxed text-navy/55">
              {audience === "proprietaire" ? (
                "Conciergerie haut de gamme en Martinique : valorisation de biens d'exception et relation voyageurs pour les propriétaires qui exigent sérénité et exigence."
              ) : (
                "Un sanctuaire côtier exclusif conçu pour ceux qui recherchent la rareté, la tranquillité et une élégance raffinée."
              )}
            </p>
          </div>

          <NavColumn title={t("footer.explore")} delay={60}>
            {audience === "proprietaire" ? (
              <>
                <NavItem href="/soumettre-ma-villa">{t("footer.submit_villa")}</NavItem>
                <NavItem href="/prestations">{t("nav.prestations")}</NavItem>
                <NavItem href="/villas">Locations (catalogue)</NavItem>
                <NavItem href="/qui-sommes-nous">{t("nav.about")}</NavItem>
              </>
            ) : (
              <>
                <NavItem href="/villas">{t("nav.villas")}</NavItem>
                <NavItem href="/prestations">{t("nav.prestations")}</NavItem>
                <NavItem href="/qui-sommes-nous">{t("nav.about")}</NavItem>
                {audience !== "voyageur" && <NavItem href="/soumettre-ma-villa">{t("footer.submit_villa")}</NavItem>}
              </>
            )}
          </NavColumn>
          <NavColumn title={t("footer.support")} delay={120}>
            <NavItem href="/contact">{t("footer.contact")}</NavItem>
            <NavItem href="/faq">{t("footer.faq")}</NavItem>
            <NavItem href="/terms">{t("footer.terms")}</NavItem>
          </NavColumn>
          <NavColumn title="Suivez-nous" delay={180}>
            <SocialLinks />
            <div className="mt-6">
              <h5 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">Langue / Devise</h5>
              <LocaleCurrencySelectors locale={locale} setLocale={setLocale} currency={currency} setCurrency={setCurrency} />
            </div>
          </NavColumn>
        </div>

        {/* ──── Mobile ──── */}
        <div className="md:hidden">
          <div className="mb-10 flex flex-col items-center space-y-4">
            <BrandLogo variant="onLight" size="sm" className="mx-auto" />
            <p className="max-w-xs text-center text-xs leading-relaxed text-navy/55">
              {audience === "proprietaire" ? (
                "Conciergerie haut de gamme en Martinique : valorisation de biens d'exception et relation voyageurs pour les propriétaires qui exigent sérénité et exigence."
              ) : (
                "Un sanctuaire côtier exclusif conçu pour ceux qui recherchent la rareté, la tranquillité et une élégance raffinée."
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">{t("footer.explore")}</h4>
              <ul className="space-y-2 text-sm text-navy/65">
                {audience === "proprietaire" ? (
                  <>
                    <li><MobileLink href="/soumettre-ma-villa">{t("footer.submit_villa")}</MobileLink></li>
                    <li><MobileLink href="/prestations">{t("nav.prestations")}</MobileLink></li>
                    <li><MobileLink href="/villas">Locations (catalogue)</MobileLink></li>
                    <li><MobileLink href="/qui-sommes-nous">{t("nav.about")}</MobileLink></li>
                  </>
                ) : (
                  <>
                    <li><MobileLink href="/villas">{t("nav.villas")}</MobileLink></li>
                    <li><MobileLink href="/prestations">{t("nav.prestations")}</MobileLink></li>
                    <li><MobileLink href="/qui-sommes-nous">{t("nav.about")}</MobileLink></li>
                    {audience !== "voyageur" && <li><MobileLink href="/soumettre-ma-villa">{t("footer.submit_villa")}</MobileLink></li>}
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">{t("footer.support")}</h4>
              <ul className="space-y-2 text-sm text-navy/65">
                <li><MobileLink href="/contact">{t("footer.contact")}</MobileLink></li>
                <li><MobileLink href="/faq">{t("footer.faq")}</MobileLink></li>
                <li><MobileLink href="/terms">{t("footer.terms")}</MobileLink></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-black/10 pt-6">
            <h4 className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">Suivez-nous</h4>
            <div className="flex items-center justify-center gap-3">
              <SocialLinks />
            </div>
            <div className="mt-5 text-center">
              <h5 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">Langue / Devise</h5>
              <div className="flex justify-center">
                <LocaleCurrencySelectors locale={locale} setLocale={setLocale} currency={currency} setCurrency={setCurrency} />
              </div>
            </div>
          </div>
        </div>

        {/* ──── Mobile: grille 2×2 ──── */}
        <div className="md:hidden">
          {/* Row 1: Explorer (gauche) | Assistance (droite) */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">{t("footer.explore")}</h4>
              <ul className="space-y-2 text-sm text-navy/65">
                {audience === "proprietaire" ? (
                  <>
                    <li><MobileLink href="/soumettre-ma-villa">{t("footer.submit_villa")}</MobileLink></li>
                    <li><MobileLink href="/prestations">{t("nav.prestations")}</MobileLink></li>
                    <li><MobileLink href="/villas">Locations (catalogue)</MobileLink></li>
                    <li><MobileLink href="/qui-sommes-nous">{t("nav.about")}</MobileLink></li>
                  </>
                ) : (
                  <>
                    <li><MobileLink href="/villas">{t("nav.villas")}</MobileLink></li>
                    <li><MobileLink href="/prestations">{t("nav.prestations")}</MobileLink></li>
                    <li><MobileLink href="/qui-sommes-nous">{t("nav.about")}</MobileLink></li>
                    {audience !== "voyageur" && <li><MobileLink href="/soumettre-ma-villa">{t("footer.submit_villa")}</MobileLink></li>}
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">{t("footer.support")}</h4>
              <ul className="space-y-2 text-sm text-navy/65">
                <li><MobileLink href="/contact">{t("footer.contact")}</MobileLink></li>
                <li><MobileLink href="/faq">{t("footer.faq")}</MobileLink></li>
                <li><MobileLink href="/terms">{t("footer.terms")}</MobileLink></li>
              </ul>
            </div>
          </div>

          {/* Row 2: Réseaux + Langue centrés */}
          <div className="mt-8 border-t border-black/10 pt-6">
            <h4 className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">Suivez-nous</h4>
            <div className="flex items-center justify-center gap-3">
              <SocialLinks />
            </div>
            <div className="mt-5 text-center">
              <h5 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">Langue / Devise</h5>
              <div className="flex justify-center">
                <LocaleCurrencySelectors locale={locale} setLocale={setLocale} currency={currency} setCurrency={setCurrency} />
              </div>
            </div>
          </div>
        </div>

        {/* ──── Changer de parcours ──── */}
        {(audience === "voyageur" || audience === "proprietaire") && (
          <div className="mt-10 flex justify-center border-t border-black/10 pt-6 md:mt-12 md:pt-8">
            <button
              type="button"
              onClick={() => { clearAudience(); router.push("/"); }}
              className="text-[10px] font-medium uppercase tracking-[0.22em] text-navy/35 underline-offset-4 transition-colors hover:text-navy/55"
            >
              Changer de parcours
            </button>
          </div>
        )}

        {/* ──── Barre du bas ──── */}
        <div className="mt-10 border-t border-black/10 pt-6 text-center text-[9px] uppercase tracking-[0.12em] text-navy/35 md:mt-12 md:flex md:items-center md:justify-between md:text-left md:text-[10px]">
          <p>© 2026 Kayvila. Tous droits réservés.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 md:mt-0 md:justify-end">
            <Link href="/mentions-legales" className="transition-colors hover:text-black/70">Mentions légales</Link>
            <Link href="/cgv" className="transition-colors hover:text-black/70">CGV</Link>
            <Link href="/confidentialite" className="transition-colors hover:text-black/70">Confidentialité</Link>
            <Link href="/cookies" className="transition-colors hover:text-black/70">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ── Sous-composants ── */

function NavColumn({ title, delay, children }: { title: string; delay: number; children: React.ReactNode }) {
  return (
    <ScrollReveal delay={delay}>
      <div>
        <h4 className="mb-6 text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">{title}</h4>
        <ul className="space-y-3 text-sm text-navy/65">{children}</ul>
      </div>
    </ScrollReveal>
  );
}

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="block transition-colors hover:text-black">{children}</Link>
    </li>
  );
}

function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-block py-1 transition-colors hover:text-black">{children}</Link>
  );
}

function SocialLinks() {
  return (
    <>
      <a href="https://instagram.com/kayvila_villas" target="_blank" rel="noopener noreferrer" aria-label="Instagram Kayvila" className="inline-flex h-9 w-9 items-center justify-center border border-black/10 text-navy/50 transition-colors hover:border-black hover:text-black">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
      </a>
      <a href="https://wa.me/33600000000" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Kayvila" className="inline-flex h-9 w-9 items-center justify-center border border-black/10 text-navy/50 transition-colors hover:border-black hover:text-black">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
      </a>
      <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook Kayvila" className="inline-flex h-9 w-9 items-center justify-center border border-black/10 text-navy/50 transition-colors hover:border-black hover:text-black">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
      </a>
    </>
  );
}

function LocaleCurrencySelectors({
  locale, setLocale, currency, setCurrency,
}: {
  locale: string; setLocale: (l: Locale) => void; currency: string; setCurrency: (c: Currency) => void;
}) {
  return (
    <div className="flex gap-1.5">
      <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)} className="min-h-9 rounded-none border border-black/15 bg-offwhite px-2 text-[11px] text-navy focus:outline-none focus:ring-1 focus:ring-black" aria-label="Langue">
        {SUPPORTED_LOCALES.map((l) => (<option key={l} value={l}>{l === "fr" ? "FR" : l === "en" ? "EN" : "ES"}</option>))}
      </select>
      <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="min-h-9 rounded-none border border-black/15 bg-offwhite px-2 text-[11px] text-navy focus:outline-none focus:ring-1 focus:ring-black" aria-label="Devise">
        {SUPPORTED_CURRENCIES.map((c) => (<option key={c} value={c}>{c}</option>))}
      </select>
    </div>
  );
}
