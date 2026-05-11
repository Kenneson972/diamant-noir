import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/contexts/Providers';

export const metadata: Metadata = {
  title: 'Maison PVL — L\'élégance sur mesure',
  description:
    'Vêtements premium pour homme et femme. Collections pensées pour celles et ceux qui recherchent l\'élégance et la qualité.',
  keywords: 'mode premium, vêtements homme, vêtements femme, élégance, mode française',
  openGraph: {
    siteName: 'Maison PVL',
    type: 'website',
    locale: 'fr_FR',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-pvl-white text-pvl-black antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
