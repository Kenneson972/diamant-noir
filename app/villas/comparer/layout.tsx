import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comparateur de villas",
  description:
    "Comparez les villas d'exception Kayvila en Martinique : capacité, équipements, tarifs et prestations, côte à côte.",
  alternates: { canonical: "/villas/comparer" },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
