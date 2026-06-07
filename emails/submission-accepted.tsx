import { Link, Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";
import { getAppBaseUrl } from "@/lib/emails/format";

export type SubmissionAcceptedProps = {
  ownerName: string;
  villaName: string;
};

export default function SubmissionAccepted({
  ownerName,
  villaName,
}: SubmissionAcceptedProps) {
  const registerUrl = `${getAppBaseUrl()}/register`;

  return (
    <EmailLayout preview={`Bienvenue chez Kayvila — ${villaName}`}>
      <Text style={title}>Bonjour {ownerName},</Text>
      <Text>
        Nous sommes ravis de vous annoncer que <strong>{villaName}</strong> a été acceptée
        dans notre collection.
      </Text>
      <Text style={sectionTitle}>Prochaines étapes</Text>
      <Text style={list}>
        1. Création de votre compte propriétaire
        <br />
        2. Configuration de Stripe Connect pour vos reversements
        <br />
        3. Séance photo professionnelle de votre bien
        <br />
        4. Mise en ligne sur Kayvila et nos partenaires
      </Text>
      <Link href={registerUrl} style={button}>
        Créer mon compte propriétaire →
      </Link>
      <Text style={detail}>
        L&apos;équipe Kayvila vous contactera dans les 48h pour organiser la suite.
      </Text>
    </EmailLayout>
  );
}

const title = { color: "#0a1929", fontSize: "20px", margin: "0 0 16px" };
const sectionTitle = { color: "#d4af37", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", margin: "20px 0 8px", textTransform: "uppercase" as const };
const list = { color: "#334155", fontSize: "14px", lineHeight: "2.2" };
const button = {
  display: "inline-block",
  backgroundColor: "#0a1929",
  color: "#ffffff",
  padding: "12px 28px",
  borderRadius: "4px",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
  margin: "16px 0",
};
const detail = { color: "#64748b", fontSize: "14px", fontStyle: "italic", marginTop: "16px" };
