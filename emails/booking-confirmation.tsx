import { Link, Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";
import { formatDateFr, formatEuros } from "@/lib/emails/format";

export type BookingConfirmationEmailProps = {
  guestName: string;
  villaName: string;
  startDate: string;
  endDate: string;
  nights: number;
  totalPrice: number;
  clientAreaUrl: string;
  emergencyPhone?: string;
  checkInTime?: string;
  checkOutTime?: string;
  wifiCode?: string;
};

export default function BookingConfirmationEmail({
  guestName,
  villaName,
  startDate,
  endDate,
  nights,
  totalPrice,
  clientAreaUrl,
  emergencyPhone = "+596 696 68 18 69",
  checkInTime = "15h",
  checkOutTime = "11h",
}: BookingConfirmationEmailProps) {
  return (
    <EmailLayout preview={`Confirmation — ${villaName}`}>
      <Text style={greeting}>Bonjour {guestName},</Text>
      <Text style={subtitle}>Votre réservation est confirmée.</Text>

      <Text style={sectionLabel}>Votre séjour</Text>
      <Text style={details}>
        {villaName}
        <br />
        {formatDateFr(startDate)} → {formatDateFr(endDate)}
        <br />
        {nights} nuit{nights > 1 ? "s" : ""} · {formatEuros(totalPrice)}
      </Text>

      <Text style={info}>
        Check-in à partir de <strong>{checkInTime}</strong> · Check-out avant <strong>{checkOutTime}</strong>
        <br />
        Urgence : <strong>{emergencyPhone}</strong>
      </Text>

      <Link href={clientAreaUrl} style={button}>
        Accéder à mon espace client
      </Link>
    </EmailLayout>
  );
}

const greeting = { color: "#0a1929", fontSize: "22px", margin: "0 0 4px" };
const subtitle = { color: "#64748b", fontSize: "15px", margin: "0 0 28px" };
const sectionLabel = { color: "#d4af37", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", margin: "0 0 8px", textTransform: "uppercase" as const };
const details = { color: "#0a1929", fontSize: "15px", lineHeight: "1.8", margin: "0 0 16px" };
const info = { color: "#64748b", fontSize: "13px", lineHeight: "1.7", margin: "0 0 24px" };
const button = { display: "inline-block", backgroundColor: "#0a1929", color: "#ffffff", padding: "12px 28px", borderRadius: "2px", fontSize: "13px", fontWeight: 700, textDecoration: "none", letterSpacing: "0.04em" };
