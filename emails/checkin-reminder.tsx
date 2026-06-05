import { Link, Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";
import { formatDateFr } from "@/lib/emails/format";

export type CheckinReminderEmailProps = {
  guestName: string;
  villaName: string;
  startDate: string;
  daysUntil: number;
  clientAreaUrl: string;
  directions?: string;
  lockboxCode?: string;
};

export default function CheckinReminderEmail({
  guestName,
  villaName,
  startDate,
  daysUntil,
  clientAreaUrl,
  directions,
  lockboxCode,
}: CheckinReminderEmailProps) {
  return (
    <EmailLayout preview={`J-${daysUntil} — ${villaName}`}>
      <Text style={title}>Bonjour {guestName},</Text>
      <Text>
        Plus que <strong>J-{daysUntil}</strong> avant votre arrivée à <strong>{villaName}</strong>.
      </Text>
      <Text>
        <strong>Date d&apos;arrivée :</strong> {formatDateFr(startDate)}
      </Text>
      {directions ? (
        <Text>
          <strong>Accès :</strong> {directions}
        </Text>
      ) : null}
      {lockboxCode ? (
        <Text>
          <strong>Code boîte à clés :</strong> {lockboxCode}
        </Text>
      ) : null}
      <Text>
        Toutes les informations pratiques sont dans votre{" "}
        <Link href={clientAreaUrl} style={link}>
          espace client
        </Link>
        .
      </Text>
    </EmailLayout>
  );
}

const title = { color: "#0a1929", fontSize: "20px", margin: "0 0 16px" };
const link = { color: "#0a1929", textDecoration: "underline" };
