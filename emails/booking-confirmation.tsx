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
  emergencyPhone = "+596 96 00 00 00",
  checkInTime = "15h",
  wifiCode,
}: BookingConfirmationEmailProps) {
  return (
    <EmailLayout preview={`Confirmation — ${villaName}`}>
      <Text style={title}>Bonjour {guestName},</Text>
      <Text>
        Votre réservation est <strong>confirmée</strong>. Nous avons hâte de vous accueillir en
        Martinique.
      </Text>
      <Text style={boxTitle}>Détails du séjour</Text>
      <Text>
        <strong>Villa :</strong> {villaName}
        <br />
        <strong>Arrivée :</strong> {formatDateFr(startDate)}
        <br />
        <strong>Départ :</strong> {formatDateFr(endDate)}
        <br />
        <strong>Nuits :</strong> {nights}
        <br />
        <strong>Total :</strong> {formatEuros(totalPrice)}
      </Text>
      <Text>
        Check-in à partir de <strong>{checkInTime}</strong> · Check-out avant <strong>11h</strong>.
      </Text>
      {wifiCode ? (
        <Text>
          <strong>Wi-Fi :</strong> {wifiCode}
        </Text>
      ) : null}
      <Text>
        Retrouvez votre réservation dans votre{" "}
        <Link href={clientAreaUrl} style={link}>
          espace client
        </Link>
        .
      </Text>
      <Text>
        Urgence : <strong>{emergencyPhone}</strong>
      </Text>
    </EmailLayout>
  );
}

const title = { color: "#0a1929", fontSize: "20px", margin: "0 0 16px" };
const boxTitle = { color: "#d4af37", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", margin: "20px 0 8px", textTransform: "uppercase" as const };
const link = { color: "#0a1929", textDecoration: "underline" };
