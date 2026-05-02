import "./globals.css";
import type { Metadata } from "next";
import {
  Inter,
  Playfair_Display,
  Cormorant_Garamond,
  Sora,
  Instrument_Sans,
} from "next/font/google";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { CompareBar } from "@/components/villas/CompareBar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatbotDynamic } from "@/components/chatbot/ChatbotDynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Kayvila | Conciergerie de luxe Martinique", template: "%s | Kayvila" },
  description:
    "Conciergerie de luxe en Martinique. Villas d'exception, réservation en ligne, entretien et gestion. Rocher du Diamant, plages du Soleil.",
  keywords: ["conciergerie", "luxe", "Martinique", "villa", "réservation", "Kayvila"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Kayvila",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <html lang="fr" className="scroll-smooth">
      <body className={`${inter.variable} ${playfair.variable} ${cormorant.variable} ${sora.variable} ${instrumentSans.variable} bg-offwhite`}>
        <LocaleProvider>
          <AuthProvider>
          <WishlistProvider>
            <CompareProvider>
              <SiteFrame isDevelopment={isDevelopment}>
                {children}
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
