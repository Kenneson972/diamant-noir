import "./globals.css";
import { Inter, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import { cookies } from "next/headers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { CompareBar } from "@/components/villas/CompareBar";
import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LOCALES,
  type Currency,
  type Locale,
} from "@/lib/i18n";
import { ChatbotDynamic } from "@/components/chatbot/ChatbotDynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export const metadata = {
  title: { default: "Diamant Noir | Conciergerie de luxe Martinique", template: "%s | Diamant Noir" },
  description: "Conciergerie de luxe en Martinique. Villas d'exception, réservation en ligne, entretien et gestion. Rocher du Diamant, plages du Soleil.",
  keywords: ["conciergerie", "luxe", "Martinique", "villa", "réservation", "Diamant Noir"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Diamant Noir",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("dn_locale")?.value ?? DEFAULT_LOCALE;
  const rawCurrency = cookieStore.get("dn_currency")?.value ?? DEFAULT_CURRENCY;
  const initialLocale: Locale = SUPPORTED_LOCALES.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : DEFAULT_LOCALE;
  const initialCurrency: Currency = SUPPORTED_CURRENCIES.includes(rawCurrency as Currency)
    ? (rawCurrency as Currency)
    : DEFAULT_CURRENCY;

  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <link rel="stylesheet" href="/heroui.min.css" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${cormorant.variable} bg-offwhite`}>
        <LocaleProvider initialLocale={initialLocale} initialCurrency={initialCurrency}>
          <WishlistProvider>
            <CompareProvider>
              <Navbar />
              {children}
              <Footer />
              <ChatbotDynamic />
              <CompareBar />
            </CompareProvider>
          </WishlistProvider>
        </LocaleProvider>
      </body>

    </html>
  );
}
