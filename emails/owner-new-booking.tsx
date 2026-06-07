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
      <Text style={greeting}>Bonjour {ownerName},</Text>
      <Text style={subtitle}>Nouvelle réservation pour {villaName}.</Text>

      <Text style={sectionLabel}>Détails</Text>
      <Text style={details}>
        Voyageur : <strong>{guestName}</strong>
        <br />
        {formatDateFr(startDate)} → {formatDateFr(endDate)}
      </Text>

      <Text style={sectionLabel}>Montant</Text>
      <Text style={details}>
        Total séjour : {formatEuros(amount)}
        <br />
        Votre revenu estimé : <strong>{formatEuros(ownerRevenue)}</strong>
      </Text>

      <Link href={dashboardUrl} style={button}>
        Voir le tableau de bord
      </Link>
    </EmailLayout>
  );
}

const greeting = { color: "#0a1929", fontSize: "22px", margin: "0 0 4px" };
const subtitle = { color: "#64748b", fontSize: "15px", margin: "0 0 28px" };
const sectionLabel = { color: "#d4af37", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", margin: "0 0 8px", textTransform: "uppercase" as const };
const details = { color: "#0a1929", fontSize: "15px", lineHeight: "1.8", margin: "0 0 16px" };
const button = { display: "inline-block", backgroundColor: "#0a1929", color: "#ffffff", padding: "12px 28px", borderRadius: "2px", fontSize: "13px", fontWeight: 700, textDecoration: "none", letterSpacing: "0.04em" };
