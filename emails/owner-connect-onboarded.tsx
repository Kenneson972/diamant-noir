import { Link, Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";

export type OwnerConnectOnboardedEmailProps = {
  ownerName: string;
  dashboardUrl: string;
};

export default function OwnerConnectOnboardedEmail({
  ownerName,
  dashboardUrl,
}: OwnerConnectOnboardedEmailProps) {
  return (
    <EmailLayout preview="Stripe Connect validé">
      <Text style={title}>Bonjour {ownerName},</Text>
      <Text>
        Votre compte <strong>Stripe Connect</strong> est validé.
      </Text>
      <Text>Vos villas sont maintenant réservables avec paiement en ligne.</Text>
      <Text>
        <Link href={dashboardUrl} style={link}>
          Accéder au dashboard
        </Link>
      </Text>
    </EmailLayout>
  );
}

const title = { color: "#0a1929", fontSize: "20px", margin: "0 0 16px" };
const link = { color: "#0a1929", textDecoration: "underline" };
