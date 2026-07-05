import { Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";
import { formatDateFr, formatEuros } from "@/lib/emails/format";

export type AdminBookingNotificationProps = {
  villaName: string;
  guestName: string;
  guestEmail: string;
  startDate: string;
  endDate: string;
  total: string;
  bookingId: string;
};

export default function AdminBookingNotificationEmail({
  villaName,
  guestName,
  guestEmail,
  startDate,
  endDate,
  total,
  bookingId,
}: AdminBookingNotificationProps) {
  return (
    <EmailLayout preview={`Nouvelle réservation — ${villaName}`}>
      <Text style={sectionLabel}>Nouvelle réservation</Text>

      <Text style={detail}>
        <strong>Villa :</strong> {villaName}
        <br />
        <strong>Voyageur :</strong> {guestName} ({guestEmail})
        <br />
        <strong>Dates :</strong> {formatDateFr(startDate)} → {formatDateFr(endDate)}
        <br />
        <strong>Montant :</strong> {total}
        <br />
        <strong>Réf. :</strong> {bookingId}
      </Text>
    </EmailLayout>
  );
}

const sectionLabel = {
  color: "#d4af37",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const detail = {
  color: "#0a1929",
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "0 0 16px",
};
