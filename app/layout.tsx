import "./globals.css";
import type { Metadata } from "next";
import { Sora, Instrument_Sans, Playfair_Display } from "next/font/google";
import { cookies } from "next/headers";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { CompareBar } from "@/components/villas/CompareBar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatbotDynamic } from "@/components/chatbot/ChatbotDynamic";
import { SUPPORTED_LOCALES, SUPPORTED_CURRENCIES, DEFAULT_LOCALE, DEFAULT_CURRENCY, type Locale, type Currency } from "@/lib/i18n";
import CookieConsent from "@/components/ui/CookieConsent";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

const siteUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : "https://kayvila.com";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("dn_locale")?.value ?? "fr";
  const ogLocale = localeCookie === "en" ? "en_US" : localeCookie === "es" ? "es_ES" : "fr_FR";
  const title = localeCookie === "en"
    ? "Kayvila | Premium Concierge Martinique"
    : localeCookie === "es"
    ? "Kayvila | Conserjería de alto standing Martinica"
    : "Kayvila | Conciergerie de standing Martinique";
  const description = localeCookie === "en"
    ? "Premium concierge in Martinique. Exceptional villas, online booking, maintenance and management. Diamond Rock, Sun Beach."
    : localeCookie === "es"
    ? "Conserjería de alto standing en Martinica. Villas excepcionales, reserva en línea, mantenimiento y gestión."
    : "Conciergerie de standing en Martinique. Villas d'exception, réservation en ligne, entretien et gestion. Rocher du Diamant, plages du Soleil.";

  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: "%s | Kayvila" },
    description,
    openGraph: {
      type: "website",
      locale: ogLocale,
      siteName: "Kayvila",
      url: "https://kayvila.com",
      title,
      description,
      images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.jpg"],
    },
    alternates: {
      canonical: "https://kayvila.com",
      languages: {
        fr: "/",
        en: "/en",
        es: "/es",
      },
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDevelopment = process.env.NODE_ENV === "development";

  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("dn_locale")?.value ?? "";
  const currencyCookie = cookieStore.get("dn_currency")?.value ?? "";
  const initialLocale: Locale = (SUPPORTED_LOCALES as readonly string[]).includes(localeCookie)
    ? (localeCookie as Locale)
    : DEFAULT_LOCALE;
  const initialCurrency: Currency = (SUPPORTED_CURRENCIES as readonly string[]).includes(currencyCookie)
    ? (currencyCookie as Currency)
    : DEFAULT_CURRENCY;

  return (
      <html
      lang={initialLocale}
      className={`${sora.variable} ${instrumentSans.variable} ${playfairDisplay.variable} scroll-smooth`}
    >
      <head>
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </head>
      <body className="bg-offwhite font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Kayvila",
              url: "https://kayvila.com",
              description:
                "Conciergerie de standing en Martinique. Villas d'exception, réservation en ligne, entretien et gestion.",
              sameAs: [
                "https://www.instagram.com/kayvilaconciergerie",
                "https://www.facebook.com/share/1EttHdFGZp/?mibextid=wwXIfr",
                "https://www.tiktok.com/@kayvilaconciergerie",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+596 696 68 18 69",
                contactType: "customer service",
                availableLanguage: ["French", "English", "Spanish"],
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Kayvila",
              url: "https://kayvila.com",
              inLanguage: ["fr", "en", "es"],
            }),
          }}
        />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-navy focus:text-white focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:outline-none focus:ring-2 focus:ring-gold">
          Aller au contenu
        </a>
        <LocaleProvider initialLocale={initialLocale} initialCurrency={initialCurrency}>
          <AuthProvider>
          <WishlistProvider>
            <CompareProvider>
              <SiteFrame isDevelopment={isDevelopment}>
                <div id="main-content" tabIndex={-1}>
                {children}
                </div>
              </SiteFrame>
              <ChatbotDynamic />
              <CompareBar />
              <CookieConsent />
            </CompareProvider>
          </WishlistProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>

    </html>
  );
}
