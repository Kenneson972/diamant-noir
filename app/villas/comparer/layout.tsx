import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comparateur de villas",
  description:
    "Comparez les villas Kayvila en Martinique : capacité, équipements, tarifs et prestations, côte à côte.",
  alternates: { canonical: "/villas/comparer" },
  openGraph: {
    images: [{ url: "https://kayvila.com/og-image.jpg", width: 1200, height: 630, alt: "Comparateur de villas Kayvila en Martinique" }],
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
