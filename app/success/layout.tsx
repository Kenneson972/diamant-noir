import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réservation confirmée",
  description: "Votre réservation a été confirmée. Merci pour votre confiance.",
  robots: { index: false, follow: false },
};

export default function SuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
