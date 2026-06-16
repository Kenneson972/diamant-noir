import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réinitialisation du mot de passe",
  description: "Définissez un nouveau mot de passe pour votre compte Kayvila.",
  robots: { index: false, follow: false },
};

export default function UpdatePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
