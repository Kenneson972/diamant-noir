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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("dn_locale")?.value ?? "fr";
  const ogLocale = localeCookie === "en" ? "en_US" : localeCookie === "es" ? "es_ES" : "fr_FR";
  const title = localeCookie === "en"
    ? "Kayvila | Luxury Concierge Martinique"
    : localeCookie === "es"
    ? "Kayvila | Conserjería de lujo Martinica"
    : "Kayvila | Conciergerie de luxe Martinique";
  const description = localeCookie === "en"
    ? "Luxury concierge in Martinique. Exceptional villas, online booking, maintenance and management. Diamond Rock, Sun Beach."
    : localeCookie === "es"
    ? "Conserjería de lujo en Martinica. Villas excepcionales, reserva en línea, mantenimiento y gestión."
    : "Conciergerie de luxe en Martinique. Villas d'exception, réservation en ligne, entretien et gestion. Rocher du Diamant, plages du Soleil.";

  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: "%s | Kayvila" },
    description,
    keywords: ["conciergerie", "luxe", "Martinique", "villa", "réservation", "Kayvila"],
    openGraph: {
      type: "website",
      locale: ogLocale,
      siteName: "Kayvila",
      images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
    alternates: {
      languages: {
        fr: "/",
        en: "/",
        es: "/",
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
    <html lang={initialLocale} className="scroll-smooth">
      <body className={`${sora.variable} ${instrumentSans.variable} ${playfairDisplay.variable} bg-offwhite`}>
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
            </CompareProvider>
          </WishlistProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>

    </html>
  );
}
