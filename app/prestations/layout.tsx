import type { Metadata } from "next";

// Metadata isolé ici — page.tsx est "use client" et ne peut pas exporter metadata
export const metadata: Metadata = {
  title: "Nos Prestations | Diamant Noir — Conciergerie Privée Martinique",
  description:
    "Gestion hôtelière complète de votre villa en Martinique : marketing, opérations, relation voyageurs, finance. Commission 20% TTC, ménage facturé aux voyageurs.",
  keywords: [
    "conciergerie",
    "location villa",
    "Martinique",
    "gestion propriété",
    "location saisonnière",
  ],
  openGraph: {
    title: "Nos Prestations | Diamant Noir",
    description:
      "Conciergerie privée clé en main pour villas de prestige en Martinique. 13 services inclus, équipe locale 7j/7, commission transparente 20% TTC.",
    images: [
      {
        url: "/prestations-hero.png",
        width: 1200,
        height: 630,
        alt: "Villa de luxe avec piscine à débordement — Martinique",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: "https://diamant-noir.com/prestations",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrestationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
