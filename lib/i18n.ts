export const SUPPORTED_LOCALES = ["fr", "en", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export const SUPPORTED_CURRENCIES = ["EUR", "USD"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
export const DEFAULT_CURRENCY: Currency = "EUR";

const EUR_TO_USD = 1.08;

export function formatPrice(amount: number, currency: Currency = "EUR"): string {
  const value = currency === "USD" ? amount * EUR_TO_USD : amount;
  const formatted = new Intl.NumberFormat(currency === "USD" ? "en-US" : "fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
  return currency === "USD" ? `${formatted} $` : `${formatted} €`;
}

export function convertPrice(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  if (from === "EUR" && to === "USD") return amount * EUR_TO_USD;
  return amount / EUR_TO_USD;
}

const translations: Record<Locale, Record<string, string>> = {
  fr: {
    "nav.home": "Accueil",
    "nav.villas": "Nos Villas",
    "nav.prestations": "Prestations",
    "nav.about": "Qui sommes-nous",
    "nav.contact": "Contact",
    "nav.book": "Réserver",
    "footer.explore": "Explorer",
    "footer.support": "Support",
    "footer.submit_villa": "Soumettre ma villa",
    "footer.contact_faq": "Contact & FAQ",
    "footer.terms": "Conditions d'utilisation",
    "footer.privacy": "Politique de confidentialité",
    "footer.cookies": "Gestion des cookies",
  },
  en: {
    "nav.home": "Home",
    "nav.villas": "Our Villas",
    "nav.prestations": "Services",
    "nav.about": "About us",
    "nav.contact": "Contact",
    "nav.book": "Book",
    "footer.explore": "Explore",
    "footer.support": "Support",
    "footer.submit_villa": "Submit my villa",
    "footer.contact_faq": "Contact & FAQ",
    "footer.terms": "Terms of use",
    "footer.privacy": "Privacy policy",
    "footer.cookies": "Cookie policy",
  },
  es: {
    "nav.home": "Inicio",
    "nav.villas": "Nuestras Villas",
    "nav.prestations": "Servicios",
    "nav.about": "Quiénes somos",
    "nav.contact": "Contacto",
    "nav.book": "Reservar",
    "footer.explore": "Explorar",
    "footer.support": "Soporte",
    "footer.submit_villa": "Enviar mi villa",
    "footer.contact_faq": "Contacto y FAQ",
    "footer.terms": "Condiciones de uso",
    "footer.privacy": "Política de privacidad",
    "footer.cookies": "Política de cookies",
  },
};

export function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
}
