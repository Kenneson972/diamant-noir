import { Link, Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";
import { formatDateFr, formatEuros } from "@/lib/emails/format";

export type OwnerNewBookingEmailProps = {
  ownerName: string;
  villaName: string;
  guestName: string;
  startDate: string;
  endDate: string;
  amount: number;
  ownerRevenue: number;
  dashboardUrl: string;
};

export default function OwnerNewBookingEmail({
  ownerName,
  villaName,
  guestName,
  startDate,
  endDate,
  amount,
  ownerRevenue,
  dashboardUrl,
}: OwnerNewBookingEmailProps) {
  return (
    <EmailLayout preview={`Nouvelle réservation — ${villaName}`}>
      <Text style={title}>Bonjour {ownerName},</Text>
      <Text>
        Nouvelle réservation pour <strong>{villaName}</strong>.
      </Text>
      <Text>
        <strong>Voyageur :</strong> {guestName}
        <br />
        <strong>Dates :</strong> {formatDateFr(startDate)} → {formatDateFr(endDate)}
        <br />
        <strong>Montant total :</strong> {formatEuros(amount)}
        <br />
        <strong>Votre revenu estimé :</strong> {formatEuros(ownerRevenue)}
      </Text>
      <Text>
        <Link href={dashboardUrl} style={link}>
          Voir le dashboard propriétaire
        </Link>
      </Text>
    </EmailLayout>
  );
}

const title = { color: "#0a1929", fontSize: "20px", margin: "0 0 16px" };
const link = { color: "#0a1929", textDecoration: "underline" };
