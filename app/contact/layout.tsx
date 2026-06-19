import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez Kayvila pour toute question sur nos villas, la conciergerie de luxe en Martinique ou la gestion locative. Par email ou téléphone.",
  openGraph: {
    title: "Contact | Kayvila",
    description:
      "Contactez Kayvila pour toute question sur nos villas, la conciergerie de luxe en Martinique.",
  },
  alternates: { canonical: "https://kayvila.com/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
