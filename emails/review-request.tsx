import { Link, Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";

export type ReviewRequestEmailProps = {
  guestName: string;
  villaName: string;
  reviewUrl: string;
};

export default function ReviewRequestEmail({
  guestName,
  villaName,
  reviewUrl,
}: ReviewRequestEmailProps) {
  return (
    <EmailLayout preview={`Votre avis — ${villaName}`}>
      <Text style={title}>Bonjour {guestName},</Text>
      <Text>
        Comment s&apos;est passé votre séjour à <strong>{villaName}</strong> ?
      </Text>
      <Text>
        <Link href={reviewUrl} style={cta}>
          Laisser un avis
        </Link>
      </Text>
      <Text>Votre avis aide les futurs voyageurs à choisir leur villa en toute confiance.</Text>
    </EmailLayout>
  );
}

const title = { color: "#0a1929", fontSize: "20px", margin: "0 0 16px" };
const cta = {
  backgroundColor: "#0a1929",
  borderRadius: "4px",
  color: "#d4af37",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 700,
  padding: "12px 20px",
  textDecoration: "none",
};
